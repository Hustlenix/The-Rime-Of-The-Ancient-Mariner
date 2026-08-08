const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { units, content, quizQuestions } = require('./seedCatalog');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

// Schema versioning for the CONTENT tables (users / attempts / progress are
// user data and are never wiped). When the content schema or the seed catalog
// changes, the content tables are rebuilt from the catalog so a stale
// data.db can never break startup.
const CONTENT_SCHEMA_VERSION = 2;

db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS flashcard_progress (
    user_id INTEGER NOT NULL REFERENCES users(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    known INTEGER NOT NULL DEFAULT 0,
    last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, question_id)
  );
`);

// ---- Content tables (versioned) ----

function createContentTables() {
  db.exec(`
    DROP TABLE IF EXISTS questions;
    DROP TABLE IF EXISTS quiz_questions;
    DROP TABLE IF EXISTS units;

    CREATE TABLE units (
      id TEXT PRIMARY KEY,
      book TEXT NOT NULL CHECK (book IN ('first-flight','footprints')),
      type TEXT NOT NULL CHECK (type IN ('prose','poem','play')),
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id TEXT NOT NULL REFERENCES units(id),
      category TEXT NOT NULL CHECK (category IN ('summary','theme','device','character','value','analysis','short','long')),
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id TEXT NOT NULL REFERENCES units(id),
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT ''
    );
  `);
}

const seedFingerprint = crypto
  .createHash('sha256')
  .update(JSON.stringify({ units, content, quizQuestions }))
  .digest('hex')
  .slice(0, 16);

function reseedContent() {
  createContentTables();
  // Question ids are assigned in catalog order, but a catalog change can shift
  // them; stale flashcard progress must not silently point at other questions.
  db.prepare('DELETE FROM flashcard_progress').run();
  db.prepare(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)'
  ).run('content_schema_version', String(CONTENT_SCHEMA_VERSION));
  db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('seed_fingerprint', seedFingerprint);

  const insertUnit = db.prepare(
    'INSERT INTO units (id, book, type, title, author, position) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const u of units) insertUnit.run(u.id, u.book, u.type, u.title, u.author || '', u.order || 0);

  const insertContent = db.prepare(
    'INSERT INTO questions (unit_id, category, prompt, answer, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertQuiz = db.prepare(
    'INSERT INTO quiz_questions (unit_id, question, options, correct_index, explanation, topic) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const tx = db.transaction(() => {
    for (const row of content) {
      insertContent.run(row.unitId, row.category, row.prompt, row.answer, row.notes, row.sortOrder);
    }
    for (const q of quizQuestions) {
      insertQuiz.run(q.unitId, q.question, JSON.stringify(q.options), q.correct_index, q.explanation, q.topic);
    }
  });
  tx();
}

function seed() {
  const schemaRow = db.prepare("SELECT value FROM meta WHERE key = 'content_schema_version'").get();
  const oldSchema = schemaRow ? Number(schemaRow.value) : 0;
  const hasUnits = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='units'").get();

  if (!hasUnits || oldSchema < CONTENT_SCHEMA_VERSION || db.prepare('SELECT COUNT(*) AS c FROM units').get().c === 0) {
    // Stale or empty content — rebuild from the catalog. User tables survive.
    reseedContent();
  } else {
    const fp = db.prepare("SELECT value FROM meta WHERE key = 'seed_fingerprint'").get();
    if (!fp || fp.value !== seedFingerprint) {
      reseedContent();
    }
  }

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const insert = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    insert.run('Teacher', 'teacher@tals.edu', bcrypt.hashSync('teacher123', 10), 'teacher');
    insert.run('Student', 'student@tals.edu', bcrypt.hashSync('student123', 10), 'student');
  }
}

seed();

module.exports = db;
