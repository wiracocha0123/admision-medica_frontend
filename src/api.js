// src/api.js
import axios from 'axios';

const RAW_API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export const API_PREFIX = '/api';
export const API_URL = RAW_API + API_PREFIX;

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
});

function _readStoredToken() {
  try {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || null;
  } catch (e) {
    return null;
  }
}


api.interceptors.request.use((config) => {
  const token = _readStoredToken();
  if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  return config;
});


api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config || {};
    const url = originalRequest.url || '';

    const isLoginReq = url.includes('/login');
    const isRefreshReq = url.includes('/refresh');

    if (status === 401 && !isLoginReq && !isRefreshReq && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const r = await axios.post(`${API_URL}/refresh`, {}, { headers: { Accept: 'application/json' } });
        const newToken = r?.data?.access_token;
        if (newToken) {
          setToken(newToken, true);
          originalRequest.headers = { ...(originalRequest.headers || {}), Authorization: `Bearer ${newToken}` };
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // fall through
      }
      clearToken();
      return Promise.reject(error);
    }

    if (status === 401) {
      clearToken();
    }

    return Promise.reject(error);
  }
);

export function setToken(token, remember = true, expires_in = null) {
  try {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('access_token', token);
    if (expires_in) {
      const expiresAt = Date.now() + expires_in * 1000;
      storage.setItem('access_token_expiry', String(expiresAt));
    }
    if (remember) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token_expiry');
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('access_token_expiry');
    }
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } catch (e) {}
}

export function clearToken() {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('access_token_expiry');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token_expiry');
  } catch (e) {}
  delete api.defaults.headers.common.Authorization;
}

export function getToken() {
  return _readStoredToken();
}

export default api;

// Convenience wrappers used across the app
export function post(url, data = {}, config = {}) {
  const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
  return api.post(url, data, { ...config, headers });
}

export function get(url, config = {}) {
  const headers = { Accept: 'application/json', ...(config.headers || {}) };
  return api.get(url, { ...config, headers });
}

export async function fetchCurrentUser() {
  try {
    const res = await get('/me');
    return res.data;
  } catch (e) {
    // try /user as fallback
    const res2 = await get('/user');
    return res2.data;
  }
}
