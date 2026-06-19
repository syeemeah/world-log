import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthSession {
  token: string;
  username: string;
  role: "admin" | "editor";
}

interface AuthCtx {
  session: AuthSession | null;
  isAdmin: boolean;
  isEditor: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  isAdmin: false,
  isEditor: false,
  login: async () => ({ ok: false }),
  logout: () => {},
});

const STORAGE_KEY = "sy_travel_session";

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession);

  useEffect(() => {
    setAuthTokenGetter(() => session?.token ?? null);
  }, [session]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json() as { token?: string; username?: string; role?: string; error?: string };
      if (!res.ok) return { ok: false, error: data.error ?? "Login failed" };

      const s: AuthSession = {
        token: data.token!,
        username: data.username!,
        role: data.role as "admin" | "editor",
      };
      setSession(s);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not connect to server" };
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isAdmin = session?.role === "admin";
  const isEditor = session?.role === "admin" || session?.role === "editor";

  return (
    <AuthContext.Provider value={{ session, isAdmin, isEditor, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
