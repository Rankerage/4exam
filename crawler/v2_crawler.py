"""
4exam 교과서 데이터 수집기 v2 - 멀티 전략
1. djsch.kr / jnei.go.kr / sen.go.kr 등 WAF 없는 CMS에서 직접 PDF 다운로드
2. Google 검색으로 새 PDF/XLS/HWP URL 발견
3. 다운로드 → PyMuPDF + 정규식 파싱
4. DB 업데이트
"""
import sqlite3, re, json, time, random, os, urllib.request, ssl
from urllib.parse import quote

DB = "/home/ubuntu/4exam/frontend/data/4exam.db"
SAVE = "/tmp/textbook_data"
LOG = "/tmp/textbook_crawler_v2.log"

os.makedirs(SAVE, exist_ok=True)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"}

PUB_MAP = {
    '미래엔': '미래엔', '비상교육': '비상교육', '비상': '비상교육',
    '천재교과서': '천재교육', '천재교육': '천재교육', '천재': '천재교육',
    '동아출판': '동아출판', '동아': '동아출판',
    '지학사': '지학사', '지학': '지학사',
    '능률교육': '능률교육', '엔이능률': '능률교육', '능률': '능률교육',
    '와이비엠': '와이비엠', 'YBM': '와이비엠',
    '금성출판사': '금성출판사', '금성': '금성출판사',
    '창비교육': '창비교육', '창비': '창비교육',
    '씨마스': '씨마스', '좋은책신사고': '좋은책신사고',
    '리베르스쿨': '리베르스쿨', '다락원': '다락원',
}

SUBJ_MAP = {
    '국어': '국어','수학': '수학','영어': '영어',
    '사회': '사회','과학': '과학','한국사': '한국사',
    '역사': '사회','물리': '물리','화학': '화학',
    '생명과학': '생명과학','지구과학': '지구과학',
    '도덕': '도덕','음악': '음악','미술': '미술',
    '체육': '체육','정보': '정보','기술가정': '기술가정',
}

def log(msg):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG, "a") as f: f.write(line + "\n")

def download(url):
    """파일 다운로드"""
    try:
        req = urllib.request.Request(url, headers=H)
        resp = urllib.request.urlopen(req, timeout=20, context=ctx)
        data = resp.read()
        return data if len(data) > 500 else None
    except:
        return None

def parse_pdf(data):
    """PDF에서 교과서 정보 추출"""
    results = []
    try:
        import fitz
        tmp = f"/tmp/_tmp_{random.randint(0,9999)}.pdf"
        with open(tmp, "wb") as f: f.write(data)
        doc = fitz.open(tmp)
        text = ""
        for page in doc: text += page.get_text()
        doc.close()
        os.remove(tmp)
        
        # "국어 비상교육" 또는 "국어: 비상교육" 패턴
        for subj_name, subj_norm in SUBJ_MAP.items():
            for pub_name, pub_norm in PUB_MAP.items():
                pattern = rf'{subj_name}[:\s]*.*?{re.escape(pub_name)}'
                if re.search(pattern, text):
                    results.append((subj_norm, pub_norm))
    except:
        pass
    return list(set(results))

def google_search(query):
    """Google 검색으로 PDF/XLS 링크 찾기"""
    links = []
    try:
        url = f"https://www.google.com/search?q={quote(query)}&num=20"
        req = urllib.request.Request(url, headers=H)
        resp = urllib.request.urlopen(req, timeout=15, context=ctx)
        html = resp.read().decode('utf-8', errors='ignore')
        links = re.findall(r'url\?q=(https?://[^&"\']+)', html)
        links = [l for l in links if any(e in l.lower() for e in ['.pdf','.xls','.xlsx','.hwp','fileDown','filedown'])]
    except:
        pass
    return list(set(links))

def update_db(school_name, subject, publisher):
    """DB 업데이트"""
    try:
        conn = sqlite3.connect(DB)
        cur = conn.cursor()
        cur.execute("""
            UPDATE textbook_adoptions SET publisher = ?, source = 'crawled'
            WHERE school_id IN (SELECT id FROM schools WHERE name LIKE ?)
            AND subject = ?
        """, (publisher, f"%{school_name}%", subject))
        updated = cur.rowcount
        conn.commit()
        conn.close()
        return updated
    except:
        return 0

def main():
    log("🚀 v2 크롤러 시작")
    
    queries = [
        'site:djsch.kr "교과서" "선정" OR "목록" filetype:pdf 2026',
        'site:jnei.go.kr "교과서" "선정" filetype:pdf 2026',
        'site:dge.go.kr OR site:sen.go.kr "교과서 선정" filetype:pdf 2026',
        '"교과서 선정 목록" "출판사" filetype:pdf OR filetype:xls 2026',
    ]
    
    all_links = []
    for q in queries:
        log(f"🔍 검색: {q[:60]}")
        links = google_search(q)
        log(f"  → {len(links)}개 발견")
        all_links.extend(links)
        time.sleep(random.uniform(3, 7))
    
    all_links = list(set(all_links))
    log(f"\n📎 총 {len(all_links)}개 고유 링크")
    
    downloaded = 0
    total_updated = 0
    
    for i, url in enumerate(all_links):
        safe_name = re.sub(r'[^\w]', '_', url.split('/')[-1][:30])
        fpath = f"{SAVE}/{safe_name}"
        
        # 중복 스킵
        for ext in ['.pdf','.xls','.xlsx']:
            if os.path.exists(fpath + ext):
                log(f"  ⏭️ 중복 #{i+1}")
                break
        else:
            data = download(url)
            if data:
                ext = '.pdf' if b'%PDF' in data[:10] else '.xls'
                with open(fpath + ext, 'wb') as f: f.write(data)
                downloaded += 1
                
                # PDF 파싱 + DB 업데이트
                if ext == '.pdf':
                    pairs = parse_pdf(data)
                    for subj, pub in pairs:
                        updated = update_db(safe_name[:10], subj, pub)
                        total_updated += updated
                    if pairs:
                        log(f"  ✅ #{i+1}: {len(pairs)}과목 파싱, {len(pairs)}건 업데이트")
        
        time.sleep(random.uniform(0.5, 2))
    
    log(f"\n📊 완료: {downloaded}개 다운로드, {total_updated}건 DB 업데이트")

if __name__ == "__main__":
    main()
