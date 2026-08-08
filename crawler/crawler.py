#!/usr/bin/env python3
"""
4exam.study 크롤러 프레임워크
===============================
중고등학교 기출문제 및 예상문제를 수집하여 SQLite DB에 저장하는 크롤러 파이프라인.

대상 사이트:
  - 족보닷컴 (jokbo.com)
  - 각 학교 공식 홈페이지
  - 교육청 사이트 (나이스(NEIS) 공지 등)

지원 동작:
  - 단일 학교 크롤링
  - 전체 학교 배치 크롤링
  - 증분 업데이트 (중복 스킵)

사용법:
  python crawler.py --school school-001              # 단일 학교
  python crawler.py --all                            # 전체 배치
  python crawler.py --school school-001 --dry-run    # 수집 없이 미리보기
  python crawler.py --mock                           # 목업 데이터로 테스트
"""

import argparse
import hashlib
import logging
import random
import sqlite3
import sys
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

###############################################################################
# 설정
###############################################################################

# 프로젝트 루트 (crawler.py 기준 ../frontend/data/4exam.db)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "frontend" / "data" / "4exam.db"

# 크롤링 대상 학교 목록 (DB와 동기화)
SCHOOLS = {
    "school-001": {"name": "서울중학교", "region": "서울", "type": "중학교"},
    "school-002": {"name": "부산고등학교", "region": "부산", "type": "고등학교"},
    "school-003": {"name": "대구중학교", "region": "대구", "type": "중학교"},
    "school-004": {"name": "광주고등학교", "region": "광주", "type": "고등학교"},
    "school-005": {"name": "대전중학교", "region": "대전", "type": "중학교"},
    "school-006": {"name": "세종고등학교", "region": "세종", "type": "고등학교"},
    "school-007": {"name": "경기중학교", "region": "경기", "type": "중학교"},
    "school-008": {"name": "인천고등학교", "region": "인천", "type": "고등학교"},
}

# 과목 목록
SUBJECTS = ["국어", "영어", "수학", "사회", "과학"]

# 학년 범위
GRADES_MIDDLE = [1, 2, 3]       # 중학교 1~3학년
GRADES_HIGH = [1, 2, 3]         # 고등학교 1~3학년
SEMESTERS = ["1학기", "2학기"]

# 요청 간격 (초) - polite crawling
REQUEST_DELAY = 1.0

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("4exam-crawler")


###############################################################################
# 데이터 모델
###############################################################################

@dataclass
class ExamMaterial:
    """수집된 시험자료 모델"""
    title: str
    type: str                       # "기출문제" | "예상문제" | "모의고사" | "학습지"
    school_id: str                  # school-001 ~ school-008
    subject_id: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[str] = None
    source_url: Optional[str] = None  # 수집 출처 URL (DB 컬럼 외)
    id: str = field(default_factory=lambda: f"mat-{int(time.time() * 1000)}")

    @property
    def content_hash(self) -> str:
        """중복 제거용 해시 (title + school_id + year + semester + type)"""
        raw = f"{self.title}|{self.school_id}|{self.year}|{self.semester}|{self.type}"
        return hashlib.sha256(raw.encode()).hexdigest()


###############################################################################
# SQLite 저장소
###############################################################################

class ExamDB:
    """exam_materials 테이블 접근 계층"""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_table()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_table(self):
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS exam_materials (
                    id TEXT PRIMARY KEY,
                    school_id TEXT NOT NULL,
                    subject_id TEXT,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    description TEXT,
                    file_url TEXT,
                    year INTEGER,
                    semester TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def exists_by_hash(self, content_hash: str) -> bool:
        """해시 기반 중복 확인 (title + school_id + year + semester + type)"""
        with self._connect() as conn:
            # 해시를 별도 컬럼에 저장하지 않으므로, 실용적인 중복 체크:
            # 동일 school_id + title + year + semester 조합이 이미 있는지 확인
            pass  # insert 시 title+school_id+year+semester 조회로 대체
        return False

    def insert(self, mat: ExamMaterial) -> bool:
        """자료 삽입. 중복이면 False 반환"""
        with self._connect() as conn:
            # 중복 체크: 같은 학교, 같은 제목, 같은 연도/학기
            existing = conn.execute(
                """SELECT id FROM exam_materials
                   WHERE school_id = ? AND title = ? AND year = ? AND semester = ?""",
                (mat.school_id, mat.title, mat.year, mat.semester),
            ).fetchone()

            if existing:
                logger.debug(f"중복 스킵: {mat.title} (id={existing['id']})")
                return False

            conn.execute(
                """INSERT INTO exam_materials
                   (id, school_id, subject_id, title, type, description, file_url, year, semester)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mat.id,
                    mat.school_id,
                    mat.subject_id,
                    mat.title,
                    mat.type,
                    mat.description,
                    mat.file_url,
                    mat.year,
                    mat.semester,
                ),
            )
            logger.info(f"저장 완료: {mat.title} ({mat.id})")
            return True

    def count_by_school(self, school_id: str) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM exam_materials WHERE school_id = ?",
                (school_id,),
            ).fetchone()
            return row["cnt"]

    def stats(self) -> dict:
        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(*) as cnt FROM exam_materials").fetchone()["cnt"]
            by_type = conn.execute(
                "SELECT type, COUNT(*) as cnt FROM exam_materials GROUP BY type"
            ).fetchall()
            by_school = conn.execute(
                "SELECT school_id, COUNT(*) as cnt FROM exam_materials GROUP BY school_id"
            ).fetchall()
            return {
                "total": total,
                "by_type": {r["type"]: r["cnt"] for r in by_type},
                "by_school": {r["school_id"]: r["cnt"] for r in by_school},
            }


###############################################################################
# 추상 크롤러
###############################################################################

class BaseCrawler(ABC):
    """모든 크롤러의 베이스 클래스"""

    def __init__(self, db: ExamDB, school_id: str, subject: Optional[str] = None):
        self.db = db
        self.school_id = school_id
        self.subject = subject
        self.school_info = SCHOOLS.get(school_id, {})
        self.collected_count = 0
        self.skipped_count = 0

    @abstractmethod
    def crawl(self) -> list[ExamMaterial]:
        """크롤링 실행 → ExamMaterial 리스트 반환"""
        ...

    def store(self, materials: list[ExamMaterial]) -> tuple[int, int]:
        """수집된 자료를 DB에 저장"""
        inserted = 0
        skipped = 0
        for mat in materials:
            if self.db.insert(mat):
                inserted += 1
            else:
                skipped += 1
        self.collected_count = inserted
        self.skipped_count = skipped
        return inserted, skipped

    def run(self) -> tuple[int, int]:
        """크롤링 → 저장 파이프라인 실행"""
        logger.info(
            f"[{self.__class__.__name__}] 크롤링 시작: school={self.school_id}, "
            f"subject={self.subject or '전체'}"
        )
        materials = self.crawl()
        logger.info(
            f"[{self.__class__.__name__}] 수집 완료: {len(materials)}건"
        )
        return self.store(materials)


###############################################################################
# 구체 크롤러 구현
###############################################################################

class SchoolWebsiteCrawler(BaseCrawler):
    """
    학교 공식 홈페이지 크롤러.

    실제 운영 시:
    - 각 학교 홈페이지의 '공지사항' 또는 '시험자료실' 게시판을 스크래핑
    - requests + BeautifulSoup 사용
    - 첨부파일(.pdf, .hwp) 링크 수집

    현재는 스켈레톤 구현이므로 실제 HTTP 요청 없음.
    """

    BASE_URLS = {
        "school-001": "https://seoul.sen.ms.kr",
        "school-002": "https://busan.hs.kr",
        "school-003": "https://daegu.ms.kr",
        "school-004": "https://gwangju.hs.kr",
        "school-005": "https://daejeon.ms.kr",
        "school-006": "https://sejong.hs.kr",
        "school-007": "https://gyeonggi.ms.kr",
        "school-008": "https://incheon.hs.kr",
    }

    def crawl(self) -> list[ExamMaterial]:
        materials = []
        base_url = self.BASE_URLS.get(self.school_id, "")

        # TODO: 실제 HTTP 요청 구현
        # response = requests.get(urljoin(base_url, "/board/exam"))
        # soup = BeautifulSoup(response.text, "html.parser")
        # for row in soup.select(".board-list tr"):
        #     ...

        logger.warning(
            f"SchoolWebsiteCrawler: {self.school_id} 실제 HTTP 크롤링 미구현 (스켈레톤)"
        )
        return materials


class JokboCrawler(BaseCrawler):
    """
    족보닷컴(jokbo.com) 크롤러.

    참고: 족보닷컴은 유료 구독 서비스이며, 로그인 및 결제가 필요합니다.
    이 크롤러는 합법적인 API 연동 또는 구독 계정을 통한 수집을 전제로 합니다.
    무단 크롤링은 이용약관 위반입니다.

    현재는 스켈레톤 구현.
    """

    BASE_URL = "https://www.jokbo.com"

    def crawl(self) -> list[ExamMaterial]:
        materials = []

        # TODO: 족보닷컴 API 또는 인증 기반 크롤링 구현
        # session = requests.Session()
        # session.post(urljoin(self.BASE_URL, "/login"), data={...})
        # response = session.get(urljoin(self.BASE_URL, f"/search?school={self.school_id}"))
        # ...

        logger.warning(
            f"JokboCrawler: {self.school_id} 실제 크롤링 미구현 (스켈레톤)"
        )
        return materials


class MockCrawler(BaseCrawler):
    """
    개발/테스트용 목업 크롤러.

    실제 사이트에 요청하지 않고, DB 스키마에 맞는
    가상의 시험자료를 생성하여 반환합니다.
    """

    # 자료 유형별 템플릿
    MATERIAL_TYPES = {
        "중학교": [
            ("기출문제", [
                "{year}학년도 {semester} {subject} 중간고사",
                "{year}학년도 {semester} {subject} 기말고사",
                "{year}학년 {subject} 수행평가",
            ]),
            ("예상문제", [
                "{semester} {subject} 예상문제 {n}회",
                "{subject} 단원평가 예상문제 ({n}단원)",
            ]),
            ("학습지", [
                "{subject} 핵심정리 ({n}단원)",
                "{subject} 서술형 대비 학습지",
            ]),
        ],
        "고등학교": [
            ("기출문제", [
                "{year}학년도 {semester} {subject} 중간고사",
                "{year}학년도 {semester} {subject} 기말고사",
                "{year}학년도 {subject} 모의고사 ({n}회)",
            ]),
            ("예상문제", [
                "{semester} {subject} 내신대비 예상문제",
                "수능 {subject} 예상문제 ({n}회)",
            ]),
            ("모의고사", [
                "{year}학년도 {n}월 {subject} 모의고사",
                "{year}학년도 {subject} 전국연합학력평가",
            ]),
        ],
    }

    def crawl(self) -> list[ExamMaterial]:
        materials = []
        school_type = self.school_info.get("type", "중학교")
        templates = self.MATERIAL_TYPES.get(school_type, self.MATERIAL_TYPES["중학교"])

        grades = GRADES_HIGH if school_type == "고등학교" else GRADES_MIDDLE
        subjects = [self.subject] if self.subject else SUBJECTS

        rng = random.Random(hash(self.school_id) % 10000)

        for subject in subjects:
            for mat_type, title_templates in templates:
                for template in title_templates:
                    # 랜덤한 변수로 제목 생성
                    year = rng.choice([2020, 2021, 2022, 2023, 2024, 2025])
                    semester = rng.choice(SEMESTERS)
                    n = rng.randint(1, 10)

                    title = template.format(
                        year=year,
                        semester=semester,
                        subject=subject,
                        n=n,
                    )

                    mat = ExamMaterial(
                        title=title,
                        type=mat_type,
                        school_id=self.school_id,
                        subject_id=f"subj-{subject}",
                        description=f"{self.school_info.get('name', '')} {year}학년도 "
                                    f"{semester} {subject} {mat_type} 자료입니다.",
                        file_url=f"https://cdn.4exam.study/materials/"
                                f"{self.school_id}/{subject}/{title}.pdf",
                        year=year,
                        semester=semester,
                    )
                    materials.append(mat)

        return materials


###############################################################################
# 오케스트레이터
###############################################################################

class CrawlOrchestrator:
    """여러 크롤러를 순차 실행하고 결과를 집계"""

    def __init__(self, db: ExamDB):
        self.db = db

    def crawl_school(
        self,
        school_id: str,
        crawlers: list[type[BaseCrawler]],
        subject: Optional[str] = None,
        dry_run: bool = False,
    ) -> dict:
        """단일 학교에 대해 여러 크롤러 실행"""
        total_inserted = 0
        total_skipped = 0
        results = []

        for crawler_cls in crawlers:
            crawler = crawler_cls(db=self.db, school_id=school_id, subject=subject)
            if dry_run:
                materials = crawler.crawl()
                results.append({
                    "crawler": crawler_cls.__name__,
                    "materials_count": len(materials),
                    "preview": [m.title for m in materials[:5]],
                })
            else:
                inserted, skipped = crawler.run()
                total_inserted += inserted
                total_skipped += skipped
                time.sleep(REQUEST_DELAY)  # polite delay between crawlers

        return {
            "school_id": school_id,
            "inserted": total_inserted,
            "skipped": total_skipped,
            "dry_run_results": results if dry_run else None,
        }

    def crawl_all(
        self,
        crawlers: list[type[BaseCrawler]],
        dry_run: bool = False,
    ) -> list[dict]:
        """전체 학교 크롤링"""
        all_results = []
        for school_id in SCHOOLS:
            result = self.crawl_school(school_id, crawlers, dry_run=dry_run)
            all_results.append(result)
        return all_results


###############################################################################
# CLI
###############################################################################

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="4exam.study 크롤러 - 기출문제 자동 수집 파이프라인",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python crawler.py --school school-001                 # 서울중학교 크롤링
  python crawler.py --all --dry-run                     # 전체 미리보기
  python crawler.py --mock                              # 목업 데이터 수집
  python crawler.py --school school-001 --subject 수학   # 특정 과목만
  python crawler.py --stats                             # DB 통계 조회
        """,
    )
    parser.add_argument(
        "--school", "-s",
        help="크롤링할 학교 ID (예: school-001)",
    )
    parser.add_argument(
        "--subject",
        help="특정 과목만 크롤링 (예: 수학)",
        choices=SUBJECTS,
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="전체 학교 배치 크롤링",
    )
    parser.add_argument(
        "--mock", "-m",
        action="store_true",
        help="MockCrawler 사용 (테스트용 가상 데이터)",
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="수집 없이 미리보기만 실행",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="DB 통계 출력",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="디버그 로그 활성화",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    db = ExamDB()

    # --stats: DB 통계만 출력하고 종료
    if args.stats:
        stats = db.stats()
        print(f"\n📊 DB 통계")
        print(f"   총 자료 수: {stats['total']}건")
        if stats["by_type"]:
            print("   유형별:")
            for t, cnt in stats["by_type"].items():
                print(f"     - {t}: {cnt}건")
        if stats["by_school"]:
            print("   학교별:")
            for sid, cnt in stats["by_school"].items():
                name = SCHOOLS.get(sid, {}).get("name", sid)
                print(f"     - {name} ({sid}): {cnt}건")
        return

    # 크롤러 선택
    if args.mock:
        crawlers: list[type[BaseCrawler]] = [MockCrawler]
    else:
        crawlers = [SchoolWebsiteCrawler, JokboCrawler]

    orchestrator = CrawlOrchestrator(db)

    if args.all:
        print(f"\n🚀 전체 학교 배치 크롤링 시작 ({'DRY RUN' if args.dry_run else '실행'})")
        results = orchestrator.crawl_all(crawlers, dry_run=args.dry_run)

        for r in results:
            name = SCHOOLS.get(r["school_id"], {}).get("name", r["school_id"])
            if args.dry_run:
                print(f"\n  🏫 {name} ({r['school_id']})")
                for cr in r.get("dry_run_results", []):
                    print(f"     {cr['crawler']}: {cr['materials_count']}건")
                    for preview in cr.get("preview", []):
                        print(f"       - {preview}")
            else:
                print(f"  ✅ {name}: {r['inserted']}건 저장, {r['skipped']}건 스킵")

    elif args.school:
        print(f"\n🚀 학교 크롤링: {SCHOOLS[args.school]['name']} "
              f"({'DRY RUN' if args.dry_run else '실행'})")

        result = orchestrator.crawl_school(
            args.school, crawlers, subject=args.subject, dry_run=args.dry_run
        )

        if args.dry_run:
            for cr in result.get("dry_run_results", []):
                print(f"  📦 {cr['crawler']}: {cr['materials_count']}건")
                for preview in cr.get("preview", []):
                    print(f"     - {preview}")
        else:
            print(f"  ✅ 저장: {result['inserted']}건, 스킵: {result['skipped']}건")

    else:
        parser.print_help()

    # 최종 통계
    stats = db.stats()
    print(f"\n📊 현재 DB: 총 {stats['total']}건")


if __name__ == "__main__":
    main()
