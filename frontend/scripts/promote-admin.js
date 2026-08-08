const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(__dirname, "..", "data", "4exam.db"));
db.prepare("UPDATE users SET role='admin' WHERE nickname='테스트교사'").run();
const users = db.prepare("SELECT id, nickname, role FROM users").all();
console.log(JSON.stringify(users, null, 2));
db.close();
