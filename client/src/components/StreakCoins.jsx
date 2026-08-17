import { useEffect, useState } from 'react';
import {
  getStreak,
  getCoins,
  STORE_ITEMS,
  getStoreState,
  buyStoreItem,
  setActiveStoreItem,
  PROGRESS_EVENT
} from '../games/progress';

function applyCosmetics(stores) {
  const el = document.documentElement;
  const accent = STORE_ITEMS.find((i) => stores.active[i.id] && i.kind === 'accent');
  const frame = STORE_ITEMS.find((i) => stores.active[i.id] && i.kind === 'frame');
  if (accent) el.dataset.accent = accent.id.replace('accent-', '');
  else delete el.dataset.accent;
  if (frame) el.dataset.frame = frame.id.replace('frame-', '');
  else delete el.dataset.frame;
}

export default function StreakCoins() {
  const [streak, setStreak] = useState(() => getStreak());
  const [coins, setCoins] = useState(() => getCoins());
  const [stores, setStores] = useState(() => getStoreState());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setStreak(getStreak());
      setCoins(getCoins());
      setStores(getStoreState());
    };
    window.addEventListener(PROGRESS_EVENT, refresh);
    applyCosmetics(getStoreState());
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (open) applyCosmetics(stores);
  }, [stores, open]);

  return (
    <div className="streak-bar">
      <div className="streak-left">
        <span className="streak-item" title="Consecutive days with a flashcard or study session">
          <svg className="streak-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3c3.5 3.2 6 6 6 9a6 6 0 0 1-12 0c0-3 2.5-5.8 6-9Z" />
            <path d="M12 9v5l3 2" strokeLinecap="round" />
          </svg>
          <span className="streak-label">Days at Sea</span>
          <strong className="streak-value">{streak}</strong>
        </span>
        <span className="streak-item" title="Mariner Coins — earned by study days and wax seals">
          <svg className="streak-glyph coin-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v9M9 10.5h4.5a1.5 1.5 0 0 1 0 3H9" strokeLinecap="round" />
          </svg>
          <span className="streak-label">Mariner Coins</span>
          <strong className="streak-value">{coins}</strong>
        </span>
      </div>
      <button type="button" className="btn btn-outline btn-small stores-trigger" onClick={() => setOpen(true)}>
        Ship’s Stores
      </button>

      {open && (
        <div className="modal-overlay stores-overlay" onClick={() => setOpen(false)}>
          <div className="modal stores-modal" role="dialog" aria-modal="true" aria-labelledby="stores-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 id="stores-title">Ship’s Stores</h3>
              <button type="button" className="modal-close" aria-label="Close stores" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <p className="modal-sub">
              Spend Mariner Coins on deck cosmetics. Balance: <strong>{coins}</strong> coins.
            </p>
            <ul className="store-list">
              {STORE_ITEMS.map((item) => {
                const owned = !!stores.owned[item.id];
                const active = !!stores.active[item.id];
                return (
                  <li key={item.id} className={`store-item ${owned ? 'owned' : ''} ${active ? 'active' : ''}`}>
                    <div className="store-item-copy">
                      <span className="store-item-name">{item.name}</span>
                      <span className="store-item-kind">{item.kind === 'accent' ? 'Accent theme' : 'Mascot frame'}</span>
                    </div>
                    <span className="store-item-price">{owned ? (active ? 'Active' : 'Owned') : `${item.price} coins`}</span>
                    {owned ? (
                      <button type="button" className="btn btn-small btn-ghost" disabled={active} onClick={() => { setActiveStoreItem(item.id); setStores(getStoreState()); }}>
                        {active ? 'In use' : 'Equip'}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-small btn-outline" disabled={coins < item.price} onClick={() => { buyStoreItem(item.id); setStores(getStoreState()); }}>
                        Buy
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}