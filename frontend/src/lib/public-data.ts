// 공공데이터 API 연동 - 학교 정보 & 급식 메뉴
const NEIS_API_KEY = process.env.NEIS_API_KEY || "";

export interface SchoolInfo {
  schoolCode: string;
  schoolName: string;
  region: string;
  type: string;
  address: string;
}

// 학교알리미 API 연동 준비
export async function fetchSchoolInfo(region: string, schoolName: string): Promise<SchoolInfo[]> {
  // 실제 API 연동 전까지는 로컬 DB 사용
  // const url = `https://open.neis.go.kr/hub/schoolInfo?...`;
  return [];
}

// 급식 메뉴 API 연동 준비
export async function fetchLunchMenu(schoolCode: string, date: string): Promise<string[]> {
  // const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?...`;
  return [];
}

// 전국 시도교육청 코드
export const REGIONS: Record<string, string> = {
  "서울": "B10", "부산": "C10", "대구": "D10", "인천": "E10",
  "광주": "F10", "대전": "G10", "울산": "H10", "세종": "I10",
  "경기": "J10", "강원": "K10", "충북": "M10", "충남": "N10",
  "전북": "P10", "전남": "Q10", "경북": "R10", "경남": "S10",
  "제주": "T10",
};
