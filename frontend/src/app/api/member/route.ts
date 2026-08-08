// 회원 API - 이메일만으로 초경량 가입/로그인
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "4exam.db");

export async function POST(req: Request) {
  const { email, schoolId, action } = await req.json();
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  const db = new Database(DB_PATH);

  if (action === "register" || action === "login") {
    let member = db.prepare("SELECT * FROM members WHERE email = ?").get(email);
    
    if (!member) {
      // 신규 가입
      db.prepare("INSERT INTO members (email, school_id) VALUES (?, ?)").run(email, schoolId || null);
      db.close();
      return Response.json({ ok: true, new: true, schoolId: schoolId || null });
    }
    
    if (schoolId) {
      // 학교 변경
      db.prepare("UPDATE members SET school_id = ?, last_login = CURRENT_TIMESTAMP WHERE email = ?").run(schoolId, email);
    } else {
      db.prepare("UPDATE members SET last_login = CURRENT_TIMESTAMP WHERE email = ?").run(email);
    }
    
    db.close();
    return Response.json({ ok: true, new: false, schoolId: member.school_id || schoolId });
  }

  if (action === "me") {
    const member = db.prepare("SELECT * FROM members WHERE email = ?").get(email);
    db.close();
    if (!member) return Response.json({ found: false });
    return Response.json({ found: true, email: member.email, schoolId: member.school_id });
  }

  db.close();
  return Response.json({ error: "invalid action" }, { status: 400 });
}
