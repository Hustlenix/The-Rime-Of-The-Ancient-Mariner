import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const TYPE_LABELS = { prose: 'Prose', poem: 'Poem', play: 'Play' };

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getUnits()
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="home">
      <section className="hero hero-books">
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-school">The Ashok Leyland School</p>
          <h1 className="hero-title">Class X English Study Portal</h1>
          <p className="hero-tagline">Interact in English — Literature Reader</p>
          <p className="hero-sub">
            Every chapter and poem of your English Literature Reader, with deep summaries, themes,
            character sketches, poetic devices, model answers, quizzes and flashcards — exam-ready
            for the CBSE Class X board paper.
          </p>
          <div className="cta-row">
            <Link to="/search" className="btn btn-primary">
              Search the portal
            </Link>
            <Link to="/unit/rime-of-the-ancient-mariner/study" className="btn btn-outline">
              The Ancient Mariner — a classic
            </Link>
          </div>
        </div>
      </section>

      {error && <p className="error-text">Failed to load units: {error}</p>}
      {!data && !error && <p className="page-loader">Loading the book shelf…</p>}

      {data && (
        <div className="book-shelf">
          {data.books.map((book) => (
            <section key={book.id} className="book-section">
              <div className="book-section-head">
                <h2>{book.name}</h2>
                <p>{book.tagline}</p>
              </div>
              <div className="unit-grid">
                {book.units.map((u) => (
                  <Link key={u.id} to={`/unit/${u.id}/study`} className={`unit-card card book-${book.id}`}>
                    <div className="unit-card-top">
                      <span className={`type-badge type-${u.type}`}>{TYPE_LABELS[u.type] || u.type}</span>
                      {u.id === 'rime-of-the-ancient-mariner' && <span className="type-badge type-legacy">CLASSIC</span>}
                    </div>
                    <h3 className="unit-card-title">{u.title}</h3>
                    <p className="unit-card-author">By {u.author}</p>
                    {u.stats && (
                      <ul className="unit-card-stats">
                        {u.stats.summaries > 0 && <li>{u.stats.summaries} summaries</li>}
                        {u.stats.themes > 0 && <li>{u.stats.themes} themes</li>}
                        {u.stats.devices > 0 && <li>{u.stats.devices} poetic devices</li>}
                        {u.stats.questions > 0 && <li>{u.stats.questions} Q&A</li>}
                        {u.stats.quiz > 0 && <li>{u.stats.quiz} quiz questions</li>}
                      </ul>
                    )}
                    <span className="unit-card-go">Open unit →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="journey" aria-labelledby="journey-heading">
        <h2 id="journey-heading">How to use the portal</h2>
        <p className="journey-sub">
          One unit at a time — read, practise, then prove yourself.
        </p>
        <ol className="journey-grid">
          <li className="journey-step card">
            <span className="step-num" aria-hidden="true">1</span>
            <h3 className="step-title">Study</h3>
            <p className="step-text">
              Read the summaries, themes, character sketches and poetic devices for your unit.
            </p>
          </li>
          <li className="journey-step card">
            <span className="step-num" aria-hidden="true">2</span>
            <h3 className="step-title">Questions</h3>
            <p className="step-text">
              Practise the short and long answers with model answers — reveal them only after you
              have tried yourself.
            </p>
          </li>
          <li className="journey-step card">
            <span className="step-num" aria-hidden="true">3</span>
            <h3 className="step-title">Flashcards</h3>
            <p className="step-text">
              Flip through the question bank and track your progress as you master it.
            </p>
          </li>
          <li className="journey-step card">
            <span className="step-num" aria-hidden="true">4</span>
            <h3 className="step-title">Quiz</h3>
            <p className="step-text">
              Take the unit quiz again and again until every question feels familiar.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
