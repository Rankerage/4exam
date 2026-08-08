// NEIS 공공데이터 API 연동 — 급식, 학사일정, 학교정보
// https://open.neis.go.kr/

const NEIS_BASE = "https://open.neis.go.kr/hub";

export interface LunchMenu {
  date: string;
  menu: string[];
  calories: string;
}

export interface SchoolEvent {
  date: string;
  name: string;
  type: string; // 시험, 행사, 방학
}

// 시도교육청 코드
const OFFICE_CODES: Record<string, string> = {
  "서울": "B10", "부산": "C10", "대구": "D10", "인천": "E10",
  "광주": "F10", "대전": "G10", "울산": "H10", "세종": "I10",
  "경기": "J10", "강원": "K10", "충북": "M10", "충남": "N10",
  "전북": "P10", "전남": "Q10", "경북": "R10", "경남": "S10",
  "제주": "T10",
};

// 급식 메뉴 조회
export async function fetchLunchMenu(
  officeCode: string, schoolCode: string, date: string
): Promise<LunchMenu[]> {
  const apiKey = process.env.NEIS_API_KEY;
  if (!apiKey) {
    // API 키 없으면 더미 데이터
    return generateDummyLunch(date);
  }
  
  const url = `${NEIS_BASE}/mealServiceDietInfo?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date.replace(/-/g, "")}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const rows = data?.mealServiceDietInfo?.[1]?.row || [];
    return rows.map((r: any) => ({
      date: r.MLSV_YMD,
      menu: (r.DDISH_NM || "").split("<br/>").filter((m: string) => m.trim()),
      calories: r.CAL_INFO || "",
    }));
  } catch {
    return generateDummyLunch(date);
  }
}

// 학사일정 조회 (시험일정 확인용)
export async function fetchSchoolSchedule(
  officeCode: string, schoolCode: string, fromDate: string, toDate: string
): Promise<SchoolEvent[]> {
  const apiKey = process.env.NEIS_API_KEY;
  if (!apiKey) return generateDummySchedule(fromDate, toDate);

  const url = `${NEIS_BASE}/SchoolSchedule?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&AA_FROM_YMD=${fromDate.replace(/-/g, "")}&AA_TO_YMD=${toDate.replace(/-/g, "")}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const rows = data?.SchoolSchedule?.[1]?.row || [];
    return rows.map((r: any) => ({
      date: r.AA_YMD,
      name: r.EVENT_NM || "",
      type: classifyEvent(r.EVENT_NM || ""),
    }));
  } catch {
    return generateDummySchedule(fromDate, toDate);
  }
}

function classifyEvent(name: string): string {
  if (/시험|고사|모의|평가/.test(name)) return "시험";
  if (/방학|종업|개학/.test(name)) return "방학";
  return "행사";
}

// --- 더미 데이터 (API 키 없을 때) ---

function generateDummyLunch(date: string): LunchMenu[] {
  const menus = [
    ["쌀밥", "된장찌개", "제육볶음", "김치", "요구르트"],
    ["잡곡밥", "미역국", "생선까스", "깍두기", "과일"],
    ["카레라이스", "계란후라이", "단무지", "샐러드", "주스"],
    ["비빔밥", "콩나물국", "계란말이", "김치", "떡"],
    ["김치볶음밥", "계란국", "돈까스", "깍두기", "아이스크림"],
  ];
  const d = new Date(date);
  const day = d.getDay();
  if (day === 0 || day === 6) return [];
  const menu = menus[d.getDate() % menus.length];
  return [{ date, menu, calories: "약 700kcal" }];
}

function generateDummySchedule(from: string, to: string): SchoolEvent[] {
  const events: SchoolEvent[] = [
    { date: "2026-04-27", name: "1학기 중간고사", type: "시험" },
    { date: "2026-04-28", name: "1학기 중간고사", type: "시험" },
    { date: "2026-04-29", name: "1학기 중간고사", type: "시험" },
    { date: "2026-07-02", name: "1학기 기말고사", type: "시험" },
    { date: "2026-07-03", name: "1학기 기말고사", type: "시험" },
    { date: "2026-07-04", name: "1학기 기말고사", type: "시험" },
    { date: "2026-07-20", name: "여름방학 시작", type: "방학" },
    { date: "2026-08-20", name: "여름방학 종료", type: "방학" },
    { date: "2026-10-05", name: "2학기 중간고사", type: "시험" },
    { date: "2026-12-08", name: "2학기 기말고사", type: "시험" },
  ];
  return events.filter(e => e.date >= from && e.date <= to);
}
