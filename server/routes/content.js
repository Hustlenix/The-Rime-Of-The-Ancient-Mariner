const express = require('express');
const db = require('../db');
const { DEFAULT_UNIT_ID, resolveUnitFilter } = require('./helpers');

const contentRouter = express.Router();
const questionsRouter = express.Router();

const VALID_CATEGORIES = ['summary', 'theme', 'device', 'character', 'value', 'analysis', 'short', 'long'];

function pickUnit(req, res) {
  // unit_id optional — defaults to the first unit of the Literature Reader;
  // unit= is accepted as an alias.
  const raw = req.query.unit_id || req.query.unit || null;
  if (raw == null) return DEFAULT_UNIT_ID;
  const resolved = resolveUnitFilter(req, res);
  if (resolved === undefined) return null;
  return resolved;
}

contentRouter.get('/', (req, res) => {
  const unitId = pickUnit(req, res);
  if (unitId === null) return;
  const rows = db
    .prepare(
      `SELECT id, category, prompt, answer, notes FROM questions
       WHERE unit_id = ? AND category IN ('summary','theme','device','character','value','analysis')
       ORDER BY category, sort_order`
    )
    .all(unitId);
  res.json({
    unitId,
    summaries: rows.filter((r) => r.category === 'summary'),
    themes: rows.filter((r) => r.category === 'theme'),
    devices: rows.filter((r) => r.category === 'device'),
    characters: rows.filter((r) => r.category === 'character'),
    values: rows.filter((r) => r.category === 'value'),
    analysis: rows.filter((r) => r.category === 'analysis')
  });
});

contentRouter.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const like = `%${q.toLowerCase()}%`;
  const unitId = resolveUnitFilter(req, res);
  if (unitId === undefined) return;

  const rows = unitId
    ? db
        .prepare(
          `SELECT q.id, q.unit_id AS unitId, u.title AS unitTitle, q.category, q.prompt, q.answer, q.notes
           FROM questions q JOIN units u ON u.id = q.unit_id
           WHERE q.unit_id = ? AND (lower(q.prompt) LIKE ? OR lower(q.answer) LIKE ? OR (q.notes IS NOT NULL AND lower(q.notes) LIKE ?))`
        )
        .all(unitId, like, like, like)
    : db
        .prepare(
          `SELECT q.id, q.unit_id AS unitId, u.title AS unitTitle, q.category, q.prompt, q.answer, q.notes
           FROM questions q JOIN units u ON u.id = q.unit_id
           WHERE lower(q.prompt) LIKE ? OR lower(q.answer) LIKE ? OR (q.notes IS NOT NULL AND lower(q.notes) LIKE ?)`
        )
        .all(like, like, like);
  res.json({ results: rows });
});

questionsRouter.get('/', (req, res) => {
  const { category } = req.query;
  const unitId = pickUnit(req, res);
  if (unitId === null) return;

  const where = ['unit_id = ?'];
  const params = [unitId];
  if (category) {
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    where.push('category = ?');
    params.push(category);
  }
  const rows = db
    .prepare(
      `SELECT id, category, prompt, answer, notes FROM questions WHERE ${where.join(' AND ')} ORDER BY category, sort_order, id`
    )
    .all(...params);
  res.json({ questions: rows });
});

module.exports = { contentRouter, questionsRouter };
