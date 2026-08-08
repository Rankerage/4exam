"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NicknamePrompt, getNickname } from "@/lib/nickname";

export default function HomeClient() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } else setResults([]);
  };

  const handleEnter = async () => {
    if (!email.includes("@")) return;
    setLoading(true);
    localStorage.setItem("4exam_email", email);
    const res = await fetch("/api/member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action: "me" }),
    });
    const data = await res.json();
    if (data.found && data.schoolId) {
      router.push(`/school/${data.schoolId}`);
    } else {
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans">
      {/* ── Stanford-style Hero ── */}
      <section className="relative bg-gradient-to-br from-[#8C1515] via-[#A31F34] to-[#2E2D29] text-white overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <p className="text-sm tracking-[.3em] uppercase opacity-60 mb-6 font-medium">
              A New Way to Study
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              당신의 학교가<br />
              <span className="text-white/80 font-light">시험을 준비합니다</span>
            </h1>
            <p className="text-lg text-white/60 font-light mb-10 max-w-xl leading-relaxed">
              전국 11,000개 학교의 수능기출, 모의고사, 학교시험 자료를<br />
              광고 한 줄만 보고 무료로 이용하세요.
            </p>

            {/* 이메일 입력 */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일 주소"
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:bg-white/20 transition-colors text-base"
                onKeyDown={e => e.key === "Enter" && handleEnter()}
              />
              <button onClick={handleEnter} disabled={loading}
                className="px-8 py-3.5 bg-white text-[#8C1515] font-bold rounded-xl hover:bg-gray-100 transition-colors text-base disabled:opacity-50">
                {loading ? "확인 중..." : "입장하기"}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-3">비밀번호 없이 이메일만으로 시작됩니다</p>
          </div>
        </div>

        {/* 하단 웨이브 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── 학교 검색 ── */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">학교 바로 찾기</h2>
          <div className="relative">
            <input
              type="text" value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="학교 이름을 입력하세요"
              className="w-full text-xl font-light py-4 border-b-2 border-gray-200 focus:border-[#8C1515] outline-none bg-transparent transition-colors"
            />
            {results.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                {results.slice(0, 8).map((s: any) => (
                  <button key={s.id}
                    onClick={() => router.push(`/school/${s.id}`)}
                    className="w-full text-left px-5 py-3 hover:bg-gray-50 border-b last:border-0 flex items-center justify-between">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-gray-400">{s.region} · {s.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 숫자로 보기 ── */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "11,165", label: "전국 학교" },
            { value: "322", label: "수능 기출문제" },
            { value: "무료", label: "광고 기반" },
            { value: "1초", label: "이메일 가입" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl md:text-5xl font-bold text-[#2E2D29] tracking-tight">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 작동 방식 ── */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#2E2D29] mb-12">
            세 단계로 끝
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "이메일 입력", desc: "비밀번호도, 이름도 필요 없습니다. 이메일 하나면 충분합니다." },
              { step: "02", title: "학교 선택", desc: "11,000개 학교 중 내 학교를 찾아 클릭 한 번으로 연결됩니다." },
              { step: "03", title: "자료 확인", desc: "수능기출부터 학교시험까지, 모든 자료가 자동으로 배달됩니다." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-bold text-[#8C1515]/20 mb-4">{item.step}</p>
                <h3 className="text-lg font-bold text-[#2E2D29] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="bg-[#2E2D29] text-white/40 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <span>© 2026 4exam.study — 광고로 운영되는 무료 교육 플랫폼</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="hover:text-white transition-colors">개인정보</a>
            <a href="mailto:mathbible@gmail.com" className="hover:text-white transition-colors">문의하기</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
