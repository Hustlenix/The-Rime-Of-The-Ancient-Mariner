import { useState } from 'react';
import { api, getUnitCatalog } from '../api';
import SearchBar from '../components/SearchBar';

const CATEGORY_LABELS = {
  summary: 'Summary',
  theme: 'Theme',
  device: 'Poetic Device',
  character: 'Character',
  analysis: 'Analysis',
  value: 'Value',
  short: 'Short Answer',
  long: 'Long Answer'
};

const CATEGORY_ORDER = ['summary', 'theme', 'character', 'analysis', 'device', 'value', 'short', 'long'];

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
  const catalog = getUnitCatalog();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
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
      const data = await api.searchContent(q.trim(), scope === 'all' ? null : scope);
      setResults(data.results);
    } catch (e) {
      setError(e.message);
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const changeScope = (e) => {
    setScope(e.target.value);
    if (query.trim()) runSearch(query);
  };

  const grouped = {};
  if (results) {
    for (const r of results) {
      (grouped[r.category] = grouped[r.category] || []).push(r);
    }
  }

  const byUnit = {};
  if (results) {
    for (const r of results) {
      (byUnit[r.unitId] = byUnit[r.unitId] || []).push(r);
    }
  }

  return (
    <div>
      <h1 className="page-title">Search</h1>
      <p className="page-intro">
        Search across summaries, themes, characters, poetic devices and the question bank of every
        unit.
      </p>

      <div className="filter-row">
        <label htmlFor="search-scope">In:</label>
        <select id="search-scope" value={scope} onChange={changeScope}>
          <option value="all">All units</option>
          {catalog.books.map((b) => (
            <optgroup key={b.id} label={b.name}>
              {b.unitIds.map((id) => {
                const u = catalog.units.find((x) => x.id === id);
                return u ? (
                  <option key={id} value={id}>
                    {u.title}
                  </option>
                ) : null;
              })}
            </optgroup>
          ))}
        </select>
      </div>

      <SearchBar onSearch={runSearch} />

      {error && <p className="error-text">{error}</p>}
      {searching && <p className="page-loader">Searching the deep…</p>}
      {results !== null && !searching && (
        <div className="search-results">
          {results.length === 0 && <p className="empty-note">No matches for “{query}”.</p>}
          {scope === 'all' &&
            Object.keys(byUnit).map((unitId) => {
              const u = catalog.units.find((x) => x.id === unitId);
              return (
                <section key={unitId} className="search-group">
                  <h2 className="search-category">
                    {u ? u.title : unitId}
                    <span className="search-count">({byUnit[unitId].length})</span>
                  </h2>
                  {byUnit[unitId].map((r) => (
                    <article key={r.id} className="search-hit card">
                      <h3>
                        {CATEGORY_LABELS[r.category] || r.category}: {highlight(r.prompt, query)}
                      </h3>
                      <p>{highlight(r.answer, query)}</p>
                      {r.notes && <p className="q-notes">{highlight(r.notes, query)}</p>}
                    </article>
                  ))}
                </section>
              );
            })}
          {scope !== 'all' &&
            CATEGORY_ORDER.filter((cat) => grouped[cat]).map((cat) => (
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
