"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { api } from "../lib/api";
import type { AuthSession } from "../lib/types";

const STORAGE_KEY = "bidora.auth";

type ToastKind = "success" | "error" | "info";
interface ToastState { message: string; kind: ToastKind }

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (payload: { email: string; password: string; displayName: string; phoneNumber?: string; registerAsSeller: boolean }) => Promise<AuthSession>;
  logout: () => void;
  hasRole: (role: "BUYER" | "SELLER" | "ADMIN") => boolean;
  notify: (message: string, kind?: ToastKind) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AuthSession;
        if (new Date(saved.expiresAt).getTime() > Date.now()) setSession(saved);
        else localStorage.removeItem(STORAGE_KEY);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const persist = useCallback((value: AuthSession) => {
    setSession(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return value;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const value = await api<AuthSession>("/api/v1/auth/login", { method: "POST", body: { email, password } });
    return persist(value);
  }, [persist]);

  const register = useCallback(async (payload: { email: string; password: string; displayName: string; phoneNumber?: string; registerAsSeller: boolean }) => {
    const value = await api<AuthSession>("/api/v1/auth/register", { method: "POST", body: payload });
    return persist(value);
  }, [persist]);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasRole = useCallback((role: "BUYER" | "SELLER" | "ADMIN") =>
    Boolean(session?.roles.includes(`ROLE_${role}`)), [session]);

  const notify = useCallback((message: string, kind: ToastKind = "success") => setToast({ message, kind }), []);
  const value = useMemo(() => ({ session, ready, login, register, logout, hasRole, notify }), [session, ready, login, register, logout, hasRole, notify]);

  const ToastIcon = toast?.kind === "success" ? CheckCircle2 : toast?.kind === "error" ? CircleAlert : Info;

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          <ToastIcon size={20} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Đóng thông báo"><X size={16} /></button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside Providers");
  return value;
}
