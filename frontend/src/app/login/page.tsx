"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "school" | "info">("role");
  const [role, setRole] = useState("student");
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [grade, setGrade] = useState(1);
  const [classCode, setClassCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    { id: "student", icon: "🎒", label: "학생", desc: "우리학교 시험자료 보기" },
    { id: "teacher", icon: "👩‍🏫", label: "선생님", desc: "자료 업로드·학급 관리" },
    { id: "parent", icon: "👨‍👩‍👧", label: "학부모", desc: "자녀 학습 관리" },
    { id: "alumni", icon: "🎓", label: "동문", desc: "동창회·추억 공유" },
  ];

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setSchools(await res.json());
    } else setSchools([]);
  };

  const handleLogin = async () => {
    if (!nickname.trim()) return setError(role === "teacher" ? "성함을 입력해주세요" : "닉네임을 입력해주세요");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selected.id, nickname: nickname.trim(),
          role, grade, classCode
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "로그인 실패"); return; }
      
      // 역할별 대시보드로 이동
      const dashboards: Record<string, string> = {
        student: `/school/${selected.id}?role=student&grade=${grade}`,
        teacher: `/admin?school=${selected.id}`,
        parent: `/school/${selected.id}?role=parent`,
        alumni: `/school/${selected.id}?role=alumni`,
      };
      router.push(dashboards[role] || "/");
    } catch {
      setError("네트워크 오류");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light tracking-tight mb-2">4exam.study</h1>
          <p className="text-sm text-gray-500">
            {step === "role" ? "누구세요?" :
             step === "school" ? "어느 학교세요?" :
             `${selected?.name} ${role === "student" ? "몇 학년인가요?" : "환영합니다!"}`}
          </p>
        </div>

        {/* 1단계: 역할 선택 */}
        {step === "role" && (
          <div className="grid grid-cols-2 gap-4">
            {roles.map(r => (
              <button key={r.id} onClick={() => { setRole(r.id); setStep("school"); }}
                className={`p-6 rounded-2xl border text-left transition-all hover:shadow-lg ${
                  role === r.id ? "border-[#A31F34] bg-[#A31F34]/5" : "border-gray-200 hover:border-gray-300"
                }`}>
                <span className="text-3xl mb-2 block">{r.icon}</span>
                <span className="font-bold text-lg block">{r.label}</span>
                <span className="text-sm text-gray-400">{r.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2단계: 학교 선택 */}
        {step === "school" && (
          <>
            <button onClick={() => setStep("role")} className="text-sm text-gray-500 hover:text-[#A31F34] mb-4 flex items-center">
              ← 역할 다시 선택
            </button>
            <div className="relative">
              <input type="text" value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="학교 이름 검색..."
                className="w-full text-xl font-light text-center py-5 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none transition-colors bg-transparent placeholder-gray-300"
                autoFocus />
            </div>
            <div className="mt-4">
              {schools.map(s => (
                <button key={s.id} onClick={() => { setSelected(s); setStep("info"); }}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="text-base font-medium hover:text-[#A31F34]">{s.name}</span>
                    <span className="text-sm text-gray-400 ml-3">{s.type}</span>
                  </div>
                  <span className="text-sm text-gray-400">{s.region}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 3단계: 정보 입력 */}
        {step === "info" && (
          <div className="space-y-6">
            <button onClick={() => setStep("school")} className="text-sm text-gray-500 hover:text-[#A31F34]">
              ← 학교 다시 선택
            </button>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg">{roles.find(r => r.id === role)?.icon}</span>
              <span>{roles.find(r => r.id === role)?.label}</span>
              <span>·</span>
              <span className="font-medium text-gray-700">{selected?.name}</span>
            </div>

            {role === "student" && (
              <div>
                <label className="block text-sm text-gray-500 mb-2">학년</label>
                <div className="flex gap-2">
                  {[1,2,3].map(g => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                        grade === g ? "border-[#A31F34] bg-[#A31F34] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>{g}학년</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-2">
                {role === "teacher" ? "성함" : role === "parent" ? "자녀 이름" : "닉네임"}
              </label>
              <input type="text" value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError(""); }}
                placeholder={role === "teacher" ? "김선생" : "사용할 이름"}
                className="w-full text-lg font-light py-4 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none bg-transparent placeholder-gray-300"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoFocus maxLength={20} />
              {error && <p className="text-sm text-[#A31F34] mt-2">{error}</p>}
            </div>

            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 bg-[#A31F34] text-white font-medium rounded-xl hover:bg-[#8B1A2C] disabled:opacity-50 transition-colors">
              {loading ? "입장 중..." : "입장하기"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
