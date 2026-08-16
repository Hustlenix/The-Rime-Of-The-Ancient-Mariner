import { describe, expect, it } from 'vitest';
import unitsIndex from '../src/data/units.json';
import searchIndex from '../src/data/search-index.json';

const KNOWN_CATEGORIES = new Set(['summary', 'theme', 'device', 'character', 'value', 'analysis', 'short', 'long']);
const UNIT_COUNT = 13; // 6 prose + 5 poems + 2 plays

describe('static fallback data (client/src/data)', () => {
  it('catalogues exactly the 13 Literature Reader units with required meta', () => {
    expect(unitsIndex.units).toHaveLength(UNIT_COUNT);
    expect(unitsIndex.books.length).toBeGreaterThan(0);

    const bookIds = new Set(unitsIndex.books.map((b) => b.id));
    for (const u of unitsIndex.units) {
      expect(u.id, `unit ${u.title} needs an id`).toMatch(/^[a-z0-9-]+$/);
      expect(u.title, `unit ${u.id} needs a title`).toBeTruthy();
      expect(u.author, `unit ${u.id} needs an author`).toBeTruthy();
      expect(['prose', 'poem', 'play']).toContain(u.type);
      expect(bookIds.has(u.book)).toBe(true);
      // Stats are optional on the shelf (Home renders them conditionally),
      // but when present the counts must be sane
      if (u.stats) {
        for (const key of ['summaries', 'themes', 'devices', 'questions', 'quiz']) {
          expect(typeof u.stats[key], `${u.id} stats.${key} should be a number`).toBe('number');
          expect(u.stats[key]).toBeGreaterThanOrEqual(0);
        }
      }
    }

    // Ids are unique and titles are unique
    const ids = unitsIndex.units.map((u) => u.id);
    expect(new Set(ids).size).toBe(UNIT_COUNT);
    const titles = unitsIndex.units.map((u) => u.title);
    expect(new Set(titles).size).toBe(UNIT_COUNT);
  });

  it('every catalogued unit has fallback content with well-formed rows', async () => {
    for (const u of unitsIndex.units) {
      const mod = await import(`../src/data/units/${u.id}.json`);
      const data = mod.default;

      expect(data.unit.id, `fallback file must match unit id ${u.id}`).toBe(u.id);
      expect(data.content.length).toBeGreaterThanOrEqual(5);
      expect(data.quizQuestions.length).toBeGreaterThanOrEqual(5);

      for (const row of data.content) {
        expect(KNOWN_CATEGORIES.has(row.category), `unknown category ${row.category} in ${u.id}`).toBe(true);
        expect(row.prompt?.trim(), `${u.id} row has an empty prompt`).toBeTruthy();
        expect(row.answer?.trim(), `${u.id} row has an empty answer`).toBeTruthy();
        expect(typeof row.sortOrder).toBe('number');
      }

      const cats = new Set(data.content.map((r) => r.category));
      // Every unit must at least have a summary (study page first tab)
      expect(cats.has('summary'), `${u.id} is missing summaries`).toBe(true);

      for (const q of data.quizQuestions) {
        expect(q.question?.trim()).toBeTruthy();
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(4);
        expect(Number.isInteger(q.correct_index)).toBe(true);
        expect(q.correct_index).toBeGreaterThanOrEqual(0);
        expect(q.correct_index).toBeLessThan(q.options.length);
        expect(q.options[q.correct_index]?.trim()).toBeTruthy();
        expect(q.explanation?.trim()).toBeTruthy();
      }
    }
  });

  it('search index covers every unit and has searchable text', async () => {
    expect(searchIndex.entries.length).toBeGreaterThan(0);

    const unitIds = new Set(unitsIndex.units.map((u) => u.id));
    const covered = new Set(searchIndex.entries.map((e) => e.unitId));
    // Every unit must be represented in the search index
    for (const id of unitIds) {
      expect(covered.has(id), `${id} missing from search index`).toBe(true);
    }

    for (const entry of searchIndex.entries) {
      expect(entry.unitId).toBeTruthy();
      const haystack = [entry.prompt, entry.answer, entry.notes].filter(Boolean).join(' ');
      expect(haystack.trim().length).toBeGreaterThan(10);
    }
  });
});