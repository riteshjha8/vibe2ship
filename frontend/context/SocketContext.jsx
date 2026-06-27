"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]); // queue of unread reminders for the ring/voice overlay
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let socket = null;

    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("v2s_access") : null;
    if (!token) return;

    import("socket.io-client")
      .then(({ io }) => {
        if (!mounted) return;
        const socketHost = API_URL || (typeof window !== "undefined" ? window.location.origin : "");
        socket = io(socketHost, {
          auth: { token },
          transports: ["websocket", "polling"],
          path: "/socket.io",
        });
        socketRef.current = socket;

        socket.on("task:reminder", (payload) => {
          setReminders((prev) => [...prev, { ...payload, id: `${payload.taskId}-${payload.ringType}-${Date.now()}` }]);
        });
      })
      .catch((error) => {
        console.error("Failed to load socket.io-client", error);
      });

    return () => {
      mounted = false;
      socket?.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [user]);

  function dismissReminder(id) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, reminders, dismissReminder }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
