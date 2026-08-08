import { useState } from 'react';
import { api } from '../api';
import SearchBar from '../components/SearchBar';

const CATEGORY_LABELS = {
  summary: 'Summary',
  theme: 'Theme',
  device: 'Poetic Device',
  short: 'Short Answer',
  long: 'Long Answer'
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, query) {
  if (!query) return text;
  const parts = String(text).split(new RegExp(`(${escapeRegExp(query)})`, 'ig'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);

  const runSearch = async (q) => {
    setQuery(q.trim());
    setError(null);
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await api.searchContent(q.trim());
      setResults(data.results);
    } catch (e) {
      setError(e.message);
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const grouped = {};
  if (results) {
    for (const r of results) {
      (grouped[r.category] = grouped[r.category] || []).push(r);
    }
  }
  const order = ['summary', 'theme', 'device', 'short', 'long'];

  return (
    <div>
      <h1 className="page-title">Search</h1>
      <p className="page-intro">
        Search across summaries, themes, poetic devices and the question bank.
      </p>

      <SearchBar onSearch={runSearch} />

      {error && <p className="error-text">{error}</p>}
      {searching && <p className="page-loader">Searching the deep…</p>}
      {results !== null && !searching && (
        <div className="search-results">
          {results.length === 0 && <p className="empty-note">No matches for “{query}”.</p>}
          {order
            .filter((cat) => grouped[cat])
            .map((cat) => (
              <section key={cat} className="search-group">
                <h2 className="search-category">{CATEGORY_LABELS[cat]}s</h2>
                {grouped[cat].map((r) => (
                  <article key={r.id} className="search-hit card">
                    <h3>{highlight(r.prompt, query)}</h3>
                    <p>{highlight(r.answer, query)}</p>
                    {r.notes && <p className="q-notes">{highlight(r.notes, query)}</p>}
                  </article>
                ))}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
