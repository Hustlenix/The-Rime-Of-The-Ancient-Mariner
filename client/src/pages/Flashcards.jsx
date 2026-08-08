import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../authContext';
import FlashcardDeck from '../components/FlashcardDeck';
import PageBanner from '../components/PageBanner';
import MotivationBar from '../components/MotivationBar';

export default function Flashcards() {
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
    Promise.all([api.getQuestions('short'), api.getQuestions('long')])
      .then(([short, long]) => setCards([...short.questions, ...long.questions]))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleMark = async (questionId, known) => {
    if (!user) return;
    try {
      await api.markKnown(questionId, known);
      setProgress((p) => ({ ...p, [questionId]: known ? 1 : 0 }));
    } catch {
      // keep local state on failure
    }
  };

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
        title="Flashcards"
        sub="Built from the short and long answer questions. Click a card to flip it, then mark it Known or Still learning."
        image="/images/snakes.jpg"
      />
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
