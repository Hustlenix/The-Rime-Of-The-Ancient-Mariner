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
const CONTENT_SCHEMA_VERSION = 3;

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

  -- ---- Teacher tools: question-paper builder (persistent, never wiped) ----

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('school_bank','pyq','sample_paper','question_bank','teacher_upload')),
    subject TEXT NOT NULL DEFAULT 'english_literature',
    grade TEXT NOT NULL DEFAULT 'class_x',
    description TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id),
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bank_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER REFERENCES resources(id),
    created_by INTEGER REFERENCES users(id),
    chapter TEXT NOT NULL REFERENCES units(id),
    topic TEXT NOT NULL DEFAULT '',
    difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    type TEXT NOT NULL CHECK (type IN ('mcq','short','long','extract')),
    marks INTEGER NOT NULL DEFAULT 1,
    year INTEGER,
    question TEXT NOT NULL,
    answer TEXT,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_bank_chapter ON bank_questions(chapter);
  CREATE INDEX IF NOT EXISTS idx_bank_resource ON bank_questions(resource_id);
  CREATE INDEX IF NOT EXISTS idx_bank_owner ON bank_questions(created_by);

  CREATE TABLE IF NOT EXISTS paper_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id),
    is_system INTEGER NOT NULL DEFAULT 0,
    structure TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    subject TEXT NOT NULL DEFAULT 'english_literature',
    grade TEXT NOT NULL DEFAULT 'class_x',
    exam_type TEXT NOT NULL DEFAULT 'unit_test',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    instructions TEXT NOT NULL DEFAULT '',
    header TEXT NOT NULL DEFAULT '{}',
    structure TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','printed')),
    total_marks INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_papers_created_by ON papers(created_by);
  CREATE INDEX IF NOT EXISTS idx_papers_status ON papers(status);

  CREATE TABLE IF NOT EXISTS paper_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    section_index INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    bank_question_id INTEGER REFERENCES bank_questions(id),
    is_custom INTEGER NOT NULL DEFAULT 0,
    question TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    chapter TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    difficulty INTEGER NOT NULL DEFAULT 3,
    type TEXT NOT NULL DEFAULT 'short',
    answer TEXT,
    source_name TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_paper_questions_paper ON paper_questions(paper_id);
`);

// ---- Content tables (versioned) ----

function createContentTables() {
  db.exec(`
    DROP TABLE IF EXISTS questions;
    DROP TABLE IF EXISTS quiz_questions;
    DROP TABLE IF EXISTS units;

    CREATE TABLE units (
      id TEXT PRIMARY KEY,
      book TEXT NOT NULL CHECK (book IN ('literature-reader')),
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

// ---- Teacher tools: question bank + paper templates ----

const SYSTEM_TEMPLATES = [
  {
    name: 'CBSE-style Literature Paper',
    description: 'Extract, short and long answers drawn from the book units (29 marks).',
    structure: [
      { label: 'Section A — Extract-based', count: 4, marks: 1, type: 'extract', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null },
      { label: 'Section B — Short Answers', count: 5, marks: 2, type: 'short', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null },
      { label: 'Section C — Long Answers', count: 3, marks: 5, type: 'long', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null }
    ]
  },
  {
    name: 'Unit Test (20 marks)',
    description: 'A compact single-chapter or mixed-chapter test.',
    structure: [
      { label: 'Section A — MCQs', count: 4, marks: 1, type: 'mcq', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null },
      { label: 'Section B — Short Answers', count: 3, marks: 2, type: 'short', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null },
      { label: 'Section C — Long Answers', count: 2, marks: 5, type: 'long', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null }
    ]
  },
  {
    name: 'Half-Yearly Literature Paper (40 marks)',
    description: 'A longer paper across all units with heavier short-answer weighting.',
    structure: [
      { label: 'Section A — MCQs', count: 8, marks: 1, type: 'mcq', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null },
      { label: 'Section B — Short Answers', count: 6, marks: 2, type: 'short', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null },
      { label: 'Section C — Long Answers', count: 4, marks: 5, type: 'long', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null }
    ]
  }
];

function seedTeacherData() {
  let school = db.prepare("SELECT id FROM resources WHERE type = 'school_bank'").get();
  if (!school) {
    const info = db
      .prepare("INSERT INTO resources (name, type, description, created_by, is_system) VALUES (?, 'school_bank', ?, NULL, 1)")
      .run('School Question Bank', 'Question bank built from the portal study content (Class X Literature Reader).');
    school = { id: info.lastInsertRowid };
  }
  const schoolId = school.id;

  // The school bank mirrors the content catalog; when the catalog changes the
  // mirrored rows are rebuilt (teacher-created rows in other resources and in
  // personal banks are never touched).
  const bankFp = crypto
    .createHash('sha256')
    .update(JSON.stringify({ content, quizQuestions }))
    .digest('hex')
    .slice(0, 16);
  const meta = db.prepare("SELECT value FROM meta WHERE key = 'bank_seed_fingerprint'").get();
  if (!meta || meta.value !== bankFp) {
    db.prepare('DELETE FROM bank_questions WHERE resource_id = ?').run(schoolId);
    const insert = db.prepare(
      `INSERT INTO bank_questions (resource_id, created_by, chapter, topic, difficulty, type, marks, year, question, answer)
       VALUES (?, NULL, ?, ?, 3, ?, ?, NULL, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const row of content) {
        if (row.category !== 'short' && row.category !== 'long') continue;
        insert.run(schoolId, row.unitId, '', row.category, row.category === 'short' ? 2 : 5, row.prompt, row.answer);
      }
      for (const q of quizQuestions) {
        insert.run(schoolId, q.unitId, q.topic || '', 'mcq', 1, q.question, null);
      }
    });
    tx();
    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('bank_seed_fingerprint', bankFp);
  }

  const tplCount = db.prepare('SELECT COUNT(*) AS c FROM paper_templates WHERE is_system = 1').get().c;
  if (tplCount === 0) {
    const insertTpl = db.prepare(
      'INSERT INTO paper_templates (name, description, created_by, is_system, structure) VALUES (?, ?, NULL, 1, ?)'
    );
    const tx = db.transaction(() => {
      for (const t of SYSTEM_TEMPLATES) insertTpl.run(t.name, t.description, JSON.stringify(t.structure));
    });
    tx();
  }
}

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

  seedTeacherData();
}

seed();

module.exports = db;
