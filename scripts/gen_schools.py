"""전국 학교 데이터 생성기 - 실제 학교명 패턴 기반"""
import sqlite3, random, os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "data", "4exam.db")

# 시도별 구/군 데이터 (실제 행정구역)
REGIONS = {
    "서울": ["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"],
    "부산": ["강서구","금정구","남구","동구","동래구","부산진구","북구","사상구","사하구","서구","수영구","연제구","영도구","중구","해운대구","기장군"],
    "대구": ["남구","달서구","동구","북구","서구","수성구","중구","달성군"],
    "인천": ["계양구","남동구","동구","미추홀구","부평구","서구","연수구","중구","강화군","옹진군"],
    "광주": ["광산구","남구","동구","북구","서구"],
    "대전": ["대덕구","동구","서구","유성구","중구"],
    "울산": ["남구","동구","북구","중구","울주군"],
    "세종": ["세종시"],
    "경기": ["수원시","성남시","고양시","용인시","부천시","안산시","안양시","남양주시","화성시","평택시","의정부시","시흥시","파주시","광명시","김포시","군포시","광주시","이천시","양주시","오산시","구리시","안성시","포천시","의왕시","하남시","여주시","양평군","동두천시","과천시","가평군","연천군"],
    "강원": ["춘천시","원주시","강릉시","동해시","태백시","속초시","삼척시","홍천군","횡성군","영월군","평창군","정선군","철원군","화천군","양구군","인제군","고성군","양양군"],
    "충북": ["청주시","충주시","제천시","보은군","옥천군","영동군","증평군","진천군","괴산군","음성군","단양군"],
    "충남": ["천안시","공주시","보령시","아산시","서산시","논산시","계룡시","당진시","금산군","부여군","서천군","청양군","홍성군","예산군","태안군"],
    "전북": ["전주시","군산시","익산시","정읍시","남원시","김제시","완주군","진안군","무주군","장수군","임실군","순창군","고창군","부안군"],
    "전남": ["목포시","여수시","순천시","나주시","광양시","담양군","곡성군","구례군","고흥군","보성군","화순군","장흥군","강진군","해남군","영암군","무안군","함평군","영광군","장성군","완도군","진도군","신안군"],
    "경북": ["포항시","경주시","김천시","안동시","구미시","영주시","영천시","상주시","문경시","경산시","의성군","청송군","영양군","영덕군","청도군","고령군","성주군","칠곡군","예천군","봉화군","울진군","울릉군"],
    "경남": ["창원시","진주시","통영시","사천시","김해시","밀양시","거제시","양산시","의령군","함안군","창녕군","고성군","남해군","하동군","산청군","함양군","거창군","합천군"],
    "제주": ["제주시","서귀포시"],
}

# 학교명 접미사 패턴
MIDDLE_SUFFIXES = ["중학교", "중", "여자중학교", "남자중학교"]
HIGH_SUFFIXES = ["고등학교", "고", "여자고등학교", "남자고등학교", "과학고등학교", "외국어고등학교", "예술고등학교", "체육고등학교"]
SPECIAL_HIGH = ["과학고", "외국어고", "예술고", "체육고", "마이스터고", "특성화고"]

PUBLISHERS = ["비상교육", "미래엔", "천재교육", "지학사", "좋은책신사고", "금성출판사", "동아출판"]

def generate_school_name(gu, suffix):
    """자연스러운 학교명 생성"""
    patterns = [
        f"{gu}{suffix}",           # 강남중학교
        f"{gu}제일{suffix}",       # 강남제일중학교
        f"{gu}중앙{suffix}",       # 강남중앙중학교
        f"{gu}동{suffix}",         # 강남동중학교
        f"{gu}서{suffix}",         # 강남서중학교
        f"{gu}북{suffix}",         # 강남북중학교
        f"{gu}신{suffix}",         # 강남신중학교
        f"{gu}대성{suffix}",       # 강남대성중학교
        f"{gu}명문{suffix}",       # 강남명문중학교
        f"{gu}한울{suffix}",       # 강남한울중학교
        f"{gu}새롬{suffix}",       # 강남새롬중학교
        f"{gu}해오름{suffix}",     # 강남해오름중학교
    ]
    return random.choice(patterns)

def generate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 기존 데이터 삭제 후 새로 채움
    cur.execute("DELETE FROM exam_materials")
    cur.execute("DELETE FROM schools")
    
    schools_inserted = 0
    
    for region, gus in REGIONS.items():
        for gu in gus:
            # 각 구별 중학교 1~3개
            num_mid = random.randint(1, 3)
            for _ in range(num_mid):
                suffix = random.choice(MIDDLE_SUFFIXES)
                name = generate_school_name(gu, suffix)
                # 중복방지
                cur.execute("SELECT COUNT(*) FROM schools WHERE name = ?", (name,))
                if cur.fetchone()[0] > 0:
                    continue
                
                sid = f"sch-{schools_inserted:05d}"
                publisher = random.choice(PUBLISHERS)
                cur.execute(
                    "INSERT INTO schools (id, name, region, type, address, textbook_publisher) VALUES (?,?,?,?,?,?)",
                    (sid, name, region, "중학교", f"{region} {gu}", publisher)
                )
                schools_inserted += 1
            
            # 각 구별 고등학교 1~2개
            num_high = random.randint(1, 2)
            for _ in range(num_high):
                if random.random() < 0.1:
                    suffix = random.choice(SPECIAL_HIGH)
                else:
                    suffix = random.choice(HIGH_SUFFIXES)
                name = generate_school_name(gu, suffix)
                
                cur.execute("SELECT COUNT(*) FROM schools WHERE name = ?", (name,))
                if cur.fetchone()[0] > 0:
                    continue
                
                sid = f"sch-{schools_inserted:05d}"
                publisher = random.choice(PUBLISHERS)
                cur.execute(
                    "INSERT INTO schools (id, name, region, type, address, textbook_publisher) VALUES (?,?,?,?,?,?)",
                    (sid, name, region, "고등학교", f"{region} {gu}", publisher)
                )
                schools_inserted += 1
    
    conn.commit()
    
    # 시험자료 샘플 생성
    subjects = ["국어", "영어", "수학", "사회", "과학", "한국사"]
    types = ["기출문제", "예상문제", "수행평가", "요점정리"]
    years = [2023, 2024, 2025, 2026]
    semesters = ["1학기", "2학기"]
    
    # 랜덤하게 200개 학교에서 1000개 자료 생성
    cur.execute("SELECT id FROM schools ORDER BY RANDOM() LIMIT 200")
    school_ids = [r[0] for r in cur.fetchall()]
    
    for i in range(1000):
        sid = random.choice(school_ids)
        subj = random.choice(subjects)
        typ = random.choice(types)
        year = random.choice(years)
        sem = random.choice(semesters)
        title = f"{year}년 {sem} {subj} {typ}"
        desc = f"{subj} {typ} 자료입니다."
        
        mid = f"mat-gen-{i:05d}"
        cur.execute(
            "INSERT INTO exam_materials (id, school_id, title, type, description, year, semester) VALUES (?,?,?,?,?,?,?)",
            (mid, sid, title, typ, desc, year, sem)
        )
    
    conn.commit()
    conn.close()
    
    return schools_inserted

if __name__ == "__main__":
    count = generate()
    print(f"✅ {count}개 학교, 1000개 시험자료 생성 완료!")
