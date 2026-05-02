const BASE = '/api';
const DEFAULT_TIMEOUT_MS = 60000;

async function request(path, { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw new Error('Network error. Is the server running?');
  }
  clearTimeout(timer);

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    const msg = data.error || data.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body }),
  changePassword: (body) => request('/auth/password', { method: 'PUT', body }),
  deleteAccount: (body) => request('/auth/account', { method: 'DELETE', body }),

  listRoadmaps: () => request('/roadmap'),
  getRoadmap: (id) => request(`/roadmap/${id}`),
  generateRoadmap: (body) => request('/roadmap/generate', { method: 'POST', body, timeoutMs: 120000 }),
  toggleTask: (id, body) => request(`/roadmap/${id}/task`, { method: 'PATCH', body }),
  deleteRoadmap: (id) => request(`/roadmap/${id}`, { method: 'DELETE' }),

  insights: (role) => request(`/insights?role=${encodeURIComponent(role)}`, { timeoutMs: 90000 }),
  skillGap: (body) => request('/skill-gap', { method: 'POST', body, timeoutMs: 90000 }),
  leaderboard: () => request('/leaderboard'),
  stats: () => request('/stats'),

  scanResume: async (formData) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    let res;
    try {
      res = await fetch('/api/resume/scan', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Scan timed out after 2 minutes.');
      throw new Error('Network error during scan.');
    }
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Scan failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  },
};
