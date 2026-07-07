import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, loadToken, setToken } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    await loadToken();
    const r = await api.get('/api/auth/me');
    if (r.ok) { setUser(r.data.user); setMembership(r.data.membership); }
    else { setUser(null); setMembership(null); }
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handle = async (r) => {
    if (r.ok && r.data.token) { await setToken(r.data.token); setUser(r.data.user); setMembership(r.data.membership); return { ok: true }; }
    if (r.error === 'network') return { ok: false, error: "Can't reach the gym server. Check that you're on the same Wi-Fi and the server is running." };
    return { ok: false, error: r.data.message || r.data.error || 'Something went wrong.' };
  };
  const login = async (email, password) => handle(await api.post('/api/auth/login', { email, password }));
  const register = async (name, email, password) => handle(await api.post('/api/auth/register', { name, email, password }));
  const loginWithGoogle = async (credential) => handle(await api.post('/api/auth/google', { credential }));
  const logout = async () => { await setToken(null); setUser(null); setMembership(null); };

  return (
    <Ctx.Provider value={{ user, membership, ready, refresh, login, register, loginWithGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
