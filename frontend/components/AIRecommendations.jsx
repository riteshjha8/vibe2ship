"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AIRecommendations() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [mode, setMode] = useState("recommendation");

  async function load(currentMode = "recommendation") {
    setLoading(true);
    try {
      const endpoint = currentMode === "rescue" ? "/ai/rescue-plan" : "/ai/recommendations";
      const { data } = await api.get(endpoint);
      setText(data.plan || data.recommendation || "Could not generate AI guidance right now.");
      setFallback(!!data.fallback);
      setMode(currentMode);
    } catch {
      setText("Could not load AI guidance right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-semibold text-sm tracking-wide text-teal-300">
            {mode === "rescue" ? "Emergency rescue mode" : "AI mission control"}
          </h3>
          <p className="text-[11px] text-slate-500 max-w-xl mt-1">
            Get either a daily mission plan or a focused rescue checklist to save your day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load("recommendation")}
            className={`text-xs px-3 py-2 rounded-full transition ${
              mode === "recommendation" ? "bg-teal-500 text-ink" : "border border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            Daily mission
          </button>
          <button
            type="button"
            onClick={() => load("rescue")}
            className={`text-xs px-3 py-2 rounded-full transition ${
              mode === "rescue" ? "bg-alarm-500 text-ink" : "border border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            Save My Day
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500 font-mono">Thinking through your schedule…</p>
      ) : (
        <>
          <p className="text-sm text-slate-200/90 whitespace-pre-line leading-relaxed">{text}</p>
          {fallback && (
            <p className="text-[11px] text-amber-400 mt-3">
              Running on rule-based fallback — add a valid COHERE_KEY in backend/.env for full AI scheduling.
            </p>
          )}
        </>
      )}
    </div>
  );
}
