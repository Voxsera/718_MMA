// Tiny fetch wrapper. Same-origin in production; Vite proxy handles /api in dev.
export const api = {
  async get(url) {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok && r.status !== 401 && r.status !== 403) throw new Error('Request failed: ' + url);
    return r.json();
  },
  async post(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body || {}),
    });
    return r.json();
  },
};
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
