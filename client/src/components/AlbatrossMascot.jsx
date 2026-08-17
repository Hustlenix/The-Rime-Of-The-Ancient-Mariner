import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStreak, PROGRESS_EVENT } from '../games/progress';
import { tipForUnit, celebrationForStreak, randomCelebration } from '../games/mascotTips';

const DISMISS_KEY = 'tals-mascot-session';
const TIP_DELAY = 4500;
const TIP_INTERVAL = 30000;

// A woodcut-style albatross: ink outline with cross-hatch shading, a gold
// band on the wing. Pure SVG so it renders identically everywhere.
function AlbatrossArt() {
  return (
    <svg className="albatross-art" viewBox="0 0 120 100" fill="none" stroke="#141413" strokeWidth="2" aria-hidden="true">
      <path d="M60 58 L8 26 C18 20 34 22 42 30 L60 58 Z" />
      <path d="M60 58 L112 26 C102 20 86 22 78 30 L60 58 Z" />
      <path d="M60 62 C40 66 26 74 20 86 C28 84 40 82 48 78 C54 84 66 84 72 78 C80 82 92 84 100 86 C94 74 80 66 60 62 Z" />
      <path d="M60 58 C54 44 50 36 42 28 C52 24 58 26 60 32 C62 26 68 24 78 28 C70 36 66 44 60 58 Z" />
      <path d="M42 30 L52 38 M36 34 L44 42 M72 38 L78 30 M66 42 L74 34" strokeWidth="1.2" opacity="0.8" />
      <path d="M20 34 L30 40 M18 40 L27 46 M100 34 L90 40 M102 40 L93 46" strokeWidth="1" opacity="0.6" />
      <path d="M60 34 L60 44" strokeWidth="1.2" />
      <path d="M56 30 C58 26 62 26 64 30" strokeWidth="1.6" />
      <path d="M64 30 L76 33 L74 36 Z" fill="#ffd633" strokeWidth="1.2" />
      <path d="M52 66 C54 70 58 72 60 72 C62 72 66 70 68 66" strokeWidth="1.4" />
      <circle cx="60" cy="26" r="2.2" fill="#141413" stroke="none" />
    </svg>
  );
}

export default function AlbatrossMascot() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [tip, setTip] = useState(null);
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(() => getStreak());
  const celebratedRef = useRef(new Set());

  const unitId = (pathname.match(/^\/unit\/([^/]+)\//) || [])[1] || null;

  const showTip = (t) => {
    setTip(t);
    setOpen(true);
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') setDismissed(true);
    } catch {
      /* session storage blocked — keep the mascot visible */
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      const s = getStreak();
      setStreak(s);
      const celebration = celebrationForStreak(s);
      if (celebration && !celebratedRef.current.has(s)) {
        celebratedRef.current.add(s);
        showTip(celebration);
      }
    };
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const onUnit = window.setTimeout(() => {
      showTip(tipForUnit(unitId, getStreak()));
    }, TIP_DELAY);
    const interval = window.setInterval(() => {
      showTip(tipForUnit(unitId, getStreak()));
    }, TIP_INTERVAL);
    return () => {
      window.clearTimeout(onUnit);
      window.clearInterval(interval);
    };
  }, [dismissed, unitId]);

  if (dismissed) return null;

  return (
    <aside className={`mascot ${open ? 'open' : ''}`} aria-label="The Albatross — study guide">
      {open && tip && (
        <div className="mascot-bubble" role="status">
          <button type="button" className="mascot-dismiss" aria-label="Dismiss the Albatross" onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(DISMISS_KEY, '1');
            } catch {
              /* blocked storage — dismiss for this render only */
            }
          }}>
            ×
          </button>
          <span className={`mascot-kind kind-${tip.kind}`}>{tip.kind}</span>
          <p className="mascot-text">{tip.text}</p>
          <button type="button" className="mascot-shuffle" onClick={() => showTip(tipForUnit(unitId, getStreak()))}>
            Another tip
          </button>
        </div>
      )}
      <button type="button" className="mascot-trigger" aria-label={open ? 'Hide the Albatross' : 'Ask the Albatross'} onClick={() => {
        if (!open) showTip(tipForUnit(unitId, getStreak()));
        else setOpen(false);
      }}>
        <AlbatrossArt />
        <span className="mascot-hint">{streak > 0 ? `${streak} days at sea` : 'Albatross'}</span>
      </button>
    </aside>
  );
}