import { NextResponse } from "next/server";
import { searchSchools, getSchool, getMaterials, addMaterial } from "@/lib/db";

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
    return NextResponse.json(school);
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
