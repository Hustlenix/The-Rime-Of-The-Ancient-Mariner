// Pure constraint-satisfying sampler for the paper builder.
//
// Given a section spec and a pool of bank questions, picks `count` questions
// that match the spec. Picks never repeat across sections of the same call,
// prefer less-used questions (so old papers do not recycle the same few),
// and fall back to filling as many slots as possible when the pool is thin.

const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 5;
const VALID_TYPES = ['mcq', 'short', 'long', 'extract'];

function normalizeChapterList(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return null;
  return new Set(chapters.map(String));
}

function normalizeResourceList(resources) {
  if (!Array.isArray(resources) || resources.length === 0) return null;
  const ids = new Set();
  let personal = false;
  for (const r of resources) {
    if (String(r) === 'personal') personal = true;
    else if (Number.isInteger(Number(r))) ids.add(Number(r));
  }
  return { ids, personal };
}

// One section spec, normalised. Returns null when the spec is invalid.
function normalizeSection(spec) {
  if (!spec || typeof spec !== 'object') return null;
  const count = Number(spec.count);
  const marks = Number(spec.marks);
  if (!Number.isInteger(count) || count < 1) return null;
  if (!Number.isInteger(marks) || marks < 1) return null;
  const type = spec.type === 'any' || spec.type == null || spec.type === '' ? null : String(spec.type);
  if (type && !VALID_TYPES.includes(type)) return null;
  const difficultyMin = Number.isInteger(spec.difficultyMin) ? Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, spec.difficultyMin)) : DIFFICULTY_MIN;
  const difficultyMax = Number.isInteger(spec.difficultyMax) ? Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, spec.difficultyMax)) : DIFFICULTY_MAX;
  const chooseAny = Number.isInteger(spec.chooseAny) && spec.chooseAny > count ? spec.chooseAny : null;
  return {
    count,
    marks,
    type,
    chapters: normalizeChapterList(spec.chapters),
    resources: normalizeResourceList(spec.resources),
    difficultyMin,
    difficultyMax,
    chooseAny
  };
}

function matchesSection(question, spec, user) {
  if (question.marks !== spec.marks) return false;
  if (question.difficulty < spec.difficultyMin || question.difficulty > spec.difficultyMax) return false;
  if (spec.type && question.type !== spec.type) return false;
  if (spec.chapters && !spec.chapters.has(String(question.chapter))) return false;
  if (spec.resources) {
    const inPersonal = question.resource_id == null && question.created_by === user.id;
    const inShared = question.resource_id != null && spec.resources.ids.has(Number(question.resource_id));
    if (!inPersonal && !inShared) return false;
  }
  return true;
}

function defaultRng() {
  return Math.random();
}

// pool: array of bank question rows (plain objects)
// sections: [{ index, count, marks, type, chapters, difficultyMin, difficultyMax, resources, chooseAny }]
// user: { id } — owner id used to resolve the 'personal' resource
// excludeIds: bank question ids that must not be picked (already in the paper)
// Returns [{ index, picks, missing }] — picks are the full question rows.
function autoFill(pool, sections, user, excludeIds = [], rng = defaultRng) {
  const excluded = new Set(excludeIds.map((id) => Number(id)));
  const picked = new Set();
  const results = [];

  for (const raw of sections) {
    const spec = normalizeSection(raw);
    if (!spec) {
      results.push({ index: raw.index, picks: [], missing: raw.count || 0, invalid: true });
      continue;
    }

    const candidates = pool
      .filter((q) => !excluded.has(Number(q.id)) && !picked.has(Number(q.id)))
      .filter((q) => matchesSection(q, spec, user))
      .map((q, i) => ({ q, i, tiebreak: rng() }))
      .sort((a, b) => a.q.usage_count - b.q.usage_count || a.tiebreak - b.tiebreak)
      .map((x) => x.q);

    const want = Math.min(spec.count, candidates.length);
    const picks = candidates.slice(0, want).map((q) => {
      picked.add(Number(q.id));
      return q;
    });
    results.push({ index: raw.index, picks, missing: spec.count - picks.length });
  }

  return results;
}

module.exports = { autoFill, normalizeSection, matchesSection };