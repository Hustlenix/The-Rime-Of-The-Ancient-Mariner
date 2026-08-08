import { useState } from 'react';
import Flashcard from './Flashcard';

export default function FlashcardDeck({ cards, progress, user, onMark }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return <p className="empty-note">No cards available.</p>;

  const card = cards[index];
  const isKnown = user && progress[card.id] === 1;
  const isUnknown = user && progress[card.id] === 0;

  const flip = () => setFlipped((f) => !f);
  const go = (delta) => {
    setFlipped(false);
    setIndex((index + delta + cards.length) % cards.length);
  };
  const mark = (known) => {
    if (!user || !flipped) return;
    onMark(card.id, known);
  };

  return (
    <div className="deck">
      <Flashcard card={card} flipped={flipped} onFlip={flip} />
      <div className="deck-controls">
        <button className="btn btn-ghost" onClick={() => go(-1)}>
          ← Prev
        </button>
        <span className="deck-counter">
          {index + 1} / {cards.length}
        </span>
        <button className="btn btn-ghost" onClick={() => go(1)}>
          Next →
        </button>
      </div>
      <div className="deck-mark">
        {user ? (
          <>
            <button
              className={`btn ${isUnknown ? 'btn-learning' : 'btn-outline'}`}
              onClick={() => mark(false)}
              disabled={!flipped}
            >
              Still learning
            </button>
            <button
              className={`btn ${isKnown ? 'btn-known' : 'btn-outline'}`}
              onClick={() => mark(true)}
              disabled={!flipped}
            >
              ✓ Known
            </button>
          </>
        ) : (
          <p className="guest-note">Flip a card and log in to mark it Known / Still learning.</p>
        )}
      </div>
    </div>
  );
}
