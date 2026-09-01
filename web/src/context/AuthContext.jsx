import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    api('/auth/refresh')
      .then(({ user: u, accessToken }) => {
        if (!active) return;
        setAccessToken(accessToken);
        setUser(u);
      })
      .catch(() => {})
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
  }, [user]);

  const login = useCallback(async (identifier, password) => {
    const { user: u, accessToken } = await api('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
    setAccessToken(accessToken);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: u, accessToken } = await api('/auth/register', {
      method: 'POST',
      body: payload,
    });
    setAccessToken(accessToken);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}