import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEVICE_PROMPTS, pickRound } from '../games/pairs';

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function SealScore({ score, total, pct, mode }) {
  const rank = pct >= 90 ? 'Gold seal' : pct >= 70 ? 'Copper seal' : pct >= 40 ? 'Bronze seal' : 'Still on the chart';
  return (
    <div className="game-score card">
      <svg className="game-seal" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" fill="none" stroke="#141413" strokeWidth="2" />
        <circle cx="24" cy="24" r="16.5" fill="none" stroke="#ffd633" strokeWidth="1.4" />
        <path d="M24 11l3.4 8.6 9-.4-7 5.4 2.3 8.8-7.7-4.7-7.7 4.7 2.3-8.8-7-5.4 9 .4z" fill="#ffd633" stroke="#141413" strokeWidth="1" />
      </svg>
      <h2 className="game-score-title">Voyage complete</h2>
      <p className="game-score-line">
        {score} of {total} — <strong>{pct}%</strong>
      </p>
      <p className="game-score-rank">{rank}</p>
      <div className="game-score-actions">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Sail again
        </button>
        <Link className="btn btn-outline" to="/flashcards">
          Back to flashcards
        </Link>
      </div>
    </div>
  );
}

function QuoteMatcher() {
  const round = useMemo(() => pickRound(6), []);
  const answers = useMemo(() => shuffle(round.map((p) => p.answer)), [round]);
  const [pickedQuote, setPickedQuote] = useState(null);
  const [matched, setMatched] = useState(() => new Set());
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState(null);

  const pick = (answer) => {
    if (pickedQuote == null || matched.has(answer)) return;
    if (round[pickedQuote].answer === answer) {
      const next = new Set(matched);
      next.add(answer);
      setMatched(next);
      setPickedQuote(null);
      setWrong(null);
    } else {
      setMisses((m) => m + 1);
      setWrong(pickedQuote);
      window.setTimeout(() => setWrong((w) => (w === pickedQuote ? null : w)), 800);
    }
  };

  const done = matched.size === round.length;

  if (done) {
    const firstTry = Math.max(0, round.length - misses);
    return <SealScore score={firstTry} total={round.length} pct={Math.round((firstTry / round.length) * 100)} mode="quote" />;
  }

  return (
    <div className="game-board">
      <p className="game-rules">
        Pair each quote with its source. Tap a quote, then tap its answer. A wrong guess flashes the
        quote — tap again to keep going.
      </p>
      <div className="match-grid">
        <div className="match-col match-quotes" aria-label="Quotes">
          {round.map((pair, i) => {
            const locked = matched.has(pair.answer);
            return (
              <button
                key={pair.quote}
                type="button"
                className={`match-card quote-card ${pickedQuote === i ? 'picked' : ''} ${locked ? 'locked' : ''} ${wrong === i ? 'wrong' : ''}`}
                disabled={locked}
                onClick={() => setPickedQuote(locked ? null : i)}
              >
                <span className="match-card-label">Quote</span>
                <span className="match-card-text">“{pair.quote}”</span>
                {wrong === i && <span className="match-card-note">Not that one — try another</span>}
              </button>
            );
          })}
        </div>
        <div className="match-col match-answers" aria-label="Answers">
          {answers.map((answer) => {
            const locked = matched.has(answer);
            return (
              <button
                key={answer}
                type="button"
                className={`match-card answer-card ${locked ? 'locked' : ''}`}
                disabled={locked}
                onClick={() => pick(answer)}
              >
                <span className="match-card-label">Source</span>
                <span className="match-card-text">{answer}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="match-progress">
        {matched.size} of {round.length} paired
      </p>
    </div>
  );
}

function DeviceSpeedRun() {
  const DURATION = 60;
  const prompts = useMemo(() => shuffle(DEVICE_PROMPTS), []);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const lastGain = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timer);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = prompts[index % prompts.length];
  const options = useMemo(() => shuffle(current.options), [current]);

  const guess = (device) => {
    if (feedback) return;
    const correct = device === current.correct;
    if (correct) {
      const nextStreak = streak + 1;
      const gain = 10 * nextStreak;
      lastGain.current = gain;
      setStreak(nextStreak);
      setScore((s) => s + gain);
      setFeedback({ ok: true });
    } else {
      setStreak(0);
      setFeedback({ ok: false, correct: current.correct });
    }
    window.setTimeout(() => {
      setFeedback(null);
      if (index + 1 < prompts.length) setIndex(index + 1);
      else setDone(true);
    }, 900);
  };

  if (done) {
    return <SealScore score={score} total={DURATION * 10} pct={Math.min(100, Math.round((score / (DURATION * 10)) * 100))} mode="speed" />;
  }

  return (
    <div className="game-board">
      <div className="speedrun-top">
        <span className="timer">⏱ {timeLeft}s</span>
        <span className="streak-meter">Streak ×{streak + 1}</span>
        <span className="score-meter">{score} pts</span>
      </div>
      <div className="extract-card card">
        <p className="extract-text">“{current.extract}”</p>
        <p className="extract-source">{current.unitId.replace(/-/g, ' ')}</p>
      </div>
      {feedback && (
        <p className={`feedback ${feedback.ok ? 'good' : 'bad'}`}>
          {feedback.ok ? `Correct — +${lastGain.current} points!` : `Not that one — it is ${feedback.correct}.`}
        </p>
      )}
      <div className="device-options">
        {options.map((device) => (
          <button key={device} type="button" className="device-option" onClick={() => guess(device)}>
            {device}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Games() {
  const [mode, setMode] = useState(null);

  return (
    <div className="games">
      <header className="games-head">
        <p className="page-kicker">Literary Parlor Games</p>
        <h1 className="page-title">The Printing Press Arcade</h1>
        <p className="page-intro">
          Two timed parlour games for the exam hall — match the masters’ words and name the devices
          before the hourglass runs out.
        </p>
      </header>

      {mode === null && (
        <div className="game-mode-grid">
          <button type="button" className="game-mode card" onClick={() => setMode('quote')}>
            <span className="game-mode-icon" aria-hidden="true">“”</span>
            <h2>Quote Matcher</h2>
            <p>Pair famous lines with their poems and speakers. Six pairs, one voyage.</p>
          </button>
          <button type="button" className="game-mode card" onClick={() => setMode('speed')}>
            <span className="game-mode-icon" aria-hidden="true">⏱</span>
            <h2>Device Speed Run</h2>
            <p>Sixty seconds to name the poetic device in each extract. Streaks multiply your score.</p>
          </button>
        </div>
      )}

      {mode === 'quote' && <QuoteMatcher />}
      {mode === 'speed' && <DeviceSpeedRun />}

      {mode !== null && (
        <button type="button" className="btn btn-ghost btn-small back-to-games" onClick={() => setMode(null)}>
          ← Choose another game
        </button>
      )}
    </div>
  );
}