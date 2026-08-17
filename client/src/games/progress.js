// Voyage Edition — progress store: logbook (days at sea + streak), Mariner
// Coins ledger, per-unit wax seals and the Ship's Stores cosmetics.
//
// Everything lives in localStorage wrapped in try-catch with an in-memory
// fallback, so incognito or blocked storage never throws anywhere. Mutations
// dispatch a 'tals:progress' event so mounted widgets re-read their state.

const LOGBOOK_KEY = 'tals-logbook';
const COINS_KEY = 'tals-coins';
const SEALS_KEY = 'tals-seals';
const QUIZ_BEST_KEY = 'tals-quiz-best';
const STORES_KEY = 'tals-stores';

export const COINS_STUDY_DAY = 10;
export const COINS_GOLD_SEAL = 25;
export const COINS_UNIT_SEAL = 15;
export const FLASHCARDS_PER_DAY = 5;
export const GOLD_SEAL_PCT = 90;

export const PROGRESS_EVENT = 'tals:progress';

const memory = {};

function readJSON(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return memory[key] ?? null;
  }
}

function writeJSON(key, value) {
  memory[key] = value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // blocked storage — the in-memory copy above keeps the session working
  }
  try {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    // no-op outside browsers
  }
}

// ---- Calendar helpers (local time, YYYY-MM-DD keys) ----

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function prevDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  return dayKey(prev);
}

// Pure streak math: longest run of consecutive days ending at (or just before)
// `asOfKey`. Used by getStreak and exercised directly by tests.
export function consecutiveStreak(days, asOfKey) {
  let cursor = asOfKey;
  if (!days[cursor]) cursor = prevDayKey(cursor);
  let streak = 0;
  while (days[cursor]) {
    streak += 1;
    cursor = prevDayKey(cursor);
  }
  return streak;
}

// ---- Logbook: days at sea ----
//
// tals-logbook = { days: { 'YYYY-MM-DD': { flashcards, reviewed } },
//                  pending: { 'YYYY-MM-DD': n } }
// `pending` accumulates flashcard answers below the daily threshold; only
// banked days appear in `days`.

function emptyLogbook() {
  return { days: {}, pending: {} };
}

export function getLogbook() {
  return readJSON(LOGBOOK_KEY) || emptyLogbook();
}

// Marks `date` as a day at sea. Coins are awarded once per calendar day.
export function bankDay(date = new Date()) {
  const logbook = getLogbook();
  const key = dayKey(date);
  if (!logbook.days[key]) {
    logbook.days[key] = { flashcards: 0, reviewed: 1 };
    writeJSON(LOGBOOK_KEY, logbook);
    addCoins(COINS_STUDY_DAY, `study-day:${key}`);
    return { day: key, streak: getStreak(), newlyBanked: true };
  }
  return { day: key, streak: getStreak(), newlyBanked: false };
}

// Reviewing a summary (one Study page visit counts) banks the day.
export function logSummaryReview(date = new Date()) {
  return bankDay(date);
}

// Answering flashcards accumulates toward the daily threshold (5).
export function logFlashcardsAnswered(count = 1, date = new Date()) {
  const logbook = getLogbook();
  const key = dayKey(date);
  const soFar = (logbook.pending[key] || 0) + count;
  if (soFar < FLASHCARDS_PER_DAY) {
    logbook.pending[key] = soFar;
    writeJSON(LOGBOOK_KEY, logbook);
    return { day: key, streak: getStreak(), banked: false };
  }
  delete logbook.pending[key];
  if (!logbook.days[key]) logbook.days[key] = { flashcards: 0, reviewed: 0 };
  logbook.days[key].flashcards += soFar;
  writeJSON(LOGBOOK_KEY, logbook);
  addCoins(COINS_STUDY_DAY, `study-day:${key}`);
  return { day: key, streak: getStreak(), banked: true };
}

export function getStreak(date = new Date()) {
  return consecutiveStreak(getLogbook().days, dayKey(date));
}

// ---- Mariner Coins ----
//
// tals-coins = { balance, ledger: [{ at, amount, reason }] }

function emptyCoins() {
  return { balance: 0, ledger: [] };
}

export function getCoins() {
  return (readJSON(COINS_KEY) || emptyCoins()).balance;
}

export function addCoins(amount, reason) {
  const coins = readJSON(COINS_KEY) || emptyCoins();
  coins.balance += amount;
  coins.ledger.push({ at: new Date().toISOString(), amount, reason });
  if (coins.ledger.length > 200) coins.ledger = coins.ledger.slice(-200);
  writeJSON(COINS_KEY, coins);
  return coins.balance;
}

export function spendCoins(amount, reason) {
  const coins = readJSON(COINS_KEY) || emptyCoins();
  if (coins.balance < amount) return { ok: false, balance: coins.balance };
  coins.balance -= amount;
  coins.ledger.push({ at: new Date().toISOString(), amount: -amount, reason });
  writeJSON(COINS_KEY, coins);
  return { ok: true, balance: coins.balance };
}

export function getCoinLedger(limit = 20) {
  const coins = readJSON(COINS_KEY) || emptyCoins();
  return coins.ledger.slice(-limit).reverse();
}

// ---- Wax seals per unit ----
//
// tals-seals = { [unitId]: 'gold' | 'copper' }
// tals-quiz-best = { [unitId]: bestPct }

export function sealForUnit(quizPct) {
  if (quizPct == null || Number.isNaN(quizPct)) return null;
  return quizPct >= GOLD_SEAL_PCT ? 'gold' : 'copper';
}

export function getSeals() {
  return readJSON(SEALS_KEY) || {};
}

export function getSeal(unitId) {
  return getSeals()[unitId] || null;
}

export function setSeal(unitId, seal) {
  const seals = getSeals();
  if (seal === null) delete seals[unitId];
  else seals[unitId] = seal;
  writeJSON(SEALS_KEY, seals);
  return seal;
}

export function getQuizBest(unitId) {
  return (readJSON(QUIZ_BEST_KEY) || {})[unitId] ?? null;
}

// Records a finished quiz and derives the wax seal. Coins: +15 on the first
// completion, +25 more the first time the unit reaches a gold seal.
export function recordQuizResult(unitId, pct) {
  const best = readJSON(QUIZ_BEST_KEY) || {};
  const prevBest = best[unitId] ?? null;
  const nextBest = Math.max(prevBest ?? 0, pct);
  if (nextBest > (prevBest ?? 0)) {
    best[unitId] = nextBest;
    writeJSON(QUIZ_BEST_KEY, best);
    const prevSeal = getSeal(unitId);
    const nextSeal = sealForUnit(nextBest);
    if (nextSeal !== prevSeal) {
      setSeal(unitId, nextSeal);
      if (prevSeal === null) addCoins(COINS_UNIT_SEAL, `seal:${unitId}`);
      if (nextSeal === 'gold') addCoins(COINS_GOLD_SEAL, `gold-seal:${unitId}`);
    }
  }
  return { best: nextBest, seal: sealForUnit(nextBest), coins: getCoins() };
}

// ---- Unlock order (derived from seals; nothing stored) ----

export function unlockOrder(units, seals = getSeals()) {
  return units.map((u, i) => {
    const seal = seals[u.id];
    if (seal === 'gold') return { id: u.id, state: 'sealed-gold' };
    if (seal === 'copper') return { id: u.id, state: 'sealed' };
    if (i === 0 || seals[units[i - 1].id]) return { id: u.id, state: 'unlocked' };
    return { id: u.id, state: 'locked' };
  });
}

export function isUnitUnlocked(unitId, units, seals = getSeals()) {
  const row = unlockOrder(units, seals).find((r) => r.id === unitId);
  return row ? row.state !== 'locked' : false;
}

// Completed (any seal) over total — the "Board Exam Readiness" measure.
export function readinessPct(units, seals = getSeals()) {
  if (!units.length) return 0;
  const done = units.filter((u) => seals[u.id]).length;
  return Math.round((done / units.length) * 100);
}

// ---- Ship's Stores (cosmetics; no server, no PDFs this round) ----
//
// tals-stores = { owned: { [itemId]: true }, active: { [itemId]: true } }

export const STORE_ITEMS = [
  { id: 'accent-gold', kind: 'accent', name: 'Gold Foil Accent', price: 60 },
  { id: 'accent-copper', kind: 'accent', name: 'Copper Rivet Accent', price: 45 },
  { id: 'accent-brass', kind: 'accent', name: 'Brass Lantern Accent', price: 30 },
  { id: 'frame-compass', kind: 'frame', name: 'Compass Rose Frame', price: 80 },
  { id: 'frame-waves', kind: 'frame', name: 'Wave Crest Frame', price: 65 }
];

function emptyStores() {
  return { owned: {}, active: {} };
}

export function getStoreState() {
  return readJSON(STORES_KEY) || emptyStores();
}

export function buyStoreItem(itemId) {
  const item = STORE_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: 'unknown' };
  const stores = getStoreState();
  if (stores.owned[itemId]) return { ok: false, error: 'owned', balance: getCoins() };
  const spend = spendCoins(item.price, `store:${itemId}`);
  if (!spend.ok) return { ok: false, error: 'coins', balance: spend.balance };
  stores.owned[itemId] = true;
  writeJSON(STORES_KEY, stores);
  return { ok: true, item, balance: getCoins() };
}

// Only one accent and one frame can be active at a time.
export function setActiveStoreItem(itemId) {
  const stores = getStoreState();
  if (itemId && !stores.owned[itemId]) return { ok: false, error: 'owned' };
  const item = STORE_ITEMS.find((i) => i.id === itemId);
  const kind = item ? item.kind : null;
  if (kind) {
    for (const owned of STORE_ITEMS.filter((i) => i.kind === kind)) {
      delete stores.active[owned.id];
    }
    if (itemId) stores.active[itemId] = true;
  } else if (itemId === null || itemId === undefined) {
    stores.active = {};
  }
  writeJSON(STORES_KEY, stores);
  return { ok: true, stores };
}
