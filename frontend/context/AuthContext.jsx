"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { detectTimezone } from "@/lib/dayjs";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("v2s_user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("v2s_access") : null;

    async function initializeAuth() {
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const { data } = await api.get("/auth/me");
          localStorage.setItem("v2s_user", JSON.stringify(data.user));
          setUser(data.user);
        } catch (err) {
          console.warn("Stored access token exists but user recovery failed", err.response?.status || err.message);
          localStorage.removeItem("v2s_user");
          localStorage.removeItem("v2s_access");
          localStorage.removeItem("v2s_refresh");
          setUser(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(false);
    }

    initializeAuth();
  }, [router]);

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
    setLoggingOut(true);
    try {
      await api.post("/auth/logout", { refreshToken }, { skipAuthRedirect: true });
    } catch {}
    localStorage.removeItem("v2s_user");
    localStorage.removeItem("v2s_access");
    localStorage.removeItem("v2s_refresh");
    setUser(null);
    await router.replace("/");
    setLoggingOut(false);
  }, [router]);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("v2s_user", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loggingOut, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
