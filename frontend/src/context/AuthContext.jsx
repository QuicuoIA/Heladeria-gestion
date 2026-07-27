// ============================================================
// ARCHIVO: frontend/src/context/AuthContext.jsx
// DESCRIPCIÓN: Contexto de autenticación — login, logout y
//              estado del usuario persistido en localStorage.
// ============================================================

import { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem('usuario');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Intenta autenticar con el PIN dado.
   * @param {string} pin
   * @returns {{ success: boolean, mensaje?: string }}
   */
  const login = async (pin) => {
    try {
      const { data } = await api.post('/auth/login', { pin });
      if (data.token && data.usuario) {
        localStorage.setItem('token',   data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        setUsuario(data.usuario);
        return { success: true };
      }
      return { success: false, mensaje: data.mensaje || 'Error al iniciar sesión.' };
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'PIN incorrecto o error de red.';
      return { success: false, mensaje };
    }
  };

  const logout = () => {
    localStorage.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
