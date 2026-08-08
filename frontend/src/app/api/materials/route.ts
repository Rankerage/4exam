// POST /api/materials — 관리자 인증 필요, 시험자료 등록
// GET /api/materials — 학교별 자료 조회 (공개)
import { requireAdmin, authErrorResponse } from "@/lib/auth";
import { addMaterial, getMaterials } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolId = url.searchParams.get("schoolId");
  if (!schoolId) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }
  const type = url.searchParams.get("type") || undefined;
  return Response.json(getMaterials(schoolId, type));
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return authErrorResponse(e);
  }

  const body = await req.json();
  const { schoolId, title, type, description, year, semester } = body;

  if (!schoolId || !title || !type) {
    return Response.json({ error: "schoolId, title, type는 필수 항목입니다" }, { status: 400 });
  }

  const id = addMaterial({
    schoolId,
    title,
    type,
    description,
    year,
    semester,
  });

  return Response.json({ ok: true, id });
}
