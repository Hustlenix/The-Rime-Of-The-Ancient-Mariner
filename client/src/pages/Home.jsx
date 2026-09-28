import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getLastUnit } from '../api';
import VoyageChart from '../components/VoyageChart';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const lastUnit = getLastUnit();

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
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const shelf = document.getElementById('book-shelf');
                if (shelf) shelf.scrollIntoView();
              }}
            >
              Browse the shelf
            </button>
          </div>
        </div>
      </section>

      {lastUnit && (
        <section className="continue-card" aria-label="Continue studying">
          <div className="continue-copy">
            <p className="continue-label">Pick up where you left off</p>
            <h2 className="continue-title">{lastUnit.title}</h2>
            <p className="continue-author">By {lastUnit.author}</p>
          </div>
          <Link className="btn btn-primary" to={`/unit/${lastUnit.id}/study`}>
            Continue studying
          </Link>
        </section>
      )}

      <section className="journey" aria-labelledby="quick-start-heading">
        <h2 id="quick-start-heading">Start here</h2>
        <p className="journey-sub">
          Want a quick tour? These four stops show the main study experience in under a minute.
        </p>
        <div className="journey-grid">
          <article className="journey-step card">
            <span className="step-num" aria-hidden="true">1</span>
            <h3 className="step-title">Ancient Mariner</h3>
            <p className="step-text">
              Open the poem that started this project and revise its summary, themes and devices.
            </p>
            <Link className="btn btn-outline" to="/unit/rime-of-the-ancient-mariner/study">
              Study the poem
            </Link>
          </article>
          <article className="journey-step card">
            <span className="step-num" aria-hidden="true">2</span>
            <h3 className="step-title">Question practice</h3>
            <p className="step-text">
              Attempt exam-style questions first, then reveal the model answer when you are ready.
            </p>
            <Link className="btn btn-outline" to="/unit/rime-of-the-ancient-mariner/questions">
              Try questions
            </Link>
          </article>
          <article className="journey-step card">
            <span className="step-num" aria-hidden="true">3</span>
            <h3 className="step-title">Printing Press Arcade</h3>
            <p className="step-text">
              Play the Quote Matcher and the timed Poetic Device Speed Run.
            </p>
            <Link className="btn btn-outline" to="/games">
              Play study games
            </Link>
          </article>
          <article className="journey-step card">
            <span className="step-num" aria-hidden="true">4</span>
            <h3 className="step-title">Search all 13 units</h3>
            <p className="step-text">
              Search across summaries, themes, poetic devices and the question bank.
            </p>
            <Link className="btn btn-outline" to="/search">
              Search the reader
            </Link>
          </article>
        </div>
      </section>

      {error && <p className="error-text">Failed to load units: {error}</p>}
      {!data && !error && <p className="page-loader">Loading the book shelf…</p>}

      {data && (
        <VoyageChart units={data.books.flatMap((b) => b.units.map((u) => ({ ...u, book: b.name })))} />
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
