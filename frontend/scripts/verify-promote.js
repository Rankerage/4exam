const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(process.cwd(), "data", "4exam.db"));
const rows = db.prepare("SELECT id, nickname FROM users WHERE nickname LIKE ?").all("%검증%");
if (rows.length > 0) {
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(rows[0].id);
  console.log("promoted", rows[0].nickname, "to admin");
} else {
  console.log("no matching user found");
}
db.close();
