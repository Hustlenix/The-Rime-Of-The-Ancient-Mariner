// "The Rime of the Ancient Mariner" — legacy TALS unit.
// The question text below is imported VERBATIM from server/seedData.js
// (the school's question bank). Do not reword, reorder or edit it.
const { questions, quizQuestions } = require('../seedData');

module.exports = {
  unit: {
    id: 'rime-of-the-ancient-mariner',
    book: 'first-flight',
    type: 'poem',
    title: 'The Rime of the Ancient Mariner',
    author: 'Samuel Taylor Coleridge',
    order: 21,
    legacy: true
  },
  content: questions.map((q, i) => ({
    category: q.category,
    prompt: q.prompt,
    answer: q.answer,
    notes: q.notes != null ? q.notes : null,
    sortOrder: q.sort_order || i + 1
  })),
  quizQuestions: quizQuestions.map((q) => ({
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    explanation: q.explanation,
    topic: q.topic || ''
  }))
};
