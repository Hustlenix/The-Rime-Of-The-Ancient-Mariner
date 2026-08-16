import { useEffect, useMemo, useState } from 'react';
import { api, getUnitCatalog } from '../../api';

const DIFFICULTY_LABELS = { 1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard' };
const TYPE_LABELS = { mcq: 'MCQ', short: 'Short', long: 'Long', extract: 'Extract' };
const RESOURCE_TYPE_LABELS = {
  school_bank: 'School Bank',
  pyq: 'PYQ',
  sample_paper: 'Sample Paper',
  question_bank: 'Question Bank',
  teacher_upload: 'Teacher Upload'
};
const EMPTY_Q = {
  resource_id: '',
  chapter: '',
  topic: '',
  difficulty: 3,
  type: 'short',
  marks: 2,
  year: '',
  question: '',
  answer: ''
};

function DifficultyTag({ level }) {
  const colors = { 1: 'var(--good)', 2: 'var(--green)', 3: 'var(--yellow)', 4: 'var(--gold)', 5: 'var(--red)' };
  return (
    <span
      className="tag"
      style={{ borderColor: colors[level], color: colors[level] }}
      title={`Difficulty ${level}: ${DIFFICULTY_LABELS[level]}`}
    >
      {DIFFICULTY_LABELS[level]}
    </span>
  );
}

function TeacherBank() {
  const catalog = getUnitCatalog();
  const unitOptions = useMemo(() => catalog.books.flatMap((b) => b.unitIds.map((id) => catalog.units.find((u) => u.id === id)).filter(Boolean)), [catalog]);

  const [tab, setTab] = useState('resources');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // ---- resources ----
  const [resources, setResources] = useState(null);
  const [personalCount, setPersonalCount] = useState(0);
  const [newResource, setNewResource] = useState({ name: '', type: 'pyq', description: '' });

  // ---- questions ----
  const [questions, setQuestions] = useState(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ resource: '', chapter: '', type: '', difficulty: '', year: '', q: '' });
  const [form, setForm] = useState(EMPTY_Q);
  const [editingId, setEditingId] = useState(null);

  // ---- import ----
  const [importResource, setImportResource] = useState('');
  const [importCsv, setImportCsv] = useState('');
  const [importResult, setImportResult] = useState(null);

  const loadResources = () => {
    api
      .getBankResources()
      .then((d) => {
        setResources(d.resources);
        setPersonalCount(d.personal_count);
      })
      .catch((e) => setError(e.message));
  };
  useEffect(loadResources, []);

  const loadQuestions = () => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) p[k] = v;
    });
    api
      .getBankQuestions({ ...p, limit: 200 })
      .then((d) => {
        setQuestions(d.questions);
        setTotal(d.total);
      })
      .catch((e) => setError(e.message));
  };
  useEffect(loadQuestions, [filters]);

  const clearMsg = () => {
    setMessage(null);
    setError(null);
  };

  const saveResource = async (e) => {
    e.preventDefault();
    clearMsg();
    try {
      await api.createBankResource(newResource);
      setNewResource({ name: '', type: 'pyq', description: '' });
      setMessage('Resource created.');
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteResource = async (r) => {
    if (!window.confirm(`Delete resource "${r.name}" and all its questions?`)) return;
    clearMsg();
    try {
      await api.deleteBankResource(r.id);
      setMessage('Resource deleted.');
      loadResources();
      loadQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    clearMsg();
    if (!form.chapter) {
      setError('Choose a chapter first.');
      return;
    }
    const payload = {
      ...form,
      resource_id: form.resource_id === '' ? null : form.resource_id,
      difficulty: Number(form.difficulty),
      marks: Number(form.marks),
      year: form.year === '' ? null : Number(form.year)
    };
    try {
      if (editingId) {
        await api.updateBankQuestion(editingId, payload);
        setMessage('Question updated.');
      } else {
        await api.createBankQuestion(payload);
        setMessage('Question added to the bank.');
      }
      setForm(EMPTY_Q);
      setEditingId(null);
      loadQuestions();
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  };

  const editQuestion = (q) => {
    setEditingId(q.id);
    setForm({
      resource_id: q.resource_id == null ? '' : String(q.resource_id),
      chapter: q.chapter,
      topic: q.topic || '',
      difficulty: q.difficulty,
      type: q.type,
      marks: q.marks,
      year: q.year == null ? '' : String(q.year),
      question: q.question,
      answer: q.answer || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteQuestion = async (q) => {
    if (!window.confirm(`Delete question: ${q.question.slice(0, 60)}…?`)) return;
    clearMsg();
    try {
      await api.deleteBankQuestion(q.id);
      setMessage('Question deleted.');
      loadQuestions();
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadTemplate = () => {
    const csv =
      'chapter,difficulty,type,marks,year,topic,question,answer\n' +
      'ozymandias,3,short,2,2024,power,"Who said ""My name is Ozymandias, king of kings""? Why?","The traveller quotes the inscription…"\n' +
      'snake,4,long,5,2024,,Discuss the poet\'s mixed feelings towards the snake.,';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-bank-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    clearMsg();
    setImportResult(null);
    try {
      const result = await api.importBankCsv(importResource === '' ? null : importResource, importCsv);
      setImportResult(result);
      setMessage(`Imported ${result.imported} question(s).`);
      loadQuestions();
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <p className="page-kicker">Teacher tools</p>
        <h1 className="page-title">Question Bank</h1>
        <p className="page-intro">
          Curate the question pool behind every paper: the seeded School Question Bank, PYQs, sample
          papers, question banks, and your own personal questions.
        </p>
      </header>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="tabs" role="tablist">
        <button type="button" className={tab === 'resources' ? 'tab active' : 'tab'} onClick={() => setTab('resources')}>
          Resources
        </button>
        <button type="button" className={tab === 'questions' ? 'tab active' : 'tab'} onClick={() => setTab('questions')}>
          Questions {questions && <span className="tab-count">{total}</span>}
        </button>
        <button type="button" className={tab === 'import' ? 'tab active' : 'tab'} onClick={() => setTab('import')}>
          Import CSV
        </button>
      </div>

      {tab === 'resources' && (
        <section className="teacher-section">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="res-name">Resource name</label>
              <input
                id="res-name"
                type="text"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                placeholder="e.g. Oswaal Question Bank 2025"
              />
            </div>
            <div className="form-field">
              <label htmlFor="res-type">Type</label>
              <select id="res-type" value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field form-grow">
              <label htmlFor="res-desc">Description (optional)</label>
              <input
                id="res-desc"
                type="text"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              />
            </div>
            <div className="form-field form-self">
              <button type="button" className="btn btn-primary" onClick={saveResource}>
                Add resource
              </button>
            </div>
          </div>

          <div className="bank-grid">
            <div className="bank-card">
              <div className="bank-card-head">
                <span className="bank-card-name">My Questions</span>
                <span className="tag">Personal</span>
              </div>
              <p className="bank-card-count">{personalCount} question{personalCount === 1 ? '' : 's'}</p>
              <p className="empty-note">Questions you type yourself, saved for reuse.</p>
            </div>
            {(resources || []).map((r) => (
              <div className="bank-card" key={r.id}>
                <div className="bank-card-head">
                  <span className="bank-card-name">{r.name}</span>
                  <span className="tag">{RESOURCE_TYPE_LABELS[r.type] || r.type}</span>
                  {r.is_system === 1 && <span className="tag tag-yellow">System</span>}
                </div>
                <p className="bank-card-count">
                  {r.question_count} question{r.question_count === 1 ? '' : 's'}
                </p>
                {r.description && <p className="bank-card-desc">{r.description}</p>}
                <p className="bank-card-meta">
                  {r.creator_name ? `by ${r.creator_name}` : 'seeded'} · {r.grade}
                </p>
                {r.is_system !== 1 && (
                  <div className="cell-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => {
                        const name = window.prompt('Rename resource', r.name);
                        if (name && name.trim()) {
                          api
                            .updateBankResource(r.id, { name: name.trim() })
                            .then(() => {
                              setMessage('Resource renamed.');
                              loadResources();
                            })
                            .catch((e) => setError(e.message));
                        }
                      }}
                    >
                      Rename
                    </button>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => deleteResource(r)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'questions' && (
        <section className="teacher-section">
          <form className="admin-form" onSubmit={saveQuestion}>
            <h2>{editingId ? `Edit question #${editingId}` : 'Add a question'}</h2>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="q-resource">Resource (blank = My Questions)</label>
                <select id="q-resource" value={form.resource_id} onChange={(e) => setForm({ ...form, resource_id: e.target.value })}>
                  <option value="">My Questions (personal)</option>
                  {(resources || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="q-chapter">Chapter</label>
                <select id="q-chapter" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} required>
                  <option value="" disabled>
                    Select a chapter…
                  </option>
                  {unitOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="q-type">Type</label>
                <select id="q-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="q-difficulty">Difficulty</label>
                <select id="q-difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="q-marks">Marks</label>
                <input id="q-marks" type="number" min="1" max="25" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
              </div>
              <div className="form-field">
                <label htmlFor="q-year">Year (PYQs)</label>
                <input id="q-year" type="number" placeholder="2024" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="q-topic">Topic</label>
              <input id="q-topic" type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. power, symbolism, character" />
            </div>
            <div className="form-field">
              <label htmlFor="q-question">Question</label>
              <textarea id="q-question" rows="3" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
            </div>
            <div className="form-field">
              <label htmlFor="q-answer">Model answer (optional — shown in the answer key)</label>
              <textarea id="q-answer" rows="3" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save changes' : 'Add to bank'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_Q);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="filters-bar">
            <div className="form-field">
              <label htmlFor="f-resource">Resource</label>
              <select id="f-resource" value={filters.resource} onChange={(e) => setFilters({ ...filters, resource: e.target.value })}>
                <option value="">All resources</option>
                <option value="personal">My Questions</option>
                {(resources || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="f-chapter">Chapter</label>
              <select id="f-chapter" value={filters.chapter} onChange={(e) => setFilters({ ...filters, chapter: e.target.value })}>
                <option value="">All chapters</option>
                {unitOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="f-type">Type</label>
              <select id="f-type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All types</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="f-difficulty">Difficulty</label>
              <select id="f-difficulty" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="f-year">Year</label>
              <input id="f-year" type="number" placeholder="2024" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
            </div>
            <div className="form-field form-grow">
              <label htmlFor="f-q">Search</label>
              <input id="f-q" type="search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Search question text…" />
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Chapter</th>
                  <th>Type</th>
                  <th>Marks</th>
                  <th>Difficulty</th>
                  <th>Year</th>
                  <th>Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(questions || []).map((q) => (
                  <tr key={q.id}>
                    <td className="cell-truncate" title={q.question}>
                      {q.question}
                      {q.resource_name && <span className="cell-sub">{q.resource_name}</span>}
                    </td>
                    <td>{q.chapter_title || q.chapter}</td>
                    <td>{TYPE_LABELS[q.type] || q.type}</td>
                    <td>{q.marks}</td>
                    <td>
                      <DifficultyTag level={q.difficulty} />
                    </td>
                    <td>{q.year || '—'}</td>
                    <td>{q.usage_count}</td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => editQuestion(q)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-small" onClick={() => deleteQuestion(q)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {questions && questions.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-note">
                      No questions match. Try clearing filters, or add a question above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'import' && (
        <section className="teacher-section">
          <div className="admin-form">
            <h2>Bulk import questions from a CSV</h2>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="imp-resource">Import into</label>
                <select id="imp-resource" value={importResource} onChange={(e) => setImportResource(e.target.value)}>
                  <option value="">My Questions (personal)</option>
                  {(resources || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field form-self">
                <label>&nbsp;</label>
                <button type="button" className="btn btn-outline" onClick={downloadTemplate}>
                  Download template
                </button>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="imp-csv">CSV content</label>
              <textarea
                id="imp-csv"
                rows="10"
                value={importCsv}
                onChange={(e) => setImportCsv(e.target.value)}
                placeholder="chapter,difficulty,type,marks,year,topic,question,answer&#10;ozymandias,3,short,2,2024,power,Who said X?,Answer text."
              />
            </div>
            <p className="empty-note">
              Columns: chapter (unit id), difficulty (1-5), type (mcq/short/long/extract), marks, year,
              topic, question, answer. Paste from Excel or use the template.
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={runImport} disabled={!importCsv.trim()}>
                Import
              </button>
            </div>
            {importResult && (
              <p className="success-text">
                {importResult.imported} question(s) imported
                {importResult.errors.length > 0 && `, ${importResult.errors.length} row(s) skipped`}.
              </p>
            )}
            {importResult && importResult.errors.length > 0 && (
              <ul className="error-list">
                {importResult.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-form">
            <h3>Unit ids for CSV chapters</h3>
            <ul className="unit-id-list">
              {unitOptions.map((u) => (
                <li key={u.id}>
                  <code>{u.id}</code> — {u.title}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

export default TeacherBank;