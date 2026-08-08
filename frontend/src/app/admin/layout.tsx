// /admin 레이아웃 — 서버 컴포넌트에서 쿠키 기반 인증 검사
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    redirect("/login");
  }

  const user = getUser(sessionId);
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-light tracking-tight">4exam.study</Link>
            <span className="text-xs px-2 py-0.5 bg-[#A31F34] text-white rounded">관리자</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{user.nickname}님</span>
            <form action={async () => {
              "use server";
              const cookieStore = await cookies();
              cookieStore.delete(SESSION_COOKIE);
              redirect("/login");
            }}>
              <button type="submit" className="text-gray-400 hover:text-[#A31F34] transition-colors">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
