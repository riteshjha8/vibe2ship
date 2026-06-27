"use client";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const isBrowser = typeof window !== "undefined";
const apiBaseUrl = isBrowser ? "/api" : API_URL ? `${API_URL}/api` : "/api";

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("v2s_access");
    config.headers = config.headers || {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("v2s_refresh");
      if (!refreshToken) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, original });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const refreshUrl = "/api/auth/refresh";
        const { data } = await axios.post(refreshUrl, { refreshToken });
        localStorage.setItem("v2s_access", data.accessToken);
        queue.forEach(({ resolve, original: o }) => {
          o.headers.Authorization = `Bearer ${data.accessToken}`;
          resolve(api(o));
        });
        queue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        localStorage.removeItem("v2s_access");
        localStorage.removeItem("v2s_refresh");
        localStorage.removeItem("v2s_user");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
