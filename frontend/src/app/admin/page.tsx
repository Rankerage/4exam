"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface School {
  id: string; name: string; region: string; type: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    schoolId: "",
    title: "",
    type: "기출문제",
    description: "",
    year: new Date().getFullYear(),
    semester: "1학기",
  });
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const searchSchools = async (q: string) => {
    setSchoolQuery(q);
    if (q.length >= 1) {
      const res = await fetch(`/api/exam?action=search&q=${encodeURIComponent(q)}`);
      setSchools(await res.json());
    } else setSchools([]);
  };

  const selectSchool = (school: School) => {
    setSelectedSchool(school);
    setForm((f) => ({ ...f, schoolId: school.id }));
    setSchoolQuery(school.name);
    setSchools([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolId || !form.title.trim()) {
      setMessage({ type: "error", text: "학교와 제목을 입력해주세요" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: form.schoolId,
          title: form.title.trim(),
          type: form.type,
          description: form.description.trim() || undefined,
          year: form.year,
          semester: form.semester,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "등록 실패" });
        return;
      }
      setMessage({ type: "success", text: "자료가 등록되었습니다!" });
      // 폼 초기화
      setForm({
        schoolId: "",
        title: "",
        type: "기출문제",
        description: "",
        year: new Date().getFullYear(),
        semester: "1학기",
      });
      setSelectedSchool(null);
      setSchoolQuery("");
    } catch {
      setMessage({ type: "error", text: "네트워크 오류" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-light mb-8">시험자료 등록</h1>

      {message && (
        <div
          className={`mb-6 p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-[#A31F34] border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 학교 검색 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
          <input
            type="text"
            value={schoolQuery}
            onChange={(e) => searchSchools(e.target.value)}
            placeholder="학교 이름 검색..."
            className="w-full px-4 py-3 border border-gray-200 focus:border-[#A31F34] outline-none transition-colors bg-white"
          />
          {selectedSchool && (
            <p className="text-xs text-green-600 mt-1">
              ✓ {selectedSchool.name} ({selectedSchool.region} · {selectedSchool.type})
            </p>
          )}
          {schools.length > 0 && !selectedSchool && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 max-h-48 overflow-y-auto shadow-lg">
              {schools.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectSchool(s)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex justify-between"
                >
                  <span>{s.name}</span>
                  <span className="text-gray-400">{s.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">자료 제목</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예: 2024년 1학기 중간고사"
            className="w-full px-4 py-3 border border-gray-200 focus:border-[#A31F34] outline-none transition-colors bg-white"
          />
        </div>

        {/* 유형 + 학년 + 학기 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-[#A31F34] outline-none bg-white"
            >
              {["기출문제", "예상문제", "수행평가", "요점정리"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-[#A31F34] outline-none bg-white"
              min={2000}
              max={2100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학기</label>
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 focus:border-[#A31F34] outline-none bg-white"
            >
              {["1학기", "2학기"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="자료에 대한 간단한 설명..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 focus:border-[#A31F34] outline-none transition-colors bg-white resize-none"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#A31F34] text-white font-medium hover:bg-[#8B1A2C] transition-colors disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "자료 등록"}
        </button>
      </form>
    </main>
  );
}
