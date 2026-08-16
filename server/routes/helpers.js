// Shared route helpers for unit-aware endpoints.
const db = require('../db');
const { units } = require('../seedCatalog');

// Unit-less requests resolve to the first unit of the Literature Reader
// (book order), never to a hard-coded chapter, so the API's default matches
// the lesson students actually see first.
const DEFAULT_UNIT_ID =
  units
    .filter((u) => u.book === 'literature-reader')
    .sort((a, b) => (a.order || 0) - (b.order || 0))[0]?.id || 'two-gentlemen-of-verona';

function unitExists(unitId) {
  return !!db.prepare('SELECT id FROM units WHERE id = ?').get(unitId);
}

// Returns the unit_id to filter by, or null for "all units".
// Accepts ?unit_id= and ?unit= (backward-compatible alias).
function resolveUnitFilter(req, res) {
  const raw = req.query.unit_id || req.query.unit || null;
  if (raw == null) return null;
  const unitId = String(raw);
  if (!unitExists(unitId)) {
    res.status(400).json({ error: `Unknown unit: ${unitId}` });
    return undefined;
  }
  return unitId;
}

module.exports = { DEFAULT_UNIT_ID, unitExists, resolveUnitFilter };
