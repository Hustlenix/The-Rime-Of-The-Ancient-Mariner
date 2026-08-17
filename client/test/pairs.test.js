import { describe, expect, it } from 'vitest';
import { QUOTE_PAIRS, DEVICE_PROMPTS, normalize, pickRound, validatePairs } from '../src/games/pairs';

describe('game pairs', () => {
  it('has at least six quote pairs with unique quotes and answers', () => {
    expect(QUOTE_PAIRS.length).toBeGreaterThanOrEqual(6);
    const quotes = QUOTE_PAIRS.map((p) => normalize(p.quote));
    const answers = QUOTE_PAIRS.map((p) => normalize(p.answer));
    expect(new Set(quotes).size).toBe(quotes.length);
    expect(new Set(answers).size).toBe(answers.length);
  });

  it('has 8–10 device prompts with labelled correct answers in options', () => {
    expect(DEVICE_PROMPTS.length).toBeGreaterThanOrEqual(8);
    expect(DEVICE_PROMPTS.length).toBeLessThanOrEqual(10);
    for (const p of DEVICE_PROMPTS) {
      expect(p.options).toContain(p.correct);
      expect(p.options).toHaveLength(4);
      expect(new Set(p.options).size).toBe(4);
    }
  });

  it('normalizes quotes and punctuation', () => {
    expect(normalize('“Water, water, everywhere!”')).toBe('water water everywhere');
    expect(normalize('  A  —  B  ')).toBe('a b');
  });

  it('picks a bounded round', () => {
    const round = pickRound(6, () => 0.99);
    expect(round).toHaveLength(6);
    const round2 = pickRound(100, () => 0.5);
    expect(round2.length).toBeLessThanOrEqual(QUOTE_PAIRS.length);
  });
});

describe('validatePairs against unit JSONs', () => {
  it('resolves every quote and extract in the source data', async () => {
    const result = await validatePairs({ throwOnError: true });
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});