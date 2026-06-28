"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || API_URL;

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
        const socketHost = SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "");
        socket = io(socketHost, {
          auth: { token },
          transports: ["websocket", "polling"],
          path: "/socket.io",
        });
        socketRef.current = socket;

        socket.on("connect", () => console.debug("socket connected", socket.id));
        socket.on("disconnect", (reason) => console.debug("socket disconnected", reason));
        socket.on("task:reminder", (payload) => {
          console.debug("socket event: task:reminder", payload);
          // If the meeting requests auto-join and the reminder is within the configured window, attempt to open the join URL immediately.
          try {
            const join = payload.actions?.find((a) => a.kind === "open_url");
            const shouldAutoJoin = payload.meeting?.shouldAutoJoin ?? (payload.meeting?.autoJoin && !!join?.href);
            let opened = false;
            if (shouldAutoJoin && join?.href) {
              try {
                const w = window.open(join.href, "_blank", "noopener,noreferrer");
                // Some browsers will return null if the popup is blocked
                opened = !!w;
                console.debug("auto-join attempted", { href: join.href, opened });
              } catch (err) {
                console.debug("auto-join window.open threw", err);
                opened = false;
              }
            }
            // Dispatch a DOM event so UI components can show a toast / fallback join button.
            try {
              window.dispatchEvent(new CustomEvent("meeting:autoJoin", { detail: { payload, join: join?.href, opened } }));
            } catch (err) {
              console.debug("failed to dispatch meeting:autoJoin event", err);
            }
          } catch (err) {
            console.debug("error handling task:reminder", err);
          }
          try {
            // Notify any task-specific UI that a task reminder is ringing now.
            window.dispatchEvent(new CustomEvent("task:ring", { detail: payload }));
          } catch (err) {
            // ignore
          }
          setReminders((prev) => [...prev, { ...payload, id: `${payload.taskId}-${payload.ringType}-${Date.now()}` }]);
        });
        socket.on("assignment:autosubmit", (payload) => {
          try {
            // let UI components refresh and show updates
            window.dispatchEvent(new CustomEvent("assignments:refresh"));
            window.dispatchEvent(new CustomEvent("assignment:result", { detail: payload }));
          } catch (err) {
            // ignore
          }
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
