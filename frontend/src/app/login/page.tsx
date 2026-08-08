"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string; name: string; region: string; type: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"school" | "nickname">("school");
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 학교 검색
  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setSchools(await res.json());
    } else setSchools([]);
  };

  // 학교 선택 → 닉네임 단계로
  const selectSchool = (school: School) => {
    setSelectedSchool(school);
    setStep("nickname");
  };

  // 로그인
  const handleLogin = async () => {
    if (!nickname.trim()) return setError("닉네임을 입력해주세요");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: selectedSchool!.id, nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인 실패");
        return;
      }
      // role에 따라 리디렉션
      if (data.user.role === "admin" || data.user.role === "teacher") {
        router.push("/admin");
      } else {
        router.push(`/school/${selectedSchool!.id}`);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-tight mb-2">4exam.study</h1>
          <p className="text-sm text-gray-500">
            {step === "school" ? "우리 학교를 찾아보세요" : `${selectedSchool!.name} 학생이신가요?`}
          </p>
        </div>

        {step === "school" ? (
          <>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="학교 이름 검색..."
                className="w-full text-xl font-light text-center py-5 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none transition-colors bg-transparent placeholder-gray-300"
                autoFocus
              />
            </div>
            <div className="mt-4">
              {schools.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSchool(s)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-base font-medium hover:text-[#A31F34]">{s.name}</span>
                    <span className="text-sm text-gray-400 ml-3">{s.type}</span>
                  </div>
                  <span className="text-sm text-gray-400">{s.region}</span>
                </button>
              ))}
              {query && schools.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">검색 결과가 없습니다</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div
              onClick={() => setStep("school")}
              className="text-sm text-gray-500 cursor-pointer hover:text-[#A31F34] transition-colors flex items-center"
            >
              ← 학교 다시 선택
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <span className="px-3 py-1 bg-gray-100 rounded-full">{selectedSchool!.name}</span>
              <span>·</span>
              <span>{selectedSchool!.region}</span>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="사용할 닉네임을 입력하세요"
                className="w-full text-lg font-light py-4 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none transition-colors bg-transparent placeholder-gray-300"
                autoFocus
                maxLength={20}
              />
              {error && <p className="text-sm text-[#A31F34] mt-2">{error}</p>}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[#A31F34] text-white font-medium hover:bg-[#8B1A2C] transition-colors disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "입장하기"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
