"use client";
import { useState } from "react";
import api from "@/lib/api";

export default function TaskSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Search your task history and planner insights.");

  async function search() {
    const trimmed = query.trim();
    if (!trimmed) {
      setMessage("Type a keyword like travel, groceries, workout, or presentation.");
      setResults([]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.get(`/ai/search?q=${encodeURIComponent(trimmed)}`);
      setResults(data.results || []);
      setMessage(data.message || (data.results?.length ? "" : "No matching planner results found."));
    } catch {
      setResults([]);
      setMessage("Could not search your planner right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 bg-slate-950/80 border border-white/10">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">AI task search</h3>
        <p className="text-sm text-slate-400 mt-1">Find the right task, project note, or planner moment with semantic search.</p>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for travel, groceries, workout, sprint..."
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 outline-none"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-teal-500 hover:bg-teal-400 text-ink px-4 py-2 text-sm font-medium transition disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((item, index) => (
            <div key={`${item.id || index}-${index}`} className="rounded-2xl border border-white/10 p-3 bg-slate-900">
              <p className="text-sm font-semibold text-slate-100">{item.title}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.snippet}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 min-h-[5rem]">{loading ? "Searching…" : message}</p>
      )}
    </div>
  );
}
