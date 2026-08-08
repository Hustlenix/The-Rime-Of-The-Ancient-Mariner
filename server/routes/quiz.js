const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

router.get('/questions', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const rows = db
    .prepare('SELECT id, question, options, explanation, topic FROM quiz_questions ORDER BY RANDOM() LIMIT ?')
    .all(limit);
  res.json({ questions: rows.map((r) => ({ ...r, options: JSON.parse(r.options) })) });
});

router.post('/attempts', requireAuth, (req, res) => {
  const { score, total } = req.body || {};
  if (
    !Number.isInteger(score) ||
    !Number.isInteger(total) ||
    total <= 0 ||
    score < 0 ||
    score > total
  ) {
    return res.status(400).json({ error: 'score and total must be valid integers' });
  }
  const info = db
    .prepare('INSERT INTO quiz_attempts (user_id, score, total) VALUES (?, ?, ?)')
    .run(req.user.id, score, total);
  const attempt = db.prepare('SELECT id, score, total, created_at FROM quiz_attempts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ attempt });
});

router.get('/attempts', requireAuth, (req, res) => {
  const attempts = db
    .prepare('SELECT id, score, total, created_at FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user.id);
  res.json({ attempts });
});

module.exports = router;
