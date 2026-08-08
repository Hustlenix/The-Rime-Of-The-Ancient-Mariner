const express = require('express');
const db = require('../db');

const contentRouter = express.Router();
const questionsRouter = express.Router();

const VALID_CATEGORIES = ['summary', 'theme', 'device', 'short', 'long'];

contentRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, category, prompt, answer, notes FROM questions WHERE category IN ('summary','theme','device') ORDER BY category, sort_order"
    )
    .all();
  res.json({
    summaries: rows.filter((r) => r.category === 'summary'),
    themes: rows.filter((r) => r.category === 'theme'),
    devices: rows.filter((r) => r.category === 'device')
  });
});

contentRouter.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const like = `%${q.toLowerCase()}%`;
  const rows = db
    .prepare(
      `SELECT id, category, prompt, answer, notes FROM questions
       WHERE lower(prompt) LIKE ? OR lower(answer) LIKE ? OR (notes IS NOT NULL AND lower(notes) LIKE ?)`
    )
    .all(like, like, like);
  res.json({ results: rows });
});

questionsRouter.get('/', (req, res) => {
  const { category } = req.query;
  if (category) {
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const rows = db
      .prepare('SELECT id, category, prompt, answer, notes FROM questions WHERE category = ? ORDER BY sort_order, id')
      .all(category);
    return res.json({ questions: rows });
  }
  const rows = db
    .prepare('SELECT id, category, prompt, answer, notes FROM questions ORDER BY category, sort_order, id')
    .all();
  res.json({ questions: rows });
});

module.exports = { contentRouter, questionsRouter };
