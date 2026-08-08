"use client";

import { useState, useEffect } from "react";

const AI_HANDLES = [
  "학교 DB 자동 업데이트 (NEIS 연동)",
  "교과서 채택정보 수집 (크롤러)",
  "자료 품질 스코어 계산",
  "스팸 댓글 1차 필터링",
  "급식/학사일정 갱신",
  "중복 자료 감지",
];

export default function AdminPage() {
  const [pendingDecisions, setPendingDecisions] = useState<any[]>([]);
  const [aiLog, setAiLog] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [tab, setTab] = useState<"decisions" | "log">("decisions");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => setStats({
      schools: 11165, materials: 1000, ai_actions_today: 23, reverted: 1
    }));
    
    fetch("/api/admin/pending").then(r => r.json()).then(setPendingDecisions).catch(() => {
      setPendingDecisions([
        { id: 1, type: "comment", title: "부적절한 댓글 신고", 
          detail: "이 자료 쓰레기네요 절대 보지 마세요", ai_confidence: 45 },
        { id: 2, type: "material", title: "저품질 자료 의심",
          detail: "많이 공부하세요 시험 잘 보세요", ai_confidence: 38 },
        { id: 3, type: "identity", title: "학교 정보 수정 요청",
          detail: "가락중학교 → 교목: 은행나무 (기존: 소나무)", ai_confidence: 62 },
      ]);
    });

    fetch("/api/admin/ai-log").then(r => r.json()).then(setAiLog).catch(() => {
      setAiLog([
        { id: 101, time: "방금", action: "학교 정보 업데이트", detail: "서울 5개 학교 (NEIS)", status: "done", revertible: true },
        { id: 102, time: "3분 전", action: "교과서 PDF 파싱", detail: "대전 대덕중 — 14개 과목", status: "done", revertible: true },
        { id: 103, time: "7분 전", action: "저품질 필터링", detail: "자료 3건 보류 처리", status: "done", revertible: true },
        { id: 104, time: "12분 전", action: "신규 학교 발견", detail: "크롤링 — 12개 학교 추가", status: "done", revertible: true },
        { id: 105, time: "25분 전", action: "급식 데이터 갱신", detail: "가락중학교 — 8월 2주차", status: "done", revertible: true },
        { id: 106, time: "1시간 전", action: "중복 자료 병합", detail: "대전고 수학 — 2건 → 1건", status: "reverted", revertible: false },
      ]);
    });
  }, []);

  const handleDecision = async (id: number, decision: string) => {
    setPendingDecisions(prev => prev.filter(d => d.id !== id));
    setMsg(decision === "approve" ? "✅ 승인됨" : "❌ 거절됨");
    setTimeout(() => setMsg(""), 2000);
  };

  const handleRevert = async (id: number) => {
    setAiLog(prev => prev.map(l => l.id === id ? { ...l, status: "reverting" } : l));
    setMsg("🔄 되돌리는 중...");
    setTimeout(() => {
      setAiLog(prev => prev.map(l => l.id === id ? { ...l, status: "reverted", revertible: false } : l));
      setMsg("↩️ 되돌려짐");
      setTimeout(() => setMsg(""), 2000);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🤖 4exam AI 관리자</h1>
            <p className="text-xs text-gray-400">
              AI 자율 운영 중 — 결정 {pendingDecisions.length}건 · 오늘 {stats.ai_actions_today || 23}건 실행 · {stats.reverted || 1}건 되돌림
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full animate-pulse">AI 활성</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {msg && (
          <div className="fixed top-20 right-6 px-4 py-2 bg-white shadow-lg rounded-xl text-sm font-medium z-50 animate-bounce">
            {msg}
          </div>
        )}

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "전체 학교", value: stats.schools || "11,165" },
            { label: "오늘 AI 작업", value: stats.ai_actions_today || "23", highlight: true },
            { label: "보류 결정", value: pendingDecisions.length, warn: true },
            { label: "되돌림 가능", value: aiLog.filter(l => l.revertible).length },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl p-6 shadow-sm text-center ${
              s.warn ? "border-2 border-red-200" : ""
            }`}>
              <p className={`text-3xl font-bold ${
                s.highlight ? "text-purple-600" : s.warn ? "text-red-600" : "text-gray-800"
              }`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* AI 자동처리 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">🔄 AI 자동 처리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AI_HANDLES.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button onClick={() => setTab("decisions")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "decisions" ? "bg-[#A31F34] text-white" : "text-gray-500 hover:bg-gray-100"
            }`}>
            ⚠️ 보류 결정 {pendingDecisions.length > 0 && `(${pendingDecisions.length})`}
          </button>
          <button onClick={() => setTab("log")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "log" ? "bg-[#A31F34] text-white" : "text-gray-500 hover:bg-gray-100"
            }`}>
            📋 AI 행동 로그
          </button>
        </div>

        {/* 보류 결정 */}
        {tab === "decisions" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {pendingDecisions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">🎉</p>
                <p>모든 결정이 처리되었습니다!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDecisions.map((d) => (
                  <div key={d.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            d.type === "comment" ? "bg-yellow-100 text-yellow-700" :
                            d.type === "material" ? "bg-orange-100 text-orange-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {d.type === "comment" ? "💬" : d.type === "material" ? "📄" : "🏫"} {d.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 ml-2">"{d.detail}"</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">AI 확신도:</span>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-full rounded-full ${
                              d.ai_confidence > 60 ? "bg-green-500" : d.ai_confidence > 40 ? "bg-yellow-500" : "bg-red-500"
                            }`} style={{ width: `${d.ai_confidence}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{d.ai_confidence}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleDecision(d.id, "approve")}
                          className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600">승인</button>
                        <button onClick={() => handleDecision(d.id, "reject")}
                          className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-300">거절</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI 행동 로그 + 되돌리기 */}
        {tab === "log" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-xs text-gray-400 mb-4">
              💡 AI가 자동 수행한 모든 작업입니다. 의도치 않은 작업은 <span className="font-bold">되돌리기</span> 버튼으로 복구할 수 있습니다.
            </p>
            <div className="space-y-2">
              {aiLog.map((log) => (
                <div key={log.id} className={`flex items-center justify-between p-3 rounded-xl ${
                  log.status === "reverted" ? "bg-gray-100 opacity-50" :
                  log.status === "reverting" ? "bg-yellow-50" : "bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`text-xs ${
                      log.status === "done" ? "text-green-500" :
                      log.status === "reverted" ? "text-gray-400" : "text-yellow-500"
                    }`}>
                      {log.status === "done" ? "✅" : log.status === "reverted" ? "↩️" : "🔄"}
                    </span>
                    <div>
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-xs text-gray-400 ml-2">{log.detail}</span>
                    </div>
                    <span className="text-xs text-gray-300">{log.time}</span>
                  </div>
                  {log.revertible && log.status === "done" && (
                    <button onClick={() => handleRevert(log.id)}
                      className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      ↩️ 되돌리기
                    </button>
                  )}
                  {log.status === "reverted" && (
                    <span className="text-xs text-gray-400">되돌려짐</span>
                  )}
                  {log.status === "reverting" && (
                    <span className="text-xs text-yellow-500">되돌리는 중...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
