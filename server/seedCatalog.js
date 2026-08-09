// Central content catalog: every unit lives in server/content/<unitId>.js as a
// self-contained module ({ unit, content, quizQuestions }). This file loads
// them all and exposes flat, unit-tagged arrays for the DB seeder and the
// client fallback generator.
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();

const units = [];
const content = [];
const quizQuestions = [];

for (const file of files) {
  const mod = require(path.join(contentDir, file));
  if (!mod || !mod.unit || !mod.unit.id) {
    throw new Error(`seedCatalog: ${file} must export { unit, content, quizQuestions }`);
  }
  const { unit } = mod;
  const rows = Array.isArray(mod.content) ? mod.content : [];
  const quiz = Array.isArray(mod.quizQuestions) ? mod.quizQuestions : [];

  units.push({ ...unit, type: unit.type || 'prose', order: unit.order || 0 });
  rows.forEach((row, i) => {
    if (!row.category || !row.prompt || !row.answer) {
      throw new Error(`seedCatalog: ${file} content row #${i} needs category/prompt/answer`);
    }
    content.push({
      unitId: unit.id,
      category: row.category,
      prompt: row.prompt,
      answer: row.answer,
      notes: row.notes != null ? row.notes : null,
      sortOrder: Number.isInteger(row.sortOrder) ? row.sortOrder : i + 1
    });
  });
  quiz.forEach((q, i) => {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`seedCatalog: ${file} quiz row #${i} needs question + options[]`);
    }
    quizQuestions.push({
      unitId: unit.id,
      question: q.question,
      options: q.options.map(String),
      correct_index: Number.isInteger(q.correct_index) ? q.correct_index : 0,
      explanation: q.explanation || '',
      topic: q.topic || ''
    });
  });
}

// Stable ordering helpers used by both the DB seeder and the fallback generator,
// so client-side ids always mirror server-side ids.
const BOOK_ORDER = { 'literature-reader': 1 };
const books = [
  { id: 'literature-reader', name: 'Interact in English — Literature Reader', tagline: 'Prose, poems & plays' }
];

function compareUnits(a, b) {
  if (a.book !== b.book) return (BOOK_ORDER[a.book] || 99) - (BOOK_ORDER[b.book] || 99);
  return (a.order || 0) - (b.order || 0);
}

const orderedUnits = [...units].sort(compareUnits);

module.exports = { units, orderedUnits, books, content, quizQuestions };
