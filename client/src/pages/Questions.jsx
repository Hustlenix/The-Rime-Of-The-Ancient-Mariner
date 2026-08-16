import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import QuestionCard from '../components/QuestionCard';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';
import UnitSwitcher from '../components/UnitSwitcher';
import Breadcrumbs from '../components/Breadcrumbs';
import { img } from '../asset';

export default function Questions() {
  const { unitId } = useParams();
  const meta = api.getUnitMeta(unitId);
  const [category, setCategory] = useState('short');
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setQuestions(null);
    setError(null);
    api
      .getQuestions(unitId, category)
      .then((data) => setQuestions(data.questions))
      .catch((e) => setError(e.message));
  }, [unitId, category]);

  if (!meta) {
    return (
      <div className="page">
        <h1 className="page-title">Unit not found</h1>
        <p className="page-intro">We could not find “{unitId}” on the shelf.</p>
        <Link className="btn btn-primary" to="/">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageBanner
        kicker="The question bank"
        title={`${meta.title} — Questions`}
        sub="Short and long answer questions with model answers. Click a question to reveal its answer."
        image={img('ice.jpg')}
      />
      <Breadcrumbs unitTitle={meta.title} />
      <UnitSwitcher currentId={meta.id} page="questions" />
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
