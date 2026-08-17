import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { unlockOrder, readinessPct, getSeals, PROGRESS_EVENT } from '../games/progress';

const LEGS = [
  { kind: 'prose', label: 'Prose Cove', sub: 'stories of the shore' },
  { kind: 'poem', label: 'Poetry Isles', sub: 'verses on the tide' },
  { kind: 'play', label: 'Drama Strait', sub: 'the staged crossing' }
];

function SealMark({ state }) {
  if (state === 'sealed-gold') {
    return (
      <svg className="seal seal-gold" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <radialGradient id="seal-gold-g" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#f4d166" />
            <stop offset="100%" stopColor="#c9a227" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="21" fill="url(#seal-gold-g)" stroke="#8a6d10" strokeWidth="2" />
        <circle cx="24" cy="24" r="16.5" fill="none" stroke="#8a6d10" strokeWidth="1" opacity="0.6" />
        <path d="M24 10l3.2 9.4 9.8.3-7.7 6.1 2.7 9.4-8-5.5-8 5.5 2.7-9.4-7.7-6.1 9.8-.3z" fill="#8a6d10" />
      </svg>
    );
  }
  if (state === 'sealed') {
    return (
      <svg className="seal seal-copper" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" fill="#b87333" stroke="#7a4a1e" strokeWidth="2" />
        <circle cx="24" cy="24" r="16.5" fill="none" stroke="#7a4a1e" strokeWidth="1" opacity="0.6" />
        <path d="M24 13l2.4 7 7.4.2-5.8 4.6 2 7.1-6-4.2-6 4.2 2-7.1-5.8-4.6 7.4-.2z" fill="#7a4a1e" />
      </svg>
    );
  }
  if (state === 'unlocked') {
    return (
      <svg className="seal seal-open" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" fill="none" stroke="#141413" strokeWidth="1.6" strokeDasharray="4 3" />
        <circle cx="24" cy="24" r="15" fill="none" stroke="#ffd633" strokeWidth="1.2" />
        <path d="M24 17v7l5 3" fill="none" stroke="#141413" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="seal seal-locked" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="#141413" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.35" />
      <path d="M18 23v-4a6 6 0 0 1 12 0v4h-12zm0 0h12v8H18z" fill="#141413" opacity="0.35" />
    </svg>
  );
}

function Waypoint({ unit, state, kind }) {
  const locked = state === 'locked';
  const label = state === 'sealed-gold' ? 'Exam-ready — gold seal' : state === 'sealed' ? 'Completed — copper seal' : locked ? 'Chart locked — complete the previous unit' : 'Unlocked';
  const inner = (
    <>
      <span className="waypoint-seal">
        <SealMark state={state} />
      </span>
      <span className="waypoint-text">
        <span className="waypoint-title">{unit.title}</span>
        <span className="waypoint-author">By {unit.author}</span>
        {state === 'sealed-gold' && <span className="waypoint-status">Gold seal · exam-ready</span>}
        {state === 'sealed' && <span className="waypoint-status">Copper seal · completed</span>}
        {locked && <span className="waypoint-status">Chart not yet drawn</span>}
      </span>
    </>
  );
  if (locked) {
    return (
      <span className={`waypoint waypoint-locked kind-${kind}`} aria-disabled="true" title={label}>
        {inner}
      </span>
    );
  }
  return (
    <Link className={`waypoint kind-${kind}`} to={`/unit/${unit.id}/study`} title={label} aria-label={`${unit.title} — ${label}`}>
      {inner}
    </Link>
  );
}

export default function VoyageChart({ units }) {
  const [seals, setSeals] = useState(() => getSeals());
  const orders = useMemo(() => {
    const states = unlockOrder(units, seals);
    return Object.fromEntries(states.map((s) => [s.id, s.state]));
  }, [units, seals]);
  const pct = readinessPct(units, seals);

  useEffect(() => {
    const refresh = () => setSeals(getSeals());
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  return (
    <section className="voyage-chart card" id="book-shelf" aria-labelledby="chart-heading">
      <div className="chart-compass" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="#141413" strokeWidth="1.4">
          <circle cx="32" cy="32" r="26" strokeDasharray="3 3" opacity="0.5" />
          <path d="M32 6l4 22h-8z" fill="#ffd633" stroke="#141413" />
          <path d="M32 58l-4-22h8z" fill="#141413" opacity="0.8" />
          <path d="M6 32l22-4v8z" fill="#141413" opacity="0.5" />
          <path d="M58 32l-22 4v-8z" fill="#141413" opacity="0.5" />
        </svg>
      </div>
      <div className="chart-head">
        <p className="chart-kicker">The Voyage Chart</p>
        <h2 id="chart-heading">Chart your course through the Literature Reader</h2>
        <p className="chart-sub">
          Complete a unit’s quiz to seal it — every seal draws the path onward. Gold seals (90%+) mark
          exam-ready units.
        </p>
      </div>

      <div className="readiness">
        <div className="readiness-head">
          <span className="readiness-label">Board Exam Readiness</span>
          <span className="readiness-pct">{pct}%</span>
        </div>
        <div className="readiness-track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
          <div className="readiness-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="readiness-sub">
          {pct === 100
            ? 'Every unit sealed — the whole voyage is charted. Well sailed, Mariner.'
            : `${units.filter((u) => seals[u.id]).length} of ${units.length} units sealed so far.`}
        </p>
      </div>

      <div className="chart-legend" aria-hidden="true">
        <span className="legend-item"><span className="legend-swatch seal-gold-swatch" /> Gold seal — 90%+ on the quiz</span>
        <span className="legend-item"><span className="legend-swatch seal-copper-swatch" /> Copper seal — completed</span>
        <span className="legend-item"><span className="legend-swatch seal-open-swatch" /> Open course — unlocked</span>
        <span className="legend-item"><span className="legend-swatch seal-lock-swatch" /> Chart not yet drawn</span>
      </div>

      <div className="chart-legs">
        {LEGS.map((leg) => {
          const legUnits = units.filter((u) => (u.type || 'prose') === leg.kind);
          if (!legUnits.length) return null;
          return (
            <div className="chart-leg" key={leg.kind}>
              <div className="leg-head">
                <h3 className="leg-label">{leg.label}</h3>
                <p className="leg-sub">{leg.sub}</p>
              </div>
              <svg className="leg-path" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,10 C20,2 40,18 60,10 S90,18 100,10" fill="none" stroke="#141413" strokeWidth="1.4" strokeDasharray="6 5" opacity="0.5" />
              </svg>
              <div className="chart-leg-nodes">
                {legUnits.map((u) => (
                  <Waypoint key={u.id} unit={u} state={orders[u.id] || 'locked'} kind={leg.kind} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}