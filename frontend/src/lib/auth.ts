// 인증 헬퍼 — 쿠키 기반 세션 관리
import { cookies } from "next/headers";
import { getUser, User } from "./db";

const SESSION_COOKIE = "4exam_session";

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return getUser(sessionId) ?? null;
}

export async function requireSession(): Promise<User> {
  const user = await getSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireSession();
  if (user.role !== "admin" && user.role !== "teacher") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return Response.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return Response.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }
  }
  return Response.json({ error: "서버 오류" }, { status: 500 });
}

export { SESSION_COOKIE };
