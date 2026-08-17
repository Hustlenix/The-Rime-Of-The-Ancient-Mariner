// Voyage Edition — curated game data for the Games page.
//
// Quote Matcher pairs (quote -> poem or character) and Device Speed Run
// prompts (extract -> poetic device) are drawn strictly from the unit JSON
// content, and validatePairs() re-checks every entry against those files
// (run in dev at load and explicitly in tests).

export const QUOTE_PAIRS = [
  { quote: 'Water, water, everywhere, nor any drop to drink', answer: 'The Rime of the Ancient Mariner', unitId: 'rime-of-the-ancient-mariner' },
  { quote: 'a sadder and a wiser man', answer: 'The Wedding-Guest', unitId: 'rime-of-the-ancient-mariner' },
  { quote: 'boundless and bare', answer: 'Ozymandias', unitId: 'ozymandias' },
  { quote: 'king in exile', answer: 'Snake', unitId: 'snake' },
  { quote: 'living record', answer: 'Not Marble, Nor the Gilded Monuments', unitId: 'not-marble-nor-the-gilded-monuments' },
  { quote: 'foghorn blaring unrivalled through the bog', answer: 'The Frog and the Nightingale', unitId: 'the-frog-and-the-nightingale' },
  { quote: 'primeval dance party', answer: 'Clovis', unitId: 'mrs-packletides-tiger' },
  { quote: 'Les Fauves', answer: 'Louisa Mebbin', unitId: 'mrs-packletides-tiger' },
  { quote: 'the incidental expenses are so heavy', answer: 'Mrs Packletide', unitId: 'mrs-packletides-tiger' },
  { quote: 'honourable men', answer: 'Mark Antony', unitId: 'julius-caesar' },
  { quote: 'the fixed North Star', answer: 'Julius Caesar', unitId: 'julius-caesar' }
];

export const DEVICE_OPTIONS = ['Alliteration', 'Metaphor', 'Personification', 'Simile', 'Imagery', 'Irony', 'Assonance'];

// Each prompt: a short, unambiguous extract from a device entry's answer,
// four options, and the correct device (matching the source entry's label).
export const DEVICE_PROMPTS = [
  { extract: 'The furrow followed free', unitId: 'rime-of-the-ancient-mariner', correct: 'Alliteration', options: ['Alliteration', 'Metaphor', 'Simile', 'Personification'] },
  { extract: 'Water, water, everywhere, nor any drop to drink', unitId: 'rime-of-the-ancient-mariner', correct: 'Irony', options: ['Irony', 'Imagery', 'Simile', 'Alliteration'] },
  { extract: 'All in a hot and copper sky, The bloody sun, at noon', unitId: 'rime-of-the-ancient-mariner', correct: 'Metaphor', options: ['Metaphor', 'Imagery', 'Simile', 'Irony'] },
  { extract: 'The sun came up upon the left, Out of the sea came he', unitId: 'rime-of-the-ancient-mariner', correct: 'Personification', options: ['Personification', 'Metaphor', 'Simile', 'Imagery'] },
  { extract: 'As idle as a painted ship Upon a painted ocean', unitId: 'rime-of-the-ancient-mariner', correct: 'Simile', options: ['Simile', 'Metaphor', 'Personification', 'Irony'] },
  { extract: 'boundless and bare', unitId: 'ozymandias', correct: 'Alliteration', options: ['Alliteration', 'Assonance', 'Imagery', 'Personification'] },
  { extract: 'trunkless stone legs', unitId: 'ozymandias', correct: 'Imagery', options: ['Imagery', 'Alliteration', 'Simile', 'Personification'] },
  { extract: 'the voice of my education', unitId: 'snake', correct: 'Personification', options: ['Personification', 'Metaphor', 'Alliteration', 'Imagery'] },
  { extract: 'living record', unitId: 'not-marble-nor-the-gilded-monuments', correct: 'Metaphor', options: ['Metaphor', 'Simile', 'Imagery', 'Alliteration'] },
  { extract: 'foghorn blaring unrivalled through the bog', unitId: 'the-frog-and-the-nightingale', correct: 'Metaphor', options: ['Metaphor', 'Simile', 'Personification', 'Imagery'] }
];

// Strips punctuation/quotes and collapses whitespace so extracts survive
// minor formatting differences between the JSON and the game data.
export function normalize(text) {
  return String(text)
    .replace(/["“”'\u2018\u2019.,;:!?()—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// A round of `count` quote pairs with unique answers.
export function pickRound(count = 6, rng = Math.random) {
  return [...QUOTE_PAIRS].sort(() => rng() - 0.5).slice(0, Math.min(count, QUOTE_PAIRS.length));
}

// Verifies every pair and prompt against the source unit JSONs:
// - quotes resolve inside the referenced unit's content
// - extracts resolve inside the matching device entry's answer
// - the correct device is labelled and present in the options
// - no duplicate quotes or duplicate correct answers
export async function validatePairs({ throwOnError = false } = {}) {
  const errors = [];
  const unitIds = new Set([...QUOTE_PAIRS.map((p) => p.unitId), ...DEVICE_PROMPTS.map((d) => d.unitId)]);

  for (const unitId of unitIds) {
    let mod;
    try {
      mod = await import(`../data/units/${unitId}.json`);
    } catch {
      errors.push(`unit "${unitId}" could not be loaded`);
      continue;
    }
    const rows = mod.default.content || [];
    const deviceRows = rows.filter((r) => r.category === 'device');

    for (const pair of QUOTE_PAIRS.filter((p) => p.unitId === unitId)) {
      const hay = rows.map((r) => `${r.prompt} ${r.answer} ${r.notes || ''}`).join(' ');
      if (!normalize(hay).includes(normalize(pair.quote))) {
        errors.push(`quote not found in ${unitId}: "${pair.quote}"`);
      }
    }

    for (const prompt of DEVICE_PROMPTS.filter((d) => d.unitId === unitId)) {
      const row = deviceRows.find((r) => normalize(r.prompt).startsWith(normalize(prompt.correct)));
      if (!row) {
        errors.push(`no "${prompt.correct}" device entry in ${unitId}`);
        continue;
      }
      if (!normalize(row.answer).includes(normalize(prompt.extract))) {
        errors.push(`extract not in ${prompt.correct} entry of ${unitId}: "${prompt.extract}"`);
      }
      if (!prompt.options.includes(prompt.correct)) {
        errors.push(`correct device missing from options in ${unitId}: "${prompt.extract}"`);
      }
    }
  }

  const quotes = QUOTE_PAIRS.map((p) => normalize(p.quote));
  if (new Set(quotes).size !== quotes.length) errors.push('duplicate quote in QUOTE_PAIRS');
  const answers = QUOTE_PAIRS.map((p) => normalize(p.answer));
  if (new Set(answers).size !== answers.length) errors.push('duplicate answer in QUOTE_PAIRS');
  if (QUOTE_PAIRS.length < 6) errors.push('fewer than 6 quote pairs');
  if (DEVICE_PROMPTS.length < 8 || DEVICE_PROMPTS.length > 10) errors.push('device prompts should number 8–10');

  if (throwOnError && errors.length) throw new Error(errors.join('; '));
  return { ok: errors.length === 0, errors };
}

// Dev-time self check: the test suite covers this too, but catching a bad
// edit in the running dev server is faster than waiting for CI.
if (import.meta.env && import.meta.env.DEV) {
  validatePairs({ throwOnError: true }).catch((err) => {
    console.warn('[voyage] pairs.js validation failed:', err.message);
  });
}
