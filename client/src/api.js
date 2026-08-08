import fallbackContent from './fallbackContent.js';

const BASE = '/api';
const STATIC_EVENT = 'api:static-mode';

let staticMode = false;

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function isStatic() {
  return staticMode;
}

function enterStaticMode() {
  if (staticMode) return;
  staticMode = true;
  window.dispatchEvent(new CustomEvent(STATIC_EVENT));
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    // Network-level failure (no server reachable — e.g. static hosting).
    const err = new Error('Cannot reach the school server from this page.');
    err.static = true;
    throw err;
  }

  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    setToken(null);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('json')) {
    // This API always answers JSON; a non-JSON response (static-hosting 404
    // page, SPA fallback, unreachable dev proxy) means no API behind this URL.
    const err = new Error('The school server is not available on this page.');
    err.static = true;
    throw err;
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

// Try the live API first; when it is unreachable (static hosting), serve the
// question bank embedded in the bundle so every study page keeps working.
async function withFallback(path, options, makeFallback) {
  if (staticMode) return makeFallback();
  try {
    return await request(path, options);
  } catch (err) {
    if (err.static) {
      enterStaticMode();
      return makeFallback();
    }
    throw err;
  }
}

function searchFallback(q) {
  const needle = String(q || '').trim().toLowerCase();
  if (!needle) return [];
  return fallbackContent.questions.filter((row) =>
    [row.prompt, row.answer, row.notes]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(needle))
  );
}

const staticAuthError =
  'Sign-in is not available in this hosted preview — it runs without the school server. You can still study, search, quiz and use the flashcards as a guest.';

export const api = {
  getToken,
  setToken,

  register: async (data) => {
    try {
      return await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      if (err.static) throw new Error(staticAuthError);
      throw err;
    }
  },
  login: async (data) => {
    try {
      return await request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      if (err.static) throw new Error(staticAuthError);
      throw err;
    }
  },
  me: async () => {
    try {
      return await request('/auth/me');
    } catch (err) {
      if (err.static) enterStaticMode();
      throw err;
    }
  },

  getContent: () =>
    withFallback('/content', {}, () => ({
      summaries: fallbackContent.summaries,
      themes: fallbackContent.themes,
      devices: fallbackContent.devices
    })),

  getQuestions: (category) =>
    withFallback(`/questions${category ? `?category=${encodeURIComponent(category)}` : ''}`, {}, () => {
      let rows = fallbackContent.questions;
      if (category && category !== 'all') rows = rows.filter((q) => q.category === category);
      return { questions: rows };
    }),

  searchContent: (q) =>
    withFallback(`/content/search?q=${encodeURIComponent(q)}`, {}, () => ({
      results: searchFallback(q)
    })),

  getQuizQuestions: (limit = 10) =>
    withFallback(`/quiz/questions?limit=${limit}`, {}, () => {
      const shuffled = [...fallbackContent.quizQuestions].sort(() => Math.random() - 0.5);
      return { questions: shuffled.slice(0, limit) };
    }),

  submitAttempt: (score, total) =>
    request('/quiz/attempts', { method: 'POST', body: JSON.stringify({ score, total }) }),
  getAttempts: () => request('/quiz/attempts'),

  markKnown: (questionId, known) =>
    request(`/flashcards/${questionId}/known`, { method: 'POST', body: JSON.stringify({ known }) }),
  getFlashcardProgress: () => request('/flashcards/progress'),

  createQuestion: (data) => request('/admin/questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuestion: (id, data) => request(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuestion: (id) => request(`/admin/questions/${id}`, { method: 'DELETE' }),

  getQuizQuestionsAdmin: () => request('/admin/quiz-questions'),
  createQuizQuestion: (data) => request('/admin/quiz-questions', { method: 'POST', body: JSON.stringify(data) }),
  updateQuizQuestion: (id, data) => request(`/admin/quiz-questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuizQuestion: (id) => request(`/admin/quiz-questions/${id}`, { method: 'DELETE' })
};
