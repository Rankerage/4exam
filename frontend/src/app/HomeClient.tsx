"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdBanner } from "@/components/AdPlaceholder";

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } else setResults([]);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#A31F34]">4exam.study</h1>
          <div className="flex items-center gap-4 text-sm">
            <a href="/schools" className="text-gray-600 hover:text-[#A31F34]">학교 찾기</a>
            <a href="/schools" className="px-4 py-2 bg-[#A31F34] text-white rounded-lg hover:bg-[#8B1A2C]">학교 찾기</a>
          </div>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#A31F34]/5 to-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            우리 학교<br /><span className="text-[#A31F34]">바로 가기</span>
          </h2>
          <p className="text-gray-500 text-lg mb-8">전국 11,000개 학교의 시험자료·급식·일정을 한 곳에</p>
          
          {/* 학교 검색 */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text" value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="학교 이름을 입력하세요 (예: 가락중학교)"
                className="w-full text-lg py-4 px-6 border-2 border-gray-200 rounded-2xl focus:border-[#A31F34] outline-none bg-white shadow-sm"
              />
            </div>
            {results.length > 0 && (
              <div className="mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {results.map((s) => (
                  <button key={s.id}
                    onClick={() => router.push(`/school/${s.id}`)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b last:border-0">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-gray-400 ml-2">{s.type} · {s.region}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 역할별 카드 */}
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
            <a href="#" className="text-sm text-[#A31F34]">더 보기 →</a>
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
          <span>© 2026 4exam.study — 전국 학교별 맞춤 시험자료</span>
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
