import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getUnitCatalog } from '../../api';

const DIFFICULTY_LABELS = { 1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard' };
const TYPE_LABELS = { mcq: 'MCQ', short: 'Short', long: 'Long', extract: 'Extract' };
const EXAM_TYPE_LABELS = { unit_test: 'Unit Test', half_yearly: 'Half-Yearly', full: 'Full Paper', practice: 'Practice', other: 'Other' };
const STATUS_LABELS = { draft: 'Draft', submitted: 'Submitted', printed: 'Printed' };

const STEPS = ['Details', 'Blueprint', 'Auto-fill', 'Review & edit', 'Export'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptySection() {
  return { label: '', count: 3, marks: 1, type: 'mcq', chapters: [], difficultyMin: 1, difficultyMax: 5, resources: [], chooseAny: null };
}

function Chips({ options, selected, onChange, placeholder }) {
  return (
    <div className="chips">
      {options.length === 0 && <span className="empty-note">{placeholder}</span>}
      {options.map((opt) => {
        const isOn = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            className={isOn ? 'chip chip-on' : 'chip'}
            onClick={() => onChange(isOn ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function QuestionPicker({ onPick, onClose, excludeIds }) {
  const catalog = getUnitCatalog();
  const unitOptions = useMemo(() => catalog.books.flatMap((b) => b.unitIds.map((id) => catalog.units.find((u) => u.id === id)).filter(Boolean)), [catalog]);
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ resource: '', chapter: '', type: '', difficulty: '', q: '' });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getBankResources().then((d) => setResources(d.resources)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '') p[k] = v;
    });
    if (excludeIds.length) p.exclude = excludeIds.join(',');
    api
      .getBankQuestions({ ...p, limit: 100 })
      .then((d) => setRows(d.questions))
      .catch((e) => setError(e.message));
  }, [filters, excludeIds]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Pick a question</h2>
          <button type="button" className="btn btn-ghost btn-small" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="filters-bar">
          <div className="form-field">
            <label htmlFor="p-resource">Resource</label>
            <select id="p-resource" value={filters.resource} onChange={(e) => setFilters({ ...filters, resource: e.target.value })}>
              <option value="">All</option>
              <option value="personal">My Questions</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="p-chapter">Chapter</label>
            <select id="p-chapter" value={filters.chapter} onChange={(e) => setFilters({ ...filters, chapter: e.target.value })}>
              <option value="">All</option>
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="p-type">Type</label>
            <select id="p-type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="p-diff">Difficulty</label>
            <select id="p-diff" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field form-grow">
            <label htmlFor="p-q">Search</label>
            <input id="p-q" type="search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="modal-list">
          {(rows || []).map((q) => (
            <div className="modal-row" key={q.id}>
              <div className="modal-row-text">
                <p>{q.question}</p>
                <p className="cell-sub">
                  {q.chapter_title} · {TYPE_LABELS[q.type] || q.type} · {q.marks} mark{q.marks === 1 ? '' : 's'} · {DIFFICULTY_LABELS[q.difficulty]}
                  {q.resource_name ? ` · ${q.resource_name}` : ''}
                </p>
              </div>
              <button type="button" className="btn btn-primary btn-small" onClick={() => onPick(q)}>
                Pick
              </button>
            </div>
          ))}
          {rows && rows.length === 0 && <p className="empty-note">No matching questions.</p>}
        </div>
      </div>
    </div>
  );
}

export default function PaperBuilder() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const catalog = getUnitCatalog();
  const unitOptions = useMemo(() => catalog.books.flatMap((b) => b.unitIds.map((id) => catalog.units.find((u) => u.id === id)).filter(Boolean)), [catalog]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(!!paperId);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [resources, setResources] = useState([]);

  const [paperIdSaved, setPaperIdSaved] = useState(paperId ? Number(paperId) : null);
  const [paperStatus, setPaperStatus] = useState(null);
  const [details, setDetails] = useState({
    title: '',
    exam_type: 'unit_test',
    duration_minutes: 60,
    instructions: '',
    school: 'The Ashok Leyland School',
    klass: '',
    date: today()
  });
  const [structure, setStructure] = useState([{ ...emptySection(), label: 'Section A' }]);
  const [questions, setQuestions] = useState([]);
  const [picker, setPicker] = useState(null); // { sectionIndex, replaceId } | null

  useEffect(() => {
    api.getTemplates().then((d) => setTemplates(d.templates)).catch(() => {});
    api.getBankResources().then((d) => setResources(d.resources)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!paperId) return;
    api
      .getPaper(paperId)
      .then((d) => {
        const p = d.paper;
        setPaperStatus(p.status);
        setDetails({
          title: p.title,
          exam_type: p.exam_type,
          duration_minutes: p.duration_minutes,
          instructions: p.instructions || '',
          school: (p.header && p.header.school) || 'The Ashok Leyland School',
          klass: (p.header && p.header.klass) || '',
          date: (p.header && p.header.date) || today()
        });
        setStructure(Array.isArray(p.structure) && p.structure.length ? p.structure : [{ ...emptySection(), label: 'Section A' }]);
        setQuestions(d.questions.map((q) => ({ ...q, is_custom: !!q.is_custom })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [paperId]);

  const totalMarks = useMemo(() => questions.reduce((s, q) => s + q.marks, 0), [questions]);
  const blueprintMarks = useMemo(() => structure.reduce((s, sec) => s + sec.count * sec.marks, 0), [structure]);
  const sections = useMemo(() => {
    const arr = [];
    structure.forEach((sec, i) => {
      arr.push({ ...sec, index: i, qs: questions.filter((q) => q.section_index === i).sort((a, b) => a.position - b.position) });
    });
    return arr;
  }, [structure, questions]);

  const saveDraft = async (submit = false) => {
    setError(null);
    setMessage(null);
    if (!details.title.trim()) {
      setError('Give the paper a title first.');
      setStep(1);
      return;
    }
    const payload = {
      title: details.title,
      exam_type: details.exam_type,
      duration_minutes: Number(details.duration_minutes) || 60,
      instructions: details.instructions,
      header: { school: details.school, klass: details.klass, date: details.date },
      structure,
      questions: questions.map((q, i) => ({
        section_index: q.section_index,
        position: i,
        bank_question_id: q.bank_question_id,
        is_custom: q.is_custom,
        question: q.question,
        marks: q.marks,
        chapter: q.chapter,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        answer: q.answer,
        source_name: q.source_name || ''
      }))
    };
    try {
      let id = paperIdSaved;
      if (id) {
        const d = await api.updatePaper(id, payload);
        setPaperStatus(d.paper.status);
        setMessage('Draft saved.');
      } else {
        const d = await api.createPaper(payload);
        id = d.paper.id;
        setPaperIdSaved(id);
        setPaperStatus(d.paper.status);
        setMessage('Draft saved. You can keep editing or submit it below.');
      }
      if (submit && id) {
        const d = await api.submitPaper(id);
        setPaperStatus(d.paper.status);
        setMessage('Paper submitted to the admin print queue.');
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const autoFill = async (sectionIndex = null) => {
    setError(null);
    const indexes = sectionIndex == null ? structure.map((_, i) => i) : [sectionIndex];
    const specs = indexes.map((i) => ({
      index: i,
      count: structure[i].count,
      marks: structure[i].marks,
      type: structure[i].type,
      chapters: structure[i].chapters,
      difficultyMin: structure[i].difficultyMin,
      difficultyMax: structure[i].difficultyMax,
      resources: structure[i].resources
    }));
    const excludeIds = questions.filter((q) => q.bank_question_id).map((q) => q.bank_question_id);
    try {
      const d = await api.autoFillSections(specs, excludeIds);
      let missingNote = null;
      setQuestions((prev) => {
        let next = [...prev];
        for (const res of d.sections) {
          const i = res.index;
          next = next.filter((q) => q.section_index !== i || q.is_custom);
          res.picks.forEach((p, pos) => {
            next.push({
              section_index: i,
              position: pos,
              bank_question_id: p.id,
              is_custom: false,
              question: p.question,
              marks: p.marks,
              chapter: p.chapter,
              topic: p.topic || '',
              difficulty: p.difficulty,
              type: p.type,
              answer: p.answer || null,
              source_name: p.resource_name || ''
            });
          });
          if (res.missing > 0) {
            missingNote = `Section "${structure[i].label}": ${res.missing} slot(s) left empty — no matching questions in the bank.`;
          }
        }
        return next;
      });
      if (missingNote) setMessage(missingNote);
    } catch (err) {
      setError(err.message);
    }
  };

  const move = (sectionIndex, position, dir) => {
    setQuestions((prev) => {
      const inSection = prev.filter((q) => q.section_index === sectionIndex).sort((a, b) => a.position - b.position);
      const target = position + dir;
      if (target < 0 || target >= inSection.length) return prev;
      const a = inSection[position];
      const b = inSection[target];
      return prev.map((q) => {
        if (q.id === a.id || (q.id === undefined && q === a)) return { ...b, position };
        if (q.id === b.id || (q.id === undefined && q === b)) return { ...a, position: target };
        return q;
      });
    });
  };

  const removeQuestion = (sectionIndex, position) => {
    setQuestions((prev) =>
      prev
        .filter((q) => !(q.section_index === sectionIndex && q.position === position))
        .map((q) => (q.section_index === sectionIndex && q.position > position ? { ...q, position: q.position - 1 } : q))
    );
  };

  const swapQuestion = (sectionIndex, position, picked) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.section_index === sectionIndex && q.position === position) {
          return {
            section_index,
            position,
            bank_question_id: picked.id,
            is_custom: false,
            question: picked.question,
            marks: picked.marks,
            chapter: picked.chapter,
            topic: picked.topic || '',
            difficulty: picked.difficulty,
            type: picked.type,
            answer: picked.answer || null,
            source_name: picked.resource_name || ''
          };
        }
        return q;
      })
    );
    setPicker(null);
  };

  const addCustom = (sectionIndex) => {
    setQuestions((prev) => {
      const inSection = prev.filter((q) => q.section_index === sectionIndex);
      return [
        ...prev,
        {
          section_index: sectionIndex,
          position: inSection.length,
          bank_question_id: null,
          is_custom: true,
          question: '',
          marks: structure[sectionIndex].marks,
          chapter: structure[sectionIndex].chapters[0] || '',
          topic: '',
          difficulty: 3,
          type: 'short',
          answer: null,
          source_name: ''
        }
      ];
    });
    setMessage('A blank custom question was added — type its text below, then save.');
  };

  const drift = totalMarks !== blueprintMarks;

  if (loading) return <div className="page-loader">Loading paper…</div>;

  return (
    <div className="page">
      <header className="page-head">
        <p className="page-kicker">Teacher tools</p>
        <h1 className="page-title">{paperIdSaved ? details.title || 'Edit paper' : 'Build a question paper'}</h1>
        <p className="page-intro">
          {paperStatus && (
            <span className="tag tag-yellow" style={{ marginRight: '0.5rem' }}>
              {STATUS_LABELS[paperStatus]}
            </span>
          )}
          Step {step} of 5 — {STEPS[step - 1]}. Total: <strong>{totalMarks} marks</strong>
          {drift && <span className="drift-note"> (blueprint says {blueprintMarks})</span>}
        </p>
      </header>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {paperStatus === 'printed' && (
        <div className="notice">
          This paper is printed and locked. <Link to={`/teacher/library`}>Back to library</Link>, or duplicate it to make changes.
        </div>
      )}

      <nav className="wizard-steps" aria-label="Builder steps">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={step === i + 1 ? 'wizard-step active' : 'wizard-step'}
            onClick={() => setStep(i + 1)}
            disabled={paperStatus === 'printed'}
          >
            {i + 1}. {label}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <section className="admin-form">
          <h2>Paper details</h2>
          <div className="form-field">
            <label htmlFor="p-title">Title</label>
            <input id="p-title" type="text" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} placeholder="e.g. Literature Unit Test — Poetry" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="p-exam">Exam type</label>
              <select id="p-exam" value={details.exam_type} onChange={(e) => setDetails({ ...details, exam_type: e.target.value })}>
                {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="p-duration">Duration (minutes)</label>
              <input id="p-duration" type="number" min="5" max="600" value={details.duration_minutes} onChange={(e) => setDetails({ ...details, duration_minutes: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="p-date">Date</label>
              <input id="p-date" type="date" value={details.date} onChange={(e) => setDetails({ ...details, date: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="p-school">School name (header)</label>
              <input id="p-school" type="text" value={details.school} onChange={(e) => setDetails({ ...details, school: e.target.value })} />
            </div>
            <div className="form-field">
              <label htmlFor="p-klass">Class / section</label>
              <input id="p-klass" type="text" value={details.klass} onChange={(e) => setDetails({ ...details, klass: e.target.value })} placeholder="X-A" />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="p-instructions">General instructions</label>
            <textarea id="p-instructions" rows="3" value={details.instructions} onChange={(e) => setDetails({ ...details, instructions: e.target.value })} placeholder="Attempt all questions. Marks are indicated against each question." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Next: Blueprint
            </button>
            <button type="button" className="btn btn-outline" onClick={() => saveDraft()}>
              Save draft
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="admin-form">
          <h2>Section blueprint</h2>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="tpl-select">Start from a template</label>
              <select
                id="tpl-select"
                value=""
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === Number(e.target.value));
                  if (tpl) setStructure(tpl.structure.map((s, i) => ({ ...s, label: s.label || `Section ${String.fromCharCode(65 + i)}` })));
                }}
              >
                <option value="" disabled>
                  Choose a template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {structure.map((sec, i) => (
            <div className="blueprint-section" key={i}>
              <div className="form-row">
                <div className="form-field form-grow">
                  <label htmlFor={`sec-label-${i}`}>Section label</label>
                  <input id={`sec-label-${i}`} type="text" value={sec.label} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))} />
                </div>
                <div className="form-field">
                  <label htmlFor={`sec-count-${i}`}>Questions</label>
                  <input id={`sec-count-${i}`} type="number" min="1" max="50" value={sec.count} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, count: Math.max(1, Number(e.target.value) || 1) } : s)))} />
                </div>
                <div className="form-field">
                  <label htmlFor={`sec-marks-${i}`}>Marks each</label>
                  <input id={`sec-marks-${i}`} type="number" min="1" max="25" value={sec.marks} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, marks: Math.max(1, Number(e.target.value) || 1) } : s)))} />
                </div>
                <div className="form-field">
                  <label htmlFor={`sec-type-${i}`}>Type</label>
                  <select id={`sec-type-${i}`} value={sec.type} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, type: e.target.value } : s)))}>
                    <option value="any">Any type</option>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`sec-any-${i}`}>Answer any N of M (M)</label>
                  <input id={`sec-any-${i}`} type="number" min={sec.count + 1} placeholder="all" value={sec.chooseAny || ''} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, chooseAny: e.target.value === '' ? null : Math.max(sec.count + 1, Number(e.target.value) || 0) } : s)))} />
                </div>
                <div className="form-field form-self">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      setStructure(structure.filter((_, j) => j !== i));
                      setQuestions((prev) => prev.filter((q) => q.section_index !== i).map((q) => (q.section_index > i ? { ...q, section_index: q.section_index - 1 } : q)));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>Chapters (blank = all)</label>
                <Chips
                  options={unitOptions.map((u) => ({ value: u.id, label: u.title }))}
                  selected={sec.chapters}
                  onChange={(chapters) => setStructure(structure.map((s, j) => (j === i ? { ...s, chapters } : s)))}
                  placeholder="All chapters"
                />
              </div>
              <div className="form-field">
                <label>Resources (blank = all, incl. My Questions)</label>
                <Chips
                  options={[{ value: 'personal', label: 'My Questions' }, ...resources.map((r) => ({ value: String(r.id), label: r.name }))]}
                  selected={sec.resources}
                  onChange={(res) => setStructure(structure.map((s, j) => (j === i ? { ...s, resources: res } : s)))}
                  placeholder="All resources"
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor={`sec-dmin-${i}`}>Difficulty from</label>
                  <select id={`sec-dmin-${i}`} value={sec.difficultyMin} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, difficultyMin: Number(e.target.value) } : s)))}>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor={`sec-dmax-${i}`}>…to</label>
                  <select id={`sec-dmax-${i}`} value={sec.difficultyMax} onChange={(e) => setStructure(structure.map((s, j) => (j === i ? { ...s, difficultyMax: Number(e.target.value) } : s)))}>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-self">
                  <span className="section-total">
                    {sec.count} × {sec.marks} = <strong>{sec.count * sec.marks}</strong> marks
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStructure([...structure, { ...emptySection(), label: `Section ${String.fromCharCode(65 + structure.length)}` }])}
            >
              + Add section
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
              Next: Auto-fill
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="teacher-section">
          <div className="toolbar">
            <button type="button" className="btn btn-primary" onClick={() => autoFill(null)}>
              Auto-fill every section
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              Back
            </button>
            <span className="toolbar-note">Less-used questions are preferred; nothing is repeated within the paper.</span>
          </div>

          {sections.map((sec) => (
            <div className="blueprint-section" key={sec.index}>
              <div className="blueprint-head">
                <h3>
                  {sec.label} <span className="tag">{sec.count} × {sec.marks} marks</span>
                  {sec.qs.length < sec.count && <span className="tag tag-red">{sec.count - sec.qs.length} empty</span>}
                </h3>
                <button type="button" className="btn btn-outline btn-small" onClick={() => autoFill(sec.index)}>
                  Refill section
                </button>
              </div>
              {sec.qs.length === 0 && <p className="empty-note">No questions yet in this section.</p>}
              {sec.qs.map((q) => (
                <div className="pick-row" key={q.id || `${q.section_index}-${q.position}`}>
                  <span className="pick-num">{q.position + 1}.</span>
                  <div className="pick-text">
                    <p>{q.question}</p>
                    <p className="cell-sub">
                      {q.chapter_title || q.chapter || '—'} · {TYPE_LABELS[q.type] || q.type} · {q.marks} mark{q.marks === 1 ? '' : 's'} · {DIFFICULTY_LABELS[q.difficulty]}
                      {q.source_name && ` · ${q.source_name}`}
                      {q.is_custom && ' · your question'}
                    </p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => removeQuestion(sec.index, q.position)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ))}

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
              Next: Review &amp; edit
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="teacher-section">
          <div className="toolbar">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>
              Back
            </button>
            <span className="toolbar-note">
              Swap any question, reorder, edit text in place, or add your own.
              {drift && <span className="drift-note"> Totals drifted from the blueprint ({totalMarks} vs {blueprintMarks}) — check section sizes.</span>}
            </span>
          </div>

          {sections.map((sec) => (
            <div className="blueprint-section" key={sec.index}>
              <div className="blueprint-head">
                <h3>
                  {sec.label} <span className="tag">{sec.qs.reduce((s, q) => s + q.marks, 0)} / {sec.count * sec.marks} marks</span>
                </h3>
                <button type="button" className="btn btn-outline btn-small" onClick={() => addCustom(sec.index)}>
                  + Add my own question
                </button>
              </div>
              {sec.qs.map((q) => (
                <div className="review-row" key={q.id || `${q.section_index}-${q.position}`}>
                  <div className="cell-actions review-order">
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => move(sec.index, q.position, -1)} title="Move up" disabled={q.position === 0}>
                      ↑
                    </button>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => move(sec.index, q.position, 1)} title="Move down" disabled={q.position === sec.qs.length - 1}>
                      ↓
                    </button>
                  </div>
                  <div className="review-text">
                    <textarea
                      rows="2"
                      value={q.question}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((x) => (x.section_index === sec.index && x.position === q.position ? { ...x, question: e.target.value } : x))
                        )
                      }
                      aria-label="Question text"
                    />
                    <div className="form-row review-meta">
                      <div className="form-field">
                        <label htmlFor={`rm-chapter-${q.position}-${sec.index}`}>Chapter</label>
                        <select
                          id={`rm-chapter-${q.position}-${sec.index}`}
                          value={q.chapter}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((x) => (x.section_index === sec.index && x.position === q.position ? { ...x, chapter: e.target.value } : x))
                            )
                          }
                        >
                          <option value="">—</option>
                          {unitOptions.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor={`rm-marks-${q.position}-${sec.index}`}>Marks</label>
                        <input
                          id={`rm-marks-${q.position}-${sec.index}`}
                          type="number"
                          min="1"
                          max="25"
                          value={q.marks}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((x) => (x.section_index === sec.index && x.position === q.position ? { ...x, marks: Math.max(1, Number(e.target.value) || 1) } : x))
                            )
                          }
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`rm-diff-${q.position}-${sec.index}`}>Difficulty</label>
                        <select
                          id={`rm-diff-${q.position}-${sec.index}`}
                          value={q.difficulty}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((x) => (x.section_index === sec.index && x.position === q.position ? { ...x, difficulty: Number(e.target.value) } : x))
                            )
                          }
                        >
                          {[1, 2, 3, 4, 5].map((d) => (
                            <option key={d} value={d}>
                              {DIFFICULTY_LABELS[d]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="cell-actions">
                    <button type="button" className="btn btn-outline btn-small" onClick={() => setPicker({ sectionIndex: sec.index, position: q.position })}>
                      Swap
                    </button>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => removeQuestion(sec.index, q.position)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => setStep(5)}>
              Next: Export &amp; share
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="teacher-section">
          <div className="admin-form">
            <h2>Export &amp; share</h2>
            <p>
              <strong>{details.title || 'Untitled paper'}</strong> · {EXAM_TYPE_LABELS[details.exam_type]} · {totalMarks} marks ·{' '}
              {details.duration_minutes} min
            </p>
            <p>
              {structure.length} section{structure.length === 1 ? '' : 's'}, {questions.length} question{questions.length === 1 ? '' : 's'}.
            </p>
            {paperIdSaved && (
              <p>
                <Link className="btn btn-primary" to={`/teacher/paper/${paperIdSaved}`} target="_blank" rel="noopener noreferrer">
                  Open print view (PDF / print)
                </Link>
              </p>
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => saveDraft(false)}>
                Save draft
              </button>
              <button type="button" className="btn btn-primary" onClick={() => saveDraft(true)} disabled={questions.length === 0 || paperStatus === 'printed'}>
                Submit to admin queue
              </button>
              {paperStatus === 'submitted' && (
                <Link className="btn btn-ghost" to="/teacher/library">
                  View in library
                </Link>
              )}
            </div>
            {paperIdSaved && (
              <p className="empty-note">
                Save a new copy to reuse this paper as a template: open it in the library and hit Duplicate.
              </p>
            )}
          </div>
        </section>
      )}

      {picker && (
        <QuestionPicker
          onClose={() => setPicker(null)}
          excludeIds={questions.filter((q) => q.bank_question_id).map((q) => q.bank_question_id)}
          onPick={(picked) => swapQuestion(picker.sectionIndex, picker.position, picked)}
        />
      )}
    </div>
  );
}