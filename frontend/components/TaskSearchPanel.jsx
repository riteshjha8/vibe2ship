"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";

export default function TaskSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const text = query.trim();

    if (!text) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.get(
        `/ai/search?q=${encodeURIComponent(text)}`
      );

      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={query}
            placeholder="Search tasks, goals, habits..."
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-14 rounded-full bg-[#171717] border border-[#2B2B2B] pl-12 pr-4 text-white text-sm placeholder:text-zinc-500 outline-none transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="h-14 rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:bg-[#c9a736] disabled:opacity-60"
        >
          Search
        </button>
      </div>

      {loading && (
        <p className="text-sm text-zinc-400 mb-2">Searching...</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((item, index) => (
            <div
              key={item.id ?? index}
              className="rounded-2xl border border-[#2B2B2B] bg-[#171717] p-4 transition hover:border-[#D4AF37]/40"
            >
              <h3 className="text-white font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{item.snippet}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="rounded-xl border border-[#2B2B2B] bg-[#171717] p-4 text-sm text-zinc-500">
          No results found.
        </div>
      )}

    </div>
  );
}