"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { MaterialFeedback } from "@/components/MaterialFeedback";
import { AdBanner } from "@/components/AdPlaceholder";

interface Material {
  id: string; title: string; type: string; description?: string;
  year?: number; semester?: string; subject?: string; created_at: string;
}

const BOARDS = [
  { key: "전체", label: "전체" },
  { key: "국어", label: "국어" },
  { key: "영어", label: "영어" },
  { key: "수학", label: "수학" },
  { key: "과학", label: "과학" },
  { key: "사회", label: "사회" },
  { key: "기타", label: "기타" },
];

export default function SchoolPage({ params }: { params: { id: string } }) {
  const [school, setSchool] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [board, setBoard] = useState("전체");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/exam?action=school&id=${params.id}`).then(r => r.json()).then(s => {
      setSchool(s);
      fetch("/api/materials?schoolId=ALL").then(r => r.json()).then(common => {
        fetch(`/api/materials?schoolId=${params.id}`).then(r => r.json()).then(specific => {
          setMaterials([...specific, ...common]);
        });
      });
    });
  }, [params.id]);

  if (!school) return <main className="min-h-screen flex items-center justify-center"><p className="text-gray-300">불러오는 중...</p></main>;

  const filtered = materials.filter(m => {
    if (board === "기타") {
      return !["국어","영어","수학","과학","사회"].some(s => 
        m.subject?.includes(s) || m.title.includes(s)
      );
    }
    if (board !== "전체" && !m.subject?.includes(board) && !m.title.includes(board)) return false;
    if (search && !m.title.includes(search) && !m.description?.includes(search)) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-white">
      <NavBar />
      
      {/* 학교명 + 검색 */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-lg font-bold">{school.name}</h1>
            {school.english_publisher && (
              <span className="text-[11px] px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                📗 영어: {school.english_publisher}
              </span>
            )}
          </div>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${school.name} 자료 검색...`}
            className="w-full mt-2 text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A31F34] outline-none"
          />
        </div>
      </div>

      {/* 게시판 탭 */}
      <div className="border-b border-gray-100 sticky top-14 bg-white z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex gap-0 overflow-x-auto">
          {BOARDS.map(b => (
            <button key={b.key} onClick={() => setBoard(b.key)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                board === b.key
                  ? "border-[#A31F34] text-[#A31F34] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {b.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-300 self-center pr-2 whitespace-nowrap">
            {filtered.length}건
          </span>
        </div>
      </div>

      {/* 게시판 본문 */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <p className="text-lg">게시물이 없습니다</p>
          </div>
        ) : (
          <>
            {/* 게시물 리스트 */}
            <div className="space-y-1">
              {filtered.map((m, i) => (
                <div key={m.id}>
                  <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg group cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          m.type?.includes("기출") ? "bg-red-50 text-red-600" :
                          m.type?.includes("예상") ? "bg-blue-50 text-blue-600" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {m.type?.replace("(공통)","")?.replace("기출문제(공통)","기출")}
                        </span>
                        <span className="text-sm text-gray-800 truncate group-hover:text-[#A31F34]">
                          {m.title}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate ml-1">{m.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {m.type?.includes("공통") && <span className="text-[10px] text-gray-300">🌐</span>}
                      <MaterialFeedback materialId={m.id} />
                    </div>
                  </div>

                  {/* 광고 (5개마다) */}
                  {i > 0 && i % 5 === 0 && (
                    <div className="py-4">
                      <AdBanner />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 하단 광고 */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <AdBanner />
            </div>
          </>
        )}
      </div>

      {/* 학교 변경 */}
      <div className="text-center py-8 border-t border-gray-100">
        <a href="/login?change=1" className="text-xs text-gray-400 hover:text-[#A31F34]">
          다른 학교로 변경
        </a>
      </div>
    </main>
  );
}
