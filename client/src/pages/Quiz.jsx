import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../authContext';
import QuizRunner from '../components/QuizRunner';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';
import UnitSwitcher from '../components/UnitSwitcher';
import { img } from '../asset';

export default function Quiz() {
  const { unitId } = useParams();
  const meta = api.getUnitMeta(unitId);
  const { user } = useAuth();
  const [attempts, setAttempts] = useState(null);

  const loadAttempts = useCallback(() => {
    if (!user) return;
    api
      .getAttempts()
      .then((data) => setAttempts(data.attempts))
      .catch(() => setAttempts([]));
  }, [user]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const handleFinish = async (score, total) => {
    if (!user) return;
    try {
      await api.submitAttempt(score, total);
      loadAttempts();
    } catch {
      // score saved silently on failure — practice continues
    }
  };

  const best = attempts && attempts.length
    ? Math.max(...attempts.map((a) => (a.total > 0 ? a.score / a.total : 0)))
    : null;

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
        kicker="Trial by water"
        title={`${meta.title} — Quiz Practice`}
        sub="Ten random multiple-choice questions, one at a time — with instant feedback and an explanation after every answer."
        image={img('lonely.jpg')}
      />
      <UnitSwitcher currentId={meta.id} page="quiz" />
      <MotivationBar />

      {user && attempts && (
        <div className="quiz-stats card">
          <span>
            Attempts: <strong>{attempts.length}</strong>
          </span>
          <span>
            Best score:{' '}
            <strong>{best !== null ? `${Math.round(best * 100)}%` : '—'}</strong>
          </span>
        </div>
      )}
      {!user && (
        <p className="guest-note">
          Practising as a guest — log in to save your scores and see your history.
        </p>
      )}

      <QuizRunner unitId={meta.id} onFinish={handleFinish} />
    </div>
  );
}
