"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSession, login as apiLogin, logout as apiLogout } from "@/lib/auth-api";
import type { AuthSession, AuthUser, LoginCredentials } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((data: AuthSession | null) => {
    setSession(data);
  }, []);

  const refreshSession = useCallback(async () => {
    const data = await getSession();
    applySession(data);
  }, [applySession]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const data = await getSession();
        if (active) {
          applySession(data);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const data = await apiLogin(credentials);
      applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    applySession(null);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      permissions: session?.permissions ?? [],
      isLoading,
      isAuthenticated: Boolean(session?.user),
      login,
      logout,
      refreshSession,
    }),
    [session, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
