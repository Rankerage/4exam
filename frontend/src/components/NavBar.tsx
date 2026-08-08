"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } else setResults([]);
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link href="/" className="text-lg font-bold text-[#A31F34] tracking-tight shrink-0">
            4exam<span className="text-gray-300 font-light">.study</span>
          </Link>

          {/* 검색바 (데스크탑) */}
          <div className="hidden md:block flex-1 max-w-md mx-6 relative">
            <input
              type="text" value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="학교 검색..."
              className="w-full text-sm py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#A31F34] focus:bg-white outline-none transition-colors"
            />
            {results.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {results.slice(0, 5).map((s: any) => (
                  <button key={s.id}
                    onClick={() => { router.push(`/school/${s.id}`); setQuery(""); setResults([]); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-xs text-gray-400">{s.region}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 메뉴 (데스크탑) */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/schools" className="px-3 py-1.5 text-sm text-gray-500 hover:text-[#A31F34] rounded-lg hover:bg-gray-50 transition-colors">
              전체 학교
            </Link>
            <Link href="/login" className="px-3 py-1.5 text-sm bg-[#A31F34] text-white rounded-lg hover:bg-[#8B1A2C] transition-colors">
              입장하기
            </Link>
          </div>

          {/* 햄버거 (모바일) */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen 
                ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <input
              type="text" value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="학교 검색..."
              className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg"
              autoFocus
            />
            {results.length > 0 && (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                {results.slice(0, 5).map((s: any) => (
                  <button key={s.id}
                    onClick={() => { router.push(`/school/${s.id}`); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b last:border-0">
                    {s.name} <span className="text-gray-400 ml-1">{s.region}</span>
                  </button>
                ))}
              </div>
            )}
            <Link href="/schools" className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              onClick={() => setMenuOpen(false)}>전체 학교</Link>
            <Link href="/login" className="block px-3 py-2 text-sm text-center bg-[#A31F34] text-white rounded-lg"
              onClick={() => setMenuOpen(false)}>입장하기</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

// 학교 페이지 전용 탭바
export function SchoolTabs({ schoolId, grade, onGradeChange }: {
  schoolId: string; grade: number; onGradeChange: (g: number) => void;
}) {
  const tabs = [
    { id: "materials", label: "📝 시험자료", path: `/school/${schoolId}` },
    { id: "lunch", label: "🍱 급식", path: `/school/${schoolId}?tab=lunch` },
    { id: "schedule", label: "📅 일정", path: `/school/${schoolId}?tab=schedule` },
    { id: "info", label: "🏫 학교정보", path: `/school/${schoolId}?tab=info` },
  ];

  return (
    <div className="border-b border-gray-100 bg-white sticky top-14 z-40">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* 탭 */}
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(tab => (
              <Link key={tab.id} href={tab.path}
                className="px-4 py-2.5 text-sm whitespace-nowrap text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-b-2 border-transparent hover:border-gray-200 transition-colors">
                {tab.label}
              </Link>
            ))}
          </div>

          {/* 학년 선택 */}
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            {[0, 1, 2, 3].map(g => (
              <button key={g} onClick={() => onGradeChange(g)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  grade === g 
                    ? "bg-[#A31F34] text-white" 
                    : "text-gray-400 hover:bg-gray-100"
                }`}>
                {g === 0 ? "전체" : `${g}학년`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
