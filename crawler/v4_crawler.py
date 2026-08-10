"""
크롤러 v4 — URL 리스트 기반
- /tmp/textbook_urls.txt 에서 URL 읽기
- 각 URL 다운로드 → PyMuPDF 파싱 → DB 저장
- 완료된 URL은 processed_urls.txt 로 이동
"""
import sqlite3, urllib.request, ssl, re, os, time, random
import fitz

def parse_hwp(filepath):
    try:
        import olefile
        ole = olefile.OleFileIO(filepath)
        text = ole.openstream('PrvText').read().decode('utf-16-le', errors='ignore')
        ole.close()
        return text
    except:
        return ''



DB = "/home/ubuntu/4exam/frontend/data/4exam.db"
URL_FILE = "/tmp/textbook_urls.txt"
PROCESSED = "/tmp/processed_urls.txt"
SAVE_DIR = "/tmp/textbook_data"
os.makedirs(SAVE_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

PUB_MAP = {
    '비상교육': '비상교육', '비상': '비상교육', '미래엔': '미래엔',
    '천재교육': '천재교육', '천재교과서': '천재교육', '천재': '천재교육',
    '동아출판': '동아출판', '동아': '동아출판', '지학사': '지학사',
    '능률교육': '능률교육', 'NE능률': '능률교육', '엔이능률': '능률교육',
    '와이비엠': '와이비엠', 'YBM': '와이비엠', '금성출판사': '금성출판사',
    '창비교육': '창비교육', '좋은책신사고': '좋은책신사고',
    '씨마스': '씨마스', '리베르스쿨': '리베르스쿨', '장원교육': '장원교육',
    '아이스크림': '아이스크림미디어', '해냄에듀': '해냄에듀',
}

def extract_publishers(text):
    results = []
    for subj in ['국어','영어','수학','사회','과학','한국사','역사','도덕',
                 '정보','체육','음악','미술','기술가정','한문','물리','화학',
                 '생명과학','지구과학','통합과학','통합사회']:
        if subj not in text: continue
        for pub_key, pub_val in PUB_MAP.items():
            if pub_key in text:
                results.append((subj, pub_val))
                break
    return list(set(results))

def extract_school_name(url):
    # URL에서 학교명 추측
    m = re.search(r'([a-zA-Z0-9-]+)\.djsch\.kr', url)
    if m: return m.group(1)
    m = re.search(r'([a-zA-Z0-9_-]+)/k2board/', url)
    if m: return m.group(1)
    return "unknown"

print(f"[{time.strftime('%H:%M:%S')}] v4 URL 크롤러 시작")

# URL 목록 읽기
if not os.path.exists(URL_FILE):
    print("URL 파일 없음 — 종료")
    exit(0)

with open(URL_FILE) as f:
    urls = [l.strip() for l in f if l.strip() and not l.startswith('#')]

if not urls:
    print("처리할 URL 없음")
    exit(0)

print(f"처리 대상: {len(urls)}개 URL")

conn = sqlite3.connect(DB)
cur = conn.cursor()
updated = 0
processed_urls = []

for i, url in enumerate(urls):
    try:
        # 다운로드
        req = urllib.request.Request(url, headers=H)
        resp = urllib.request.urlopen(req, context=ctx, timeout=20)
        data = resp.read()
        if len(data) < 500:
            processed_urls.append(url)
            continue
        
        # 저장
        school_code = extract_school_name(url)
        fname = f"{SAVE_DIR}/{school_code}_{i}.pdf"
        with open(fname, 'wb') as f:
            f.write(data)
        
        # 파싱
        try:
            doc = fitz.open(fname)
            text = ""
            for page in doc:
                t = page.get_text()
                if isinstance(t, str):
                    text += t
            doc.close()
        except:
            text = parse_hwp(fname)
        
        if not text:
            processed_urls.append(url)
            continue
        
        subjects = extract_publishers(text)
        if not subjects:
            processed_urls.append(url)
            continue
        
        # 학교명 찾기
        school_match = re.search(r'([가-힣]+(?:고등학교|중학교|초등학교|여자중|여자고|여중|여고))', text)
        school_name = school_match.group(1) if school_match else school_code
        
        # DB 업데이트
        for subj, pub in subjects:
            cur.execute(
                "UPDATE textbook_adoptions SET publisher=?, source='crawled_v4' WHERE school_id IN (SELECT id FROM schools WHERE name LIKE ?) AND subject=?",
                (pub, f"%{school_name}%", subj)
            )
            updated += cur.rowcount
        
        print(f"  ✅ {school_name}: {len(subjects)}과목")
        
    except Exception as e:
        print(f"  ❌ {url[:60]}...: {str(e)[:40]}")
    
    processed_urls.append(url)
    time.sleep(random.uniform(0.5, 2))

conn.commit()
conn.close()

# 처리된 URL 저장
with open(PROCESSED, 'a') as f:
    for url in processed_urls:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M')} | {url}\n")

# URL 파일 비우기
open(URL_FILE, 'w').close()

print(f"[{time.strftime('%H:%M:%S')}] ✅ 완료: {updated}건 DB 업데이트")
