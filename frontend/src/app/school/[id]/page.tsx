"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar, SchoolTabs } from "@/components/NavBar";

interface Material {
  id: string; title: string; type: string; description?: string;
  year?: number; semester?: string; subject?: string; created_at: string;
}
interface Identity {
  tree: string; flower: string; motto: string; founded: number;
  student_count: number; theme_color: string;
}

export default function SchoolPage({ params }: { params: { id: string } }) {
  const [school, setSchool] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [grade, setGrade] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/exam?action=school&id=${params.id}`).then(r => r.json()).then(setSchool);
    fetch(`/api/materials?schoolId=${params.id}`).then(r => r.json()).then(d => {
      // 공통자료도 함께 가져오기
      fetch("/api/materials?schoolId=ALL").then(r2 => r2.json()).then(common => {
        setMaterials([...d, ...common].slice(0, 30));
      });
    });
    // 학교 아이덴티티는 school 데이터에 포함
  }, [params.id]);

  // 인사말 생성
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "밝은 아침입니다" : hour < 17 ? "활기찬 오후입니다" : "고요한 저녁입니다";
  
  // 학교명 첫글자
  const initial = school?.name?.charAt(0) || "學";

  // 교과서 기반 개인화 문구
  const textbook = school?.textbook_publisher || "맞춤 교과서";

  if (!school) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-lg font-light">학교를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <NavBar />
      <SchoolTabs schoolId={params.id} grade={grade} onGradeChange={setGrade} />

      {/* 학교 헤더 */}
      <header className="relative bg-gradient-to-r from-[#A31F34] to-[#C42A45] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[.3em] uppercase opacity-60 mb-3">{school.type}</p>
              <h1 className="text-3xl md:text-5xl font-extralight tracking-tight mb-2">{school.name}</h1>
              <p className="text-white/70 text-md font-light mt-3">{greeting}, 오늘도 좋은 하루!</p>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-3xl font-bold opacity-80">{initial}</span>
              </div>
            </div>
          </div>

          {/* 학교 메타 */}
          <div className="flex flex-wrap gap-3 mt-8">
            <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs">
              📚 {textbook}
            </span>
            <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs">
              📍 {school.region}
            </span>
            {grade > 0 && (
              <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs">
                🎒 {grade}학년
              </span>
            )}
            <a href={`/login?change=1`} 
               className="px-3 py-1.5 bg-white/20 rounded-full text-xs hover:bg-white/30 transition-colors">
              🔄 학교 변경
            </a>
          </div>
        </div>
      </header>

      {/* 본문: 그리드 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 자료 그리드 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              📝 {grade > 0 ? `${grade}학년 ` : ""}시험자료
              <span className="text-sm font-normal text-gray-400 ml-2">수능기출 · 모의고사 · 학교시험</span>
            </h2>
            <select 
              onChange={(e) => {
                const v = e.target.value;
                if (v === "ALL") {
                  fetch("/api/materials?schoolId=ALL").then(r => r.json()).then(d => {
                    fetch(`/api/materials?schoolId=${params.id}`).then(r2 => r2.json()).then(specific => {
                      setMaterials([...specific, ...d].slice(0, 30));
                    });
                  });
                } else {
                  fetch(`/api/materials?schoolId=${params.id}&type=${v}`).then(r => r.json()).then(setMaterials);
                }
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
              <option value="ALL">전체 자료</option>
              <option value="기출문제">기출문제</option>
              <option value="예상문제">예상문제</option>
              <option value="수행평가">수행평가</option>
            </select>
          </div>

          {materials.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-lg font-light">아직 등록된 자료가 없습니다</p>
              <p className="text-sm mt-2">첫 번째 자료를 기다리고 있어요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((m) => (
                <div key={m.id} 
                  className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      m.type?.includes("기출") ? "bg-red-50 text-red-600" :
                      m.type?.includes("예상") ? "bg-blue-50 text-blue-600" :
                      m.type?.includes("모의") ? "bg-purple-50 text-purple-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {m.type?.replace("(공통)", "")}
                    </span>
                    {m.year && (
                      <span className="text-xs text-gray-300">{m.year}학년도</span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-800 group-hover:text-[#A31F34] transition-colors mb-1 line-clamp-2">
                    {m.title}
                  </h3>
                  
                  {m.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{m.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {m.type?.includes("공통") ? "🌐 전국 공통" : `🏫 ${school.name}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 하단: 급식 + 일정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-100">
          <div>
            <h3 className="font-bold text-lg mb-4">🍱 오늘의 급식</h3>
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm">급식 정보를 불러오는 중...</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">📅 학사일정</h3>
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm">일정 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
