"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string; name: string; region: string; type: string; address: string; textbook_publisher?: string;
}

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
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
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
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

        {results.length > 0 && (
          <div className="w-full max-w-2xl mt-2">
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/school/${s.id}`)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-medium hover:text-[#A31F34]">{s.name}</span>
                    <span className="text-sm text-gray-400 ml-3">{s.type}</span>
                  </div>
                  <span className="text-sm text-gray-400">{s.region}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{s.address}{s.textbook_publisher ? ` · ${s.textbook_publisher}` : ""}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-400 mb-4">대상별 바로가기</p>
          <div className="flex gap-6 justify-center text-sm text-gray-500">
            {["중학생","고등학생","교사","학부모"].map(a => (
              <span key={a} className="hover:text-[#A31F34] transition-colors cursor-pointer">{a}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
