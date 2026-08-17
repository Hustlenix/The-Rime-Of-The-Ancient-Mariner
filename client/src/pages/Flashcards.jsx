import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../authContext';
import FlashcardDeck from '../components/FlashcardDeck';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';
import UnitSwitcher from '../components/UnitSwitcher';
import Breadcrumbs from '../components/Breadcrumbs';
import { img } from '../asset';
import { logFlashcardsAnswered } from '../games/progress';

export default function Flashcards() {
  const { unitId } = useParams();
  const meta = api.getUnitMeta(unitId);
  const { user } = useAuth();
  const [cards, setCards] = useState(null);
  const [progress, setProgress] = useState({});
  const [error, setError] = useState(null);

  const loadProgress = useCallback(() => {
    if (!user) return;
    api
      .getFlashcardProgress()
      .then((data) => setProgress(data.progress || {}))
      .catch(() => setProgress({}));
  }, [user]);

  useEffect(() => {
    setCards(null);
    setError(null);
    Promise.all([api.getQuestions(unitId, 'short'), api.getQuestions(unitId, 'long')])
      .then(([short, long]) => setCards([...short.questions, ...long.questions]))
      .catch((e) => setError(e.message));
  }, [unitId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleMark = async (questionId, known) => {
    logFlashcardsAnswered(1);
    if (!user) return;
    try {
      await api.markKnown(questionId, known);
      setProgress((p) => ({ ...p, [questionId]: known ? 1 : 0 }));
    } catch {
      // keep local state on failure
    }
  };

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

  if (error) return <p className="error-text">Failed to load flashcards: {error}</p>;
  if (!cards) return <p className="page-loader">Loading flashcards…</p>;

  const knownCount = Object.values(progress).filter((v) => v === 1).length;
  const pct = cards.length ? Math.round((knownCount / cards.length) * 100) : 0;
  const R = 42;
  const CIRC = 2 * Math.PI * R;

  return (
    <div>
      <PageBanner
        kicker="Learn by heart"
        title={`${meta.title} — Flashcards`}
        sub="Built from the unit's short and long answer questions. Click a card to flip it, then mark it Known or Still learning."
        image={img('snakes.jpg')}
      />
      <Breadcrumbs unitTitle={meta.title} />
      <UnitSwitcher currentId={meta.id} page="flashcards" />
      <MotivationBar />

      <div className="flash-header">
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
            <strong>{knownCount}</strong> of {cards.length} cards known
          </p>
          {!user && <p className="guest-note">Log in to save your progress.</p>}
        </div>
      </div>

      <FlashcardDeck cards={cards} progress={progress} user={user} onMark={handleMark} />
    </div>
  );
}
