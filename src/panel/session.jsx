import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ApiError, get, post } from './api';
import { disablePush } from './pwa';
import { Skeleton } from './ui';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// user === undefined: still checking /api/auth/me; null: signed out.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(null);
  const check = useCallback(() => {
    setError(null);
    get('/api/auth/me').then(setUser, (e) => (e instanceof ApiError && e.status === 401 ? setUser(null) : setError(e)));
  }, []);
  useEffect(() => {
    check();
    const out = () => setUser(null);
    window.addEventListener('mcj:unauth', out);
    return () => window.removeEventListener('mcj:unauth', out);
  }, [check]);
  const logout = async () => { await disablePush().catch(() => {}); await post('/api/auth/logout').catch(() => {}); setUser(null); };
  // Sections come from the server's permission map (/api/auth/me), never from a copy here.
  const can = (resource, action) => user?.perms?.[resource]?.includes(action) ?? false;
  return <Ctx.Provider value={{ user, setUser, reload: check, error, logout, can }}>{children}</Ctx.Provider>;
}

// Route guard: sends signed-out visitors to the login and remembers where they were going.
export function RequireAuth({ children }) {
  const { user, error, reload } = useAuth();
  const loc = useLocation();
  if (error) return <div className="auth-wrap"><div className="state state-error" role="alert"><p>No se pudo comprobar la sesión.</p><button className="p-btn" onClick={reload}>Reintentar</button></div></div>;
  if (user === undefined) return <div className="auth-wrap"><Skeleton rows={3} /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return children;
}

// Derej and seasons (public endpoints) cached for the whole session.
let cat;
export function useCatalogs() {
  const [v, set] = useState(null);
  useEffect(() => {
    cat ??= Promise.all([get('/api/public/derej'), get('/api/public/seasons')]).catch((e) => { cat = null; throw e; });
    cat.then(([derej, seasons]) => set({ derej, seasons }), () => set({ derej: [], seasons: [] }));
  }, []);
  return v ?? { derej: [], seasons: [] };
}
