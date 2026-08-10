"""
교과서 크롤러 v3 — WAF 없는 학교 직접 방문
- 대전(djsch.kr) 150개 + 전남(jnei.go.kr) 400개
- 각 학교 공지사항에서 교과서 PDF 링크 발견 → 다운로드 → 파싱
"""
import sqlite3, urllib.request, ssl, re, os, time, random
import fitz

DB = "/home/ubuntu/4exam/frontend/data/4exam.db"
SAVE = "/tmp/textbook_data"
os.makedirs(SAVE, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
}

PUB_MAP = {
    '비상교육': '비상교육', '비상': '비상교육', '미래엔': '미래엔',
    '천재교육': '천재교육', '천재교과서': '천재교육', '천재': '천재교육',
    '동아출판': '동아출판', '동아': '동아출판', '지학사': '지학사',
    '능률교육': '능률교육', 'NE능률': '능률교육', '엔이능률': '능률교육',
    '와이비엠': '와이비엠', 'YBM': '와이비엠',
    '금성출판사': '금성출판사', '금성': '금성출판사',
    '창비교육': '창비교육', '좋은책신사고': '좋은책신사고',
    '씨마스': '씨마스', '리베르스쿨': '리베르스쿨',
}

def extract_school_code(url):
    if not url: return None
    m = re.search(r'([a-zA-Z0-9-]+)\.djsch\.kr', url)
    if m: return m.group(1)
    m = re.search(r'([a-zA-Z0-9-]+)\.ms\.jne\.kr', url)
    if m: return m.group(1)
    return None

def download_with_retry(url, max_retries=2):
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            resp = urllib.request.urlopen(req, context=ctx, timeout=15)
            data = resp.read()
            if len(data) < 500:  # 너무 작으면 리디렉트 페이지
                if attempt < max_retries - 1:
                    time.sleep(random.uniform(2, 5))
                    continue
            return data
        except:
            if attempt < max_retries - 1:
                time.sleep(random.uniform(2, 5))
    return None

def parse_pdf_text(filepath):
    try:
        doc = fitz.open(filepath)
        text = ""
        for page in doc:
            t = page.get_text()
            if t:
                text += t
        doc.close()
        return text
    except:
        return ""

def extract_publishers(text, school_name):
    results = []
    lines = text.split('\n')
    
    for line in lines:
        # 패턴: "과목명 ... 출판사명" 형태
        for subj in ['국어', '영어', '수학', '사회', '과학', '한국사', '역사', '도덕',
                     '정보', '체육', '음악', '미술', '기술가정', '기술·가정', '한문']:
            if subj in line:
                for pub_key, pub_val in PUB_MAP.items():
                    if pub_key in line:
                        results.append((subj.replace('·',''), pub_val))
                        break
    
    # 중복 제거
    seen = set()
    unique = []
    for s, p in results:
        key = (s, p)
        if key not in seen:
            seen.add(key)
            unique.append(key)
    return unique

def update_db(school_name, subjects):
    if not subjects:
        return 0
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    count = 0
    for subj, pub in subjects:
        cur.execute(
            "UPDATE textbook_adoptions SET publisher=?, source='crawled_v3' WHERE school_id IN (SELECT id FROM schools WHERE name LIKE ?) AND subject=?",
            (pub, f"%{school_name}%", subj)
        )
        count += cur.rowcount
    conn.commit()
    conn.close()
    return count

# ── 메인 ──
print(f"[{time.strftime('%H:%M:%S')}] 🚀 v3 크롤러 시작")

conn = sqlite3.connect(DB)
cur = conn.cursor()

# 접근 가능한 학교만 필터링
cur.execute("""
    SELECT name, homepage FROM schools 
    WHERE homepage LIKE '%djsch.kr%' OR homepage LIKE '%.ms.jne.kr%'
    LIMIT 100
""")
schools = cur.fetchall()
conn.close()

print(f"대상 학교: {len(schools)}개")

found = 0
for i, (name, hp) in enumerate(schools):
    code = extract_school_code(hp)
    if not code: continue
    
    # 학교 공지사항 페이지 접근 시도
    # djsch.kr 패턴: /boardCnts/list.do?m=0201&s=[code]
    if 'djsch.kr' in hp:
        board_url = f"https://{code}.djsch.kr/boardCnts/list.do?m=0201&s={code}"
    elif 'jne.kr' in hp:
        board_url = f"https://{code}.ms.jne.kr/boardCnts/list.do?m=0201"
    else:
        continue
    
    try:
        data = download_with_retry(board_url)
        if not data:
            continue
        
        html = data.decode('utf-8', errors='ignore')
        
        # PDF 링크 찾기
        pdf_links = re.findall(r'fileDown\.do\?[^"\']+', html)
        
        for link in pdf_links[:3]:  # 최대 3개만 시도
            if 'djsch.kr' in hp:
                pdf_url = f"https://{code}.djsch.kr/boardCnts/{link}"
            else:
                pdf_url = f"https://{code}.ms.jne.kr/boardCnts/{link}"
            
            pdf_data = download_with_retry(pdf_url)
            if not pdf_data or len(pdf_data) < 1000:
                continue
            
            # 저장 + 파싱
            fname = f"{SAVE}/{code}_{hash(pdf_url)}.pdf"
            with open(fname, 'wb') as f:
                f.write(pdf_data)
            
            text = parse_pdf_text(fname)
            if not text:
                continue
            
            subjects = extract_publishers(text, name[:4])
            count = update_db(name, subjects)
            
            if count > 0:
                found += count
                print(f"  ✅ {name}: {len(subjects)}과목 ({count}건 DB)")
            
            break  # 한 학교당 첫 성공한 PDF만
    
    except Exception as e:
        pass
    
    # 요청 간격
    if i % 10 == 0:
        time.sleep(random.uniform(3, 6))
    else:
        time.sleep(random.uniform(0.5, 2))

print(f"[{time.strftime('%H:%M:%S')}] ✅ 완료: {found}건 업데이트")
