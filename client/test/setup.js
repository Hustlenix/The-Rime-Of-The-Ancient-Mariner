import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Simulate an unreachable school server: every fetch rejects, so the API
// client falls back to the bundled static data (preview mode). Deterministic
// and fast — no real network attempts in tests.
globalThis.fetch = vi.fn(() =>
  Promise.reject(new TypeError('Failed to fetch (stubbed: server unreachable)'))
);

// jsdom lacks scrollTo/matchMedia used by some browser code paths
window.scrollTo = () => {};
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// The real index.html ships a theme-color meta the ThemeToggle syncs.
if (!document.querySelector('meta[name="theme-color"]')) {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', '#141414');
  document.head.appendChild(meta);
}