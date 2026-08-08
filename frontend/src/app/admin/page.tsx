"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string; name: string; region: string; type: string; textbook_publisher?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"upload" | "list" | "schools">("upload");
  
  // 업로드 폼
  const [title, setTitle] = useState("");
  const [type, setType] = useState("기출문제");
  const [subject, setSubject] = useState("수학");
  const [year, setYear] = useState(2026);
  const [semester, setSemester] = useState("1학기");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  
  // 대상 학교 선택
  const [targetMode, setTargetMode] = useState<"all" | "type" | "textbook" | "search" | "specific">("all");
  const [targetType, setTargetType] = useState("고등학교");
  const [targetPublisher, setTargetPublisher] = useState("천재교육");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [searchResults, setSearchResults] = useState<School[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 자료 목록
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(u => {
      if (!u || (u.role !== "admin" && u.role !== "teacher")) router.push("/login");
      else setUser(u);
    });
  }, []);

  useEffect(() => {
    fetch("/api/materials?limit=50").then(r => r.json()).then(setMaterials);
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setSearchResults(await res.json());
    } else setSearchResults([]);
  };

  const handleUpload = async () => {
    if (!title.trim()) return setMsg("제목을 입력하세요");
    setSaving(true);
    setMsg("");
    
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, type, subject, year, semester, description, fileUrl,
          target: {
            mode: targetMode,
            type: targetMode === "type" ? targetType : undefined,
            publisher: targetMode === "textbook" ? targetPublisher : undefined,
            schoolIds: targetMode === "specific" ? selectedSchools.map(s => s.id) : undefined,
          }
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ ${data.count || 1}개 학교에 자료가 등록되었습니다!`);
        setTitle(""); setDescription(""); setFileUrl("");
        fetch("/api/materials?limit=50").then(r => r.json()).then(setMaterials);
      } else {
        setMsg(`❌ ${data.error}`);
      }
    } catch {
      setMsg("❌ 네트워크 오류");
    }
    setSaving(false);
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">📋 4exam 관리자</h1>
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{user.role}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("upload")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==="upload" ? "bg-[#A31F34] text-white" : "text-gray-600 hover:bg-gray-100"}`}>📤 자료 올리기</button>
            <button onClick={() => setTab("list")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==="list" ? "bg-[#A31F34] text-white" : "text-gray-600 hover:bg-gray-100"}`}>📋 자료 목록</button>
            <button onClick={() => setTab("schools")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==="schools" ? "bg-[#A31F34] text-white" : "text-gray-600 hover:bg-gray-100"}`}>🏫 학교 관리</button>
            <button onClick={() => { fetch("/api/auth/logout", {method:"POST"}); router.push("/"); }} className="px-3 py-2 text-sm text-gray-400 hover:text-red-500">로그아웃</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {tab === "upload" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 자료 정보 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">📝 자료 정보</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">제목</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 2026년 1학기 중간고사 수학"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#A31F34] outline-none text-sm" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">유형</label>
                      <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
                        {["기출문제","예상문제","수행평가","요점정리","모의고사"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">과목</label>
                      <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
                        {["국어","영어","수학","사회","과학","한국사","물리","화학","생명과학","지구과학","경제","법과사회","세계사","동아시아사","윤리","지리"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">연도</label>
                      <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">학기</label>
                      <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
                        {["1학기","2학기"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">설명</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="자료에 대한 설명..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#A31F34] outline-none text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">파일 URL</label>
                    <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://s3.amazonaws.com/..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#A31F34] outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 대상 학교 선택 */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">🎯 대상 학교</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="target" checked={targetMode==="all"} onChange={() => setTargetMode("all")} className="accent-[#A31F34]" />
                    <div><p className="text-sm font-medium">전체 학교</p><p className="text-xs text-gray-400">모든 학교에 제공</p></div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="target" checked={targetMode==="type"} onChange={() => setTargetMode("type")} className="accent-[#A31F34]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">학교 유형별</p>
                      <select value={targetType} onChange={e => setTargetType(e.target.value)} className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
                        {["중학교","고등학교"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="target" checked={targetMode==="textbook"} onChange={() => setTargetMode("textbook")} className="accent-[#A31F34]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">교과서 출판사별</p>
                      <select value={targetPublisher} onChange={e => setTargetPublisher(e.target.value)} className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
                        {["비상교육","미래엔","천재교육","지학사","좋은책신사고","금성출판사","동아출판"].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="target" checked={targetMode==="specific"} onChange={() => setTargetMode("specific")} className="accent-[#A31F34]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">검색하여 선택</p>
                      <input value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="학교명 검색..."
                        className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs" />
                      {/* 검색 결과 */}
                      {searchResults.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                          {searchResults.map(s => (
                            <button key={s.id} onClick={() => {
                              if (!selectedSchools.find(x => x.id === s.id)) setSelectedSchools([...selectedSchools, s]);
                            }} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs flex items-center justify-between">
                              <span>{s.name}</span>
                              <span className="text-gray-400">{s.region}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* 선택된 학교 */}
                      {selectedSchools.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedSchools.map(s => (
                            <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                              {s.name}
                              <button onClick={() => setSelectedSchools(selectedSchools.filter(x => x.id !== s.id))} className="hover:text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* 업로드 버튼 */}
              <button onClick={handleUpload} disabled={saving}
                className="w-full py-3 bg-[#A31F34] text-white font-medium rounded-xl hover:bg-[#8B1A2C] disabled:opacity-50 transition-colors">
                {saving ? "업로드 중..." : "📤 자료 등록하기"}
              </button>
              {msg && <p className={`text-sm text-center p-3 rounded-xl ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{msg}</p>}
              
              {/* 통계 카드 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-2">🎯 등록 예상 범위</p>
                <p className="text-2xl font-bold text-[#A31F34]">
                  {targetMode === "all" ? "전체 학교" :
                   targetMode === "type" ? "모든 " + targetType :
                   targetMode === "textbook" ? targetPublisher + " 채택 학교" :
                   `${selectedSchools.length}개 학교`}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "list" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">📋 등록된 자료 ({materials.length}개)</h2>
            <div className="space-y-2">
              {materials.map((m: any) => (
                <div key={m.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <span className="text-xl">{m.type==="기출문제"?"📝":"📖"}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{m.title}</p>
                    <p className="text-xs text-gray-400">{m.type} · {m.subject || "과목 미정"} · {m.year}년 {m.semester}</p>
                  </div>
                  <span className="text-xs text-gray-400">{m.created_at?.slice(0,10)}</span>
                  <button className="text-xs text-red-400 hover:text-red-600">삭제</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "schools" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">🏫 학교별 교과서 정보 관리</h2>
            <p className="text-sm text-gray-500 mb-4">학교별 교과서 채택 정보를 입력하세요. 이 정보는 자료 노출 필터에 사용됩니다.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              💡 <b>80% 공통 + 20% 학교별</b> 전략: 대부분의 자료는 전체 학교에 보여주고, 교과서별 특화 자료만 필터링합니다. 학생은 모든 자료가 "우리학교 전용"이라고 느낍니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
