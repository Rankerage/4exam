"""
전국 학교 교과서 채택현황 자동 수집기
- Google 검색 → PDF/XLS/HWP 다운로드 → 출판사 정보 추출 → DB 저장
- 밤새 계속 실행
"""
import sqlite3, re, json, time, random, os, urllib.request, ssl
from urllib.parse import quote

DB = "/home/ubuntu/4exam/frontend/data/4exam.db"
SAVE_DIR = "/tmp/textbook_data"
LOG_FILE = "/tmp/textbook_crawler.log"

os.makedirs(SAVE_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9",
}

def log(msg):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def download(url, name):
    """파일 다운로드, 이미 있으면 스킵"""
    safe = re.sub(r'[^\w]', '_', name)[:40]
    for ext in ['.pdf', '.xls', '.xlsx', '.hwp', '.dat']:
        if os.path.exists(f"{SAVE_DIR}/{safe}{ext}"):
            return None
    
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=20, context=ctx)
        data = resp.read()
        
        if len(data) < 200:
            return None
        
        if b"%PDF" in data[:10]:
            ext = ".pdf"
        elif b"\xd0\xcf\x11\xe0" in data[:4]:
            ext = ".xls"
        elif b"PK" == data[:2]:
            ext = ".xlsx"
        else:
            return None
        
        fname = f"{SAVE_DIR}/{safe}{ext}"
        with open(fname, "wb") as f:
            f.write(data)
        return fname
    except:
        return None

def parse_textbook_data(filepath):
    """파일에서 교과서 출판사 정보 추출"""
    results = []
    try:
        if filepath.endswith('.pdf'):
            # PyMuPDF로 추출 시도
            try:
                import fitz
                doc = fitz.open(filepath)
                text = ""
                for page in doc:
                    text += page.get_text()
                doc.close()
            except:
                return results
        elif filepath.endswith(('.xls', '.xlsx')):
            text = open(filepath, 'rb').read().decode('latin-1', errors='ignore')
        else:
            return results
        
        # 출판사명 추출
        publishers = {
            '미래엔': '미래엔', '비상': '비상교육', '천재': '천재교육', 
            '동아': '동아출판', '지학': '지학사', '능률': '능률교육',
            'YBM': '와이비엠', '와이비엠': '와이비엠', '금성': '금성출판사',
            '창비': '창비교육', '씨마스': '씨마스', '교학사': '교학사',
            '신사고': '좋은책신사고', '리베르': '리베르스쿨',
        }
        
        # 과목-출판사 매핑 추출
        subjects = ['국어','영어','수학','사회','과학','한국사','물리','화학','생명','지구',
                     '정보','체육','음악','미술','기술','도덕','역사','문학','독서']
        
        for pub_name, pub_norm in publishers.items():
            if pub_name in text:
                # 근처에 있는 과목명 찾기
                idx = text.find(pub_name)
                context = text[max(0,idx-100):idx+100]
                found_subjects = [s for s in subjects if s in context]
                if found_subjects:
                    for subj in found_subjects:
                        results.append(dict(subject=subj, publisher=pub_norm))
        
        return results
    except:
        return results

def update_db(school_name, textbooks):
    """추출된 교과서 정보를 DB에 저장"""
    if not school_name or not textbooks:
        return
    
    try:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()
        
        for tb in textbooks:
            subj = tb['subject']
            pub = tb['publisher']
            # 해당 학교의 해당 과목 채택 정보 업데이트
            cur.execute("""
                UPDATE textbook_adoptions SET publisher = ?, source = 'crawled'
                WHERE school_id IN (SELECT id FROM schools WHERE name LIKE ?)
                AND subject = ?
            """, (pub, f"%{school_name}%", subj))
        
        conn.commit()
        conn.close()
    except Exception as e:
        log(f"DB 오류: {e}")

def crawl():
    """메인 크롤링 루프"""
    log("🚀 교과서 크롤러 시작")
    
    # 수집할 검색어 리스트
    queries = [
        '"교과서 선정 목록" "출판사" 2026 filetype:xls',
        '"교과서 선정 결과" 출판사 2026 filetype:pdf',
        '"교과용도서 선정" filetype:hwp 2026',
        '"교과서 목록" "출판사" 2026 filetype:pdf',
        '"검인정 교과서" 선정 결과 2026 filetype:pdf',
    ]
    
    total_downloaded = 0
    total_parsed = 0
    
    for q_idx, query in enumerate(queries):
        log(f"🔍 검색 {q_idx+1}/{len(queries)}: {query[:60]}")
        
        # Google 검색 URL
        search_url = f"https://www.google.com/search?q={quote(query)}&num=20"
        
        try:
            req = urllib.request.Request(search_url, headers=HEADERS)
            resp = urllib.request.urlopen(req, timeout=15, context=ctx)
            html = resp.read().decode('utf-8', errors='ignore')
            
            # 링크 추출
            links = re.findall(r'url\?q=(https?://[^&"\']+)', html)
            links = list(set(links))[:10]
            
            for link in links:
                if any(ext in link.lower() for ext in ['.pdf','.xls','.xlsx','.hwp','fileDown','filedown']):
                    name = re.sub(r'https?://[^/]+/', '', link)[:30]
                    fname = download(link, name)
                    if fname:
                        total_downloaded += 1
                        log(f"  ✅ 다운로드 #{total_downloaded}: {os.path.basename(fname)}")
                        
                        # 파싱 시도
                        data = parse_textbook_data(fname)
                        if data:
                            total_parsed += 1
                            log(f"  📊 파싱: {len(data)}개 과목")
                
                time.sleep(random.uniform(1, 3))
            
        except Exception as e:
            log(f"  ⚠️ 검색 오류: {str(e)[:50]}")
        
        time.sleep(random.uniform(5, 10))
    
    # 수집된 파일 목록
    files = [f for f in os.listdir(SAVE_DIR) if not f.startswith('.')]
    
    # DB에 저장
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM textbook_adoptions WHERE source = 'crawled'")
    crawled = cur.fetchone()[0]
    conn.close()
    
    log(f"📊 최종: {len(files)}개 파일 수집, {crawled}개 DB 반영")
    log("✅ 완료")

if __name__ == "__main__":
    crawl()
