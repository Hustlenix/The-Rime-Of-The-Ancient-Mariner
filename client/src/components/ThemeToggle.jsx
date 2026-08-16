import { useEffect, useState } from 'react';

const KEY = 'tals-theme';

// Browser-chrome colour follows the active theme so the address bar
// matches the page background in both modes.
const THEME_COLORS = { dark: '#141414', light: '#f5f0e1' };

// Saved preference wins; otherwise fall back to the operating system
// preference so first-time visitors get the theme their device expects.
function getInitial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore storage errors */
  }
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore storage errors */
    }
  }, [theme]);

  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className="btn btn-ghost btn-small theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6Z" />
        </svg>
      )}
      <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
      <span className="sr-only" aria-live="polite">
        {theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
      </span>
    </button>
  );
}