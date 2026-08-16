import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/authContext';

function renderApp() {
  return render(
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  );
}

describe('App shell', () => {
  it('renders the header, skip link, footer and auth actions', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Class X English Study Portal — Home/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();

    for (const label of ['Study', 'Questions', 'Quiz', 'Flashcards', 'Search']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByText('Class X English Study Portal — The Ashok Leyland School')).toBeInTheDocument();
  });

  it('lazily renders the Home page with the book shelf (static fallback data)', async () => {
    renderApp();

    // Lazy chunk loads asynchronously
    const heading = await screen.findByRole('heading', { name: 'Class X English Study Portal' });
    expect(heading).toBeInTheDocument();

    // All 13 units appear on the shelf
    expect(await screen.findByText('Two Gentlemen of Verona')).toBeInTheDocument();
    expect(screen.getByText('The Rime of the Ancient Mariner')).toBeInTheDocument();
    expect(screen.getByText('By Samuel Taylor Coleridge')).toBeInTheDocument();

    const unitCards = screen.getAllByRole('link', { name: /Open unit/ });
    expect(unitCards.length).toBe(13);

    // Journey section with four numbered steps
    expect(screen.getByRole('heading', { name: 'How to use the portal' })).toBeInTheDocument();
    expect(screen.getAllByText(/^[1-4]$/)).toHaveLength(4);
  });

  it('enters preview mode with a banner when the server is unreachable', async () => {
    localStorage.removeItem('tals-preview-dismissed');
    renderApp();
    expect(await screen.findByText(/Preview mode\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('shows a "Continue studying" card for the last opened lesson', async () => {
    localStorage.setItem('tals-last-unit', 'ozymandias');
    renderApp();
    expect(await screen.findByText('Pick up where you left off')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Continue studying' });
    expect(link).toHaveAttribute('href', '#/unit/ozymandias/study');
  });
});