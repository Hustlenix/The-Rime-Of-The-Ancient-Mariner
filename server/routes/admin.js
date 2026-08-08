const express = require('express');
const db = require('../db');
const { requireTeacher } = require('./auth');
const { unitExists } = require('./helpers');

const router = express.Router();
router.use(requireTeacher);

const VALID_CATEGORIES = ['summary', 'theme', 'device', 'character', 'value', 'analysis', 'short', 'long'];

function parseQuestionBody(body) {
  const { unit_id, category, prompt, answer, notes, sort_order } = body || {};
  if (!unit_id || !unitExists(unit_id)) return { error: 'unit_id is required and must match an existing unit' };
  if (!VALID_CATEGORIES.includes(category)) return { error: 'Invalid category' };
  if (!prompt || !String(prompt).trim()) return { error: 'prompt is required' };
  if (!answer || !String(answer).trim()) return { error: 'answer is required' };
  return {
    value: {
      unit_id,
      category,
      prompt: String(prompt).trim(),
      answer: String(answer).trim(),
      notes: notes != null && String(notes).trim() !== '' ? String(notes).trim() : null,
      sort_order: Number.isInteger(sort_order) ? sort_order : 0
    }
  };
}

function parseQuizQuestionBody(body) {
  const { unit_id, question, options, correct_index, explanation, topic } = body || {};
  if (!unit_id || !unitExists(unit_id)) return { error: 'unit_id is required and must match an existing unit' };
  if (!question || !String(question).trim()) return { error: 'question is required' };
  if (!Array.isArray(options) || options.length < 2 || options.some((o) => !String(o).trim())) {
    return { error: 'options must be an array of non-empty strings' };
  }
  if (!Number.isInteger(correct_index) || correct_index < 0 || correct_index >= options.length) {
    return { error: 'correct_index must point to one of the options' };
  }
  if (!explanation || !String(explanation).trim()) return { error: 'explanation is required' };
  return {
    value: {
      unit_id,
      question: String(question).trim(),
      options: options.map((o) => String(o).trim()),
      correct_index,
      explanation: String(explanation).trim(),
      topic: topic != null ? String(topic).trim() : ''
    }
  };
}

// ---- Questions CRUD ----

router.get('/questions', (req, res) => {
  const unitId = req.query.unit_id || req.query.unit || null;
  const rows = unitId
    ? db
        .prepare('SELECT id, unit_id, category, prompt, answer, notes, sort_order FROM questions WHERE unit_id = ? ORDER BY category, sort_order, id')
        .all(unitId)
    : db
        .prepare('SELECT id, unit_id, category, prompt, answer, notes, sort_order FROM questions ORDER BY category, sort_order, id')
        .all();
  res.json({ questions: rows });
});

router.post('/questions', (req, res) => {
  const parsed = parseQuestionBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  const info = db
    .prepare('INSERT INTO questions (unit_id, category, prompt, answer, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(v.unit_id, v.category, v.prompt, v.answer, v.notes, v.sort_order);
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ question });
});

router.put('/questions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Question not found' });
  const parsed = parseQuestionBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  db.prepare('UPDATE questions SET unit_id = ?, category = ?, prompt = ?, answer = ?, notes = ?, sort_order = ? WHERE id = ?').run(
    v.unit_id,
    v.category,
    v.prompt,
    v.answer,
    v.notes,
    v.sort_order,
    id
  );
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  res.json({ question });
});

router.delete('/questions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Question not found' });
  db.prepare('DELETE FROM flashcard_progress WHERE question_id = ?').run(id);
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  res.json({ success: true });
});

// ---- Quiz questions CRUD ----

router.get('/quiz-questions', (req, res) => {
  const unitId = req.query.unit_id || req.query.unit || null;
  const rows = unitId
    ? db
        .prepare('SELECT id, unit_id, question, options, correct_index, explanation, topic FROM quiz_questions WHERE unit_id = ? ORDER BY id')
        .all(unitId)
    : db
        .prepare('SELECT id, unit_id, question, options, correct_index, explanation, topic FROM quiz_questions ORDER BY id')
        .all();
  res.json({ questions: rows.map((r) => ({ ...r, options: JSON.parse(r.options) })) });
});

router.post('/quiz-questions', (req, res) => {
  const parsed = parseQuizQuestionBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  const info = db
    .prepare('INSERT INTO quiz_questions (unit_id, question, options, correct_index, explanation, topic) VALUES (?, ?, ?, ?, ?, ?)')
    .run(v.unit_id, v.question, JSON.stringify(v.options), v.correct_index, v.explanation, v.topic);
  const row = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ question: { ...row, options: JSON.parse(row.options) } });
});

router.put('/quiz-questions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM quiz_questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Quiz question not found' });
  const parsed = parseQuizQuestionBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  db.prepare(
    'UPDATE quiz_questions SET unit_id = ?, question = ?, options = ?, correct_index = ?, explanation = ?, topic = ? WHERE id = ?'
  ).run(v.unit_id, v.question, JSON.stringify(v.options), v.correct_index, v.explanation, v.topic, id);
  const row = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(id);
  res.json({ question: { ...row, options: JSON.parse(row.options) } });
});

router.delete('/quiz-questions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM quiz_questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Quiz question not found' });
  db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
