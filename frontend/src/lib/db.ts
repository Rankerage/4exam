// 학교·시험자료 DB (SQLite → PostgreSQL 마이그레이션 가능)
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "4exam.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema();
  }
  return db;
}

function initSchema() {
  const d = getDb();
  d.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT,
      textbook_publisher TEXT,
      lunch_api_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE TABLE IF NOT EXISTS exam_materials (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      subject_id TEXT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      year INTEGER,
      semester TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE TABLE IF NOT EXISTS lunch_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id TEXT NOT NULL,
      date TEXT NOT NULL,
      menu TEXT,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      nickname TEXT,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 샘플 학교 데이터
    INSERT OR IGNORE INTO schools (id, name, region, type, address, textbook_publisher) VALUES
      ('school-001', '서울중학교', '서울', '중학교', '서울특별시 강남구', '비상교육'),
      ('school-002', '부산고등학교', '부산', '고등학교', '부산광역시 해운대구', '미래엔'),
      ('school-003', '대구중학교', '대구', '중학교', '대구광역시 수성구', '천재교육'),
      ('school-004', '광주고등학교', '광주', '고등학교', '광주광역시 북구', '비상교육'),
      ('school-005', '대전중학교', '대전', '중학교', '대전광역시 유성구', '지학사'),
      ('school-006', '세종고등학교', '세종', '고등학교', '세종특별자치시', '미래엔'),
      ('school-007', '경기중학교', '경기', '중학교', '경기도 수원시', '천재교육'),
      ('school-008', '인천고등학교', '인천', '고등학교', '인천광역시 연수구', '비상교육');
  `);
}

export function searchSchools(query: string) {
  const d = getDb();
  return d.prepare(
    "SELECT * FROM schools WHERE name LIKE ? OR region LIKE ? OR address LIKE ? LIMIT 15"
  ).all(`%${query}%`, `%${query}%`, `%${query}%`);
}

export function getSchool(id: string) {
  const d = getDb();
  return d.prepare("SELECT * FROM schools WHERE id = ?").get(id);
}

export function getMaterials(schoolId: string, type?: string) {
  const d = getDb();
  // 모든 학교 공통자료 + 학교 전용 자료
  if (type) {
    return d.prepare(
      "SELECT * FROM exam_materials WHERE (school_id = ? OR school_id = 'ALL') AND type = ? ORDER BY created_at DESC LIMIT 20"
    ).all(schoolId, type);
  }
  return d.prepare(
    "SELECT * FROM exam_materials WHERE school_id = ? OR school_id = 'ALL' ORDER BY created_at DESC LIMIT 30"
  ).all(schoolId);
}

export function addMaterial(data: { schoolId: string; subjectId?: string; title: string; type: string; description?: string; fileUrl?: string; year?: number; semester?: string }) {
  const d = getDb();
  const id = `mat-${Date.now()}`;
  d.prepare(
    "INSERT INTO exam_materials (id, school_id, subject_id, title, type, description, file_url, year, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, data.schoolId, data.subjectId || null, data.title, data.type, data.description || null, data.fileUrl || null, data.year || null, data.semester || null);
  return id;
}

// ── 사용자 인증 ──
export interface User {
  id: string;
  school_id: string | null;
  nickname: string | null;
  role: string;
  created_at: string;
}

export function createUser(schoolId: string, nickname: string, role: string = "student"): User {
  const d = getDb();
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  d.prepare(
    "INSERT INTO users (id, school_id, nickname, role) VALUES (?, ?, ?, ?)"
  ).run(id, schoolId, nickname, role);
  return getUser(id)!;
}

export function getUser(id: string): User | undefined {
  const d = getDb();
  return d.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getUserBySchoolAndNickname(schoolId: string, nickname: string): User | undefined {
  const d = getDb();
  return d.prepare(
    "SELECT * FROM users WHERE school_id = ? AND nickname = ? LIMIT 1"
  ).get(schoolId, nickname) as User | undefined;
}

export function getAllSchools() {
  const d = getDb();
  return d.prepare("SELECT * FROM schools ORDER BY name").all();
}
