import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'eventx_session';

const getSession = () => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const saveSession = (user) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getSession());

  // ── Register (Talking to MySQL Backend) ─────────
  const register = useCallback(async ({ name, email, password, role, department }) => {
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, department })
      });
      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      const session = data.user;
      setUser(session);
      saveSession(session);
      return { success: true, user: session };
    } catch (err) {
      return { success: false, error: 'Cannot connect to backend server.' };
    }
  }, []);

  // ── Login (Talking to MySQL Backend) ────────────
  const login = useCallback(async ({ email, password }) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!data.success) {
        return { success: false, error: data.error };
      }

      const session = data.user;
      setUser(session);
      saveSession(session);
      return { success: true, user: session };
    } catch (err) {
      return { success: false, error: 'Cannot connect to backend server.' };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    // Always send to login page after logout (not register)
    window.location.href = '/login';
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
