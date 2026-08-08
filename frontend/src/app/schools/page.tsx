"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface School { id: string; name: string; region: string; type: string; address: string; }

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [region, setRegion] = useState("");

  useEffect(() => {
    fetch(`/api/exam?action=search&q=${region}`).then(r => r.json()).then(setSchools);
  }, [region]);

  const regions = ["서울","부산","대구","인천","광주","대전","세종","경기"];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-[#A31F34] mb-8 inline-block">← 홈</Link>
        <h1 className="text-2xl font-medium mb-8">학교 찾기</h1>
        
        <div className="flex gap-2 flex-wrap mb-8">
          {regions.map(r => (
            <button key={r} onClick={() => setRegion(r === region ? "" : r)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${region === r ? "bg-[#A31F34] text-white border-[#A31F34]" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
              {r}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {schools.map(s => (
            <Link key={s.id} href={`/school/${s.id}`}
              className="block p-4 border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-gray-400">{s.type}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{s.address}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
