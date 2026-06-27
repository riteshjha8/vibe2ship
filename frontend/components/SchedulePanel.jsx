"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function SchedulePanel() {
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("recommendation");

  async function load(currentMode = "recommendation") {
    setLoading(true);
    try {
      const endpoint = currentMode === "rescue" ? "/ai/rescue-plan" : "/ai/recommendations";
      const { data } = await api.get(endpoint);
      setSchedule(data.plan || data.recommendation || "The AI schedule could not be generated.");
      setMode(currentMode);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">AI schedule coach</h3>
          <p className="text-sm text-slate-400">Auto-suggested order for your day with deadline rescue when needed.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => load("recommendation")}
            className={`text-xs rounded-full px-3 py-2 transition ${mode === "recommendation" ? "bg-teal-500 text-ink" : "border border-white/10 text-slate-300 hover:bg-white/5"}`}
          >
            Daily plan
          </button>
          <button
            type="button"
            onClick={() => load("rescue")}
            className={`text-xs rounded-full px-3 py-2 transition ${mode === "rescue" ? "bg-alarm-500 text-ink" : "border border-white/10 text-slate-300 hover:bg-white/5"}`}
          >
            Rescue mode
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Thinking through your tasks…</p>
      ) : (
        <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{schedule}</pre>
      )}
    </div>
  );
}
