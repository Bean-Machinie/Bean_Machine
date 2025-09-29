import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiFetch, type ApiUser } from '../lib/api';

type AuthContextValue = {
  user: ApiUser | null;
  initializing: boolean;
  signUp: (credentials: AuthCredentials) => Promise<AuthResult>;
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type AuthCredentials = {
  email: string;
  password: string;
};

type AuthResult = {
  success: boolean;
  message: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Pull the current session on initial mount so the UI can render the correct state.
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: ApiUser }>('/api/auth/me', {
        method: 'GET',
      });
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const signUp = useCallback(async ({ email, password }: AuthCredentials): Promise<AuthResult> => {
    try {
      const data = await apiFetch<{ message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }, []);

  const signIn = useCallback(async ({ email, password }: AuthCredentials): Promise<AuthResult> => {
    try {
      const data = await apiFetch<{ user: ApiUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      return { success: true, message: 'Signed in successfully.' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiFetch<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, initializing, signIn, signOut, signUp, refreshUser }),
    [user, initializing, signIn, signOut, signUp, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
