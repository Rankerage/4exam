"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LunchMenu, SchoolEvent, fetchLunchMenu, fetchSchoolSchedule } from "@/lib/neis-api";

interface Material {
  id: string; title: string; type: string; description?: string;
  year?: number; semester?: string; subject?: string; created_at: string;
}

// 개인화 템플릿 엔진
const PERSONALIZE = {
  schoolName: "",
  schoolRegion: "",
  schoolType: "",
  grade: 1,
  textbook: "",
  greeting: "",
};

function personalizeText(text: string, ctx: typeof PERSONALIZE): string {
  return text
    .replace(/\{학교명\}/g, ctx.schoolName)
    .replace(/\{지역\}/g, ctx.schoolRegion)
    .replace(/\{학교유형\}/g, ctx.schoolType)
    .replace(/\{학년\}/g, `${ctx.grade}학년`)
    .replace(/\{교과서\}/g, ctx.textbook)
    .replace(/\{인사말\}/g, ctx.greeting);
}

function getGreeting(ctx: typeof PERSONALIZE): string {
  const h = new Date().getHours();
  const time = h < 12 ? "밝은 아침" : h < 17 ? "활기찬 오후" : "차분한 저녁";
  return `${ctx.schoolName} ${ctx.grade}학년 학생 여러분, ${time}입니다!`;
}

export default function SchoolPage({ params }: { params: { id: string } }) {
  const [school, setSchool] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lunch, setLunch] = useState<LunchMenu[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [tab, setTab] = useState("all");
  const [grade, setGrade] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  useEffect(() => {
    fetch(`/api/exam?action=school&id=${params.id}`).then(r => r.json()).then(setSchool);
    fetch(`/api/exam?action=materials&schoolId=${params.id}`).then(r => r.json()).then(setMaterials);
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30*86400000).toISOString().slice(0, 10);
    fetchLunchMenu("B10", params.id, today).then(setLunch);
    fetchSchoolSchedule("B10", params.id, today, nextMonth).then(setEvents);
  }, [params.id]);

  if (!school) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>;

  // 개인화 컨텍스트
  const ctx: typeof PERSONALIZE = {
    schoolName: school.name || "우리 학교",
    schoolRegion: school.region || "",
    schoolType: school.type || "",
    grade,
    textbook: school.textbook_publisher || "",
    greeting: "",
  };
  ctx.greeting = getGreeting(ctx);

  const filtered = tab === "all" ? materials : materials.filter(m => m.type === tab);
  const types = ["all","기출문제","예상문제","수행평가","요점정리","급식/일정"];
  const examEvents = events.filter(e => e.type === "시험");

  // 개인화된 제목 생성
  const personalizedTitle = (m: Material) => {
    const titles: Record<string, string> = {
      "기출문제": `📝 ${ctx.schoolName} ${ctx.grade}학년 ${m.subject || ""} ${m.type}`,
      "예상문제": `🎯 ${ctx.schoolName} 맞춤 ${m.subject || ""} ${m.type}`,
      "수행평가": `✍️ ${ctx.schoolName} ${m.subject || ""} ${m.type} 자료`,
      "요점정리": `📖 ${ctx.schoolName} ${ctx.grade}학년 ${m.subject || ""} 핵심정리`,
    };
    return titles[m.type] || m.title;
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ===== 개인화 헤더 ===== */}
      <header className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab] text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">← 학교 변경</Link>
            <div className="flex items-center gap-2">
              {/* 학년 선택 */}
              {[1,2,3].map(g => (
                <button key={g} onClick={() => setGrade(g)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    grade === g ? "bg-white text-[#1a237e]" : "bg-white/20 text-white hover:bg-white/30"
                  }`}>
                  {g}학년
                </button>
              ))}
            </div>
          </div>
          
          {/* 인사말 */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
            {personalizeText("{인사말}", ctx)}
          </h1>
          <p className="text-white/70 text-sm">
            {personalizeText("{학교명}만을 위한 맞춤 시험자료 · {교과서} 교과서 기준", ctx)}
          </p>
        </div>
      </header>

      {/* ===== 학교 정보 배너 ===== */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            <InfoBadge label="교과서" value={school.textbook_publisher || "정보 없음"} />
            <InfoBadge label="지역" value={school.region} />
            <InfoBadge label="학교유형" value={school.type} />
            <InfoBadge label="선택학년" value={`${grade}학년`} highlight />
            
            {/* 급식 미리보기 */}
            {lunch.length > 0 && (
              <div className="flex-1" />
            )}
            {lunch.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 max-w-xs">
                <p className="text-xs text-[#A31F34] font-bold mb-2">
                  🍱 {personalizeText("{학교명} 오늘의 급식", ctx)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {lunch[0].menu.map((m, i) => (
                    <span key={i} className="text-sm text-gray-700 bg-gray-50 px-2 py-0.5 rounded-lg">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 시험 일정 */}
          {examEvents.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {examEvents.slice(0, 3).map((e, i) => (
                <div key={i} className="shrink-0 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-xs text-red-700 font-medium">
                  📅 {e.name} — {e.date}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 탭 + 자료 ===== */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
          <div className="flex gap-1">
            {types.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  tab===t ? "bg-[#A31F34] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {t==="all" ? "전체" : t==="급식/일정" ? "🍱 급식" : t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* 정렬 */}
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {tab === "급식/일정" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">
                📅 {personalizeText("{학교명} 학사일정", ctx)}
              </h3>
              {events.map((e, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-200 last:border-0">
                  <span className="text-sm text-gray-400 w-24">{e.date}</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    e.type==="시험"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"
                  }`}>{e.type}</span>
                  <span className="text-sm">{e.name}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">
                🍱 {personalizeText("{학교명} 이번 주 급식", ctx)}
              </h3>
              {lunch.map((l, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">{l.date}</p>
                  <div className="flex flex-wrap gap-1">
                    {l.menu.map((m, j) => (
                      <span key={j} className="text-sm bg-white px-2 py-1 rounded-lg shadow-sm">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 개인화 카드 그리드 */}
            <div className={viewMode === "card"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-2"
            }>
              {filtered.map(m => (
                viewMode === "card" ? (
                  <div key={m.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer">
                    <div className="aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <span className="text-5xl opacity-20">
                        {m.type==="기출문제"?"📝":m.type==="예상문제"?"🎯":m.type==="수행평가"?"✍️":"📖"}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-[#A31F34]/10 text-[#A31F34] rounded-full font-medium">{m.type}</span>
                        {m.year && <span className="text-xs text-gray-400">{m.year}년</span>}
                        {m.subject && <span className="text-xs text-gray-400">{m.subject}</span>}
                      </div>
                      {/* ★ 개인화된 제목 */}
                      <h3 className="font-semibold text-base group-hover:text-[#A31F34] transition-colors">
                        {personalizeText(personalizedTitle(m), ctx)}
                      </h3>
                      {m.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {personalizeText(m.description, ctx)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="text-2xl">{m.type==="기출문제"?"📝":"🎯"}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">{personalizeText(personalizedTitle(m), ctx)}</h3>
                      <p className="text-sm text-gray-500">{m.type} {m.year && `· ${m.year}년`}</p>
                    </div>
                    <span className="text-xs text-gray-400">{m.created_at?.slice(0,10)}</span>
                  </div>
                )
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-400 text-lg">
                  {personalizeText("{학교명}의 첫 번째 자료를 기다리고 있어요!", ctx)}
                </p>
                <p className="text-gray-300 text-sm mt-1">곧 업데이트 됩니다</p>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between text-xs text-gray-400">
          <span>4exam.study — {school.name}</span>
          <span>{personalizeText("{학교명} {학년}학년 맞춤 시험자료", ctx)}</span>
        </div>
      </footer>
    </main>
  );
}

function InfoBadge({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`${highlight ? "bg-[#A31F34]/5 border-[#A31F34]/20" : "bg-white"} px-4 py-3 rounded-xl border`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`font-bold ${highlight ? "text-[#A31F34]" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: string; onChange: (v: "card"|"list") => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      <button onClick={() => onChange("card")} className={`p-1.5 rounded-md ${view==="card"?"bg-white shadow-sm":""}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/></svg>
      </button>
      <button onClick={() => onChange("list")} className={`p-1.5 rounded-md ${view==="list"?"bg-white shadow-sm":""}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg>
      </button>
    </div>
  );
}
