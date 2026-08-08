import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// school-codes.json은 public/에 있고, 빌드 시 정적 파일로 제공됨
// Edge Runtime에서는 fetch로 가져옴
let codesCache: Record<string, { id: string; name: string; type: string }> | null = null;

async function getSchoolCodes() {
  if (codesCache) return codesCache;
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://4exam.study";
    const res = await fetch(`${base}/school-codes.json`);
    codesCache = await res.json();
    return codesCache || {};
  } catch {
    return {};
  }
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase();

  // 4exam.study 또는 www 제외
  if (!host.includes("4exam.study") || host === "4exam.study" || host.startsWith("www.")) {
    return NextResponse.next();
  }

  // 서브도메인 파싱
  const parts = host.replace(".4exam.study", "").split(".");
  
  // 검색 키 생성
  const codes = await getSchoolCodes();
  
  // 정확한 매칭 (school.m 또는 school)
  for (const key of [parts.join("."), parts[0]]) {
    if (codes[key]) {
      const url = request.nextUrl.clone();
      url.pathname = `/school/${codes[key].id}`;
      return NextResponse.rewrite(url);
    }
  }

  // 부분 매칭 (학교명으로 검색)
  for (const [code, info] of Object.entries(codes)) {
    if (info.name.includes(parts[0]) || code.includes(parts[0])) {
      const url = request.nextUrl.clone();
      url.pathname = `/school/${info.id}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|school-codes.json).*)"],
};
