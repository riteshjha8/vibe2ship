"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { detectTimezone } from "@/lib/dayjs";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("v2s_user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("v2s_access") : null;
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const persist = (userData, accessToken, refreshToken) => {
    localStorage.setItem("v2s_user", JSON.stringify(userData));
    localStorage.setItem("v2s_access", accessToken);
    localStorage.setItem("v2s_refresh", refreshToken);
    setUser(userData);
  };

  const register = useCallback(async (form) => {
    const timezone = detectTimezone();
    const { data } = await api.post("/auth/register", { ...form, timezone });
    persist(data.user, data.accessToken, data.refreshToken);
    return data.user;
  }, []);

  const login = useCallback(async (form) => {
    const { data } = await api.post("/auth/login", form);
    persist(data.user, data.accessToken, data.refreshToken);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("v2s_refresh");
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {}
    localStorage.removeItem("v2s_user");
    localStorage.removeItem("v2s_access");
    localStorage.removeItem("v2s_refresh");
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("v2s_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
