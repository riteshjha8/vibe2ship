"use client";
import { useEffect, useState } from "react";

export default function AutoJoinToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    function handler(e) {
      const { payload, join, opened } = e.detail || {};
      const title = payload?.title || (payload?.meeting && payload.meeting.title) || "Meeting";
      const message = opened
        ? `Auto-joined ${title}`
        : `Attempted auto-join for ${title}. Click to open.`;
      setToast({ title, message, href: join, opened });
      // auto-hide after 12s
      window.setTimeout(() => setToast((t) => (t && t.href === join ? null : t)), 12_000);
    }

    window.addEventListener("meeting:autoJoin", handler);
    return () => window.removeEventListener("meeting:autoJoin", handler);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-60">
      <div className="rounded-lg bg-slate-900/90 text-slate-100 p-3 shadow-lg max-w-sm w-full">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{toast.title}</div>
            <div className="text-xs text-slate-300">{toast.message}</div>
          </div>
          <div className="flex items-center gap-2">
            {toast.href && (
              <a
                href={toast.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/15"
              >
                Open
              </a>
            )}
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-200 text-sm px-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
