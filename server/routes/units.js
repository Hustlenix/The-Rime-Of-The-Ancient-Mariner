const express = require('express');
const db = require('../db');

const router = express.Router();

// Unit list grouped by book, with per-unit content depth metadata so the
// client can render book sections without guessing.
router.get('/', (req, res) => {
  const units = db
    .prepare('SELECT id, book, type, title, author, position FROM units ORDER BY book, position')
    .all();
  const counts = db
    .prepare(
      `SELECT unit_id, category, COUNT(*) AS c FROM questions GROUP BY unit_id, category`
    )
    .all();
  const quizCounts = db
    .prepare('SELECT unit_id, COUNT(*) AS c FROM quiz_questions GROUP BY unit_id')
    .all();
  const countBy = (rows, unitId, key) => {
    const found = rows.find((r) => r.unit_id === unitId);
    return found ? found[key] : 0;
  };

  const books = [
    { id: 'first-flight', name: 'First Flight', tagline: 'Prose & poems' },
    { id: 'footprints', name: 'Footprints Without Feet', tagline: 'Supplementary reader' }
  ];

  const grouped = books.map((b) => ({
    ...b,
    units: units
      .filter((u) => u.book === b.id)
      .map((u) => ({
        id: u.id,
        type: u.type,
        title: u.title,
        author: u.author,
        order: u.position,
        stats: {
          summaries: countBy(counts, u.id, 'c') /* refined below */,
          questions: 0,
          quiz: countBy(quizCounts, u.id, 'c')
        }
      }))
  }));

  // Per-unit per-category counts, refined properly.
  for (const b of grouped) {
    for (const u of b.units) {
      const perCat = counts.filter((r) => r.unit_id === u.id);
      u.stats.summaries = perCat.filter((r) => r.category === 'summary').reduce((s, r) => s + r.c, 0);
      u.stats.themes = perCat.filter((r) => r.category === 'theme').reduce((s, r) => s + r.c, 0);
      u.stats.devices = perCat.filter((r) => r.category === 'device').reduce((s, r) => s + r.c, 0);
      u.stats.characters = perCat
        .filter((r) => r.category === 'character' || r.category === 'analysis')
        .reduce((s, r) => s + r.c, 0);
      u.stats.questions = perCat
        .filter((r) => r.category === 'short' || r.category === 'long')
        .reduce((s, r) => s + r.c, 0);
      u.stats.quiz = countBy(quizCounts, u.id, 'c');
    }
  }

  res.json({ books: grouped, units: units.map((u) => ({ id: u.id, book: u.book, type: u.type, title: u.title, author: u.author, order: u.position })) });
});

module.exports = router;
