import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types/auth";
import { getMeSync } from "./demoUser";

/**
 * DEMO auth context: the visitor is always signed in as the preloaded sample user.
 * No tokens, no sign-in, no network.
 */
type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getMeSync());
  const setUser = useCallback((u: User | null) => setUserState(u), []);
  return (
    <AuthContext.Provider value={{ user, isLoading: false, isAuthenticated: true, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
