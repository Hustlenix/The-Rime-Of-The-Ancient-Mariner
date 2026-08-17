import { useEffect, useState } from 'react';

// Fountain-pen underlines on quoted lines inside the definition — the
// examiners' favourite lines are the key terms here.
function withPenTerms(text) {
  if (!text) return text;
  const parts = String(text).split(/("[^"]*"|“[^”]*”)/g);
  if (parts.length < 3) return text;
  return parts.map((p, i) =>
    i % 2 === 1 ? <mark key={i} className="pen-term">{p}</mark> : p
  );
}

export default function DeviceMarginalia({ devices, rows }) {
  const [openId, setOpenId] = useState(null);
  const glosses = (rows || []).filter((r) => r.notes && r.notes.trim());
  const active = openId ? devices.find((d) => d.id === openId) : null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="marginalia">
      <div className="marginalia-chips">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip marginalia-chip ${openId === d.id ? 'active' : ''}`}
            onClick={() => setOpenId(openId === d.id ? null : d.id)}
            aria-expanded={openId === d.id}
          >
            {d.prompt}
          </button>
        ))}
        {glosses.length > 0 && devices.length === 0 && (
          <button
            type="button"
            className="chip marginalia-chip"
            onClick={() => setOpenId('__glosses__')}
            aria-expanded={openId === '__glosses__'}
          >
            Margin Notes
          </button>
        )}
      </div>
      <p className="marginalia-hint">
        Select a device to open its margin note — the explanation, its key terms, and any archaic-word glosses.
      </p>

      {openId === '__glosses__' && (
        <div className="marginalia-drawer" role="dialog" aria-label="Margin notes">
          <div className="drawer-head">
            <h3>Margin Notes</h3>
            <button type="button" className="modal-close" aria-label="Close margin notes" onClick={() => setOpenId(null)}>
              ×
            </button>
          </div>
          <ul className="gloss-list">
            {glosses.map((g) => (
              <li key={g.id} className="gloss-item">
                <span className="gloss-word">{g.prompt}</span>
                <span className="gloss-note">{g.notes}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active && (
        <div className="marginalia-drawer" role="dialog" aria-label={`${active.prompt} — margin note`}>
          <div className="drawer-head">
            <h3>{active.prompt}</h3>
            <button type="button" className="modal-close" aria-label="Close margin note" onClick={() => setOpenId(null)}>
              ×
            </button>
          </div>
          <p className="drawer-definition">{withPenTerms(active.answer)}</p>
          {active.notes && (
            <div className="gloss-block">
              <h4>Archaic words &amp; glosses</h4>
              <p className="gloss-note">{active.notes}</p>
            </div>
          )}
          <p className="drawer-sign" aria-hidden="true">
            ✒ in the margin
          </p>
        </div>
      )}
    </div>
  );
}