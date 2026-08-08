// Server smoke test: boots the Express app on an ephemeral port and exercises
// every public route. Run: node server/smoke.js  (from the repo root)
process.env.PORT = process.env.PORT || '5099';
process.env.JWT_SECRET = 'smoke-test-secret';

const app = require('./index');

const BASE = `http://127.0.0.1:${process.env.PORT}`;

function check(name, cond, extra) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
}

function finish() {
  console.log(process.exitCode ? '\nSMOKE: FAILURES PRESENT' : '\nSMOKE: ALL CHECKS PASSED');
  // Give the process a clean exit: close keep-alive sockets then exit.
  setTimeout(() => process.exit(process.exitCode || 0), 300);
}

async function get(path, token) {
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const server = app.listen(process.env.PORT);

  // Wait for the server to accept connections.
  for (let i = 0; i < 20; i++) {
    try {
      await fetch(BASE + '/api/units');
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const units = await get('/api/units');
  check('GET /api/units returns books+units', units.status === 200 && Array.isArray(units.body.books) && units.body.units.length >= 30,
    `${units.body.units ? units.body.units.length : '?'} units`);
  if (units.body.books) {
    for (const b of units.body.books) {
      console.log(`  book ${b.id}: ${b.units.map((u) => u.id).join(', ')}`);
    }
  }

  const contentDefault = await get('/api/content');
  check('GET /api/content (no unit) defaults to Mariner', contentDefault.status === 200 && contentDefault.body.unitId === 'rime-of-the-ancient-mariner'
    && contentDefault.body.summaries.length >= 2 && contentDefault.body.devices.length >= 10,
    `unitId=${contentDefault.body.unitId}`);

  const contentAlias = await get('/api/content?unit=fog');
  check('GET /api/content?unit= alias works', contentAlias.status === 200 && contentAlias.body.unitId === 'fog');

  const contentBad = await get('/api/content?unit_id=nope');
  check('GET /api/content?unit_id=nope -> 400', contentBad.status === 400);

  const questions = await get('/api/questions?unit_id=the-proposal&category=short');
  check('GET /api/questions filtered', questions.status === 200 && questions.body.questions.length > 0,
    `${questions.body.questions ? questions.body.questions.length : '?'} short answers`);

  const quiz = await get('/api/quiz/questions?unit_id=bholi&limit=10');
  check('GET /api/quiz/questions?unit_id=bholi&limit=10', quiz.status === 200 && quiz.body.questions.length === 10
    && Array.isArray(quiz.body.questions[0].options));

  const search = await get('/api/content/search?q=lencho');
  check('GET /api/content/search?q=lencho (all units)', search.status === 200 && search.body.results.length > 0,
    `${search.body.results.length} hits`);

  const searchScoped = await get('/api/content/search?q=albatross&unit_id=rime-of-the-ancient-mariner');
  check('GET /api/content/search scoped to a unit', searchScoped.status === 200 && searchScoped.body.results.length > 0,
    `${searchScoped.body.results.length} hits`);

  // Auth + admin smoke (existing behavior unchanged)
  const login = await get('/api/auth/login', null);
  // login needs a POST body; use fetch directly
  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@tals.edu', password: 'teacher123' })
  });
  const loginBody = await loginRes.json();
  check('POST /api/auth/login (teacher)', loginRes.status === 200 && !!loginBody.token);
  if (loginRes.status === 200) {
    const admin = await get('/api/admin/questions?unit_id=rime-of-the-ancient-mariner', loginBody.token);
    check('GET /api/admin/questions scoped', admin.status === 200 && admin.body.questions.length > 0,
      `${admin.body.questions.length} rows`);
    const adminAll = await get('/api/admin/questions', loginBody.token);
    check('GET /api/admin/questions all units', adminAll.status === 200 && adminAll.body.questions.length > 0);
  }

  // Units depth metadata
  const ff = units.body.books && units.body.books.find((b) => b.id === 'first-flight');
  const mariner = ff && ff.units.find((u) => u.id === 'rime-of-the-ancient-mariner');
  check('Units metadata carries stats (Mariner)', mariner && mariner.stats && mariner.stats.questions >= 10 && mariner.stats.quiz >= 10);

  server.close();
  finish();
}

main().catch((err) => {
  console.error('SMOKE CRASH:', err);
  process.exit(1);
});
