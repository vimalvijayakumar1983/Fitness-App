import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, getToken, setToken } from '@/services/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthValue {
  user: AuthUser | null;
  token: string | null;
  /** True once the initial token check has completed. */
  ready: boolean;
  register: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTok] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Restore a saved session on launch.
  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await getToken();
      if (saved) {
        try {
          const { user } = await api.me();
          if (active) {
            setUser(user);
            setTok(saved);
          }
        } catch {
          await setToken(null); // expired/invalid
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await api.me();
    setUser(user);
    setTok(await getToken());
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    await api.register(email, password, name);
    await refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setTok(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, token, ready, register, login, logout }),
    [user, token, ready, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
