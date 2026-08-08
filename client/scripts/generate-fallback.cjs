// Generates the client's static-mode data files from server/seedCatalog.js so
// the GitHub Pages site (no API server) can serve the full portal:
//   client/src/data/units.json            — unit + book index (small, static import)
//   client/src/data/units/<unitId>.json   — per-unit content (lazy-loaded chunks)
//   client/src/data/search-index.json     — flat content rows for client-side search
// Run: npm run gen-fallback   (in client/). Pass --check to validate only.
const fs = require('fs');
const path = require('path');
const { orderedUnits, books, content, quizQuestions } = require(path.join(__dirname, '..', '..', 'server', 'seedCatalog.js'));

const CHECK_ONLY = process.argv.includes('--check');
const dataDir = path.join(__dirname, '..', 'src', 'data');
const unitsDir = path.join(dataDir, 'units');

// Content ids must mirror the DB's insert order (seedCatalog order), so
// flashcard progress stays stable between the server and static copies.
const contentWithIds = content.map((row, i) => ({ id: i + 1, ...row }));
const quizWithIds = quizQuestions.map((q, i) => ({ id: i + 1, ...q }));

const byUnit = new Map();
for (const row of contentWithIds) {
  if (!byUnit.has(row.unitId)) byUnit.set(row.unitId, []);
  byUnit.get(row.unitId).push(row);
}
const quizByUnit = new Map();
for (const q of quizWithIds) {
  if (!quizByUnit.has(q.unitId)) quizByUnit.set(q.unitId, []);
  quizByUnit.get(q.unitId).push(q);
}

// ---- Validation (also serves as the fallback-loader test) ----
const errors = [];
function validateUnit(unit) {
  const rows = byUnit.get(unit.id) || [];
  const quiz = quizByUnit.get(unit.id) || [];
  const cats = {};
  for (const r of rows) cats[r.category] = (cats[r.category] || 0) + 1;
  const summaries = cats.summary || 0;
  const themes = cats.theme || 0;
  const questions = (cats.short || 0) + (cats.long || 0);
  const devices = cats.device || 0;
  const chars = (cats.character || 0) + (cats.analysis || 0);
  const values = cats.value || 0;

  const bad = (cond, msg) => { if (!cond) errors.push(`${unit.id}: ${msg}`); };
  const legacy = unit.legacy === true;

  bad(summaries >= 2, `expected >= 2 summaries, got ${summaries}`);
  bad(themes >= (legacy ? 1 : 2), `expected >= ${legacy ? 1 : 2} themes, got ${themes}`);
  bad(quiz.length >= 10, `expected >= 10 quiz questions, got ${quiz.length}`);
  if (!legacy) {
    bad(questions >= 12, `expected >= 12 Q&A (short+long), got ${questions}`);
    if (unit.type === 'poem') {
      bad(devices >= 5, `poem: expected >= 5 poetic devices, got ${devices}`);
      bad(chars >= 2, `poem: expected >= 2 analysis/character rows, got ${chars}`);
    } else {
      bad(chars >= 3, `prose/play: expected >= 3 character sketches, got ${chars}`);
      bad(values >= 2, `prose/play: expected >= 2 value rows, got ${values}`);
    }
  }
  for (const r of rows) {
    if (!String(r.prompt).trim() || !String(r.answer).trim()) bad(`content row #${r.id} empty prompt/answer`);
  }
  for (const q of quiz) {
    if (q.options.length !== 4) bad(`quiz #${q.id} must have 4 options, got ${q.options.length}`);
    if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.options.length) {
      bad(`quiz #${q.id} invalid correct_index`);
    }
    if (!String(q.explanation).trim()) bad(`quiz #${q.id} missing explanation`);
  }
}

for (const u of orderedUnits) validateUnit(u);

if (errors.length) {
  console.error('FALLBACK VALIDATION FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

if (CHECK_ONLY) {
  console.log(`Validation OK: ${orderedUnits.length} units, ${content.length} content rows, ${quizQuestions.length} quiz questions.`);
  process.exit(0);
}

// ---- Write files ----
fs.mkdirSync(unitsDir, { recursive: true });

const index = {
  generatedAt: new Date().toISOString(),
  books: books.map((b) => ({ ...b, unitIds: orderedUnits.filter((u) => u.book === b.id).map((u) => u.id) })),
  units: orderedUnits.map(({ id, book, type, title, author, order, legacy }) => ({ id, book, type, title, author, order, legacy: legacy === true }))
};
fs.writeFileSync(path.join(dataDir, 'units.json'), JSON.stringify(index, null, 1) + '\n');

for (const u of orderedUnits) {
  const unitFile = {
    unit: { id: u.id, book: u.book, type: u.type, title: u.title, author: u.author, order: u.order },
    content: (byUnit.get(u.id) || []).map((r) => ({
      id: r.id,
      category: r.category,
      prompt: r.prompt,
      answer: r.answer,
      notes: r.notes,
      sortOrder: r.sortOrder
    })),
    quizQuestions: (quizByUnit.get(u.id) || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      topic: q.topic
    }))
  };
  fs.writeFileSync(path.join(unitsDir, `${u.id}.json`), JSON.stringify(unitFile, null, 1) + '\n');
}

const searchIndex = {
  entries: contentWithIds.map((r) => ({
    id: r.id,
    unitId: r.unitId,
    unitTitle: orderedUnits.find((u) => u.id === r.unitId)?.title || r.unitId,
    category: r.category,
    prompt: r.prompt,
    answer: r.answer,
    notes: r.notes
  }))
};
fs.writeFileSync(path.join(dataDir, 'search-index.json'), JSON.stringify(searchIndex, null, 1) + '\n');

const totalQA = contentWithIds.filter((r) => r.category === 'short' || r.category === 'long').length;
console.log(
  `Wrote ${orderedUnits.length} units (${contentWithIds.length} content rows, ${totalQA} Q&A, ${quizWithIds.length} quiz questions) to ${dataDir}`
);
