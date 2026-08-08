// POST /api/auth/login — 학교 선택 + 닉네임 입력으로 로그인
import { cookies } from "next/headers";
import { createUser, getUserBySchoolAndNickname } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { schoolId, nickname } = await req.json();

  if (!schoolId || !nickname) {
    return Response.json({ error: "학교와 닉네임을 입력해주세요" }, { status: 400 });
  }

  const trimmed = nickname.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    return Response.json({ error: "닉네임은 1~20자로 입력해주세요" }, { status: 400 });
  }

  // 기존 사용자 있으면 재사용, 없으면 새로 생성
  let user = getUserBySchoolAndNickname(schoolId, trimmed);
  if (!user) {
    user = createUser(schoolId, trimmed);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: false, // 개발환경 HTTP
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: "/",
  });

  return Response.json({ ok: true, user: { id: user.id, nickname: user.nickname, role: user.role } });
}
