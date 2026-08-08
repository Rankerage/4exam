// 광고 플레이스홀더 컴포넌트
export function AdBanner({ type = "horizontal" }: { type?: "horizontal" | "square" | "text" }) {
  if (type === "text") {
    return (
      <div className="text-center py-3 px-4 text-xs text-gray-300 border-t border-gray-100">
        <span>Advertisement</span>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
      <div className={`flex items-center justify-center ${type === "square" ? "aspect-square" : "h-24 md:h-28"}`}>
        <span className="text-gray-300 text-sm">광고 영역</span>
      </div>
      <span className="absolute top-2 right-3 text-[10px] text-gray-300">Ad</span>
    </div>
  );
}

// 콘텐츠 사이 인라인 광고
export function InlineAd() {
  return (
    <div className="my-12 py-8 border-t border-b border-gray-100">
      <p className="text-[10px] uppercase tracking-[.2em] text-gray-300 text-center mb-6">Sponsored</p>
      <div className="h-20 bg-gray-50 flex items-center justify-center">
        <span className="text-gray-300 text-xs">광고</span>
      </div>
    </div>
  );
}

// 학교 페이지 전용 광고 (급식 옆)
export function SchoolPageAd() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 max-w-xs border border-dashed border-gray-200">
      <p className="text-xs text-gray-400 mb-2">Sponsored</p>
      <div className="h-20 bg-gray-50 rounded-xl flex items-center justify-center">
        <span className="text-gray-300 text-xs">광고</span>
      </div>
    </div>
  );
}
