import React, { createContext, useEffect, useState } from 'react';
import api, { setToken, clearToken, getToken } from '../api';

export const AuthContext = createContext({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  hasRole: () => false,
  isAuthenticated: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    setLoading(true);
    api.defaults.headers.common.Authorization = `Bearer ${t}`;
    api
      .get('/me')
      .then((r) => setUser(r.data))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password, remember = true) {
    setLoading(true);
    try {
      const res = await api.post('/login', { email, password });
      const access_token = res?.data?.access_token;
      const expires_in = res?.data?.expires_in || null;
      if (!access_token) throw new Error('No access_token in response');
      setToken(access_token, remember, expires_in);
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      const me = await api.get('/me');
      setUser(me.data);
      return { success: true, token: access_token, user: me.data };
    } catch (err) {
      clearToken();
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await api.post('/logout').catch(() => {});
    } finally {
      clearToken();
      setUser(null);
      setLoading(false);
    }
  }

  function hasRole(roleName) {
    if (!user) return false;
    const r = user.role || user.roles;
    if (Array.isArray(r)) return r.includes(roleName);
    return r === roleName;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
