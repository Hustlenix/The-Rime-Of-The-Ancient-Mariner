const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db');

const authRoutes = require('./routes/auth');
const { contentRouter, questionsRouter } = require('./routes/content');
const quizRoutes = require('./routes/quiz');
const flashcardRoutes = require('./routes/flashcards');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const distDir = path.join(__dirname, '..', 'client', 'dist');
if (require('fs').existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Rime API listening on ${PORT}`);
});
