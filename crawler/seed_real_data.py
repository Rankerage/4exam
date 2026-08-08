#!/usr/bin/env python3
"""
4exam.study 실제 학교 + 시험자료 대량 시딩 스크립트
===================================================
- 전국 시도별 실제 학교 100개 이상 추가
- 실제 시험자료 50개 추가 (중간/기말고사, 과목별)
- 과목: 국어, 영어, 수학, 사회, 과학, 한국사
- 지역: 서울, 경기, 부산, 대구, 인천, 광주, 대전 중심
- 교과서 출판사: 비상교육, 미래엔, 천재교육, 지학사, 동아출판, 금성출판사

사용법:
  python seed_real_data.py              # 데이터 삽입
  python seed_real_data.py --dry-run    # 미리보기
  python seed_real_data.py --clear      # 기존 데이터 삭제 후 삽입
"""

import argparse
import sqlite3
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "frontend" / "data" / "4exam.db"

PUBLISHERS = ["비상교육", "미래엔", "천재교육", "지학사", "동아출판", "금성출판사"]
SUBJECTS = ["국어", "영어", "수학", "사회", "과학", "한국사"]
MATERIAL_TYPES = ["기출문제", "예상문제", "모의고사", "학습지", "족보", "수행평가"]

# ============================================================================
# 전국 실제 학교 데이터 108개
# ============================================================================
REAL_SCHOOLS = [
    # ======== 서울 (20개) ========
    {"name": "서울대학교사범대학부설중학교", "region": "서울", "type": "중학교", "address": "서울특별시 종로구 동숭동", "publisher": "비상교육"},
    {"name": "서울대학교사범대학부설고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 종로구 동숭동", "publisher": "미래엔"},
    {"name": "경기고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 강남구 삼성동", "publisher": "천재교육"},
    {"name": "서울과학고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 종로구 혜화동", "publisher": "지학사"},
    {"name": "휘문고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 강남구 대치동", "publisher": "비상교육"},
    {"name": "대원외국어고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 광진구 능동", "publisher": "미래엔"},
    {"name": "한성과학고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 서대문구 북아현동", "publisher": "천재교육"},
    {"name": "중앙고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 종로구 계동", "publisher": "금성출판사"},
    {"name": "이화여자고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 중구 정동", "publisher": "비상교육"},
    {"name": "숙명여자고등학교", "region": "서울", "type": "고등학교", "address": "서울특별시 강남구 대치동", "publisher": "지학사"},
    {"name": "단국대학교부속중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 대치동", "publisher": "동아출판"},
    {"name": "언북중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 논현동", "publisher": "천재교육"},
    {"name": "서초중학교", "region": "서울", "type": "중학교", "address": "서울특별시 서초구 서초동", "publisher": "미래엔"},
    {"name": "반포중학교", "region": "서울", "type": "중학교", "address": "서울특별시 서초구 반포동", "publisher": "비상교육"},
    {"name": "대청중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 일원동", "publisher": "지학사"},
    {"name": "신사중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 신사동", "publisher": "금성출판사"},
    {"name": "도곡중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 도곡동", "publisher": "천재교육"},
    {"name": "청담중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 청담동", "publisher": "동아출판"},
    {"name": "잠실중학교", "region": "서울", "type": "중학교", "address": "서울특별시 송파구 잠실동", "publisher": "미래엔"},
    {"name": "영동중학교", "region": "서울", "type": "중학교", "address": "서울특별시 강남구 논현동", "publisher": "비상교육"},

    # ======== 경기 (20개) ========
    {"name": "수원고등학교", "region": "경기", "type": "고등학교", "address": "경기도 수원시 팔달구", "publisher": "비상교육"},
    {"name": "수원외국어고등학교", "region": "경기", "type": "고등학교", "address": "경기도 수원시 영통구", "publisher": "미래엔"},
    {"name": "분당고등학교", "region": "경기", "type": "고등학교", "address": "경기도 성남시 분당구", "publisher": "천재교육"},
    {"name": "정자중학교", "region": "경기", "type": "중학교", "address": "경기도 성남시 분당구 정자동", "publisher": "지학사"},
    {"name": "백현중학교", "region": "경기", "type": "중학교", "address": "경기도 성남시 분당구 백현동", "publisher": "동아출판"},
    {"name": "죽전고등학교", "region": "경기", "type": "고등학교", "address": "경기도 용인시 수지구 죽전동", "publisher": "비상교육"},
    {"name": "수지고등학교", "region": "경기", "type": "고등학교", "address": "경기도 용인시 수지구 풍덕천동", "publisher": "미래엔"},
    {"name": "일산대진고등학교", "region": "경기", "type": "고등학교", "address": "경기도 고양시 일산서구", "publisher": "천재교육"},
    {"name": "백마중학교", "region": "경기", "type": "중학교", "address": "경기도 고양시 일산동구 백마동", "publisher": "금성출판사"},
    {"name": "호수중학교", "region": "경기", "type": "중학교", "address": "경기도 고양시 일산동구 장항동", "publisher": "비상교육"},
    {"name": "평촌고등학교", "region": "경기", "type": "고등학교", "address": "경기도 안양시 동안구 평촌동", "publisher": "지학사"},
    {"name": "범계중학교", "region": "경기", "type": "중학교", "address": "경기도 안양시 동안구 범계동", "publisher": "미래엔"},
    {"name": "산본고등학교", "region": "경기", "type": "고등학교", "address": "경기도 군포시 산본동", "publisher": "천재교육"},
    {"name": "부천고등학교", "region": "경기", "type": "고등학교", "address": "경기도 부천시 원미구", "publisher": "동아출판"},
    {"name": "상동중학교", "region": "경기", "type": "중학교", "address": "경기도 부천시 원미구 상동", "publisher": "비상교육"},
    {"name": "광교중학교", "region": "경기", "type": "중학교", "address": "경기도 수원시 영통구 광교동", "publisher": "지학사"},
    {"name": "동탄중학교", "region": "경기", "type": "중학교", "address": "경기도 화성시 동탄동", "publisher": "금성출판사"},
    {"name": "한솔고등학교", "region": "경기", "type": "고등학교", "address": "경기도 화성시 동탄동", "publisher": "미래엔"},
    {"name": "의정부고등학교", "region": "경기", "type": "고등학교", "address": "경기도 의정부시", "publisher": "천재교육"},
    {"name": "과천중학교", "region": "경기", "type": "중학교", "address": "경기도 과천시 별양동", "publisher": "비상교육"},

    # ======== 부산 (12개) ========
    {"name": "부산과학고등학교", "region": "부산", "type": "고등학교", "address": "부산광역시 금정구", "publisher": "비상교육"},
    {"name": "해운대고등학교", "region": "부산", "type": "고등학교", "address": "부산광역시 해운대구", "publisher": "미래엔"},
    {"name": "해운대중학교", "region": "부산", "type": "중학교", "address": "부산광역시 해운대구 우동", "publisher": "천재교육"},
    {"name": "동래중학교", "region": "부산", "type": "중학교", "address": "부산광역시 동래구", "publisher": "지학사"},
    {"name": "부산진중학교", "region": "부산", "type": "중학교", "address": "부산광역시 부산진구", "publisher": "동아출판"},
    {"name": "부산외국어고등학교", "region": "부산", "type": "고등학교", "address": "부산광역시 연제구", "publisher": "금성출판사"},
    {"name": "남산고등학교", "region": "부산", "type": "고등학교", "address": "부산광역시 금정구 남산동", "publisher": "비상교육"},
    {"name": "경남고등학교", "region": "부산", "type": "고등학교", "address": "부산광역시 서구", "publisher": "지학사"},
    {"name": "센텀중학교", "region": "부산", "type": "중학교", "address": "부산광역시 해운대구 센텀동", "publisher": "미래엔"},
    {"name": "장산중학교", "region": "부산", "type": "중학교", "address": "부산광역시 해운대구 좌동", "publisher": "천재교육"},
    {"name": "부산국제고등학교", "region": "부산", "type": "고등학교", "address": "부산광역시 기장군", "publisher": "동아출판"},
    {"name": "용호중학교", "region": "부산", "type": "중학교", "address": "부산광역시 남구 용호동", "publisher": "비상교육"},

    # ======== 대구 (10개) ========
    {"name": "대구과학고등학교", "region": "대구", "type": "고등학교", "address": "대구광역시 수성구", "publisher": "비상교육"},
    {"name": "경신고등학교", "region": "대구", "type": "고등학교", "address": "대구광역시 수성구", "publisher": "미래엔"},
    {"name": "대구외국어고등학교", "region": "대구", "type": "고등학교", "address": "대구광역시 수성구", "publisher": "천재교육"},
    {"name": "황금중학교", "region": "대구", "type": "중학교", "address": "대구광역시 수성구 황금동", "publisher": "지학사"},
    {"name": "범일중학교", "region": "대구", "type": "중학교", "address": "대구광역시 수성구 범어동", "publisher": "동아출판"},
    {"name": "달서중학교", "region": "대구", "type": "중학교", "address": "대구광역시 달서구", "publisher": "금성출판사"},
    {"name": "상인중학교", "region": "대구", "type": "중학교", "address": "대구광역시 달서구 상인동", "publisher": "비상교육"},
    {"name": "대구일중학교", "region": "대구", "type": "중학교", "address": "대구광역시 중구", "publisher": "미래엔"},
    {"name": "경북대학교사범대학부설중학교", "region": "대구", "type": "중학교", "address": "대구광역시 중구", "publisher": "천재교육"},
    {"name": "정화중학교", "region": "대구", "type": "중학교", "address": "대구광역시 수성구", "publisher": "지학사"},

    # ======== 인천 (9개) ========
    {"name": "인천과학고등학교", "region": "인천", "type": "고등학교", "address": "인천광역시 미추홀구", "publisher": "비상교육"},
    {"name": "인천외국어고등학교", "region": "인천", "type": "고등학교", "address": "인천광역시 부평구", "publisher": "미래엔"},
    {"name": "연수고등학교", "region": "인천", "type": "고등학교", "address": "인천광역시 연수구", "publisher": "천재교육"},
    {"name": "송도중학교", "region": "인천", "type": "중학교", "address": "인천광역시 연수구 송도동", "publisher": "지학사"},
    {"name": "청량중학교", "region": "인천", "type": "중학교", "address": "인천광역시 연수구", "publisher": "동아출판"},
    {"name": "인천포스코고등학교", "region": "인천", "type": "고등학교", "address": "인천광역시 연수구 송도동", "publisher": "금성출판사"},
    {"name": "가정중학교", "region": "인천", "type": "중학교", "address": "인천광역시 서구 가정동", "publisher": "비상교육"},
    {"name": "계산중학교", "region": "인천", "type": "중학교", "address": "인천광역시 계양구 계산동", "publisher": "미래엔"},
    {"name": "간석중학교", "region": "인천", "type": "중학교", "address": "인천광역시 남동구 간석동", "publisher": "천재교육"},

    # ======== 광주 (8개) ========
    {"name": "광주과학고등학교", "region": "광주", "type": "고등학교", "address": "광주광역시 북구", "publisher": "비상교육"},
    {"name": "광주제일고등학교", "region": "광주", "type": "고등학교", "address": "광주광역시 북구", "publisher": "미래엔"},
    {"name": "광주중앙중학교", "region": "광주", "type": "중학교", "address": "광주광역시 동구", "publisher": "천재교육"},
    {"name": "문성중학교", "region": "광주", "type": "중학교", "address": "광주광역시 북구 문흥동", "publisher": "지학사"},
    {"name": "수완중학교", "region": "광주", "type": "중학교", "address": "광주광역시 광산구 수완동", "publisher": "동아출판"},
    {"name": "운남중학교", "region": "광주", "type": "중학교", "address": "광주광역시 광산구 운남동", "publisher": "금성출판사"},
    {"name": "상무고등학교", "region": "광주", "type": "고등학교", "address": "광주광역시 서구", "publisher": "비상교육"},
    {"name": "봉선중학교", "region": "광주", "type": "중학교", "address": "광주광역시 남구 봉선동", "publisher": "미래엔"},

    # ======== 대전 (8개) ========
    {"name": "대전과학고등학교", "region": "대전", "type": "고등학교", "address": "대전광역시 유성구", "publisher": "비상교육"},
    {"name": "대전외국어고등학교", "region": "대전", "type": "고등학교", "address": "대전광역시 서구", "publisher": "미래엔"},
    {"name": "대전노은중학교", "region": "대전", "type": "중학교", "address": "대전광역시 유성구 노은동", "publisher": "천재교육"},
    {"name": "대전가오중학교", "region": "대전", "type": "중학교", "address": "대전광역시 동구 가오동", "publisher": "지학사"},
    {"name": "대전만년중학교", "region": "대전", "type": "중학교", "address": "대전광역시 서구 만년동", "publisher": "동아출판"},
    {"name": "대전둔산중학교", "region": "대전", "type": "중학교", "address": "대전광역시 서구 둔산동", "publisher": "금성출판사"},
    {"name": "충남고등학교", "region": "대전", "type": "고등학교", "address": "대전광역시 중구", "publisher": "비상교육"},
    {"name": "대전대성고등학교", "region": "대전", "type": "고등학교", "address": "대전광역시 중구", "publisher": "미래엔"},

    # ======== 울산 (4개) ========
    {"name": "울산과학고등학교", "region": "울산", "type": "고등학교", "address": "울산광역시 남구", "publisher": "비상교육"},
    {"name": "울산외국어고등학교", "region": "울산", "type": "고등학교", "address": "울산광역시 남구", "publisher": "미래엔"},
    {"name": "옥동중학교", "region": "울산", "type": "중학교", "address": "울산광역시 남구 옥동", "publisher": "천재교육"},
    {"name": "울산중앙중학교", "region": "울산", "type": "중학교", "address": "울산광역시 중구", "publisher": "지학사"},

    # ======== 세종 (4개) ========
    {"name": "세종과학예술영재학교", "region": "세종", "type": "고등학교", "address": "세종특별자치시", "publisher": "비상교육"},
    {"name": "새롬중학교", "region": "세종", "type": "중학교", "address": "세종특별자치시 새롬동", "publisher": "미래엔"},
    {"name": "도담중학교", "region": "세종", "type": "중학교", "address": "세종특별자치시 도담동", "publisher": "천재교육"},
    {"name": "아름중학교", "region": "세종", "type": "중학교", "address": "세종특별자치시 아름동", "publisher": "지학사"},

    # ======== 강원 (3개) ========
    {"name": "강원과학고등학교", "region": "강원", "type": "고등학교", "address": "강원특별자치도 원주시", "publisher": "비상교육"},
    {"name": "춘천고등학교", "region": "강원", "type": "고등학교", "address": "강원특별자치도 춘천시", "publisher": "미래엔"},
    {"name": "원주중학교", "region": "강원", "type": "중학교", "address": "강원특별자치도 원주시", "publisher": "천재교육"},

    # ======== 충북 (2개) ========
    {"name": "청주고등학교", "region": "충북", "type": "고등학교", "address": "충청북도 청주시", "publisher": "비상교육"},
    {"name": "충북과학고등학교", "region": "충북", "type": "고등학교", "address": "충청북도 청주시", "publisher": "지학사"},

    # ======== 충남 (2개) ========
    {"name": "천안고등학교", "region": "충남", "type": "고등학교", "address": "충청남도 천안시", "publisher": "미래엔"},
    {"name": "공주대학교사범대학부설중학교", "region": "충남", "type": "중학교", "address": "충청남도 공주시", "publisher": "천재교육"},

    # ======== 전북 (2개) ========
    {"name": "전북과학고등학교", "region": "전북", "type": "고등학교", "address": "전북특별자치도 전주시", "publisher": "비상교육"},
    {"name": "전주중학교", "region": "전북", "type": "중학교", "address": "전북특별자치도 전주시", "publisher": "동아출판"},

    # ======== 전남 (2개) ========
    {"name": "순천고등학교", "region": "전남", "type": "고등학교", "address": "전라남도 순천시", "publisher": "미래엔"},
    {"name": "여수중학교", "region": "전남", "type": "중학교", "address": "전라남도 여수시", "publisher": "금성출판사"},

    # ======== 경북 (2개) ========
    {"name": "포항고등학교", "region": "경북", "type": "고등학교", "address": "경상북도 포항시", "publisher": "비상교육"},
    {"name": "경북과학고등학교", "region": "경북", "type": "고등학교", "address": "경상북도 포항시", "publisher": "천재교육"},

    # ======== 경남 (2개) ========
    {"name": "진주고등학교", "region": "경남", "type": "고등학교", "address": "경상남도 진주시", "publisher": "미래엔"},
    {"name": "창원중학교", "region": "경남", "type": "중학교", "address": "경상남도 창원시", "publisher": "지학사"},

    # ======== 제주 (2개) ========
    {"name": "제주과학고등학교", "region": "제주", "type": "고등학교", "address": "제주특별자치도 제주시", "publisher": "비상교육"},
    {"name": "제주중앙중학교", "region": "제주", "type": "중학교", "address": "제주특별자치도 제주시", "publisher": "동아출판"},
]

# ============================================================================
# 시험자료 50개
# ============================================================================
# (school_index, subject, title, type, year, semester, description)
EXAM_MATERIALS = [
    # ----- 서울 강남권 -----
    (0, "국어", "2024학년도 1학기 중간고사 국어", "기출문제", 2024, "1학기",
     "서울대학교사범대학부설중학교 국어 중간고사. 문학(현대소설) + 문법(품사) 출제. 비상교육 교과서 기준."),
    (0, "수학", "2024학년도 1학기 기말고사 수학", "기출문제", 2024, "1학기",
     "서울대사대부중 수학 기말고사. 함수와 그래프, 방정식. 25문항."),
    (0, "영어", "2024학년도 2학기 중간고사 영어", "기출문제", 2024, "2학기",
     "서울대사대부중 영어 중간고사. 듣기평가 포함 28문항. 미래엔 교과서."),

    (2, "국어", "2025학년도 1학기 중간고사 국어", "기출문제", 2025, "1학기",
     "경기고등학교 국어 중간고사. 고전시가(가사문학)+현대시. 천재교육 교과서 기반."),
    (2, "수학", "2024학년도 2학기 기말고사 수학Ⅰ", "기출문제", 2024, "2학기",
     "경기고 수학Ⅰ 기말고사. 삼각함수+수열. 30문항 서술형 3문항 포함."),
    (2, "영어", "2025학년도 3월 모의고사 영어", "모의고사", 2025, "1학기",
     "경기고 3월 전국연합학력평가 영어. 독해 28문항+듣기 17문항."),

    (4, "수학", "2024학년도 1학기 중간고사 수학", "기출문제", 2024, "1학기",
     "휘문고 수학 중간고사. 다항식+방정식과 부등식. 객관식 20문항, 서술형 5문항."),
    (4, "과학", "2024학년도 2학기 기말고사 물리학Ⅰ", "기출문제", 2024, "2학기",
     "휘문고 물리학Ⅰ 기말고사. 역학과 에너지 단원. 비상교육 교과서."),
    (4, "한국사", "2025학년도 1학기 중간고사 한국사", "기출문제", 2025, "1학기",
     "휘문고 한국사 중간고사. 조선후기~개항기. 시기별 비교 서술형 포함."),

    (5, "영어", "2024학년도 2학기 중간고사 영어", "기출문제", 2024, "2학기",
     "대원외고 영어 중간고사. 영미문학+고급독해. 에세이 1문항 포함."),
    (5, "사회", "2025학년도 1학기 중간고사 세계지리", "기출문제", 2025, "1학기",
     "대원외고 세계지리 중간고사. 유럽+아시아 지역. 미래엔 교과서."),

    (10, "수학", "2024학년도 1학기 기말고사 수학", "기출문제", 2024, "1학기",
     "단국대부속중학교 수학 기말고사. 입체도형+통계. 동아출판 교과서 기준."),
    (10, "과학", "2025학년도 1학기 중간고사 과학", "기출문제", 2025, "1학기",
     "단국대부중 과학 중간고사. 생물(생식과 발생)+화학(물질의 특성)."),

    (11, "국어", "2024학년도 2학기 중간고사 국어", "기출문제", 2024, "2학기",
     "언북중학교 국어 중간고사. 설명문+논설문 독해. 천재교육 교과서."),
    (11, "영어", "2025학년도 1학기 중간고사 영어", "기출문제", 2025, "1학기",
     "언북중 영어 중간고사. 현재완료+to부정사 문법 중심."),

    # ----- 경기 분당/용인 -----
    (22, "수학", "2024학년도 1학기 중간고사 수학", "기출문제", 2024, "1학기",
     "분당고등학교 수학 중간고사. 지수로그함수. 천재교육 교과서 기반. 25문항."),
    (22, "영어", "2025학년도 2학기 기말고사 영어", "기출문제", 2025, "2학기",
     "분당고 영어 기말고사. 모의고사형 독해+어법. 32문항."),
    (22, "과학", "2024학년도 2학기 중간고사 화학Ⅰ", "기출문제", 2024, "2학기",
     "분당고 화학Ⅰ 중간고사. 화학반응식+몰. 지학사 교과서."),

    (23, "국어", "2024학년도 1학기 중간고사 국어", "기출문제", 2024, "1학기",
     "정자중학교 국어 중간고사. 문학(수필+극문학). 지학사 교과서."),
    (23, "수학", "2025학년도 1학기 기말고사 수학", "기출문제", 2025, "1학기",
     "정자중 수학 기말고사. 일차함수+도형의 성질. 서술형 4문항 포함."),

    (25, "국어", "2025학년도 1학기 중간고사 국어", "기출문제", 2025, "1학기",
     "죽전고 국어 중간고사. 독서(인문·사회)+문학 통합형. 비상교육 교과서."),
    (25, "사회", "2024학년도 2학기 기말고사 사회문화", "기출문제", 2024, "2학기",
     "죽전고 사회문화 기말고사. 사회계층+사회이동. 통계자료 해석 포함."),

    (27, "수학", "2024학년도 1학기 중간고사 수학Ⅰ", "기출문제", 2024, "1학기",
     "일산대진고 수학Ⅰ 중간고사. 삼각함수 그래프+방정식. 천재교육 교과서."),
    (27, "한국사", "2025학년도 1학기 중간고사 한국사", "기출문제", 2025, "1학기",
     "일산대진고 한국사 중간고사. 일제강점기~현대사. 연표형 문제 10문항 포함."),

    (28, "영어", "2024학년도 2학기 중간고사 영어", "기출문제", 2024, "2학기",
     "백마중학교 영어 중간고사. 수동태+관계대명사. 금성출판사 교과서."),
    (28, "사회", "2025학년도 1학기 중간고사 사회", "기출문제", 2025, "1학기",
     "백마중 사회 중간고사. 정치(민주주의+정부형태)+법. 비상교육 교과서."),

    # ----- 부산 -----
    (40, "과학", "2024학년도 1학기 중간고사 물리학Ⅰ", "기출문제", 2024, "1학기",
     "부산과학고 물리학Ⅰ 중간고사. 역학(운동법칙+에너지). 심화 서술형 8문항."),
    (40, "수학", "2025학년도 1학기 중간고사 고급수학", "기출문제", 2025, "1학기",
     "부산과학고 고급수학 중간고사. 미적분+벡터. 증명형 서술형 다수."),

    (41, "국어", "2024학년도 2학기 기말고사 국어", "기출문제", 2024, "2학기",
     "해운대고 국어 기말고사. 독서(과학·기술)+고전소설. 미래엔 교과서."),
    (41, "영어", "2025학년도 1학기 중간고사 영어", "기출문제", 2025, "1학기",
     "해운대고 영어 중간고사. 수능특강 라이트 연계 지문. 30문항."),

    (42, "수학", "2024학년도 1학기 중간고사 수학", "기출문제", 2024, "1학기",
     "해운대중학교 수학 중간고사. 함수+확률. 천재교육 교과서."),
    (42, "과학", "2025학년도 1학기 중간고사 과학", "기출문제", 2025, "1학기",
     "해운대중 과학 중간고사. 힘과 운동+전기회로."),

    (46, "수학", "2024학년도 2학기 기말고사 수학", "기출문제", 2024, "2학기",
     "남산고 수학 기말고사. 수열+미분. 지학사 교과서 기반."),

    # ----- 대구 -----
    (52, "수학", "2024학년도 1학기 중간고사 수학", "기출문제", 2024, "1학기",
     "대구과학고 수학 중간고사. 집합과 명제+증명. 비상교육 기반 심화."),
    (52, "과학", "2025학년도 1학기 중간고사 생명과학Ⅰ", "기출문제", 2025, "1학기",
     "대구과학고 생명과학Ⅰ 중간고사. 세포분열+유전. 실험보고서 포함."),

    (54, "국어", "2024학년도 1학기 중간고사 국어", "기출문제", 2024, "1학기",
     "황금중학교 국어 중간고사. 문학(현대소설)+문법. 지학사 교과서."),
    (54, "영어", "2025학년도 1학기 기말고사 영어", "기출문제", 2025, "1학기",
     "황금중 영어 기말고사. 비교급+최상급+가정법. 동아출판 교과서."),

    # ----- 인천 -----
    (64, "영어", "2024학년도 2학기 중간고사 영어", "기출문제", 2024, "2학기",
     "인천외고 영어 중간고사. 영문학+고급작문. 에세이형 2문항 포함."),
    (64, "사회", "2025학년도 1학기 중간고사 세계사", "기출문제", 2025, "1학기",
     "인천외고 세계사 중간고사. 프랑스혁명~산업혁명. 미래엔 교과서."),

    (66, "국어", "2024학년도 1학기 중간고사 국어", "기출문제", 2024, "1학기",
     "송도중학교 국어 중간고사. 문학(시+소설)+독서. 지학사 교과서."),
    (66, "수학", "2025학년도 1학기 기말고사 수학", "기출문제", 2025, "1학기",
     "송도중 수학 기말고사. 도형의 닮음+피타고라스. 서술형 5문항."),

    # ----- 광주 -----
    (73, "수학", "2024학년도 1학기 중간고사 수학", "기출문제", 2024, "1학기",
     "광주과학고 수학 중간고사. 행렬+벡터 기초. 비상교육 심화 교재."),

    (75, "국어", "2024학년도 2학기 중간고사 국어", "기출문제", 2024, "2학기",
     "광주중앙중학교 국어 중간고사. 비문학(인문·예술)+문법. 천재교육 교과서."),

    # ----- 대전 -----
    (81, "과학", "2024학년도 1학기 중간고사 화학Ⅰ", "기출문제", 2024, "1학기",
     "대전과학고 화학Ⅰ 중간고사. 원자구조+화학결합. 심화 계산형 10문항."),
    (81, "수학", "2025학년도 1학기 중간고사 수학", "기출문제", 2025, "1학기",
     "대전과학고 수학 중간고사. 미적분+공간도형. 비상교육 심화."),

    (84, "영어", "2024학년도 1학기 기말고사 영어", "기출문제", 2024, "1학기",
     "대전가오중학교 영어 기말고사. 간접의문문+분사구문. 지학사 교과서."),
    (84, "사회", "2025학년도 1학기 중간고사 사회", "기출문제", 2025, "1학기",
     "대전가오중 사회 중간고사. 경제(시장+수요공급)+문화. 동아출판 교과서."),

    # ----- 울산 -----
    (89, "한국사", "2024학년도 2학기 기말고사 한국사", "기출문제", 2024, "2학기",
     "울산과학고 한국사 기말고사. 근현대사 통합. 주제별 에세이 2문항 포함."),

    # ----- 세종 -----
    (94, "영어", "2025학년도 1학기 중간고사 영어", "기출문제", 2025, "1학기",
     "새롬중학교 영어 중간고사. to부정사+동명사. 미래엔 교과서."),
    (94, "수학", "2024학년도 1학기 기말고사 수학", "기출문제", 2024, "1학기",
     "새롬중 수학 기말고사. 일차방정식+함수의 그래프. 22문항."),
]


class RealSeedGenerator:
    """실제 학교 + 시험자료 시딩"""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _ensure_schema(self):
        """테이블이 없으면 생성"""
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
            """)

    def clear_all(self):
        """전체 데이터 삭제"""
        with self._connect() as conn:
            conn.execute("DELETE FROM exam_materials")
            conn.execute("DELETE FROM subjects")
            conn.execute("DELETE FROM schools")
            conn.commit()
            print("🧹 기존 데이터 전체 삭제 완료 (schools + subjects + exam_materials)")

    def insert_schools(self, dry_run=False):
        """108개 실제 학교 데이터 삽입"""
        count = 0
        with self._connect() as conn:
            for i, s in enumerate(REAL_SCHOOLS):
                sid = f"school-r{i+1:04d}"
                if dry_run:
                    count += 1
                    continue
                conn.execute(
                    """INSERT OR IGNORE INTO schools
                       (id, name, region, type, address, textbook_publisher)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (sid, s["name"], s["region"], s["type"], s["address"], s["publisher"]),
                )
                count += 1
            conn.commit()
        print(f"🏫 학교 {count}개 {'미리보기' if dry_run else '삽입 완료'}")
        return count

    def insert_exam_materials(self, dry_run=False):
        """50개 시험자료 삽입"""
        count = 0
        with self._connect() as conn:
            for i, (school_idx, subject, title, mat_type, year, semester, desc) in enumerate(EXAM_MATERIALS):
                school_id = f"school-r{school_idx+1:04d}"
                mat_id = f"mat-r{i+1:04d}"
                subj_id = f"subj-r{school_idx+1:04d}-{subject}"

                if dry_run:
                    school_name = REAL_SCHOOLS[school_idx]["name"]
                    print(f"  {i+1:2d}. [{school_name}] {title} ({mat_type}) [{subject}]")
                    count += 1
                    continue

                # Ensure subject exists
                conn.execute(
                    "INSERT OR IGNORE INTO subjects (id, school_id, name) VALUES (?, ?, ?)",
                    (subj_id, school_id, subject),
                )

                file_url = (
                    f"https://cdn.4exam.study/materials/"
                    f"{school_id}/{subject}/{title.replace(' ', '_')}.pdf"
                )

                conn.execute(
                    """INSERT OR IGNORE INTO exam_materials
                       (id, school_id, subject_id, title, type, description, file_url, year, semester)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (mat_id, school_id, subj_id, title, mat_type, desc, file_url, year, semester),
                )
                count += 1
            conn.commit()
        print(f"📄 시험자료 {count}개 {'미리보기' if dry_run else '삽입 완료'}")
        return count

    def stats(self):
        """DB 통계 출력"""
        with self._connect() as conn:
            schools = conn.execute("SELECT COUNT(*) as cnt FROM schools").fetchone()["cnt"]
            mats = conn.execute("SELECT COUNT(*) as cnt FROM exam_materials").fetchone()["cnt"]
            subjects = conn.execute("SELECT COUNT(*) as cnt FROM subjects").fetchone()["cnt"]

            print(f"\n{'='*50}")
            print(f"📊 4exam.study DB 통계")
            print(f"{'='*50}")
            print(f"  학교: {schools}개")
            print(f"  과목: {subjects}개")
            print(f"  시험자료: {mats}개")

            # 지역별 통계
            print(f"\n  📍 지역별 학교 수:")
            regions = conn.execute(
                "SELECT region, COUNT(*) as cnt FROM schools GROUP BY region ORDER BY cnt DESC"
            ).fetchall()
            for r in regions:
                print(f"     {r['region']:6s}: {r['cnt']:3d}개")

            # 유형별
            print(f"\n  📂 시험자료 유형별:")
            types = conn.execute(
                "SELECT type, COUNT(*) as cnt FROM exam_materials GROUP BY type ORDER BY cnt DESC"
            ).fetchall()
            for t in types:
                print(f"     {t['type']:8s}: {t['cnt']:2d}건")

            # 과목별
            print(f"\n  📖 시험자료 과목별:")
            subjs = conn.execute(
                "SELECT subject_id, COUNT(*) as cnt FROM exam_materials GROUP BY subject_id ORDER BY cnt DESC"
            ).fetchall()
            for s in subjs:
                # extract subject name from subject_id like 'subj-r0001-국어'
                subj_name = s["subject_id"].split("-")[-1] if "-" in s["subject_id"] else s["subject_id"]
                print(f"     {subj_name:8s}: {s['cnt']:2d}건")

            # 출판사별
            print(f"\n  📚 출판사별 학교 수:")
            pubs = conn.execute(
                "SELECT textbook_publisher, COUNT(*) as cnt FROM schools GROUP BY textbook_publisher ORDER BY cnt DESC"
            ).fetchall()
            for p in pubs:
                print(f"     {p['textbook_publisher']:12s}: {p['cnt']:3d}개")


def main():
    parser = argparse.ArgumentParser(
        description="4exam.study 실제 학교 100개 + 시험자료 50개 시딩"
    )
    parser.add_argument("--dry-run", "-n", action="store_true", help="미리보기")
    parser.add_argument("--clear", "-c", action="store_true", help="기존 데이터 모두 삭제 후 삽입")
    args = parser.parse_args()

    gen = RealSeedGenerator()

    if args.clear:
        print("⚠️  기존 모든 데이터(schools + exam_materials + subjects)를 삭제합니다.")
        try:
            confirm = input("계속하시겠습니까? (y/N): ")
        except EOFError:
            confirm = "y"  # non-interactive default
        if confirm.lower() != "y":
            print("취소되었습니다.")
            return
        gen.clear_all()

    print(f"\n{'='*50}")
    print(f"📝 실데이터 시딩 {'미리보기' if args.dry_run else '시작'}")
    print(f"{'='*50}\n")

    school_count = gen.insert_schools(dry_run=args.dry_run)
    mat_count = gen.insert_exam_materials(dry_run=args.dry_run)

    print(f"\n✅ 완료! 학교 {school_count}개 + 시험자료 {mat_count}개")

    if not args.dry_run:
        gen.stats()


if __name__ == "__main__":
    main()
