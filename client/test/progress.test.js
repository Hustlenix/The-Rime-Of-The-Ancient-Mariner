import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dayKey,
  prevDayKey,
  consecutiveStreak,
  bankDay,
  logFlashcardsAnswered,
  getStreak,
  addCoins,
  spendCoins,
  getCoins,
  getCoinLedger,
  sealForUnit,
  setSeal,
  getSeal,
  recordQuizResult,
  unlockOrder,
  isUnitUnlocked,
  readinessPct,
  buyStoreItem,
  setActiveStoreItem,
  getStoreState,
  STORE_ITEMS,
  COINS_STUDY_DAY,
  FLASHCARDS_PER_DAY,
  PROGRESS_EVENT
} from '../src/games/progress';

const UNITS = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' }
];

describe('progress calendar helpers', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(dayKey(new Date(2026, 7, 16))).toBe('2026-08-16');
  });

  it('steps a day key backwards', () => {
    expect(prevDayKey('2026-08-16')).toBe('2026-08-15');
    expect(prevDayKey('2026-03-01')).toBe('2026-02-28');
  });
});

describe('consecutiveStreak', () => {
  it('counts the run ending today', () => {
    const days = { '2026-08-14': 1, '2026-08-15': 1, '2026-08-16': 1 };
    expect(consecutiveStreak(days, '2026-08-16')).toBe(3);
  });

  it('counts a run that ended yesterday as current', () => {
    const days = { '2026-08-15': 1, '2026-08-16': 1 };
    expect(consecutiveStreak(days, '2026-08-17')).toBe(2);
  });

  it('resets when the streak broke before yesterday', () => {
    const days = { '2026-08-14': 1, '2026-08-16': 1 };
    expect(consecutiveStreak(days, '2026-08-16')).toBe(1);
  });

  it('returns 0 with no entries', () => {
    expect(consecutiveStreak({}, '2026-08-16')).toBe(0);
  });
});

describe('logbook', () => {
  beforeEach(() => localStorage.clear());

  it('banks a study day once per calendar day', () => {
    const date = new Date(2026, 7, 16, 9);
    expect(bankDay(date).newlyBanked).toBe(true);
    expect(getStreak(date)).toBe(1);
    expect(bankDay(date).newlyBanked).toBe(false);
    expect(getStreak(date)).toBe(1);
  });

  it('awards study-day coins only the first time', () => {
    const date = new Date(2026, 7, 16, 9);
    bankDay(date);
    bankDay(date);
    expect(getCoins()).toBe(COINS_STUDY_DAY);
  });

  it('banks a day after the flashcard threshold', () => {
    const date = new Date(2026, 7, 16, 9);
    for (let i = 0; i < FLASHCARDS_PER_DAY; i++) {
      logFlashcardsAnswered(1, date);
    }
    expect(getStreak(date)).toBe(1);
  });

  it('does not bank below the flashcard threshold', () => {
    const date = new Date(2026, 7, 16, 9);
    logFlashcardsAnswered(FLASHCARDS_PER_DAY - 1, date);
    expect(getStreak(date)).toBe(0);
  });

  it('keeps a streak across consecutive days', () => {
    const d1 = new Date(2026, 7, 14, 9);
    const d2 = new Date(2026, 7, 15, 9);
    const d3 = new Date(2026, 7, 16, 9);
    bankDay(d1);
    bankDay(d2);
    bankDay(d3);
    expect(getStreak(d3)).toBe(3);
  });
});

describe('coins', () => {
  beforeEach(() => localStorage.clear());

  it('adds and spends coins, refusing overspend', () => {
    addCoins(50, 'test');
    expect(getCoins()).toBe(50);
    expect(spendCoins(30, 'spend').ok).toBe(true);
    expect(getCoins()).toBe(20);
    expect(spendCoins(30, 'overspend').ok).toBe(false);
    expect(getCoins()).toBe(20);
  });

  it('keeps a spend ledger', () => {
    addCoins(10, 'earn');
    spendCoins(4, 'spend');
    const ledger = getCoinLedger();
    expect(ledger).toHaveLength(2);
    expect(ledger[0].amount).toBe(-4);
  });
});

describe('wax seals', () => {
  beforeEach(() => localStorage.clear());

  it('maps quiz percentages to seals', () => {
    expect(sealForUnit(null)).toBeNull();
    expect(sealForUnit(89)).toBe('copper');
    expect(sealForUnit(90)).toBe('gold');
    expect(sealForUnit(100)).toBe('gold');
  });

  it('records results and improves the seal over time', () => {
    const first = recordQuizResult('a', 70);
    expect(first.seal).toBe('copper');
    expect(getSeal('a')).toBe('copper');

    const second = recordQuizResult('a', 95);
    expect(second.seal).toBe('gold');
    expect(second.coins).toBeGreaterThan(first.coins);

    recordQuizResult('a', 50);
    expect(getSeal('a')).toBe('gold');
  });

  it('does not mint coins for repeated identical seals', () => {
    recordQuizResult('a', 70);
    const before = getCoins();
    recordQuizResult('a', 80);
    expect(getCoins()).toBe(before);
  });

  it('setSeal handles removal', () => {
    setSeal('a', 'gold');
    expect(getSeal('a')).toBe('gold');
    setSeal('a', null);
    expect(getSeal('a')).toBeNull();
  });
});

describe('unlock order', () => {
  beforeEach(() => localStorage.clear());

  it('unlocks units sequentially from the front', () => {
    const rows = unlockOrder(UNITS, {});
    expect(rows.map((r) => r.state)).toEqual(['unlocked', 'locked', 'locked']);
    expect(isUnitUnlocked('a', UNITS, {})).toBe(true);
    expect(isUnitUnlocked('b', UNITS, {})).toBe(false);
  });

  it('sealing the first unit unlocks the second', () => {
    const rows = unlockOrder(UNITS, { a: 'copper' });
    expect(rows.map((r) => r.state)).toEqual(['sealed', 'unlocked', 'locked']);
  });

  it('distinguishes gold and copper seals', () => {
    const rows = unlockOrder(UNITS, { a: 'gold', b: 'copper' });
    expect(rows[0].state).toBe('sealed-gold');
    expect(rows[1].state).toBe('sealed');
    expect(rows[2].state).toBe('unlocked');
  });

  it('computes board exam readiness', () => {
    expect(readinessPct(UNITS, { a: 'copper', b: 'gold' })).toBe(67);
    expect(readinessPct(UNITS, {})).toBe(0);
  });
});

describe('Ship\'s Stores', () => {
  beforeEach(() => localStorage.clear());

  it('buys items when affordable', () => {
    addCoins(200, 'test');
    const res = buyStoreItem('accent-gold');
    expect(res.ok).toBe(true);
    expect(getStoreState().owned['accent-gold']).toBe(true);
  });

  it('refuses purchases without coins', () => {
    const res = buyStoreItem('accent-gold');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('coins');
  });

  it('refuses buying the same item twice', () => {
    addCoins(500, 'test');
    buyStoreItem('accent-gold');
    const res = buyStoreItem('accent-gold');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('owned');
  });

  it('keeps one accent and one frame active at a time', () => {
    addCoins(500, 'test');
    buyStoreItem('accent-gold');
    buyStoreItem('accent-copper');
    buyStoreItem('frame-compass');
    setActiveStoreItem('accent-gold');
    setActiveStoreItem('accent-copper');
    setActiveStoreItem('frame-compass');
    const stores = getStoreState();
    expect(stores.active['accent-gold']).toBeUndefined();
    expect(stores.active['accent-copper']).toBe(true);
    expect(stores.active['frame-compass']).toBe(true);
  });

  it('catalog sanity', () => {
    expect(STORE_ITEMS.length).toBeGreaterThanOrEqual(4);
    const ids = STORE_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('storage fallback', () => {
  it('keeps working when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      const before = getCoins();
      const fresh = new Date(2026, 8, 20, 9);
      bankDay(fresh);
      expect(getStreak(fresh)).toBe(1);
      addCoins(10, 'test');
      expect(getCoins()).toBe(before + COINS_STUDY_DAY + 10);
      expect(() => recordQuizResult('a', 92)).not.toThrow();
    } finally {
      spy.mockRestore();
      getSpy.mockRestore();
    }
  });

  it('dispatches a progress event on every mutation', () => {
    const listener = vi.fn();
    window.addEventListener(PROGRESS_EVENT, listener);
    try {
      addCoins(5, 'test');
      expect(listener).toHaveBeenCalled();
    } finally {
      window.removeEventListener(PROGRESS_EVENT, listener);
    }
  });
});