"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const changeSchool = searchParams.get("change") === "1";

  const [step, setStep] = useState<"email" | "school">(changeSchool ? "school" : "email");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 저장된 이메일 확인
  useEffect(() => {
    const saved = localStorage.getItem("4exam_email");
    if (saved && !changeSchool) {
      setEmail(saved);
      // 자동 로그인 → 바로 학교 페이지로
      fetch("/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: saved, action: "me" }),
      }).then(r => r.json()).then(d => {
        if (d.found && d.schoolId) {
          router.push(`/school/${d.schoolId}`);
        }
      });
    }
  }, []);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } else setResults([]);
  };

  const handleSubmit = async () => {
    if (!email.includes("@")) return setMsg("올바른 이메일을 입력해주세요");
    if (!selected) return setMsg("학교를 선택해주세요");
    
    setLoading(true);
    localStorage.setItem("4exam_email", email);
    
    const res = await fetch("/api/member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, schoolId: selected.id, action: "login" }),
    });
    const data = await res.json();
    
    if (data.ok) {
      router.push(`/school/${selected.id}?welcome=1`);
    } else {
      setMsg("오류가 발생했습니다");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light">
            {changeSchool ? "🏫 학교 변경" : step === "email" ? "👋 거의 다 왔어요" : "🏫 학교 선택"}
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {changeSchool ? "새 학교를 선택하세요" :
             step === "email" ? "이메일만 입력하면 끝!" : `${email}님, 학교를 알려주세요`}
          </p>
        </div>

        {step === "email" && (
          <div className="space-y-4">
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="w-full text-xl font-light text-center py-5 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none bg-transparent"
              onKeyDown={(e) => e.key === "Enter" && email.includes("@") && setStep("school")}
              autoFocus
            />
            <button
              onClick={() => email.includes("@") && setStep("school")}
              disabled={!email.includes("@")}
              className="w-full py-3 bg-[#A31F34] text-white font-medium rounded-xl hover:bg-[#8B1A2C] disabled:opacity-30 transition-colors">
              다음
            </button>
            <p className="text-xs text-gray-300 text-center">
              이름·비밀번호 없이 이메일만으로 가입됩니다
            </p>
          </div>
        )}

        {step === "school" && (
          <div className="space-y-4">
            {!changeSchool && (
              <button onClick={() => setStep("email")} className="text-sm text-gray-400 hover:text-[#A31F34]">
                ← 이메일 수정
              </button>
            )}
            
            <input
              type="text" value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="학교 검색..."
              className="w-full text-lg font-light text-center py-4 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none bg-transparent"
              autoFocus
            />

            {selected && (
              <div className="p-4 bg-[#A31F34]/5 rounded-xl border border-[#A31F34]/20">
                <p className="text-sm font-medium">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.region} · {selected.type}</p>
              </div>
            )}

            {results.length > 0 && !selected && (
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl">
                {results.map((s: any) => (
                  <button key={s.id}
                    onClick={() => { setSelected(s); setQuery(""); setResults([]); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{s.region} · {s.type}</span>
                  </button>
                ))}
              </div>
            )}

            {msg && <p className="text-sm text-red-500 text-center">{msg}</p>}

            <button onClick={handleSubmit} disabled={!selected || loading}
              className="w-full py-3 bg-[#A31F34] text-white font-medium rounded-xl hover:bg-[#8B1A2C] disabled:opacity-30 transition-colors">
              {loading ? "입장 중..." : changeSchool ? "학교 변경" : "시작하기"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
