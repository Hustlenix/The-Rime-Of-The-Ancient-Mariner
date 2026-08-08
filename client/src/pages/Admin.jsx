import { useEffect, useState } from 'react';
import { api, getUnitCatalog } from '../api';

const CATEGORIES = ['summary', 'theme', 'device', 'character', 'value', 'analysis', 'short', 'long'];

const EMPTY_QUESTION = { unit_id: '', category: 'short', prompt: '', answer: '', notes: '', sort_order: 0 };
const EMPTY_QUIZ = { unit_id: '', question: '', options: ['', '', '', ''], correct_index: 0, explanation: '', topic: '' };

function UnitSelect({ value, onChange, label = 'Unit' }) {
  const catalog = getUnitCatalog();
  return (
    <div className="form-field">
      <label htmlFor="unit-select">{label}</label>
      <select id="unit-select" value={value} onChange={(e) => onChange(e.target.value)} required>
        <option value="" disabled>
          Select a unit…
        </option>
        {catalog.books.map((b) => (
          <optgroup key={b.id} label={b.name}>
            {b.unitIds.map((id) => {
              const u = catalog.units.find((x) => x.id === id);
              return u ? (
                <option key={id} value={id}>
                  {u.title}
                </option>
              ) : null;
            })}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function AdminQuestions({ unitId }) {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(EMPTY_QUESTION);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    api
      .getQuestionsAdmin(unitId)
      .then((data) => setList(data.questions))
      .catch((e) => setError(e.message));
  };

  useEffect(load, [unitId]);

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.unit_id) {
      setError('Choose a unit first.');
      return;
    }
    const payload = { ...form, sort_order: Number(form.sort_order) || 0, notes: form.notes };
    try {
      if (editingId) {
        await api.updateQuestion(editingId, payload);
        setMessage('Question updated.');
      } else {
        await api.createQuestion(payload);
        setMessage('Question created.');
      }
      setForm({ ...EMPTY_QUESTION, unit_id: payload.unit_id });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (q) => {
    setEditingId(q.id);
    setForm({
      unit_id: q.unit_id,
      category: q.category,
      prompt: q.prompt,
      answer: q.answer,
      notes: q.notes || '',
      sort_order: q.sort_order ?? 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete question: ${q.prompt.slice(0, 60)}…?`)) return;
    try {
      await api.deleteQuestion(q.id);
      setMessage('Question deleted.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-section">
      <h2>{editingId ? `Edit question #${editingId}` : 'Add a question'}</h2>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
      <form className="admin-form" onSubmit={save}>
        <UnitSelect value={form.unit_id} onChange={(v) => setForm({ ...form, unit_id: v })} />
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="q-category">Category</label>
            <select
              id="q-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="q-order">Sort order</label>
            <input
              id="q-order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="q-prompt">Prompt / title</label>
          <input
            id="q-prompt"
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="q-answer">Answer / body</label>
          <textarea
            id="q-answer"
            rows="4"
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="q-notes">Notes (optional)</label>
          <textarea
            id="q-notes"
            rows="2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Save changes' : 'Add question'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_QUESTION, unit_id: form.unit_id });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>All questions ({list ? list.length : '…'})</h2>
      {!list && <p className="page-loader">Loading…</p>}
      {list && list.length === 0 && <p className="empty-note">No questions yet.</p>}
      {list && list.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unit</th>
              <th>Category</th>
              <th>Prompt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td className="cell-truncate">{q.unit_id}</td>
                <td>{q.category}</td>
                <td className="cell-truncate">{q.prompt}</td>
                <td className="cell-actions">
                  <button className="btn btn-outline btn-small" onClick={() => edit(q)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => remove(q)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminQuizQuestions({ unitId }) {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(EMPTY_QUIZ);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    api
      .getQuizQuestionsAdmin(unitId)
      .then((data) => setList(data.questions))
      .catch((e) => setError(e.message));
  };

  useEffect(load, [unitId]);

  const setOption = (i, value) => {
    const options = [...form.options];
    options[i] = value;
    setForm({ ...form, options });
  };

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.unit_id) {
      setError('Choose a unit first.');
      return;
    }
    const payload = { ...form, correct_index: Number(form.correct_index) };
    try {
      if (editingId) {
        await api.updateQuizQuestion(editingId, payload);
        setMessage('Quiz question updated.');
      } else {
        await api.createQuizQuestion(payload);
        setMessage('Quiz question created.');
      }
      setForm({ ...EMPTY_QUIZ, unit_id: payload.unit_id });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (q) => {
    setEditingId(q.id);
    setForm({
      unit_id: q.unit_id,
      question: q.question,
      options: [...q.options],
      correct_index: q.correct_index,
      explanation: q.explanation,
      topic: q.topic || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (q) => {
    if (!window.confirm(`Delete quiz question: ${q.question.slice(0, 60)}…?`)) return;
    try {
      await api.deleteQuizQuestion(q.id);
      setMessage('Quiz question deleted.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-section">
      <h2>{editingId ? `Edit quiz question #${editingId}` : 'Add a quiz question'}</h2>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
      <form className="admin-form" onSubmit={save}>
        <UnitSelect value={form.unit_id} onChange={(v) => setForm({ ...form, unit_id: v })} />
        <div className="form-field">
          <label htmlFor="zq-question">Question</label>
          <input
            id="zq-question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="zq-topic">Topic (e.g. Plot, Theme, Poetic Device)</label>
          <input
            id="zq-topic"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          />
        </div>
        {form.options.map((opt, i) => (
          <div className="form-field" key={i}>
            <label htmlFor={`zq-opt-${i}`}>Option {String.fromCharCode(65 + i)}</label>
            <input
              id={`zq-opt-${i}`}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              required
            />
          </div>
        ))}
        <div className="form-field">
          <label htmlFor="zq-correct">Correct option</label>
          <select
            id="zq-correct"
            value={form.correct_index}
            onChange={(e) => setForm({ ...form, correct_index: Number(e.target.value) })}
          >
            {form.options.map((_, i) => (
              <option key={i} value={i}>
                {String.fromCharCode(65 + i)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="zq-explanation">Explanation</label>
          <textarea
            id="zq-explanation"
            rows="2"
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Save changes' : 'Add quiz question'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_QUIZ, unit_id: form.unit_id });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>All quiz questions ({list ? list.length : '…'})</h2>
      {!list && <p className="page-loader">Loading…</p>}
      {list && list.length === 0 && <p className="empty-note">No quiz questions yet.</p>}
      {list && list.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unit</th>
              <th>Topic</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td className="cell-truncate">{q.unit_id}</td>
                <td>{q.topic}</td>
                <td className="cell-truncate">{q.question}</td>
                <td>{String.fromCharCode(65 + q.correct_index)}</td>
                <td className="cell-actions">
                  <button className="btn btn-outline btn-small" onClick={() => edit(q)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => remove(q)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Admin() {
  const catalog = getUnitCatalog();
  const [tab, setTab] = useState('questions');
  const [unitId, setUnitId] = useState('all');

  return (
    <div>
      <h1 className="page-title">Admin — Question Bank</h1>
      <p className="page-intro">Teacher-only area. Add, edit and delete content for the portal.</p>

      <div className="filter-row">
        <label htmlFor="admin-unit">Unit:</label>
        <select id="admin-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="all">All units</option>
          {catalog.books.map((b) => (
            <optgroup key={b.id} label={b.name}>
              {b.unitIds.map((id) => {
                const u = catalog.units.find((x) => x.id === id);
                return u ? (
                  <option key={id} value={id}>
                    {u.title}
                  </option>
                ) : null;
              })}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'questions' ? 'active' : ''}`} onClick={() => setTab('questions')}>
          Questions
        </button>
        <button className={`tab ${tab === 'quiz' ? 'active' : ''}`} onClick={() => setTab('quiz')}>
          Quiz Questions
        </button>
      </div>
      {tab === 'questions' ? (
        <AdminQuestions unitId={unitId === 'all' ? null : unitId} />
      ) : (
        <AdminQuizQuestions unitId={unitId === 'all' ? null : unitId} />
      )}
    </div>
  );
}
