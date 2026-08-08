const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    setToken(null);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const api = {
  getToken,
  setToken,

  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  getContent: () => request('/content'),
  getQuestions: (category) => request(`/questions${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  searchContent: (q) => request(`/content/search?q=${encodeURIComponent(q)}`),

  getQuizQuestions: (limit = 10) => request(`/quiz/questions?limit=${limit}`),
  submitAttempt: (score, total) => request('/quiz/attempts', { method: 'POST', body: JSON.stringify({ score, total }) }),
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
