export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 max-w-lg mx-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          4exam.study
        </h1>
        <h2 className="text-lg md:text-xl text-white/70 font-light mb-8">
          전국 학교별 맞춤 시험자료
        </h2>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {["무료", "학교인증", "교과서별"].map((tag) => (
            <span key={tag} className="px-5 py-2 bg-white/15 rounded-full text-white/90 text-sm">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["AI 예상문제", "급식메뉴", "기출문제"].map((tag) => (
            <span key={tag} className="px-5 py-2 bg-white/15 rounded-full text-white/90 text-sm">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-white/40 text-sm mt-12">🚀 2026년 오픈 예정</p>
      </div>
    </main>
  );
}
