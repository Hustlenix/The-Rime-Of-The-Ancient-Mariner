import { useEffect, useState } from 'react';

const QUOTES = [
  {
    text: 'He prayeth best, who loveth best all things both great and small; for the dear God who loveth us, He made and loveth all.',
    source: 'The Mariner\u2019s final teaching'
  },
  {
    text: 'Water, water, everywhere, nor any drop to drink.',
    source: 'Part II'
  },
  {
    text: 'The ice was here, the ice was there, the ice was all around.',
    source: 'Part I'
  },
  {
    text: 'A sadder and a wiser man, he rose the morrow morn.',
    source: 'The Wedding Guest, Part VII'
  },
  {
    text: 'Day after day, day after day, we stuck, nor breath nor motion.',
    source: 'Part II'
  },
  {
    text: 'Instead of the cross, the Albatross about my neck was hung.',
    source: 'Part II'
  },
  {
    text: 'Alone, alone, all, all alone, alone on a wide wide sea!',
    source: 'Part IV'
  },
  {
    text: 'He holds him with his glittering eye \u2014 the Wedding-Guest stood still.',
    source: 'Part I'
  }
];

export default function MotivationBar() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % QUOTES.length), 9000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[index];

  return (
    <aside className="moti-bar" aria-label="Poem quote of the moment">
      <svg className="moti-anchor" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="5" r="2.2" />
        <path d="M12 7.2V21M12 21l-3.4-3M12 21l3.4-3M4.5 10.5c2.6 1.8 4.6 1.8 7.5 0s4.9-1.8 7.5 0" />
      </svg>
      <p className="moti-quote">
        “{q.text}”
        <span className="moti-source">{q.source}</span>
      </p>
    </aside>
  );
}
