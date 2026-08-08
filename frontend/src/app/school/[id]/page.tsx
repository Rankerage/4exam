"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Material {
  id: string; title: string; type: string; description?: string; year?: number; semester?: string; created_at: string;
}

export default function SchoolPage({ params }: { params: { id: string } }) {
  const [school, setSchool] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetch(`/api/exam?action=school&id=${params.id}`).then(r => r.json()).then(setSchool);
    fetch(`/api/exam?action=materials&schoolId=${params.id}`).then(r => r.json()).then(setMaterials);
  }, [params.id]);

  const filtered = tab === "all" ? materials : materials.filter(m => m.type === tab);

  if (!school) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>;

  return (
    <main className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-[#A31F34]">← 학교 변경</Link>
          <div>
            <h1 className="text-xl font-medium">{school.name}</h1>
            <p className="text-xs text-gray-400">{school.address}</p>
          </div>
          <span className="text-xs px-3 py-1 bg-[#A31F34] text-white rounded-full">{school.type}</span>
        </div>
      </header>

      {/* 학교 아이덴티티 */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 gap-8">
          <div><p className="text-xs text-gray-400 mb-1">교과서</p><p className="text-lg font-light">{school.textbook_publisher || "-"}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">지역</p><p className="text-lg font-light">{school.region}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">유형</p><p className="text-lg font-light">{school.type}</p></div>
        </div>
      </section>

      {/* 탭 + 자료 그리드 */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-3">
          {["all","기출문제","예상문제","수행평가","요점정리"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm pb-2 border-b-2 transition-colors ${tab===t ? "border-[#A31F34] text-[#A31F34] font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t==="all" ? "전체" : t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(m => (
            <div key={m.id} className="group cursor-pointer border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <p className="text-xs text-[#A31F34] font-medium mb-1">{m.type} {m.year && `${m.year}년`}</p>
              <h3 className="text-base font-medium mb-1">{m.title}</h3>
              {m.description && <p className="text-sm text-gray-500">{m.description}</p>}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-400 col-span-3 text-center py-12">아직 등록된 자료가 없습니다</p>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between text-xs text-gray-400">
          <span>4exam.study — {school.name}</span>
          <span>전국 학교별 맞춤 시험자료</span>
        </div>
      </footer>
    </main>
  );
}
