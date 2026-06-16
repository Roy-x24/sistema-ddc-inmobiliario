import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 min

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const stored = localStorage.getItem('usuario');
    if (token && stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        cerrarSesion();
      }
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (localStorage.getItem('access_token')) {
          cerrarSesion(true);
        }
      }, INACTIVITY_TIMEOUT);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [usuario]);

  const iniciarSesion = (access_token, refresh_token, datosUsuario) => {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  };

  const cerrarSesion = useCallback((porInactividad = false) => {
    const refreshToken = localStorage.getItem('refresh_token');
    const destino = porInactividad === true ? '/sesion-expirada' : '/login';

    localStorage.clear();
    setUsuario(null);
    window.location.href = destino;

    if (refreshToken) {
      api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
