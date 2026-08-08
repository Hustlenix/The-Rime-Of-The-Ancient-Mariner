// Shared route helpers for unit-aware endpoints.
const db = require('../db');

// The legacy single-unit default: any endpoint called without a unit_id keeps
// behaving as the original Mariner portal.
const DEFAULT_UNIT_ID = 'rime-of-the-ancient-mariner';

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
