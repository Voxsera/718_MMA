import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setUser(d.user); setMembership(d.membership); }
      else { setUser(null); setMembership(null); }
    } catch { setUser(null); }
    setReady(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const loginWithGoogle = async (credential) => {
    const res = await api.post('/api/auth/google', { credential });
    if (res.ok) { setUser(res.user); setMembership(res.membership); return { ok: true }; }
    return { ok: false, error: res.message || res.error };
  };

  const logout = async () => { await api.post('/api/auth/logout'); setUser(null); setMembership(null); };

  return <AuthCtx.Provider value={{ user, membership, ready, loginWithGoogle, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
