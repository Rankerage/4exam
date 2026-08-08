"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdBanner } from "@/components/AdPlaceholder";

const ALL_REGIONS = [
  "전체", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

const ALL_TYPES = ["전체", "초등학교", "중학교", "고등학교"];

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("전체");
  const [schoolType, setSchoolType] = useState("전체");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (q: string, r: string, t: string) => {
    setQuery(q);
    setRegion(r);
    setSchoolType(t);
    
    if (q.length >= 1 || r !== "전체") {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("action", "search");
      if (q) params.set("q", q);
      if (r !== "전체") params.set("region", r);
      if (t !== "전체") params.set("type", t);
      
      const res = await fetch(`/api/exam?${params.toString()}`);
      const data = await res.json();
      // 지역/유형 필터링은 API에서 지원하지 않으므로 클라이언트에서
      let filtered = data;
      if (r !== "전체") filtered = filtered.filter((s: any) => s.region === r);
      if (t !== "전체") filtered = filtered.filter((s: any) => s.type === t);
      setResults(filtered);
      setLoading(false);
    } else {
      setResults([]);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#A31F34] cursor-pointer" onClick={() => router.push("/")}>
            4exam.study
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <a href="/schools" className="text-gray-600 hover:text-[#A31F34]">전체 학교</a>
            <a href="/admin" className="text-gray-400 hover:text-[#A31F34]">관리자</a>
          </div>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#A31F34]/5 to-white">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            우리 학교<br /><span className="text-[#A31F34]">바로 가기</span>
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            전국 11,000개 학교의 시험자료·급식·일정을 한 곳에
          </p>
          
          {/* 학교 검색 + 필터 */}
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-3">
              <input
                type="text" value={query}
                onChange={(e) => handleSearch(e.target.value, region, schoolType)}
                placeholder="학교 이름을 입력하세요 (예: 대산고등학교)"
                className="w-full text-lg py-4 px-6 border-2 border-gray-200 rounded-2xl focus:border-[#A31F34] outline-none bg-white shadow-sm"
              />
            </div>
            
            {/* 필터 칩 */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {ALL_REGIONS.map(r => (
                <button key={r}
                  onClick={() => handleSearch(query, r === region ? "전체" : r, schoolType)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    region === r
                      ? "bg-[#A31F34] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-1.5">
              {ALL_TYPES.map(t => (
                <button key={t}
                  onClick={() => handleSearch(query, region, t === schoolType ? "전체" : t)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    schoolType === t
                      ? "bg-[#A31F34] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 결과 */}
          {loading && (
            <div className="mt-4 text-gray-400 text-sm">검색 중...</div>
          )}
          {!loading && results.length > 0 && (
            <div className="mt-4 max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-left">
              <p className="px-6 py-2 text-xs text-gray-400 bg-gray-50">
                {query ? `"${query}"` : ""} {region !== "전체" ? `· ${region}` : ""} {schoolType !== "전체" ? `· ${schoolType}` : ""} — {results.length}개 학교
              </p>
              {results.map((s) => (
                <button key={s.id}
                  onClick={() => router.push(`/school/${s.id}`)}
                  className="w-full px-6 py-4 hover:bg-gray-50 border-b last:border-0 flex items-center justify-between transition-colors">
                  <div>
                    <span className="font-medium text-gray-800 group-hover:text-[#A31F34]">{s.name}</span>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{s.type}</span>
                      <span className="text-xs text-gray-400">{s.region}</span>
                    </div>
                  </div>
                  <span className="text-gray-300 text-lg">→</span>
                </button>
              ))}
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="mt-4 text-gray-400 text-sm">검색 결과가 없습니다</p>
          )}
        </div>
      </section>

      {/* 역할 카드 */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-xl font-bold text-center mb-8">누구나, 어떤 역할로든</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🎒", title: "학생", desc: "우리학교 맞춤\n시험자료" },
            { icon: "👩‍🏫", title: "선생님", desc: "자료 업로드\n학급 관리" },
            { icon: "👨‍👩‍👧", title: "학부모", desc: "자녀 학습\n급식 확인" },
            { icon: "🎓", title: "동문", desc: "동창회\n추억 나눔" },
          ].map((card, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-[#A31F34]/5 transition-colors cursor-pointer">
              <span className="text-4xl block mb-3">{card.icon}</span>
              <span className="font-bold block mb-1">{card.title}</span>
              <span className="text-sm text-gray-400 whitespace-pre-line">{card.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 광고 */}
      <div className="max-w-6xl mx-auto px-6"><AdBanner /></div>

      {/* 교육 뉴스 */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">📰 교육 소식</h3>
            <a href="#" className="text-sm text-[#A31F34] hover:underline">더 보기 →</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: "입시", title: "2027학년도 대입 전형 발표", date: "2026.08.07" },
              { tag: "교육부", title: "2022 개정 교육과정 2차 적용", date: "2026.08.05" },
              { tag: "AI", title: "AI 디지털교과서 도입 현황", date: "2026.08.03" },
            ].map((news, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <span className="text-xs px-2 py-1 bg-[#A31F34]/10 text-[#A31F34] rounded-full">{news.tag}</span>
                <h4 className="font-bold mt-3 mb-2">{news.title}</h4>
                <p className="text-sm text-gray-400">{news.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 전국 학교 현황 */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-xl font-bold text-center mb-8">📊 전국 학교 현황</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "초등학교", count: "5,313", color: "bg-green-50 text-green-700" },
            { label: "중학교", count: "3,128", color: "bg-blue-50 text-blue-700" },
            { label: "고등학교", count: "2,398", color: "bg-purple-50 text-purple-700" },
            { label: "대학교", count: "124", color: "bg-red-50 text-red-700" },
          ].map((stat, i) => (
            <div key={i} className={`text-center p-6 rounded-2xl ${stat.color}`}>
              <span className="text-3xl font-bold block">{stat.count}</span>
              <span className="text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between text-xs text-gray-400">
          <span>© 2026 4exam.study</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#A31F34]">이용약관</a>
            <a href="#" className="hover:text-[#A31F34]">개인정보</a>
            <a href="mailto:mathbible@gmail.com" className="hover:text-[#A31F34]">문의하기</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
