import { useState } from 'react';

export default function QuestionCard({ question }) {
  const [show, setShow] = useState(false);

  return (
    <article className="q-card card">
      <p className="q-prompt">{question.prompt}</p>
      <button
        className="btn btn-outline btn-small"
        onClick={() => setShow((s) => !s)}
        aria-expanded={show}
      >
        {show ? 'Hide answer' : 'Show answer'}
      </button>
      {show && <p className="q-answer">{question.answer}</p>}
      {show && question.notes && <p className="q-notes">{question.notes}</p>}
    </article>
  );
}
