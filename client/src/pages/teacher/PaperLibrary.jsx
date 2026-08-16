import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../authContext';

const STATUS_LABELS = { draft: 'Draft', submitted: 'Submitted', printed: 'Printed' };
const EXAM_TYPE_LABELS = { unit_test: 'Unit Test', half_yearly: 'Half-Yearly', full: 'Full Paper', practice: 'Practice', other: 'Other' };

export default function PaperLibrary() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mine');
  const [papers, setPapers] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = (scope) => {
    api
      .getPapers(scope === 'queue' ? { scope: 'all', status: 'submitted' } : {})
      .then((d) => setPapers(d.papers))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load(tab === 'queue' ? 'queue' : 'mine');
  }, [tab]);

  const act = async (fn, okMsg) => {
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(okMsg);
      load(tab === 'queue' ? 'queue' : 'mine');
    } catch (err) {
      setError(err.message);
    }
  };

  const statusTag = (s) => {
    const cls = s === 'printed' ? 'tag' : s === 'submitted' ? 'tag tag-yellow' : 'tag';
    return <span className={cls}>{STATUS_LABELS[s]}</span>;
  };

  return (
    <div className="page">
      <header className="page-head">
        <p className="page-kicker">Teacher tools</p>
        <h1 className="page-title">Paper Library</h1>
        <p className="page-intro">
          Your papers and the admin print queue. Build a new one from the library or duplicate any paper
          for a fast variant.
        </p>
      </header>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="toolbar">
        <Link className="btn btn-primary" to="/teacher/build">
          + Build new paper
        </Link>
        <div className="tabs" role="tablist">
          <button type="button" className={tab === 'mine' ? 'tab active' : 'tab'} onClick={() => setTab('mine')}>
            My papers
          </button>
          <button type="button" className={tab === 'queue' ? 'tab active' : 'tab'} onClick={() => setTab('queue')}>
            Print queue (all teachers)
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Exam</th>
              <th>Marks</th>
              <th>Questions</th>
              <th>Status</th>
              {tab === 'queue' && <th>Teacher</th>}
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(papers || []).map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/teacher/paper/${p.id}`}>{p.title}</Link>
                </td>
                <td>{EXAM_TYPE_LABELS[p.exam_type] || p.exam_type}</td>
                <td>{p.total_marks}</td>
                <td>{p.question_count}</td>
                <td>{statusTag(p.status)}</td>
                {tab === 'queue' && <td>{p.creator_name}</td>}
                <td className="cell-truncate">{p.updated_at}</td>
                <td>
                  <div className="cell-actions">
                    <Link className="btn btn-outline btn-small" to={`/teacher/paper/${p.id}`}>
                      View / print
                    </Link>
                    {p.created_by === user.id && (
                      <>
                        {p.status !== 'printed' && (
                          <Link className="btn btn-ghost btn-small" to={`/teacher/build/${p.id}`}>
                            Edit
                          </Link>
                        )}
                        {p.status !== 'submitted' && p.status !== 'printed' && p.question_count > 0 && (
                          <button type="button" className="btn btn-primary btn-small" onClick={() => act(() => api.submitPaper(p.id), 'Submitted to the print queue.')}>
                            Submit
                          </button>
                        )}
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => act(() => api.duplicatePaper(p.id), 'Duplicated as a new draft.')}>
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => {
                            if (window.confirm(`Delete paper "${p.title}"?`)) act(() => api.deletePaper(p.id), 'Paper deleted.');
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {tab === 'queue' && p.status === 'submitted' && p.created_by !== user.id && (
                      <button type="button" className="btn btn-primary btn-small" onClick={() => act(() => api.setPaperStatus(p.id, 'printed'), 'Marked as printed.')}>
                        Mark printed
                      </button>
                    )}
                    {tab === 'queue' && p.created_by === user.id && (
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => act(() => api.setPaperStatus(p.id, 'draft'), 'Pulled back to draft.')}>
                        Unsubmit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {papers && papers.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-note">
                  {tab === 'queue' ? 'No papers waiting to be printed.' : 'No papers yet — build your first one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}