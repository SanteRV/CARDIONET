import React, { createContext, useContext, useEffect, useState } from 'react';
import { Usuario } from '../api/auth';
import { getToken, setToken, clearToken } from '../api/client';
import * as authApi from '../api/auth';

const USER_KEY = 'cardionet_user';

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  setUser: (u: Usuario | null) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function getStoredUser(): Usuario | null {
  try {
    const u = localStorage.getItem(USER_KEY);
    return u ? (JSON.parse(u) as Usuario) : null;
  } catch {
    return null;
  }
}

function setStoredUser(u: Usuario | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Usuario | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  const setUser = (u: Usuario | null) => {
    setUserState(u);
    setStoredUser(u);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    const { ok, data } = await authApi.login(email, password);
    if (ok && data.token) {
      setToken(data.token);
      setUser(data.usuario);
      return { ok: true };
    }
    return { ok: false, error: (data as { error?: string }).error || 'Error al iniciar sesión' };
  };

  useEffect(() => {
    const token = getToken();
    const u = getStoredUser();
    if (!token || !u) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ ok, data }) => {
        if (ok && data.usuario) {
          setUser({ ...u, ...data.usuario });
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
