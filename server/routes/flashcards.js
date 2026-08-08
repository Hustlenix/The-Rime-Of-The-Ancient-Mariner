const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

router.get('/progress', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT question_id, known FROM flashcard_progress WHERE user_id = ?')
    .all(req.user.id);
  const progress = {};
  for (const r of rows) progress[r.question_id] = r.known;
  res.json({ progress });
});

router.post('/:questionId/known', requireAuth, (req, res) => {
  const questionId = parseInt(req.params.questionId, 10);
  const { known } = req.body || {};
  if (!Number.isInteger(questionId)) {
    return res.status(400).json({ error: 'Invalid question id' });
  }
  if (known !== 0 && known !== 1 && known !== true && known !== false) {
    return res.status(400).json({ error: 'known must be a boolean' });
  }
  const question = db.prepare('SELECT id FROM questions WHERE id = ?').get(questionId);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  db.prepare(
    `INSERT INTO flashcard_progress (user_id, question_id, known, last_seen) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, question_id) DO UPDATE SET known = excluded.known, last_seen = excluded.last_seen`
  ).run(req.user.id, questionId, known ? 1 : 0);
  res.json({ success: true });
});

module.exports = router;
