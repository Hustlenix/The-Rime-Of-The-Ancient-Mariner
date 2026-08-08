import { useEffect, useState } from 'react';
import { api } from '../api';
import QuestionCard from '../components/QuestionCard';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';

export default function Questions() {
  const [category, setCategory] = useState('short');
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setQuestions(null);
    api
      .getQuestions(category)
      .then((data) => setQuestions(data.questions))
      .catch((e) => setError(e.message));
  }, [category]);

  return (
    <div>
      <PageBanner
        kicker="The question bank"
        title="Questions"
        sub="Short and long answer questions with model answers. Click a question to reveal its answer."
        image="/images/ice.jpg"
      />
      <MotivationBar />

      <div className="filter-row">
        <label htmlFor="category">Filter:</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="short">Short Answers</option>
          <option value="long">Long Answers</option>
          <option value="all">All</option>
        </select>
      </div>

      {error && <p className="error-text">Failed to load questions: {error}</p>}
      {!questions && !error && <p className="page-loader">Loading questions…</p>}
      {questions && (
        <div className="q-list">
          {questions.length === 0 && <p className="empty-note">No questions in this category.</p>}
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
