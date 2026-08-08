const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const seedData = require('./seedData');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL CHECK (category IN ('summary','theme','device','short','long')),
    prompt TEXT NOT NULL,
    answer TEXT NOT NULL,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT ''
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

function seed() {
  const questionCount = db.prepare('SELECT COUNT(*) AS c FROM questions').get().c;
  if (questionCount === 0) {
    const insert = db.prepare(
      'INSERT INTO questions (category, prompt, answer, notes, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const tx = db.transaction((items) => {
      for (const it of items) {
        insert.run(it.category, it.prompt, it.answer, it.notes || null, it.sort_order || 0);
      }
    });
    tx(seedData.questions);
  }

  const quizCount = db.prepare('SELECT COUNT(*) AS c FROM quiz_questions').get().c;
  if (quizCount === 0) {
    const insert = db.prepare(
      'INSERT INTO quiz_questions (question, options, correct_index, explanation, topic) VALUES (?, ?, ?, ?, ?)'
    );
    const tx = db.transaction((items) => {
      for (const it of items) {
        insert.run(it.question, JSON.stringify(it.options), it.correct_index, it.explanation, it.topic || '');
      }
    });
    tx(seedData.quizQuestions);
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
