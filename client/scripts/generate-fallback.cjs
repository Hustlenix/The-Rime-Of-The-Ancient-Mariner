// Generates client/src/fallbackContent.js from server/seedData.js so the
// statically-hosted site (GitHub Pages, no API server) can serve the full
// question bank embedded in the bundle. Run: npm run gen-fallback
const fs = require('fs');
const path = require('path');
const { questions, quizQuestions } = require(path.join(__dirname, '..', '..', 'server', 'seedData.js'));

const byCat = (cat) => questions.filter((q) => q.category === cat);

// DB assigns ids on insert in seed order (1-based); mirror that so React keys
// and flashcard progress maps stay stable in the embedded copy.
const withIds = (rows) => rows.map((row, i) => ({ id: i + 1, ...row }));
const quizWithIds = (rows) => rows.map((row, i) => ({ id: i + 1, ...row }));

const fallback = {
  summaries: withIds(byCat('summary')),
  themes: withIds(byCat('theme')),
  devices: withIds(byCat('device')),
  questions: withIds(questions),
  quizQuestions: quizWithIds(quizQuestions)
};

const out = path.join(__dirname, '..', 'src', 'fallbackContent.js');
fs.writeFileSync(out, 'export default ' + JSON.stringify(fallback, null, 2) + ';\n');
console.log(
  `Wrote ${out}: ${fallback.questions.length} questions (${fallback.summaries.length} summaries, ${fallback.themes.length} themes, ${fallback.devices.length} devices), ${fallback.quizQuestions.length} quiz questions`
);
