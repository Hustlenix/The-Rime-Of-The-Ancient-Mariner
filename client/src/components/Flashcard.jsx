export default function Flashcard({ card, flipped, onFlip }) {
  return (
    <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={onFlip} role="button" tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}>
      <div className="flip-inner">
        <div className="flip-face flip-front">
          <p className="flip-label">Question</p>
          <p className="flip-text">{card.prompt}</p>
          <p className="flip-hint">Click to flip</p>
        </div>
        <div className="flip-face flip-back">
          <p className="flip-label">Answer</p>
          <p className="flip-text">{card.answer}</p>
          <p className="flip-hint">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}
