// NEIS 공공데이터 API 연동 — 급식, 학사일정, 학교정보
// API 키: a71581e4502e4edba23d736800e93f67
// https://open.neis.go.kr/

const NEIS_API_KEY = "a71581e4502e4edba23d736800e93f67";
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
  const url = `${NEIS_BASE}/mealServiceDietInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date.replace(/-/g, "")}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const rows = data?.mealServiceDietInfo?.[1]?.row;
    if (!rows) return []; // 방학 중이면 빈 배열
    const list = Array.isArray(rows) ? rows : [rows];
    return list.map((r: any) => ({
      date: r.MLSV_YMD,
      menu: (r.DDISH_NM || "").replace(/<br\/>/g, "\n").split("\n").filter((m: string) => m.trim()),
      calories: r.CAL_INFO || "",
    }));
  } catch {
    return [];
  }
}

// 학사일정 조회 (시험일정 확인용)
export async function fetchSchoolSchedule(
  officeCode: string, schoolCode: string, fromDate: string, toDate: string
): Promise<SchoolEvent[]> {
  const url = `${NEIS_BASE}/SchoolSchedule?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&AA_FROM_YMD=${fromDate.replace(/-/g, "")}&AA_TO_YMD=${toDate.replace(/-/g, "")}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    const rows = data?.SchoolSchedule?.[1]?.row;
    if (!rows) return [];
    const list = Array.isArray(rows) ? rows : [rows];
    return list.map((r: any) => ({
      date: r.AA_YMD,
      name: r.EVENT_NM || "",
      type: classifyEvent(r.EVENT_NM || ""),
    }));
  } catch {
    return [];
  }
}

function classifyEvent(name: string): string {
  if (/시험|고사|모의|평가/.test(name)) return "시험";
  if (/방학|종업|개학/.test(name)) return "방학";
  return "행사";
}
