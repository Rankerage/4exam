// GET /api/auth/me — 현재 로그인 사용자 정보
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return Response.json({ user: null });
  }
  return Response.json({
    user: { id: user.id, nickname: user.nickname, role: user.role, school_id: user.school_id },
  });
}
