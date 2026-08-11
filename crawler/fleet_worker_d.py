"""
4exam 함대 협력 크롤러 — HermesD (WSL2) 워커
역할: 학교 홈페이지 순회 → 교과서 게시물 검색 → PDF 다운로드
- Playwright로 WAF 우회 (실제 브라우저)
- 대전(djsch.kr) + 전남(jne.kr) + 울산(use.go.kr) 학교
"""
import sqlite3, urllib.request, ssl, re, os, time, random, json
from playwright.sync_api import sync_playwright

DB = "/tmp/4exam_schools.db"  # HermesA DB는 SSH로 동기화 (실제로는 리스트 파일 사용)
SAVE = "/tmp/textbook_data"
os.makedirs(SAVE, exist_ok=True)

# 처리할 학교 리스트 (HermesA가 생성한 파일에서 읽기)
SCHOOL_FILE = "/tmp/school_queue.txt"
DONE_FILE = "/tmp/school_done.txt"
RESULT_FILE = "/tmp/crawl_results.jsonl"

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

def crawl_school(page, school_name, school_url):
    """학교 홈페이지에서 교과서 게시물 찾기"""
    try:
        page.goto(school_url, timeout=20000, wait_until='domcontentloaded')
        time.sleep(2)
        
        # 교과서 관련 링크 찾기 (메뉴 포함)
        links = page.eval_on_selector_all(
            "a",
            """els => els.map(e => ({href: e.href, text: e.textContent.trim()}))
                       .filter(l => (l.text.includes('교과') || l.text.includes('도서') || l.text.includes('선정')) 
                                && l.text.length < 40)"""
        )
        
        results = []
        seen = set()
        for link in links[:10]:
            if link['href'] in seen: continue
            seen.add(link['href'])
            results.append(link)
        return results
    except Exception as e:
        return []

def download_pdf(url, fname):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        req = urllib.request.Request(url, headers=H)
        resp = urllib.request.urlopen(req, context=ctx, timeout=20)
        data = resp.read()
        if len(data) > 500:
            with open(fname, 'wb') as f:
                f.write(data)
            return True
    except:
        pass
    return False

print(f"[{time.strftime('%H:%M:%S')}] 🤝 HermesD 워커 시작")

# 작업 큐 읽기
if not os.path.exists(SCHOOL_FILE):
    print("작업 큐 없음 — 종료")
    exit(0)

with open(SCHOOL_FILE) as f:
    queue = [l.strip() for l in f if l.strip()]
    
if not queue:
    print("큐 비어있음")
    exit(0)

print(f"작업 대상: {len(queue)}개 학교")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=[
        '--disable-blink-features=AutomationControlled', '--no-sandbox'
    ])
    ctx = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        locale='ko-KR'
    )
    page = ctx.new_page()
    
    for i, item in enumerate(queue):
        parts = item.split('|')
        if len(parts) < 2: continue
        school_name, school_url = parts[0], parts[1]
        
        print(f"[{i+1}/{len(queue)}] {school_name}...", end=' ')
        
        links = crawl_school(page, school_name, school_url)
        
        if not links:
            print("교과 링크 없음")
            continue
        
        # 각 링크 방문해서 교과서 선정 결과 찾기
        found_any = False
        for link in links[:5]:
            try:
                page.goto(link['href'], timeout=15000, wait_until='domcontentloaded')
                time.sleep(1.5)
                
                # PDF/HWP 파일 링크 찾기
                file_links = page.eval_on_selector_all(
                    "a[href*='fileDown'], a[href*='fileDownload'], a[href*='file']",
                    "els => els.map(e => e.href)"
                )
                
                text = page.inner_text("body")[:3000]
                subjects = extract_publishers(text)
                
                for fl in file_links[:3]:
                    fname = f"{SAVE}/{school_name}_{int(time.time())}.pdf"
                    if download_pdf(fl, fname):
                        print(f"📄", end=' ')
                
                if subjects:
                    # 결과 저장 (HermesA가 DB에 반영)
                    with open(RESULT_FILE, 'a') as rf:
                        rf.write(json.dumps({
                            'school': school_name,
                            'subjects': dict(subjects),
                            'time': time.strftime('%Y-%m-%d %H:%M:%S')
                        }, ensure_ascii=False) + '\n')
                    print(f"✅ {len(subjects)}과목", end=' ')
                    found_any = True
                    break
            except:
                continue
        
        if not found_any:
            print("게시물 없음")
        
        with open(DONE_FILE, 'a') as df:
            df.write(f"{school_name}|{school_url}\n")
        
        # 인간 속도 유지
        time.sleep(random.uniform(2, 5))
    
    browser.close()

# 큐 초기화 (처리 완료)
os.remove(SCHOOL_FILE)
print(f"\n[{time.strftime('%H:%M:%S')}] ✅ HermesD 워커 완료 — 결과: {RESULT_FILE}")
