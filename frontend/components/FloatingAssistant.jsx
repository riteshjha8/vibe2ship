"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function FloatingAssistant() {
  const [isReady, setIsReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setViewportWidth(window.innerWidth);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const openPanel = async () => {
      if (!open || session) return;
      setLoading(true);
      setError("");
      try {
        const sessionsRes = await api.get("/chat/sessions");
        const firstSession = sessionsRes.data.sessions?.[0];
        if (firstSession) {
          setSession(firstSession);
          const messagesRes = await api.get(`/chat/sessions/${firstSession._id}/messages`);
          setMessages(messagesRes.data.messages || []);
        } else {
          const createRes = await api.post("/chat/sessions", { title: "AI Assistant" });
          setSession(createRes.data.session);
          setMessages([]);
        }
      } catch (err) {
        setError("Unable to load the assistant right now.");
      } finally {
        setLoading(false);
      }
    };
    openPanel();
  }, [open, session]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isShortcut = (event.ctrlKey && event.key.toLowerCase() === "k") || (event.altKey && event.code === "Space");
      if (!isShortcut) return;
      event.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function sendMessage(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !session) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/chat/sessions/${session._id}/messages`, { content: trimmed });
      const { userMessage, assistantMessage, session: updatedSession } = res.data;
      if (userMessage) setMessages((prev) => [...prev, userMessage]);
      if (assistantMessage) setMessages((prev) => [...prev, assistantMessage]);
      setSession(updatedSession || session);
      setInput("");
    } catch (err) {
      setError("Message failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isReady) return null;

  const isMobile = viewportWidth > 0 ? viewportWidth < 640 : false;
  const panelWidth = isMobile ? Math.min(window.innerWidth - 32, 560) : 520;
  const panelHeight = isMobile ? Math.min(window.innerHeight - 120, 760) : 720;
  const panelStyle = isMobile
    ? { left: 16, right: 16, bottom: 16, height: panelHeight }
    : { width: panelWidth, right: 24, bottom: 24, height: panelHeight };

  const panelClass = isMobile
    ? "fixed z-50 left-4 right-4 bottom-4 rounded-[1rem] border border-white/10 bg-slate-950/95 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl overflow-hidden"
    : "fixed z-50 rounded-[2rem] border border-white/10 bg-slate-950/95 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl overflow-hidden";

  const showEmpty = messages.length === 0 && !loading;

  return (
    <>
      <div className="fixed right-6 bottom-6 z-40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white font-semibold shadow-lg shadow-teal-500/25 transition hover:bg-teal-400"
          aria-label="Open AI assistant"
        >
          AI
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <div className={panelClass} style={panelStyle} onClick={(event) => event.stopPropagation()}>
            <div className="flex h-full min-h-[400px] flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-teal-500/10 text-teal-300 ring-1 ring-teal-400/20">
                    <span className="text-sm font-semibold">AI</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-teal-300">AI Assistant</p>
                    <h2 className="text-lg font-semibold text-white">Ask anything, plan everything</h2>
                    <p className="mt-1 text-xs text-slate-400">Type a question or ask for task prioritization.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/90 text-slate-200 transition hover:bg-slate-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loading && (
                  <div className="rounded-3xl bg-slate-900/80 px-4 py-5 text-sm text-slate-400">Loading the chat assistant…</div>
                )}
                {error && <div className="rounded-3xl bg-rose-500/10 px-4 py-4 text-sm text-rose-200">{error}</div>}
                {showEmpty ? (
                  <div className="rounded-2xl bg-slate-900/80 px-4 py-6 text-sm leading-6 text-slate-300">
                    <div className="flex flex-col gap-3">
                      <div>Start a conversation with the AI. Ask for a plan, deadline rescue, or productivity strategy.</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((message) => (
                      <div key={`${message._id}-${message.createdAt}`} className={`max-w-[90%] ${message.role === "assistant" ? "self-start" : "self-end"}`}>
                        <div className={`${message.role === "assistant" ? "bg-slate-800 text-slate-100" : "bg-teal-500/10 text-slate-100"} rounded-2xl px-4 py-3 text-sm leading-6`}>
                          {message.content}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="border-t border-slate-800/80 bg-slate-950/95 px-5 py-4">
                <label htmlFor="assistant-message" className="sr-only">Ask the AI assistant</label>
                <div className="relative">
                  <textarea
                    id="assistant-message"
                    rows={4}
                    className="w-full resize-none rounded-[2rem] border border-slate-800 bg-slate-950/95 px-4 py-4 pr-14 text-sm text-slate-100 outline-none transition duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                    placeholder="What do you want help with today?"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                  />
                  {input && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 transition hover:bg-slate-800"
                      aria-label="Clear message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-500">Shortcut: Ctrl + K / Alt + Space</div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-850"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="inline-flex min-w-[130px] items-center justify-center rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Thinking…" : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
