"use client";

import { useState, useEffect } from "react";

// 닉네임 관리 (localStorage 기반, 서버 인증 없음)
export function getNickname(): string {
  if (typeof window === "undefined") return "익명";
  return localStorage.getItem("4exam_nickname") || "";
}

export function setNickname(name: string) {
  localStorage.setItem("4exam_nickname", name);
}

// 닉네임이 없으면 입력 받는 모달
export function NicknamePrompt({ onDone }: { onDone?: () => void }) {
  const [name, setName] = useState(getNickname());
  const [show, setShow] = useState(!name);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      setNickname(trimmed);
      setShow(false);
      onDone?.();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <p className="text-2xl mb-2">👋</p>
        <h2 className="text-lg font-bold mb-2">닉네임을 정해주세요</h2>
        <p className="text-sm text-gray-400 mb-6">댓글과 좋아요에 표시됩니다</p>
        <input
          type="text" value={name}
          onChange={e => setName(e.target.value)}
          placeholder="사용할 이름 (2자 이상)"
          className="w-full text-center text-lg py-3 border-b-2 border-gray-200 focus:border-[#A31F34] outline-none bg-transparent mb-4"
          maxLength={12}
          autoFocus
          onKeyDown={e => e.key === "Enter" && handleSave()}
        />
        <button onClick={handleSave}
          disabled={name.trim().length < 2}
          className="w-full py-3 bg-[#A31F34] text-white font-medium rounded-xl hover:bg-[#8B1A2C] disabled:opacity-30 transition-colors">
          확인
        </button>
      </div>
    </div>
  );
}

// 닉네임을 사용하는 훅
export function useNickname() {
  const [nickname, setNick] = useState("");
  
  useEffect(() => {
    setNick(getNickname());
  }, []);

  const update = (name: string) => {
    setNickname(name);
    setNick(name);
  };

  return { nickname: nickname || "", update };
}
