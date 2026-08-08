"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { MaterialFeedback } from "@/components/MaterialFeedback";

interface Material {
  id: string; title: string; type: string; description?: string;
  year?: number; semester?: string; subject?: string; created_at: string;
}

export default function SchoolPage({ params }: { params: { id: string } }) {
  const [school, setSchool] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filter, setFilter] = useState("전체");

  useEffect(() => {
    fetch(`/api/exam?action=school&id=${params.id}`).then(r => r.json()).then(s => {
      setSchool(s);
      // 공통자료 + 학교자료 함께 로드
      fetch("/api/materials?schoolId=ALL").then(r => r.json()).then(common => {
        fetch(`/api/materials?schoolId=${params.id}`).then(r => r.json()).then(specific => {
          setMaterials([...specific, ...common]);
        });
      });
    });
  }, [params.id]);

  if (!school) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-300 text-lg font-light">불러오는 중...</p>
      </main>
    );
  }

  const subjects = ["전체","국어","영어","수학","과학","사회","한국사"];

  const filtered = materials.filter(m => {
    if (filter !== "전체" && !m.subject?.includes(filter) && !m.title.includes(filter)) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-white">
      <NavBar />
      
      {/* 학교 헤더 (간소화) */}
      <header className="bg-gradient-to-r from-[#A31F34] to-[#C42A45] text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <p className="text-xs tracking-[.2em] uppercase opacity-50">{school.type}</p>
          <h1 className="text-2xl md:text-4xl font-extralight tracking-tight mt-1">{school.name}</h1>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs">{school.region}</span>
            {school.textbook_publisher && (
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs">📚 {school.textbook_publisher}</span>
            )}
            <a href="/login?change=1" className="px-2.5 py-1 bg-white/20 rounded-full text-xs hover:bg-white/30">🔄 변경</a>
          </div>
        </div>
      </header>

      {/* 필터바 */}
      <div className="border-b border-gray-100 bg-white sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 overflow-x-auto">
          {/* 과목 */}
          {subjects.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                filter === s ? "bg-gray-800 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {s}
            </button>
          ))}
          <span className="text-xs text-gray-300 ml-auto whitespace-nowrap">
            {filtered.length}건
          </span>
        </div>
      </div>

      {/* 통합 피드 */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-light">자료가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <div key={m.id} 
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all">
                {/* 태그 */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    m.type?.includes("기출") ? "bg-red-50 text-red-600" :
                    m.type?.includes("예상") ? "bg-blue-50 text-blue-600" :
                    m.type?.includes("모의") ? "bg-purple-50 text-purple-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {m.type?.replace("(공통)", "")?.replace("기출문제(공통)", "기출")}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.type?.includes("공통") && (
                      <span className="text-[10px] text-gray-300">🌐</span>
                    )}
                    {m.year && (
                      <span className="text-[10px] text-gray-300">{m.year}년</span>
                    )}
                  </div>
                </div>
                
                {/* 제목 */}
                <h3 className="font-medium text-gray-800 group-hover:text-[#A31F34] transition-colors line-clamp-2 mb-1">
                  {m.subject && <span className="text-xs text-gray-400 mr-1">[{m.subject}]</span>}
                  {m.title}
                </h3>
                
                {m.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{m.description}</p>
                )}

                {/* 좋아요/댓글 */}
                <MaterialFeedback materialId={m.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
