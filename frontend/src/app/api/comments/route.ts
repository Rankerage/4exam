// 댓글 + 좋아요 API
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "4exam.db");

function getDb() {
  return new Database(DB_PATH);
}

// GET: 댓글 목록 + 투표 수
export async function GET(req: Request) {
  const url = new URL(req.url);
  const materialId = url.searchParams.get("materialId");
  if (!materialId) return Response.json({ error: "materialId required" }, { status: 400 });

  const db = getDb();
  
  const comments = db.prepare(
    "SELECT id, nickname, content, created_at FROM comments WHERE material_id = ? ORDER BY created_at DESC"
  ).all(materialId);

  const likes = db.prepare(
    "SELECT COUNT(*) as cnt FROM material_votes WHERE material_id = ? AND vote_type = 'like'"
  ).get(materialId);

  const dislikes = db.prepare(
    "SELECT COUNT(*) as cnt FROM material_votes WHERE material_id = ? AND vote_type = 'dislike'"
  ).get(materialId);

  db.close();
  
  return Response.json({
    comments,
    likes: likes.cnt || 0,
    dislikes: dislikes.cnt || 0,
  });
}

// POST: 댓글 작성 OR 투표
export async function POST(req: Request) {
  const body = await req.json();
  const { action, materialId, content, nickname, voteType } = body;
  const db = getDb();

  if (action === "comment") {
    if (!materialId || !content) {
      db.close();
      return Response.json({ error: "materialId and content required" }, { status: 400 });
    }
    const result = db.prepare(
      "INSERT INTO comments (material_id, nickname, content) VALUES (?, ?, ?)"
    ).run(materialId, nickname || "익명", content);
    db.close();
    return Response.json({ ok: true, id: result.lastInsertRowid });
  }

  if (action === "vote") {
    if (!materialId || !voteType) {
      db.close();
      return Response.json({ error: "materialId and voteType required" }, { status: 400 });
    }
    db.prepare(
      "INSERT INTO material_votes (material_id, vote_type) VALUES (?, ?)"
    ).run(materialId, voteType);

    const likes = db.prepare(
      "SELECT COUNT(*) as cnt FROM material_votes WHERE material_id = ? AND vote_type = 'like'"
    ).get(materialId);
    const dislikes = db.prepare(
      "SELECT COUNT(*) as cnt FROM material_votes WHERE material_id = ? AND vote_type = 'dislike'"
    ).get(materialId);

    db.close();
    return Response.json({ ok: true, likes: likes.cnt, dislikes: dislikes.cnt });
  }

  db.close();
  return Response.json({ error: "invalid action" }, { status: 400 });
}
