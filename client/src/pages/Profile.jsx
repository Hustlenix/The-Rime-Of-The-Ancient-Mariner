import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../authContext';

export default function Profile() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState(null);
  const [progress, setProgress] = useState({});
  const [deckSize, setDeckSize] = useState(null);

  useEffect(() => {
    api
      .getAttempts()
      .then((data) => setAttempts(data.attempts))
      .catch(() => setAttempts([]));
    api
      .getFlashcardProgress()
      .then((data) => setProgress(data.progress || {}))
      .catch(() => setProgress({}));
    Promise.all([api.getQuestions('short'), api.getQuestions('long')])
      .then(([short, long]) => setDeckSize(short.questions.length + long.questions.length))
      .catch(() => setDeckSize(0));
  }, []);

  const known = Object.values(progress).filter((v) => v === 1).length;
  const unknown = Object.keys(progress).length - known;
  const pct = deckSize ? Math.round((known / deckSize) * 100) : 0;
  const best =
    attempts && attempts.length
      ? Math.max(...attempts.map((a) => (a.total > 0 ? a.score / a.total : 0)))
      : null;
  const bestPct = best !== null ? Math.round(best * 100) : 0;
  const masteryScore = Math.round(bestPct * 0.6 + pct * 0.4);
  const rank =
    masteryScore >= 80
      ? { name: 'Master Mariner', motto: 'You have crossed every sea this poem can throw at you. The exam will be plain sailing.' }
      : masteryScore >= 60
        ? { name: 'Helmsman', motto: 'Your hand is steady at the wheel. A few more voyages and the title is yours.' }
        : masteryScore >= 40
          ? { name: 'Shipmate', motto: 'The voyage is well begun. Keep studying, Shipmate — every tide lifts you higher.' }
          : { name: 'Landlubber', motto: 'Every master mariner was once a landlubber. Your first voyage starts today.' };
  const R = 42;
  const CIRC = 2 * Math.PI * R;

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-intro">Your logbook on the voyage through the poem.</p>

      <div className="profile-grid">
        <section className="card profile-card">
          <h2>About you</h2>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role === 'teacher' ? 'Teacher' : 'Student'}
          </p>
          <p>
            <strong>Member since:</strong> {String(user.created_at || '').slice(0, 10)}
          </p>
          <span className="profile-rank">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="5" r="2.2" />
              <path d="M12 7.2V21M12 21l-3.4-3M12 21l3.4-3M4.5 10.5c2.6 1.8 4.6 1.8 7.5 0s4.9-1.8 7.5 0" />
            </svg>
            {rank.name}
          </span>
          <p className="profile-motto">{rank.motto}</p>
        </section>

        <section className="card profile-card">
          <h2>Flashcard mastery</h2>
          <div className="profile-ring-row">
            <div className="progress-ring">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle className="ring-track" cx="50" cy="50" r={R} />
                <circle
                  className="ring-value"
                  cx="50"
                  cy="50"
                  r={R}
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - pct / 100)}
                />
              </svg>
              <span className="ring-label">{pct}%</span>
            </div>
            <div className="flash-stats">
              <p>
                <strong>{known}</strong> known · <strong>{unknown}</strong> still learning ·{' '}
                <strong>{deckSize ?? '…'}</strong> cards
              </p>
            </div>
          </div>
        </section>

        <section className="card profile-card">
          <h2>Quiz history</h2>
          <p>
            <strong>Attempts:</strong> {attempts ? attempts.length : '…'} ·{' '}
            <strong>Best score:</strong>{' '}
            {best !== null ? `${Math.round(best * 100)}%` : '—'}
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Attempt log</h2>
        {!attempts && <p className="page-loader">Loading attempts…</p>}
        {attempts && attempts.length === 0 && (
          <p className="empty-note">No quiz attempts yet — try the quiz!</p>
        )}
        {attempts && attempts.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Score</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a, i) => (
                <tr key={a.id}>
                  <td>{i + 1}</td>
                  <td>{String(a.created_at).slice(0, 16)}</td>
                  <td>
                    {a.score} / {a.total}
                  </td>
                  <td>{a.total > 0 ? `${Math.round((a.score / a.total) * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
