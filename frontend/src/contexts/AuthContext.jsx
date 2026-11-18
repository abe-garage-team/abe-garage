import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cacheEmployee, getCachedEmployee } from '../services/core/session.js';
import * as authService from '../services/auth.service.js';

const AuthContext = createContext(null);

// Holds "who is logged in" for the whole app.
// The session itself is a cookie the browser sends on every request; the server decides.
// On load we ask GET /profile once: 200 means logged in, 401 means not.
export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(getCachedEmployee);
  const [checking, setChecking] = useState(true);

  const setSession = useCallback((profile) => {
    cacheEmployee(profile);
    setEmployee(profile);
  }, []);

  // Called after logout, after a password change, or when the server answers 401.
  const clearSession = useCallback(() => {
    cacheEmployee(null);
    setEmployee(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The cookie may already be gone; the local state is cleared either way.
    }
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    window.addEventListener('abe-garage:session-expired', clearSession);
    const abort = new AbortController();
    authService
      .getProfile(abort.signal)
      .then((profile) => {
        if (!abort.signal.aborted) setSession(profile);
      })
      .catch(() => {
        if (!abort.signal.aborted) clearSession();
      })
      .finally(() => {
        if (!abort.signal.aborted) setChecking(false);
      });
    return () => {
      abort.abort();
      window.removeEventListener('abe-garage:session-expired', clearSession);
    };
  }, [setSession, clearSession]);

  const value = useMemo(
    () => ({
      employee,
      checking,
      isAuthenticated: Boolean(employee),
      setSession,
      clearSession,
      logout,
    }),
    [employee, checking, setSession, clearSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requires AuthProvider');
  return context;
}
