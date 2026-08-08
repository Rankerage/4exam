"use client";

import { useState } from "react";
import { searchSchools, type School } from "@/lib/schools";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [selected, setSelected] = useState<School | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.length >= 1) setResults(searchSchools(q));
    else setResults([]);
  };

  return (
    <main className="min-h-screen bg-white">
      {!selected ? (
        /* === 메인 검색 화면 (MIT 스타일) === */
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {/* MIT 스타일 검색바 */}
          <div className="w-full max-w-2xl mb-4 text-center">
            <p className="text-sm text-gray-500 mb-6 tracking-wide font-medium">
              전국 5,500개 학교의 시험자료를 무료로
            </p>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="어느 학교에 다니세요?"
                className="w-full text-2xl md:text-3xl font-light text-center py-6 border-b-2 border-gray-300 focus:border-[#A31F34] outline-none transition-colors bg-transparent placeholder-gray-300"
              />
            </div>
          </div>

          {/* 검색 결과 */}
          {results.length > 0 && (
            <div className="w-full max-w-2xl mt-2">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-medium group-hover:text-[#A31F34] transition-colors">
                        {s.name}
                      </span>
                      <span className="text-sm text-gray-400 ml-3">{s.type}</span>
                    </div>
                    <span className="text-sm text-gray-400">{s.region}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{s.address}</p>
                </button>
              ))}
            </div>
          )}

          {/* 대상별 링크 (MIT Top resources 스타일) */}
          <div className="mt-16 text-center">
            <p className="text-xs text-gray-400 mb-4">대상별 바로가기</p>
            <div className="flex gap-6 justify-center text-sm text-gray-500">
              {["중학생", "고등학생", "교사", "학부모"].map((a) => (
                <a key={a} href="#" className="hover:text-[#A31F34] transition-colors">
                  {a}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* === 학교별 홈 (선택 후) === */
        <SchoolHome school={selected} onBack={() => setSelected(null)} />
      )}
    </main>
  );
}

function SchoolHome({ school, onBack }: { school: School; onBack: () => void }) {
  return (
    <div>
      {/* 헤더 - MIT 스타일 */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="text-sm text-gray-500 hover:text-[#A31F34]">
              ← 학교 변경
            </button>
            <div>
              <h1 className="text-xl font-medium tracking-tight">{school.name}</h1>
              <p className="text-xs text-gray-400">{school.address}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 bg-[#A31F34] text-white rounded-full font-medium">
            {school.type}
          </span>
        </div>
      </header>

      {/* 학교 아이덴티티 - 타이포그래피로 표현 */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs text-gray-400 mb-1">교과서 출판사</p>
              <p className="text-2xl font-light">{school.textbookPublisher || "정보 없음"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">지역</p>
              <p className="text-2xl font-light">{school.region}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">학교 유형</p>
              <p className="text-2xl font-light">{school.type}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 콘텐츠 그리드 - MIT 카드 스타일 */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-xs text-gray-400 mb-6">{school.name} 시험자료</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "중간고사 기출", sub: "2024-2026", desc: "최근 3개년 기출문제 모음" },
            { title: "기말고사 예상", sub: "AI 생성", desc: "교과서 기반 AI 예상문제" },
            { title: "수행평가 자료", sub: "과목별", desc: "수행평가 참고자료" },
            { title: "요점정리", sub: "핵심만", desc: "시험 직전 최종 정리" },
            { title: "오답노트", sub: "자주 틀리는", desc: "오답 분석 및 해설" },
            { title: "급식 메뉴", sub: "이번 주", desc: "우리학교 급식 확인" },
          ].map((card, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[4/3] bg-gray-100 mb-3 group-hover:bg-gray-200 transition-colors" />
              <p className="text-xs text-[#A31F34] font-medium mb-1">{card.sub}</p>
              <h3 className="text-lg font-medium mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 - MIT 스타일 */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between text-xs text-gray-400">
          <span>4exam.study — {school.name}</span>
          <span>전국 학교별 맞춤 시험자료</span>
        </div>
      </footer>
    </div>
  );
}
