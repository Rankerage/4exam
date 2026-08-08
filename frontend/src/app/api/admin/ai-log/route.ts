export async function GET() {
  return Response.json([
    { id:101,time:"방금",action:"학교 정보 업데이트",detail:"서울 5개 학교 (NEIS)",status:"done",revertible:true },
    { id:102,time:"3분 전",action:"교과서 PDF 파싱",detail:"대전 대덕중 — 14개 과목",status:"done",revertible:true },
    { id:103,time:"7분 전",action:"저품질 필터링",detail:"자료 3건 보류 처리",status:"done",revertible:true },
    { id:104,time:"12분 전",action:"신규 학교 발견",detail:"크롤링 — 12개 학교 추가",status:"done",revertible:true },
    { id:105,time:"25분 전",action:"급식 데이터 갱신",detail:"가락중학교 — 8월 2주차",status:"done",revertible:true },
    { id:106,time:"1시간 전",action:"중복 자료 병합",detail:"대전고 수학 — 2건 → 1건",status:"reverted",revertible:false },
  ]);
}
