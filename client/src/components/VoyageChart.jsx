import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { unlockOrder, readinessPct, getSeals, PROGRESS_EVENT } from '../games/progress';

const LEGS = [
  {
    kind: 'prose',
    chapter: 'Chapter I',
    label: 'Prose Cove',
    sub: 'Short stories, narrative essays & prose lessons',
    icon: '📜',
    badgeText: 'Prose • 6 Lessons'
  },
  {
    kind: 'poem',
    chapter: 'Chapter II',
    label: 'Poetry Isles',
    sub: 'Lyrical verse, sonnets, ballads & poetic devices',
    icon: '🪶',
    badgeText: 'Poetry • 5 Poems'
  },
  {
    kind: 'play',
    chapter: 'Chapter III',
    label: 'Drama Strait',
    sub: 'Theatrical plays, dialogues & stage performances',
    icon: '🎭',
    badgeText: 'Drama • 2 Plays'
  }
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
        <circle cx="24" cy="24" r="16.5" fill="none" stroke="#8a6d10" strokeWidth="1.4" opacity="0.6" />
        <path d="M24 10l3.2 9.4 9.8.3-7.7 6.1 2.7 9.4-8-5.5-8 5.5 2.7-9.4-7.7-6.1 9.8-.3z" fill="#8a6d10" />
      </svg>
    );
  }
  if (state === 'sealed') {
    return (
      <svg className="seal seal-copper" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" fill="#b87333" stroke="#7a4a1e" strokeWidth="2" />
        <circle cx="24" cy="24" r="16.5" fill="none" stroke="#7a4a1e" strokeWidth="1.4" opacity="0.6" />
        <path d="M24 13l2.4 7 7.4.2-5.8 4.6 2 7.1-6-4.2-6 4.2 2-7.1-5.8-4.6 7.4-.2z" fill="#7a4a1e" />
      </svg>
    );
  }
  return (
    <svg className="seal seal-open" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.6" />
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M24 17v7l5 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function Waypoint({ unit, state, kind, icon }) {
  const statusLabel =
    state === 'sealed-gold'
      ? 'Gold seal — exam-ready'
      : state === 'sealed'
      ? 'Copper seal — completed'
      : 'Unlocked';

  return (
    <Link
      className="waypoint"
      to={`/unit/${unit.id}/study`}
      title={`${unit.title} — ${statusLabel}`}
      aria-label={`${unit.title} by ${unit.author} — ${statusLabel}`}
    >
      <span className={`waypoint-genre-tag tag-${kind}`}>
        {icon} {kind.toUpperCase()}
      </span>
      <span className="waypoint-seal">
        <SealMark state={state} />
      </span>
      <span className="waypoint-text">
        <span className="waypoint-title">{unit.title}</span>
        <span className="waypoint-author">By {unit.author}</span>
        {state === 'sealed-gold' && <span className="waypoint-status">Gold seal · exam-ready</span>}
        {state === 'sealed' && <span className="waypoint-status">Copper seal · completed</span>}
      </span>
    </Link>
  );
}

function useDivisionInfo(units) {
  const totals = useMemo(() => {
    const counts = { prose: 0, poem: 0, play: 0 };
    units.forEach((u) => {
      const kind = u.type || 'prose';
      if (kind === 'prose') counts.prose++;
      else if (kind === 'poem') counts.poem++;
      else if (kind === 'play') counts.play++;
    });
    return counts;
  }, [units]);

  const charted = useMemo(() => {
    const seals = getSeals();
    const charted = { prose: 0, poem: 0, play: 0 };
    units.forEach((u) => {
      const kind = u.type || 'prose';
      if (seals[u.id]) {
        if (kind === 'prose') charted.prose++;
        else if (kind === 'poem') charted.poem++;
        else if (kind === 'play') charted.play++;
      }
    });
    return charted;
  }, [units]);

  return { totals, charted };
}

export default function VoyageChart({ units }) {
  const [seals, setSeals] = useState(() => getSeals());
  const [filterByDivision, setFilterByDivision] = useState('all');
  const orders = useMemo(() => {
    const states = unlockOrder(units, seals);
    return Object.fromEntries(states.map((s) => [s.id, s.state]));
  }, [units, seals]);
  const pct = readinessPct(units, seals);
  const { totals, charted } = useDivisionInfo(units);

  useEffect(() => {
    const refresh = () => setSeals(getSeals());
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  const visibleLegs = LEGS.filter(
    (leg) => filterByDivision === 'all' || filterByDivision === leg.kind
  );

  return (
    <section className="voyage-chart card" id="book-shelf" aria-labelledby="chart-heading">
      <div className="chart-compass" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="32" cy="32" r="26" strokeDasharray="3 3" opacity="0.4" />
          <path d="M32 6l4 22h-8z" fill="#ffd633" stroke="currentColor" />
          <path d="M32 58l-4-22h8z" fill="currentColor" opacity="0.8" />
          <path d="M6 32l22-4v8z" fill="currentColor" opacity="0.5" />
          <path d="M58 32l-22 4v-8z" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      <div className="chart-head">
        <p className="chart-kicker">The Voyage Chart</p>
        <h2 id="chart-heading">Chart your course through the Literature Reader</h2>
        <p className="chart-sub">
          Explore all 13 units organized into Prose, Poetry, and Drama chapters. Complete a unit's quiz to seal it.
        </p>
      </div>

      <div className="division-tabs" role="tablist" aria-label="Literature Genre Divisions">
        <button
          className={`division-tab ${filterByDivision === 'all' ? 'active' : ''}`}
          onClick={() => setFilterByDivision('all')}
          aria-pressed={filterByDivision === 'all'}
          type="button"
        >
          All Units <span className="division-tab-count">13</span>
        </button>
        <button
          className={`division-tab ${filterByDivision === 'prose' ? 'active' : ''}`}
          onClick={() => setFilterByDivision('prose')}
          aria-pressed={filterByDivision === 'prose'}
          type="button"
        >
          📜 Prose <span className="division-tab-count">{totals.prose}</span>
        </button>
        <button
          className={`division-tab ${filterByDivision === 'poem' ? 'active' : ''}`}
          onClick={() => setFilterByDivision('poem')}
          aria-pressed={filterByDivision === 'poem'}
          type="button"
        >
          🪶 Poetry <span className="division-tab-count">{totals.poem}</span>
        </button>
        <button
          className={`division-tab ${filterByDivision === 'play' ? 'active' : ''}`}
          onClick={() => setFilterByDivision('play')}
          aria-pressed={filterByDivision === 'play'}
          type="button"
        >
          🎭 Drama <span className="division-tab-count">{totals.play}</span>
        </button>
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
            ? 'Every unit sealed — the whole voyage is charted. Well sailed, Mariner!'
            : `${charted.prose + charted.poem + charted.play} of ${totals.prose + totals.poem + totals.play} units sealed so far.`}
        </p>
      </div>

      <div className="chart-legend" aria-hidden="true">
        <span className="legend-item"><span className="legend-swatch seal-gold-swatch" /> Gold seal — 90%+ on quiz</span>
        <span className="legend-item"><span className="legend-swatch seal-copper-swatch" /> Copper seal — completed</span>
        <span className="legend-item"><span className="legend-swatch seal-open-swatch" /> Open course — unlocked</span>
      </div>

      <div className="chart-legs">
        {visibleLegs.map((leg) => {
          const legUnits = units.filter((u) => (u.type || 'prose') === leg.kind);
          if (!legUnits.length) return null;
          const sealedCount = charted[leg.kind] || 0;
          const totalCount = legUnits.length;
          const legPct = totalCount > 0 ? Math.round((sealedCount / totalCount) * 100) : 0;

          return (
            <div className="chart-leg" key={leg.kind}>
              <div className="leg-head">
                <div className="leg-meta">
                  <span className={`leg-genre-badge leg-badge-${leg.kind}`}>
                    {leg.icon} {leg.badgeText}
                  </span>
                  <h3 className="leg-label">{leg.chapter}: {leg.label}</h3>
                  <p className="leg-sub">{leg.sub}</p>
                </div>
                <div className="leg-progress-wrap">
                  <span className="leg-progress-text">
                    {sealedCount} / {totalCount} Sealed ({legPct}%) {legPct === 100 ? '🏆' : ''}
                  </span>
                  <div className="leg-progress-track" role="progressbar" aria-valuenow={legPct} aria-valuemin="0" aria-valuemax="100">
                    <div className={`leg-progress-fill fill-${leg.kind}`} style={{ width: `${legPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="chart-leg-nodes">
                {legUnits.map((u) => (
                  <Waypoint
                    key={u.id}
                    unit={u}
                    state={orders[u.id]}
                    kind={leg.kind}
                    icon={leg.icon}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}