// 전국 학교 데이터 (공공데이터 연동 전 샘플)
export interface School {
  id: string;
  name: string;
  region: string;
  type: string; // 중학교, 고등학교
  address: string;
  textbookPublisher?: string;
}

export const SCHOOLS: School[] = [
  { id: "school-001", name: "서울중학교", region: "서울", type: "중학교", address: "서울특별시 강남구", textbookPublisher: "비상교육" },
  { id: "school-002", name: "부산고등학교", region: "부산", type: "고등학교", address: "부산광역시 해운대구", textbookPublisher: "미래엔" },
  { id: "school-003", name: "대구중학교", region: "대구", type: "중학교", address: "대구광역시 수성구", textbookPublisher: "천재교육" },
  { id: "school-004", name: "광주고등학교", region: "광주", type: "고등학교", address: "광주광역시 북구", textbookPublisher: "비상교육" },
  { id: "school-005", name: "대전중학교", region: "대전", type: "중학교", address: "대전광역시 유성구", textbookPublisher: "지학사" },
  { id: "school-006", name: "세종고등학교", region: "세종", type: "고등학교", address: "세종특별자치시", textbookPublisher: "미래엔" },
  { id: "school-007", name: "경기중학교", region: "경기", type: "중학교", address: "경기도 수원시", textbookPublisher: "천재교육" },
  { id: "school-008", name: "인천고등학교", region: "인천", type: "고등학교", address: "인천광역시 연수구", textbookPublisher: "비상교육" },
];

export function searchSchools(query: string): School[] {
  const q = query.toLowerCase();
  return SCHOOLS.filter(s =>
    s.name.includes(q) || s.region.includes(q) || s.address.includes(q)
  );
}
