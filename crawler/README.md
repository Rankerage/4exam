# 4exam.study 크롤러

중고등학교 기출문제·예상문제 자동 수집 파이프라인.

## 디렉토리 구조

```
crawler/
├── crawler.py          # 크롤러 프레임워크 (BaseCrawler → Mock/Jokbo/School)
├── seed_data.py        # 샘플 데이터 생성기 (20건 삽입)
├── requirements.txt    # Python 의존성
└── README.md           # 이 문서
```

## 빠른 시작

```bash
# 1. 의존성 설치
pip install -r requirements.txt

# 2. 샘플 데이터 20건 삽입
python seed_data.py

# 3. 목업 크롤러로 전체 학교 수집 (테스트)
python crawler.py --mock --all

# 4. DB 통계 확인
python crawler.py --stats
```

## crawler.py 사용법

```
사용법: crawler.py [-h] [--school SCHOOL] [--subject {국어,영어,수학,사회,과학}]
                    [--all] [--mock] [--dry-run] [--stats] [--verbose]

주요 옵션:
  --school, -s    학교 ID (school-001 ~ school-008)
  --all, -a       전체 학교 배치 크롤링
  --mock, -m      MockCrawler 사용 (HTTP 요청 없이 가상 데이터)
  --dry-run, -n   DB 저장 없이 미리보기만
  --stats         DB 통계 출력
  --subject       특정 과목만 (국어/영어/수학/사회/과학)
  --verbose, -v   디버그 로그
```

### 예시

```bash
# 단일 학교 목업 크롤링
python crawler.py --mock --school school-001

# 수학 과목만 미리보기
python crawler.py --mock --school school-001 --subject 수학 --dry-run

# 전체 배치 (실제 사이트 크롤러 - 스켈레톤)
python crawler.py --all --dry-run
```

## DB 스키마 (exam_materials)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT PK | `mat-{timestamp}` 또는 `mat-seed-XXXX` |
| school_id | TEXT FK | 학교 ID (school-001 ~ school-008) |
| subject_id | TEXT | 과목 ID (subj-국어 등) |
| title | TEXT | 자료 제목 |
| type | TEXT | 기출문제 / 예상문제 / 모의고사 / 학습지 |
| description | TEXT | 자료 설명 |
| file_url | TEXT | 첨부파일 URL |
| year | INTEGER | 학년도 (2024, 2025 등) |
| semester | TEXT | 1학기 / 2학기 |
| created_at | DATETIME | 생성일시 (자동) |

## 크롤러 종류

| 크롤러 | 상태 | 설명 |
|--------|------|------|
| `MockCrawler` | ✅ 구현 | 가상 데이터 생성 (개발·테스트용) |
| `SchoolWebsiteCrawler` | 🔧 스켈레톤 | 학교 홈페이지 게시판 스크래핑 |
| `JokboCrawler` | 🔧 스켈레톤 | 족보닷컴 인증 기반 수집 |

### 실제 크롤러 구현 가이드

`SchoolWebsiteCrawler`와 `JokboCrawler`는 현재 스켈레톤입니다.
실제 운영을 위해서는:

1. **학교 홈페이지**: `requests` + `BeautifulSoup`으로 게시판 HTML 파싱
2. **족보닷컴**: 로그인 세션 유지 후 검색 API 호출 (이용약관 확인 필수)
3. `BaseCrawler.crawl()` 메서드를 오버라이드하여 `ExamMaterial` 리스트 반환

### 중복 제거

`ExamDB.insert()`는 `(school_id, title, year, semester)` 조합이 동일하면
자동으로 스킵합니다. 동일 자료를 여러 번 수집해도 DB에는 한 번만 저장됩니다.

## seed_data.py 사용법

```bash
# 20개 샘플 삽입
python seed_data.py

# 기존 데이터 초기화 후 삽입
python seed_data.py --clear

# 미리보기 (DB 변경 없음)
python seed_data.py --dry-run
```

### 샘플 데이터 내역

총 20건, 8개 학교 × 5개 과목 분포:

| 학교 | 건수 | 유형 |
|------|------|------|
| 서울중학교 | 3 | 기출문제 |
| 부산고등학교 | 3 | 기출문제, 예상문제 |
| 대구중학교 | 3 | 기출문제, 예상문제 |
| 광주고등학교 | 3 | 예상문제, 모의고사, 학습지 |
| 대전중학교 | 3 | 기출문제, 예상문제 |
| 세종고등학교 | 2 | 모의고사, 기출문제 |
| 경기중학교 | 2 | 기출문제, 예상문제 |
| 인천고등학교 | 1 | 예상문제 |

## 폴리트 크롤링

기본 요청 간격은 1초(`REQUEST_DELAY = 1.0`)입니다.
대상 서버에 부하를 주지 않도록 필요시 `crawler.py` 상단 상수를 조정하세요.

## 라이선스

이 크롤러는 4exam.study 프로젝트의 일부입니다.
실제 사이트 크롤링 시 반드시 해당 사이트의 robots.txt 및 이용약관을 준수하세요.
