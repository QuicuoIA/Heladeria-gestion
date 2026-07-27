// ============================================================
// ARCHIVO: frontend/src/services/api.js
// DESCRIPCIÓN: Instancia de axios configurada con baseURL,
//              interceptores de token y redirección en 401/403.
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// ── Request interceptor: adjunta Bearer token ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: maneja 401/403 ────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // Solo redirige a login si el token expiró (no en cualquier 401/403)
    if ((status === 401 || status === 403) && !url.includes('/auth/login')) {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
