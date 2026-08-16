import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';

const STATUS_LABELS = { draft: 'Draft', submitted: 'Submitted', printed: 'Printed' };
const EXAM_TYPE_LABELS = { unit_test: 'Unit Test', half_yearly: 'Half-Yearly', full: 'Full Paper', practice: 'Practice', other: 'Other' };
const TYPE_LABELS = { mcq: 'MCQ', short: 'Short', long: 'Long', extract: 'Extract' };

function QuestionLine({ q, number }) {
  return (
    <div className="paper-question">
      <span className="paper-qnum">{number}.</span>
      <p className="paper-qtext">{q.question}</p>
      <span className="paper-qmarks">{q.marks}</span>
    </div>
  );
}

export default function PaperView() {
  const { paperId } = useParams();
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getPaper(paperId)
      .then((d) => {
        setPaper(d.paper);
        setQuestions(d.questions);
      })
      .catch((e) => setError(e.message));
  }, [paperId]);

  if (error) return <div className="page"><p className="error-text">{error}</p><Link className="btn btn-outline" to="/teacher/library">Back to library</Link></div>;
  if (!paper) return <div className="page-loader">Loading paper…</div>;

  const header = paper.header || {};
  const sections = (paper.structure || []).map((sec, i) => ({
    ...sec,
    qs: questions.filter((q) => q.section_index === i).sort((a, b) => a.position - b.position)
  }));
  const hasAnswers = questions.some((q) => q.answer);

  return (
    <div className="page">
      <header className="page-head">
        <p className="page-kicker">
          Teacher tools · <Link to="/teacher/library">Library</Link>
        </p>
        <h1 className="page-title">{paper.title}</h1>
        <p className="page-intro">
          <span className="tag">{STATUS_LABELS[paper.status]}</span>{' '}
          {EXAM_TYPE_LABELS[paper.exam_type]} · {paper.total_marks} marks · {paper.duration_minutes} min
        </p>
        <div className="toolbar print-hide">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          {hasAnswers && (
            <button type="button" className="btn btn-outline" onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? 'Hide answer key' : 'Show answer key'}
            </button>
          )}
          {paper.status !== 'printed' && (
            <Link className="btn btn-ghost" to={`/teacher/build/${paper.id}`}>
              Edit paper
            </Link>
          )}
          <Link className="btn btn-ghost" to="/teacher/library">
            Back to library
          </Link>
        </div>
      </header>

      <div className="paper-sheet">
        <div className="paper-header">
          <p className="paper-school">{header.school || 'The Ashok Leyland School'}</p>
          <h2 className="paper-title">{paper.title}</h2>
          <div className="paper-meta-row">
            <span>Class: {header.klass || '______'}</span>
            <span>Date: {header.date || '______'}</span>
            <span>Time: {paper.duration_minutes} min</span>
            <span>Max marks: {paper.total_marks}</span>
          </div>
          {paper.instructions && <p className="paper-instructions">{paper.instructions}</p>}
        </div>

        {sections.map((sec, i) => (
          <div className="paper-section" key={i}>
            <h3 className="paper-section-title">
              {sec.label} <span className="paper-section-marks">({sec.qs.reduce((s, q) => s + q.marks, 0)} marks)</span>
            </h3>
            {sec.chooseAny && <p className="paper-any">Answer any {sec.count} of the following {sec.chooseAny} questions.</p>}
            {sec.qs.map((q, j) => (
              <QuestionLine key={q.id || `${i}-${j}`} q={q} number={j + 1} />
            ))}
            {sec.qs.length === 0 && <p className="empty-note">No questions in this section.</p>}
          </div>
        ))}

        <p className="paper-end">— END OF PAPER —</p>

        {showAnswers && (
          <div className="paper-answers print-answers">
            <h3>Answer key</h3>
            {sections.map((sec, i) =>
              sec.qs
                .filter((q) => q.answer)
                .map((q, j) => (
                  <div className="answer-entry" key={`a-${q.id || `${i}-${j}`}`}>
                    <p className="answer-q">
                      {String.fromCharCode(65 + i)}.{j + 1} — {q.question}
                    </p>
                    <p className="answer-a">{q.answer}</p>
                  </div>
                ))
            )}
            {!hasAnswers && <p className="empty-note">No model answers are stored for these questions.</p>}
          </div>
        )}
      </div>
    </div>
  );
}