// Teacher tools: question bank (resources), paper builder, templates and the
// admin print queue. Everything here is teacher-only (role checked at mount
// time via requireTeacher) and uses prepared statements only.
const express = require('express');
const db = require('../db');
const { requireTeacher } = require('./auth');
const { unitExists } = require('./helpers');
const { autoFill, normalizeSection } = require('../lib/autofill');

const router = express.Router();
router.use(requireTeacher);

const VALID_TYPES = ['mcq', 'short', 'long', 'extract'];
const VALID_EXAM_TYPES = ['unit_test', 'half_yearly', 'full', 'practice', 'other'];
const RESOURCE_TYPES = ['school_bank', 'pyq', 'sample_paper', 'question_bank', 'teacher_upload'];

const QUESTION_COLS = `
  bq.id, bq.resource_id, bq.created_by, bq.chapter, bq.topic, bq.difficulty,
  bq.type, bq.marks, bq.year, bq.question, bq.answer, bq.usage_count, bq.updated_at,
  u.title AS chapter_title,
  r.name AS resource_name, r.type AS resource_type,
  cr.name AS creator_name`;

const QUESTION_JOINS = `
  FROM bank_questions bq
  LEFT JOIN units u ON u.id = bq.chapter
  LEFT JOIN resources r ON r.id = bq.resource_id
  LEFT JOIN users cr ON cr.id = bq.created_by`;

// ---- Ownership helpers ----

function resourceRow(id) {
  return db.prepare('SELECT * FROM resources WHERE id = ?').get(Number(id));
}

function canManageResource(user, resource) {
  if (!resource) return false;
  if (resource.is_system) return true; // school bank is curated by any teacher
  return resource.created_by === user.id;
}

function canManageQuestion(user, question) {
  if (!question) return false;
  if (question.created_by === user.id) return true;
  const resource = question.resource_id != null ? resourceRow(question.resource_id) : null;
  if (!resource) return false;
  return canManageResource(user, resource);
}

function paperRow(id) {
  return db.prepare('SELECT * FROM papers WHERE id = ?').get(Number(id));
}

// ---- Validation helpers ----

function validateQuestionFields(body, { resourceOptional = false } = {}) {
  const {
    resource_id = null,
    chapter,
    topic = '',
    difficulty = 3,
    type = 'short',
    marks = 1,
    year = null,
    question,
    answer = null
  } = body || {};

  const q = String(question || '').trim();
  if (!q) return { error: 'question text is required' };
  if (!chapter || !unitExists(String(chapter))) return { error: 'chapter must be an existing unit id' };
  if (!VALID_TYPES.includes(type)) return { error: `type must be one of: ${VALID_TYPES.join(', ')}` };
  const diff = Number(difficulty);
  if (!Number.isInteger(diff) || diff < 1 || diff > 5) return { error: 'difficulty must be an integer between 1 and 5' };
  const mk = Number(marks);
  if (!Number.isInteger(mk) || mk < 1 || mk > 25) return { error: 'marks must be an integer between 1 and 25' };
  const yr = year == null || year === '' ? null : Number(year);
  if (yr != null && !Number.isInteger(yr)) return { error: 'year must be an integer' };

  let rid = null;
  if (resource_id != null && resource_id !== '' && String(resource_id) !== 'personal') {
    rid = Number(resource_id);
    const r = resourceRow(rid);
    if (!r) return { error: 'resource does not exist' };
  }

  return {
    value: {
      resource_id: rid,
      chapter: String(chapter),
      topic: String(topic || '').trim(),
      difficulty: diff,
      type,
      marks: mk,
      year: yr,
      question: q,
      answer: answer != null && String(answer).trim() !== '' ? String(answer).trim() : null
    }
  };
}

function parsePaperStructure(structure) {
  if (!Array.isArray(structure) || structure.length === 0) return null;
  const out = [];
  for (const s of structure) {
    const norm = normalizeSection(s);
    if (!norm) return null;
    out.push({
      label: String(s.label || `Section ${String.fromCharCode(65 + out.length)}`).trim(),
      count: norm.count,
      marks: norm.marks,
      type: norm.type || 'any',
      chapters: Array.isArray(s.chapters) ? s.chapters.map(String) : [],
      difficultyMin: norm.difficultyMin,
      difficultyMax: norm.difficultyMax,
      resources: Array.isArray(s.resources) ? s.resources.map(String) : [],
      chooseAny: norm.chooseAny
    });
  }
  return out;
}

function parsePaperQuestions(items, sectionCount) {
  if (!Array.isArray(items)) return { error: 'questions must be an array' };
  const rows = [];
  for (const it of items) {
    const sectionIndex = Number(it.section_index);
    if (!Number.isInteger(sectionIndex) || sectionIndex < 0 || sectionIndex >= sectionCount) {
      return { error: 'each question needs a valid section_index' };
    }
    const question = String(it.question || '').trim();
    if (!question) return { error: 'each question needs text' };
    const marks = Number(it.marks);
    if (!Number.isInteger(marks) || marks < 1 || marks > 25) return { error: 'each question needs marks (1-25)' };
    const difficulty = Number(it.difficulty);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) return { error: 'difficulty must be 1-5' };
    const type = VALID_TYPES.includes(it.type) ? it.type : 'short';
    rows.push({
      section_index: sectionIndex,
      position: Number.isInteger(Number(it.position)) ? Number(it.position) : 0,
      bank_question_id: it.bank_question_id != null ? Number(it.bank_question_id) : null,
      is_custom: it.is_custom ? 1 : 0,
      question,
      marks,
      chapter: String(it.chapter || ''),
      topic: String(it.topic || ''),
      difficulty,
      type,
      answer: it.answer != null && String(it.answer).trim() !== '' ? String(it.answer).trim() : null,
      source_name: String(it.source_name || '')
    });
  }
  return { value: rows };
}

function bumpUsage(ids, delta) {
  const uniq = [...new Set(ids.filter((id) => id != null).map(Number))];
  if (uniq.length === 0) return;
  const stmt = db.prepare('UPDATE bank_questions SET usage_count = MAX(0, usage_count + ?) WHERE id = ?');
  const tx = db.transaction(() => {
    for (const id of uniq) stmt.run(delta, id);
  });
  tx();
}

function replacePaperQuestions(paperId, rows) {
  const old = db.prepare('SELECT bank_question_id FROM paper_questions WHERE paper_id = ?').all(paperId);
  const oldIds = old.map((r) => r.bank_question_id).filter((id) => id != null);
  const newIds = rows.map((r) => r.bank_question_id).filter((id) => id != null);
  bumpUsage(oldIds, -1);
  bumpUsage(newIds, +1);

  db.prepare('DELETE FROM paper_questions WHERE paper_id = ?').run(paperId);
  const insert = db.prepare(
    `INSERT INTO paper_questions
       (paper_id, section_index, position, bank_question_id, is_custom, question, marks,
        chapter, topic, difficulty, type, answer, source_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    for (const r of rows) {
      insert.run(
        paperId,
        r.section_index,
        r.position,
        r.bank_question_id,
        r.is_custom,
        r.question,
        r.marks,
        r.chapter,
        r.topic,
        r.difficulty,
        r.type,
        r.answer,
        r.source_name
      );
    }
  });
  tx();
}

function publicPaper(row) {
  return {
    ...row,
    header: JSON.parse(row.header || '{}'),
    structure: JSON.parse(row.structure || '[]')
  };
}

function paperList(where, params) {
  return db
    .prepare(
      `SELECT p.*, u.name AS creator_name,
              (SELECT COUNT(*) FROM paper_questions pq WHERE pq.paper_id = p.id) AS question_count
       FROM papers p JOIN users u ON u.id = p.created_by
       ${where} ORDER BY p.updated_at DESC, p.id DESC`
    )
    .all(...params)
    .map(publicPaper);
}

// ============================================================
// Resources
// ============================================================

router.get('/bank/resources', (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, u.name AS creator_name,
              (SELECT COUNT(*) FROM bank_questions bq WHERE bq.resource_id = r.id) AS question_count
       FROM resources r LEFT JOIN users u ON u.id = r.created_by
       ORDER BY r.is_system DESC, r.created_at DESC`
    )
    .all();
  const personal = db
    .prepare('SELECT COUNT(*) AS c FROM bank_questions WHERE resource_id IS NULL AND created_by = ?')
    .get(req.user.id).c;
  res.json({ resources: rows, personal_count: personal });
});

router.post('/bank/resources', (req, res) => {
  const { name, type, description = '' } = req.body || {};
  const clean = String(name || '').trim();
  if (!clean) return res.status(400).json({ error: 'name is required' });
  if (!RESOURCE_TYPES.includes(type)) return res.status(400).json({ error: `type must be one of: ${RESOURCE_TYPES.join(', ')}` });
  const info = db
    .prepare('INSERT INTO resources (name, type, description, created_by, is_system) VALUES (?, ?, ?, ?, 0)')
    .run(clean, type, String(description || '').trim(), req.user.id);
  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ resource: row });
});

router.put('/bank/resources/:id', (req, res) => {
  const resource = resourceRow(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  if (!canManageResource(req.user, resource)) return res.status(403).json({ error: 'Only the owner (or a system resource) can be edited' });
  const { name, description } = req.body || {};
  if (name != null && !String(name).trim()) return res.status(400).json({ error: 'name cannot be empty' });
  db.prepare('UPDATE resources SET name = ?, description = ? WHERE id = ?').run(
    name != null ? String(name).trim() : resource.name,
    description != null ? String(description).trim() : resource.description,
    resource.id
  );
  res.json({ resource: db.prepare('SELECT * FROM resources WHERE id = ?').get(resource.id) });
});

router.delete('/bank/resources/:id', (req, res) => {
  const resource = resourceRow(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  if (resource.is_system) return res.status(403).json({ error: 'System resources cannot be deleted' });
  if (resource.created_by !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete this resource' });
  db.prepare('DELETE FROM bank_questions WHERE resource_id = ?').run(resource.id);
  db.prepare('DELETE FROM resources WHERE id = ?').run(resource.id);
  res.json({ success: true });
});

// ============================================================
// Bank questions
// ============================================================

router.get('/bank/questions', (req, res) => {
  const where = [];
  const params = [];
  const { resource, chapter, difficulty, difficulty_min, difficulty_max, type, year, q, exclude } = req.query;

  if (resource != null && resource !== '') {
    if (String(resource) === 'personal') {
      where.push('bq.resource_id IS NULL AND bq.created_by = ?');
      params.push(req.user.id);
    } else {
      where.push('bq.resource_id = ?');
      params.push(Number(resource));
    }
  }
  if (chapter) {
    if (!unitExists(String(chapter))) return res.status(400).json({ error: 'Unknown unit' });
    where.push('bq.chapter = ?');
    params.push(String(chapter));
  }
  if (difficulty != null && difficulty !== '') {
    where.push('bq.difficulty = ?');
    params.push(Number(difficulty));
  } else {
    const lo = Number(difficulty_min);
    const hi = Number(difficulty_max);
    if (Number.isInteger(lo) && lo >= 1) {
      where.push('bq.difficulty >= ?');
      params.push(lo);
    }
    if (Number.isInteger(hi) && hi <= 5) {
      where.push('bq.difficulty <= ?');
      params.push(hi);
    }
  }
  if (type && type !== 'any') {
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
    where.push('bq.type = ?');
    params.push(type);
  }
  if (year != null && year !== '') {
    where.push('bq.year = ?');
    params.push(Number(year));
  }
  if (q) {
    const like = `%${String(q).toLowerCase()}%`;
    where.push('(lower(bq.question) LIKE ? OR lower(bq.answer) LIKE ? OR lower(bq.topic) LIKE ?)');
    params.push(like, like, like);
  }
  if (exclude) {
    const ids = String(exclude).split(',').map(Number).filter(Number.isInteger);
    if (ids.length) {
      where.push(`bq.id NOT IN (${ids.map(() => '?').join(',')})`);
      params.push(...ids);
    }
  }

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const sql = `SELECT ${QUESTION_COLS} ${QUESTION_JOINS}
               ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY bq.updated_at DESC, bq.id DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, limit, offset);
  const total = db
    .prepare(
      `SELECT COUNT(*) AS c FROM bank_questions bq ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`
    )
    .get(...params).c;
  res.json({ questions: rows, total });
});

router.post('/bank/questions', (req, res) => {
  const parsed = validateQuestionFields(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  if (v.resource_id != null) {
    const r = resourceRow(v.resource_id);
    if (!canManageResource(req.user, r)) return res.status(403).json({ error: 'You cannot add questions to this resource' });
  }
  const info = db
    .prepare(
      `INSERT INTO bank_questions (resource_id, created_by, chapter, topic, difficulty, type, marks, year, question, answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(v.resource_id, req.user.id, v.chapter, v.topic, v.difficulty, v.type, v.marks, v.year, v.question, v.answer);
  const row = db.prepare(`SELECT ${QUESTION_COLS} ${QUESTION_JOINS} WHERE bq.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ question: row });
});

router.put('/bank/questions/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM bank_questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Question not found' });
  if (!canManageQuestion(req.user, existing)) return res.status(403).json({ error: 'Only the owner or the resource owner can edit this question' });

  const parsed = validateQuestionFields({ ...req.body, resource_id: existing.resource_id }, { resourceOptional: true });
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  db.prepare(
    `UPDATE bank_questions SET chapter = ?, topic = ?, difficulty = ?, type = ?, marks = ?, year = ?, question = ?, answer = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(v.chapter, v.topic, v.difficulty, v.type, v.marks, v.year, v.question, v.answer, id);
  const row = db.prepare(`SELECT ${QUESTION_COLS} ${QUESTION_JOINS} WHERE bq.id = ?`).get(id);
  res.json({ question: row });
});

router.delete('/bank/questions/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM bank_questions WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Question not found' });
  if (!canManageQuestion(req.user, existing)) return res.status(403).json({ error: 'Only the owner or the resource owner can delete this question' });
  db.prepare('DELETE FROM bank_questions WHERE id = ?').run(id);
  res.json({ success: true });
});

// ---- CSV import ----
// Columns: chapter,difficulty,type,marks,year,topic,question,answer
// First row is treated as a header when it starts with "chapter".
router.post('/bank/import', (req, res) => {
  const { resource_id, csv } = req.body || {};
  let rid = null;
  if (resource_id != null && resource_id !== '' && String(resource_id) !== 'personal') {
    rid = Number(resource_id);
    const r = resourceRow(rid);
    if (!r) return res.status(400).json({ error: 'resource does not exist' });
    if (!canManageResource(req.user, r)) return res.status(403).json({ error: 'You cannot import into this resource' });
  }
  const text = String(csv || '');
  if (!text.trim()) return res.status(400).json({ error: 'csv is required' });

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let start = 0;
  if (lines[0] && /^chapter\b/i.test(lines[0])) start = 1;

  const insert = db.prepare(
    `INSERT INTO bank_questions (resource_id, created_by, chapter, topic, difficulty, type, marks, year, question, answer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const imported = [];
  const errors = [];

  const tx = db.transaction(() => {
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 2 || !cols[0]) {
        errors.push({ row: i + 1, error: 'row must start with a chapter id' });
        continue;
      }
      const [chapter, difficulty = '3', type = 'short', marks = '1', year = '', topic = '', ...rest] = cols;
      const question = rest.join(',');
      const answer = cols.length > 8 ? cols[8] : '';
      if (!unitExists(chapter)) {
        errors.push({ row: i + 1, error: `unknown chapter "${chapter}"` });
        continue;
      }
      if (!question) {
        errors.push({ row: i + 1, error: 'missing question text' });
        continue;
      }
      const diff = Number(difficulty);
      const mk = Number(marks);
      const yr = year === '' ? null : Number(year);
      if (!Number.isInteger(diff) || diff < 1 || diff > 5) {
        errors.push({ row: i + 1, error: `difficulty must be 1-5 (got "${difficulty}")` });
        continue;
      }
      if (!Number.isInteger(mk) || mk < 1) {
        errors.push({ row: i + 1, error: `marks must be a positive integer (got "${marks}")` });
        continue;
      }
      const info = insert.run(rid, req.user.id, chapter, topic, diff, VALID_TYPES.includes(type) ? type : 'short', mk, Number.isNaN(yr) ? null : yr, question, answer);
      imported.push(info.lastInsertRowid);
    }
  });
  tx();

  res.status(201).json({ imported: imported.length, errors });
});

// ---- Auto-fill ----

router.post('/bank/autofill', (req, res) => {
  const { sections, excludeIds = [] } = req.body || {};
  if (!Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: 'sections must be a non-empty array' });
  }
  const pool = db
    .prepare(
      `SELECT bq.id, bq.resource_id, bq.created_by, bq.chapter, bq.topic, bq.difficulty,
              bq.type, bq.marks, bq.year, bq.question, bq.answer, bq.usage_count,
              u.title AS chapter_title, r.name AS resource_name, r.type AS resource_type
       FROM bank_questions bq
       LEFT JOIN units u ON u.id = bq.chapter
       LEFT JOIN resources r ON r.id = bq.resource_id
       WHERE bq.resource_id IS NOT NULL OR bq.created_by = ?`
    )
    .all(req.user.id);

  const results = autoFill(pool, sections, req.user, excludeIds);
  res.json({ sections: results });
});

// ============================================================
// Templates
// ============================================================

router.get('/templates', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM paper_templates WHERE is_system = 1 OR created_by = ? ORDER BY is_system DESC, name')
    .all(req.user.id)
    .map((t) => ({ ...t, structure: JSON.parse(t.structure) }));
  res.json({ templates: rows });
});

router.post('/templates', (req, res) => {
  const { name, description = '', structure } = req.body || {};
  const clean = String(name || '').trim();
  if (!clean) return res.status(400).json({ error: 'name is required' });
  const parsed = parsePaperStructure(structure);
  if (!parsed) return res.status(400).json({ error: 'structure must be a non-empty array of valid sections' });
  const info = db
    .prepare('INSERT INTO paper_templates (name, description, created_by, is_system, structure) VALUES (?, ?, ?, 0, ?)')
    .run(clean, String(description || '').trim(), req.user.id, JSON.stringify(parsed));
  const row = db.prepare('SELECT * FROM paper_templates WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ template: { ...row, structure: JSON.parse(row.structure) } });
});

router.put('/templates/:id', (req, res) => {
  const tpl = db.prepare('SELECT * FROM paper_templates WHERE id = ?').get(Number(req.params.id));
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  if (tpl.is_system || tpl.created_by !== req.user.id) return res.status(403).json({ error: 'Only your own templates can be edited' });
  const { name, description, structure } = req.body || {};
  const parsed = structure != null ? parsePaperStructure(structure) : null;
  if (structure != null && !parsed) return res.status(400).json({ error: 'structure must be a non-empty array of valid sections' });
  db.prepare('UPDATE paper_templates SET name = ?, description = ?, structure = ? WHERE id = ?').run(
    name != null && String(name).trim() ? String(name).trim() : tpl.name,
    description != null ? String(description).trim() : tpl.description,
    parsed != null ? JSON.stringify(parsed) : tpl.structure,
    tpl.id
  );
  const row = db.prepare('SELECT * FROM paper_templates WHERE id = ?').get(tpl.id);
  res.json({ template: { ...row, structure: JSON.parse(row.structure) } });
});

router.delete('/templates/:id', (req, res) => {
  const tpl = db.prepare('SELECT * FROM paper_templates WHERE id = ?').get(Number(req.params.id));
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  if (tpl.is_system || tpl.created_by !== req.user.id) return res.status(403).json({ error: 'Only your own templates can be deleted' });
  db.prepare('DELETE FROM paper_templates WHERE id = ?').run(tpl.id);
  res.json({ success: true });
});

// ============================================================
// Papers
// ============================================================

router.get('/papers', (req, res) => {
  const { status, scope = 'mine', q } = req.query;
  const where = [];
  const params = [];
  if (scope === 'all') {
    // Any teacher can see the print queue; status filter makes the queue view.
  } else {
    where.push('p.created_by = ?');
    params.push(req.user.id);
  }
  if (status && ['draft', 'submitted', 'printed'].includes(status)) {
    where.push('p.status = ?');
    params.push(status);
  }
  if (q) {
    where.push('(lower(p.title) LIKE ? OR lower(p.instructions) LIKE ?)');
    const like = `%${String(q).toLowerCase()}%`;
    params.push(like, like);
  }
  res.json({ papers: paperList(where.length ? `WHERE ${where.join(' AND ')}` : '', params) });
});

function savePaper(req, res, paperId) {
  const {
    title,
    exam_type = 'unit_test',
    duration_minutes = 60,
    instructions = '',
    header = {},
    structure,
    questions
  } = req.body || {};

  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return { status: 400, body: { error: 'title is required' } };
  if (!VALID_EXAM_TYPES.includes(exam_type)) return { status: 400, body: { error: `exam_type must be one of: ${VALID_EXAM_TYPES.join(', ')}` } };
  const parsedStructure = parsePaperStructure(structure);
  if (!parsedStructure) return { status: 400, body: { error: 'structure must be a non-empty array of valid sections' } };
  const parsedQuestions = parsePaperQuestions(questions, parsedStructure.length);
  if (parsedQuestions.error) return { status: 400, body: { error: parsedQuestions.error } };
  const totalMarks = parsedQuestions.value.reduce((s, r) => s + r.marks, 0);
  const dur = Number(duration_minutes);
  if (!Number.isInteger(dur) || dur < 1 || dur > 600) return { status: 400, body: { error: 'duration_minutes must be between 1 and 600' } };
  const cleanHeader = header && typeof header === 'object' ? header : {};

  db.prepare(
    `UPDATE papers SET title = ?, exam_type = ?, duration_minutes = ?, instructions = ?, header = ?, structure = ?, total_marks = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    cleanTitle,
    exam_type,
    dur,
    String(instructions || '').trim(),
    JSON.stringify(cleanHeader),
    JSON.stringify(parsedStructure),
    totalMarks,
    paperId
  );
  replacePaperQuestions(paperId, parsedQuestions.value);
  return { status: 200, body: { paper: publicPaper(paperRow(paperId)) } };
}

router.post('/papers', (req, res) => {
  const { title, exam_type = 'unit_test', duration_minutes = 60, instructions = '', header = {}, structure, questions } = req.body || {};
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return res.status(400).json({ error: 'title is required' });
  if (!VALID_EXAM_TYPES.includes(exam_type)) return res.status(400).json({ error: `exam_type must be one of: ${VALID_EXAM_TYPES.join(', ')}` });
  const parsedStructure = parsePaperStructure(structure);
  if (!parsedStructure) return res.status(400).json({ error: 'structure must be a non-empty array of valid sections' });
  const parsedQuestions = parsePaperQuestions(questions || [], parsedStructure.length);
  if (parsedQuestions.error) return res.status(400).json({ error: parsedQuestions.error });
  const totalMarks = parsedQuestions.value.reduce((s, r) => s + r.marks, 0);
  const dur = Number(duration_minutes);
  if (!Number.isInteger(dur) || dur < 1 || dur > 600) return res.status(400).json({ error: 'duration_minutes must be between 1 and 600' });
  const cleanHeader = header && typeof header === 'object' ? header : {};

  const info = db
    .prepare(
      `INSERT INTO papers (title, created_by, exam_type, duration_minutes, instructions, header, structure, status, total_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`
    )
    .run(cleanTitle, req.user.id, exam_type, dur, String(instructions || '').trim(), JSON.stringify(cleanHeader), JSON.stringify(parsedStructure), totalMarks);
  const paperId = info.lastInsertRowid;
  replacePaperQuestions(paperId, parsedQuestions.value);
  res.status(201).json({ paper: publicPaper(paperRow(paperId)) });
});

router.get('/papers/:id', (req, res) => {
  const paper = paperRow(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  const questions = db
    .prepare(
      `SELECT pq.*, u.title AS chapter_title
       FROM paper_questions pq LEFT JOIN units u ON u.id = pq.chapter
       WHERE pq.paper_id = ? ORDER BY pq.section_index, pq.position, pq.id`
    )
    .all(paper.id);
  res.json({ paper: { ...publicPaper(paper), creator_name: db.prepare('SELECT name FROM users WHERE id = ?').get(paper.created_by)?.name || '' }, questions });
});

router.put('/papers/:id', (req, res) => {
  const paper = paperRow(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  if (paper.created_by !== req.user.id) return res.status(403).json({ error: 'Only the owner can edit this paper' });
  if (paper.status === 'printed') return res.status(403).json({ error: 'Printed papers are locked; duplicate it to make changes' });
  const result = savePaper(req, res, paper.id);
  res.status(result.status).json(result.body);
});

router.delete('/papers/:id', (req, res) => {
  const paper = paperRow(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  if (paper.created_by !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete this paper' });
  replacePaperQuestions(paper.id, []);
  db.prepare('DELETE FROM papers WHERE id = ?').run(paper.id);
  res.json({ success: true });
});

router.post('/papers/:id/duplicate', (req, res) => {
  const paper = paperRow(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  if (paper.created_by !== req.user.id) return res.status(403).json({ error: 'Only the owner can duplicate this paper' });
  const info = db
    .prepare(
      `INSERT INTO papers (title, created_by, exam_type, duration_minutes, instructions, header, structure, status, total_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`
    )
    .run(`${paper.title} (copy)`, req.user.id, paper.exam_type, paper.duration_minutes, paper.instructions, paper.header, paper.structure, paper.total_marks);
  const newId = info.lastInsertRowid;
  const rows = db
    .prepare(
      `SELECT section_index, position, bank_question_id, is_custom, question, marks, chapter, topic, difficulty, type, answer, source_name
       FROM paper_questions WHERE paper_id = ? ORDER BY section_index, position, id`
    )
    .all(paper.id);
  replacePaperQuestions(newId, rows);
  res.status(201).json({ paper: publicPaper(paperRow(newId)) });
});

router.post('/papers/:id/submit', (req, res) => {
  const paper = paperRow(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  if (paper.created_by !== req.user.id) return res.status(403).json({ error: 'Only the owner can submit a paper' });
  if (paper.status === 'printed') return res.status(400).json({ error: 'This paper was already printed' });
  const count = db.prepare('SELECT COUNT(*) AS c FROM paper_questions WHERE paper_id = ?').get(paper.id).c;
  if (count === 0) return res.status(400).json({ error: 'Add at least one question before submitting' });
  db.prepare("UPDATE papers SET status = 'submitted', updated_at = datetime('now') WHERE id = ?").run(paper.id);
  res.json({ paper: publicPaper(paperRow(paper.id)) });
});

router.post('/papers/:id/status', (req, res) => {
  const paper = paperRow(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  const { status } = req.body || {};
  if (status === 'printed') {
    // The print queue is handled by any teacher (the school prints centrally).
    db.prepare("UPDATE papers SET status = 'printed', updated_at = datetime('now') WHERE id = ?").run(paper.id);
  } else if (status === 'draft') {
    if (paper.created_by !== req.user.id) return res.status(403).json({ error: 'Only the owner can pull a paper back to draft' });
    db.prepare("UPDATE papers SET status = 'draft', updated_at = datetime('now') WHERE id = ?").run(paper.id);
  } else {
    return res.status(400).json({ error: "status must be 'printed' or 'draft'" });
  }
  res.json({ paper: publicPaper(paperRow(paper.id)) });
});

module.exports = router;