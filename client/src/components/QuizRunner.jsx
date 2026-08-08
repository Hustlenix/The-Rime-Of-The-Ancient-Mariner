import { useEffect, useState } from 'react';
import { api } from '../api';
import { img } from '../asset';

const VERDICTS = [
  {
    min: 80,
    rank: 'Master Mariner',
    verdict:
      'A Master Mariner indeed! You know the voyage of the Albatross as well as Coleridge himself. Carry this confidence to the exam.'
  },
  {
    min: 60,
    rank: 'Helmsman',
    verdict:
      'Fair sailing, Helmsman! Your knowledge holds the wheel steady. Review the questions you missed and set sail again.'
  },
  {
    min: 40,
    rank: 'Shipmate',
    verdict:
      'A worthy Shipmate — you have the shape of the voyage, but the details still drift in the fog. Study the summaries once more.'
  },
  {
    min: 0,
    rank: 'Landlubber',
    verdict:
      'Every great sailor begins on land. Read the study notes, try the flashcards, and return — the sea will not defeat you.'
  }
];

export default function QuizRunner({ onFinish }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api
      .getQuizQuestions(10)
      .then((data) => setQuestions(data.questions))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">Failed to load quiz: {error}</p>;
  if (!questions) return <p className="page-loader">Loading quiz questions…</p>;
  if (!questions.length) return <p className="empty-note">No quiz questions available yet.</p>;

  const question = questions[index];
  const answered = picked !== null;
  const pctDone = Math.round((index / questions.length) * 100);

  const pick = (i) => {
    if (answered) return;
    setPicked(i);
    if (i === question.correct_index) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setDone(true);
      if (onFinish) onFinish(score, questions.length);
    }
  };

  const restart = () => {
    setQuestions(null);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setError(null);
    api
      .getQuizQuestions(10)
      .then((data) => setQuestions(data.questions))
      .catch((e) => setError(e.message));
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const verdict = VERDICTS.find((v) => pct >= v.min) || VERDICTS[VERDICTS.length - 1];
    return (
      <div className="quiz-result card">
        <span className={`rank-badge ${pct >= 80 ? 'gold' : ''}`}>{verdict.rank}</span>
        <img className="result-art" src={img('lonely.jpg')} alt="A lonely sailor at sea" />
        <h2>Voyage Complete</h2>
        <p className="result-score">
          {score} / {questions.length}
        </p>
        <p className="result-pct">{pct}%</p>
        <p className="result-verdict">{verdict.verdict}</p>
        <button className="btn btn-primary" onClick={restart}>
          Set sail again
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-runner card">
      <div className="quiz-progress">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>Topic: {question.topic || 'General'}</span>
      </div>
      <div className="quiz-bar" aria-hidden="true">
        <div className="quiz-bar-fill" style={{ width: `${pctDone}%` }} />
      </div>
      <h2 className="quiz-question">{question.question}</h2>
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (answered) {
            if (i === question.correct_index) cls += ' correct';
            else if (i === picked) cls += ' wrong';
            else cls += ' dimmed';
          }
          return (
            <button key={i} className={cls} onClick={() => pick(i)} disabled={answered}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`quiz-feedback ${picked === question.correct_index ? 'feedback-good' : 'feedback-bad'}`}>
          <p className="feedback-head">
            {picked === question.correct_index
              ? 'Correct! Well navigated — the favourable wind is yours.'
              : 'Not quite — the right answer is highlighted above. The wise learn from every wave.'}
          </p>
          <p>{question.explanation}</p>
          <button className="btn btn-primary" onClick={next}>
            {index + 1 < questions.length ? 'Next question' : 'See results'}
          </button>
        </div>
      )}
    </div>
  );
}
