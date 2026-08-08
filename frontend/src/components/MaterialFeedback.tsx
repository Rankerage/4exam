"use client";

import { useState, useEffect } from "react";
import { getNickname } from "@/lib/nickname";

export function MaterialFeedback({ materialId }: { materialId: string }) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [voted, setVoted] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const nickname = getNickname() || "익명";

  useEffect(() => {
    fetch(`/api/comments?materialId=${materialId}`)
      .then(r => r.json())
      .then(d => {
        setLikes(d.likes || 0);
        setDislikes(d.dislikes || 0);
        setComments(d.comments || []);
      });
  }, [materialId]);

  const handleVote = async (type: string) => {
    if (voted) return;
    setVoted(type);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", materialId, voteType: type }),
    });
    const d = await res.json();
    setLikes(d.likes);
    setDislikes(d.dislikes);
  };

  const handleComment = async () => {
    if (!commentText.trim() || loading) return;
    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment", materialId,
        content: commentText,
        nickname: nickname.trim() || "익명",
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setComments([{ id: d.id, nickname: nickname.trim() || "익명", content: commentText, created_at: new Date().toISOString() }, ...comments]);
      setCommentText("");
    }
    setLoading(false);
  };

  return (
    <div className="mt-2 space-y-2">
      {/* 좋아요/싫어요 버튼 */}
      <div className="flex items-center gap-3">
        <button onClick={() => handleVote("like")}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
            voted === "like" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-100"
          }`}>
          👍 {likes}
        </button>
        <button onClick={() => handleVote("dislike")}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
            voted === "dislike" ? "bg-red-50 text-red-600" : "text-gray-400 hover:bg-gray-100"
          }`}>
          👎 {dislikes}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-gray-400 hover:bg-gray-100">
          💬 {comments.length}
        </button>
      </div>

      {/* 댓글 영역 */}
      {showComments && (
        <div className="border-t border-gray-100 pt-2 space-y-2">
          {/* 댓글 입력 */}
          <div className="flex gap-2">
            <span className="text-xs text-gray-400 self-center shrink-0">{nickname}</span>
            <input
              type="text" value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="한줄 평 남기기..."
              className="flex-1 text-xs px-3 py-1 border border-gray-200 rounded-lg focus:border-[#A31F34] outline-none"
              onKeyDown={e => e.key === "Enter" && handleComment()}
              maxLength={200}
            />
            <button onClick={handleComment} disabled={loading}
              className="text-xs px-3 py-1 bg-[#A31F34] text-white rounded-lg hover:bg-[#8B1A2C] disabled:opacity-50">
              등록
            </button>
          </div>

          {/* 댓글 목록 */}
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2 text-xs">
              <span className="font-medium text-gray-500 shrink-0">{c.nickname}</span>
              <span className="text-gray-600">{c.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
