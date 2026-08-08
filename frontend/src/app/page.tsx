import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readFileSync } from "fs";
import path from "path";
import HomeClient from "./HomeClient";

export default async function Home() {
  const heads = await headers();
  const host = heads.get("host") || "";
  
  // 서브도메인 접근 → 학교 페이지로 리디렉트
  if (host && host.includes("4exam.study") && host !== "4exam.study" && !host.startsWith("www.")) {
    const parts = host.replace(".4exam.study", "").split(".");
    const schoolCode = parts[0].toLowerCase();
    
    try {
      const jsonPath = path.join(process.cwd(), "public", "school-codes.json");
      const mapping = JSON.parse(readFileSync(jsonPath, "utf-8"));
      
      for (const key of [parts.join("."), schoolCode]) {
        if (mapping[key]) {
          redirect(`/school/${mapping[key].id}`);
        }
      }
      
      for (const [code, info] of Object.entries(mapping) as [string, any][]) {
        if (info.name?.includes(schoolCode) || code.includes(schoolCode)) {
          redirect(`/school/${info.id}`);
        }
      }
    } catch {}
  }

  return <HomeClient />;
}
