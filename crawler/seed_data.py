#!/usr/bin/env python3
"""
4exam.study 샘플 데이터 생성기
==============================
exam_materials 테이블에 20개의 현실적인 기출문제/예상문제 샘플 데이터를 삽입합니다.

사용법:
  python seed_data.py              # 20개 샘플 데이터 삽입
  python seed_data.py --clear      # 기존 샘플 데이터 초기화 후 삽입
  python seed_data.py --dry-run    # 삽입 없이 생성될 데이터 미리보기
"""

import argparse
import sqlite3
import sys
import time
from pathlib import Path
from typing import Optional

# 프로젝트 루트 (seed_data.py 기준 ../frontend/data/4exam.db)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "frontend" / "data" / "4exam.db"


class SeedDataGenerator:
    """샘플 시험자료 생성 및 삽입"""

    # 학교 정보
    SCHOOLS = {
        "school-001": {"name": "서울중학교", "region": "서울", "type": "중학교", "publisher": "비상교육"},
        "school-002": {"name": "부산고등학교", "region": "부산", "type": "고등학교", "publisher": "미래엔"},
        "school-003": {"name": "대구중학교", "region": "대구", "type": "중학교", "publisher": "천재교육"},
        "school-004": {"name": "광주고등학교", "region": "광주", "type": "고등학교", "publisher": "비상교육"},
        "school-005": {"name": "대전중학교", "region": "대전", "type": "중학교", "publisher": "지학사"},
        "school-006": {"name": "세종고등학교", "region": "세종", "type": "고등학교", "publisher": "미래엔"},
        "school-007": {"name": "경기중학교", "region": "경기", "type": "중학교", "publisher": "천재교육"},
        "school-008": {"name": "인천고등학교", "region": "인천", "type": "고등학교", "publisher": "비상교육"},
    }

    # 20개 샘플 데이터 명세
    # (school_id, subject, title, type, year, semester, description)
    SAMPLES = [
        # --- 서울중학교 (school-001) ---
        ("school-001", "국어", "2024학년도 1학기 국어 중간고사", "기출문제", 2024, "1학기",
         "서울중학교 2024년 1학기 국어 중간고사 기출문제입니다. 비상교육 교과서 기준, 1~3단원 범위."),
        ("school-001", "영어", "2024학년도 2학기 영어 기말고사", "기출문제", 2024, "2학기",
         "서울중학교 2024년 2학기 영어 기말고사. 듣기평가 포함 25문항."),
        ("school-001", "수학", "2024학년도 수학 수행평가", "기출문제", 2024, "1학기",
         "서울중학교 수학 수행평가 문제지. 함수와 그래프 단원."),

        # --- 부산고등학교 (school-002) ---
        ("school-002", "국어", "2025학년도 1학기 국어 중간고사", "기출문제", 2025, "1학기",
         "부산고등학교 2025년 국어 중간고사. 문학(현대시, 고전소설) 중심."),
        ("school-002", "수학", "2025학년도 수학Ⅰ 내신대비 예상문제", "예상문제", 2025, "1학기",
         "부산고등학교 수학Ⅰ 내신대비 예상문제 20문항. 지수로그함수 중심."),
        ("school-002", "영어", "2024학년도 2학기 영어 기말고사", "기출문제", 2024, "2학기",
         "부산고등학교 영어 기말고사. 모의고사 유형 30문항."),

        # --- 대구중학교 (school-003) ---
        ("school-003", "과학", "2024학년도 1학기 과학 중간고사", "기출문제", 2024, "1학기",
         "대구중학교 과학 중간고사. 물질의 특성, 생물의 다양성 단원."),
        ("school-003", "사회", "2025학년도 사회 예상문제 1회", "예상문제", 2025, "1학기",
         "대구중학교 사회 예상문제. 지리(한국지리) 중심 20문항."),
        ("school-003", "국어", "2024학년도 2학기 국어 기말고사", "기출문제", 2024, "2학기",
         "대구중학교 국어 기말고사. 설명문, 논설문 읽기 중심."),

        # --- 광주고등학교 (school-004) ---
        ("school-004", "과학", "2024학년도 수능 과학탐구 예상문제 3회", "예상문제", 2024, "2학기",
         "광주고등학교 수능대비 과탐 예상문제. 물리학Ⅰ+화학Ⅰ 각 20문항."),
        ("school-004", "사회", "2025학년도 3월 사회 모의고사", "모의고사", 2025, "1학기",
         "광주고등학교 사회탐구 모의고사. 생활과윤리, 사회문화 포함."),
        ("school-004", "영어", "2024학년도 영어 서술형 대비 학습지", "학습지", 2024, "2학기",
         "광주고등학교 영어 서술형 대비. 영작 및 요약문 작성 연습."),

        # --- 대전중학교 (school-005) ---
        ("school-005", "수학", "2024학년도 1학기 수학 중간고사", "기출문제", 2024, "1학기",
         "대전중학교 수학 중간고사. 정수와 유리수, 문자와 식 단원."),
        ("school-005", "영어", "2024학년도 영어 듣기평가 기출", "기출문제", 2024, "1학기",
         "대전중학교 영어 듣기평가. 20문항, MP3 음원 포함."),
        ("school-005", "국어", "2025학년도 국어 예상문제 2회", "예상문제", 2025, "1학기",
         "대전중학교 국어 예상문제. 문법(품사, 문장성분) 중심."),

        # --- 세종고등학교 (school-006) ---
        ("school-006", "수학", "2024학년도 6월 수학 모의고사", "모의고사", 2024, "1학기",
         "세종고등학교 수학 모의고사. 수학Ⅰ+수학Ⅱ, 30문항."),
        ("school-006", "과학", "2025학년도 과학탐구 기출문제", "기출문제", 2025, "1학기",
         "세종고등학교 과탐 기출. 생명과학Ⅰ, 지구과학Ⅰ 포함."),

        # --- 경기중학교 (school-007) ---
        ("school-007", "사회", "2024학년도 2학기 사회 기말고사", "기출문제", 2024, "2학기",
         "경기중학교 사회 기말고사. 역사(조선시대) 중심."),
        ("school-007", "과학", "2025학년도 과학 예상문제", "예상문제", 2025, "1학기",
         "경기중학교 과학 예상문제. 힘과 운동, 전기와 자기 단원."),

        # --- 인천고등학교 (school-008) ---
        ("school-008", "국어", "2025학년도 수능 국어 예상문제 5회", "예상문제", 2025, "2학기",
         "인천고등학교 수능대비 국어 예상문제. 독서+문학 통합형 45문항."),
    ]

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def _ensure_schema(self):
        """exam_materials 테이블이 없으면 생성 (Next.js와 동일 스키마)"""
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS schools (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    region TEXT NOT NULL,
                    type TEXT NOT NULL,
                    address TEXT,
                    textbook_publisher TEXT,
                    lunch_api_key TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS subjects (
                    id TEXT PRIMARY KEY,
                    school_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    grade INTEGER,
                    FOREIGN KEY (school_id) REFERENCES schools(id)
                );

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
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (school_id) REFERENCES schools(id)
                );

                INSERT OR IGNORE INTO schools (id, name, region, type, address, textbook_publisher) VALUES
                    ('school-001', '서울중학교', '서울', '중학교', '서울특별시 강남구', '비상교육'),
                    ('school-002', '부산고등학교', '부산', '고등학교', '부산광역시 해운대구', '미래엔'),
                    ('school-003', '대구중학교', '대구', '중학교', '대구광역시 수성구', '천재교육'),
                    ('school-004', '광주고등학교', '광주', '고등학교', '광주광역시 북구', '비상교육'),
                    ('school-005', '대전중학교', '대전', '중학교', '대전광역시 유성구', '지학사'),
                    ('school-006', '세종고등학교', '세종', '고등학교', '세종특별자치시', '미래엔'),
                    ('school-007', '경기중학교', '경기', '중학교', '경기도 수원시', '천재교육'),
                    ('school-008', '인천고등학교', '인천', '고등학교', '인천광역시 연수구', '비상교육');
            """)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def clear_samples(self):
        """샘플 데이터로 생성된 모든 exam_materials 레코드 삭제"""
        with self._connect() as conn:
            result = conn.execute("DELETE FROM exam_materials")
            conn.commit()
            print(f"🧹 기존 데이터 {result.rowcount}건 삭제됨")

    def generate(self, dry_run: bool = False) -> list[dict]:
        """샘플 데이터 생성"""
        results = []

        for i, (school_id, subject, title, mat_type, year, semester, desc) in enumerate(self.SAMPLES):
            mat_id = f"mat-seed-{i + 1:04d}"
            school = self.SCHOOLS[school_id]

            mat = {
                "id": mat_id,
                "school_id": school_id,
                "subject_id": f"subj-{subject}",
                "title": title,
                "type": mat_type,
                "description": desc,
                "file_url": (f"https://cdn.4exam.study/materials/"
                             f"{school_id}/{subject}/{title.replace(' ', '_')}.pdf"),
                "year": year,
                "semester": semester,
            }

            if dry_run:
                results.append(mat)
            else:
                self._insert(mat)
                results.append(mat)

        return results

    def _insert(self, mat: dict):
        """단일 자료 삽입"""
        with self._connect() as conn:
            # 중복 체크
            existing = conn.execute(
                "SELECT id FROM exam_materials WHERE id = ?",
                (mat["id"],),
            ).fetchone()
            if existing:
                print(f"  ⏭️  스킵 (이미 존재): {mat['title']}")
                return

            conn.execute(
                """INSERT INTO exam_materials
                   (id, school_id, subject_id, title, type, description, file_url, year, semester)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mat["id"],
                    mat["school_id"],
                    mat["subject_id"],
                    mat["title"],
                    mat["type"],
                    mat["description"],
                    mat["file_url"],
                    mat["year"],
                    mat["semester"],
                ),
            )
            school_name = self.SCHOOLS[mat["school_id"]]["name"]
            print(f"  ✅ 저장: [{school_name}] {mat['title']} ({mat['type']})")

    def stats(self):
        """현재 DB 통계 출력"""
        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(*) as cnt FROM exam_materials").fetchone()["cnt"]
            by_type = conn.execute(
                "SELECT type, COUNT(*) as cnt FROM exam_materials GROUP BY type"
            ).fetchall()
            by_school = conn.execute(
                "SELECT school_id, COUNT(*) as cnt FROM exam_materials GROUP BY school_id"
            ).fetchall()

            print(f"\n📊 exam_materials 통계")
            print(f"   총 자료: {total}건")
            if by_type:
                print("   유형별:")
                for r in by_type:
                    print(f"     - {r['type']}: {r['cnt']}건")
            if by_school:
                print("   학교별:")
                for r in by_school:
                    name = self.SCHOOLS.get(r["school_id"], {}).get("name", r["school_id"])
                    print(f"     - {name} ({r['school_id']}): {r['cnt']}건")


def main():
    parser = argparse.ArgumentParser(
        description="4exam.study 샘플 시험자료 생성기 — exam_materials 테이블에 20건 삽입"
    )
    parser.add_argument(
        "--clear", "-c",
        action="store_true",
        help="기존 exam_materials 데이터를 모두 삭제 후 삽입",
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="삽입 없이 생성될 데이터 미리보기",
    )
    args = parser.parse_args()

    gen = SeedDataGenerator()

    if args.clear:
        print("⚠️  기존 exam_materials 데이터를 모두 삭제합니다.")
        confirm = input("계속하시겠습니까? (y/N): ")
        if confirm.lower() != "y":
            print("취소되었습니다.")
            return
        gen.clear_samples()

    print(f"\n📝 샘플 데이터 {len(gen.SAMPLES)}건 {'미리보기' if args.dry_run else '생성'} 시작\n")

    results = gen.generate(dry_run=args.dry_run)

    if args.dry_run:
        for i, mat in enumerate(results):
            school = gen.SCHOOLS[mat["school_id"]]
            print(f"  {i+1}. [{school['name']}] {mat['title']}")
            print(f"     유형: {mat['type']} | 과목: {mat['subject_id']} | "
                  f"{mat['year']} {mat['semester']}")
            print(f"     설명: {mat['description'][:60]}...")
            print()
    else:
        print(f"\n✅ 완료! {len(results)}건의 샘플 데이터가 생성되었습니다.")

    gen.stats()

    # 검증: 미리 정의된 20개 샘플이 실제로 삽입되었는지
    if not args.dry_run:
        with gen._connect() as conn:
            seed_count = conn.execute(
                "SELECT COUNT(*) as cnt FROM exam_materials WHERE id LIKE 'mat-seed-%'"
            ).fetchone()["cnt"]
            print(f"\n🔍 검증: 'mat-seed-*' ID {seed_count}건 확인 "
                  f"(예상: {len(gen.SAMPLES)}건)")


if __name__ == "__main__":
    main()
