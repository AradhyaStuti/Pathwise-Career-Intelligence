import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user } = await api.login({ email, password });
    setUser(user);
  }

  async function signup(name, email, password) {
    const { user } = await api.signup({ name, email, password });
    setUser(user);
  }

  async function logout() {
    try { await api.logout(); } catch {}
    setUser(null);
  }

  async function updateProfile(patch) {
    const { user } = await api.updateProfile(patch);
    setUser(user);
    return user;
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
