import { NextResponse } from "next/server";
import { searchSchools, getSchool, getMaterials, addMaterial } from "@/lib/db";
import Database from "better-sqlite3";
import path from "path";

function getEnglishAdoption(schoolId: string) {
  try {
    const db = new Database(path.join(process.cwd(), "data", "4exam.db"));
    const row = db.prepare(
      "SELECT publisher, source FROM english_adoptions WHERE school_id = ?"
    ).get(schoolId);
    db.close();
    return row || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "search") {
    const q = url.searchParams.get("q") || "";
    const schools = searchSchools(q);
    return NextResponse.json(schools);
  }

  if (action === "school") {
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const school = getSchool(id);
    if (!school) return NextResponse.json({ error: "not found" }, { status: 404 });
    // 영어 교과서 정보 추가
    const eng = getEnglishAdoption(id);
    return NextResponse.json({ ...school, english_publisher: eng?.publisher || null });
  }

  if (action === "materials") {
    const schoolId = url.searchParams.get("schoolId");
    const type = url.searchParams.get("type") || undefined;
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    const mats = getMaterials(schoolId, type);
    return NextResponse.json(mats);
  }

  return NextResponse.json({ actions: ["search", "school", "materials"] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const id = addMaterial(body);
  return NextResponse.json({ ok: true, id });
}
