"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import HabitTracker from "@/components/HabitTracker";
import api from "@/lib/api";

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/habits");
      setHabits(data.habits);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!title) return;
    const { data } = await api.post("/habits", { title, frequency });
    setHabits((prev) => [data.habit, ...prev]);
    setTitle("");
  }

  function handleChange(updated) {
    setHabits((prev) => prev.map((h) => (h._id === updated._id ? updated : h)));
  }
  function handleDelete(id) {
    api.delete(`/habits/${id}`).then(() => setHabits((prev) => prev.filter((h) => h._id !== id)));
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Habits</h1>

      <form onSubmit={submit} className="glass-card rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-400 mb-1">Habit</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning workout"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-ink px-4 py-2 rounded-lg font-medium text-sm transition">
          Add habit
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500 font-mono">Loading…</p>
      ) : habits.length === 0 ? (
        <p className="text-sm text-slate-500">No habits yet. Add one above to start a streak.</p>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <HabitTracker key={h._id} habit={h} onChange={handleChange} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </Shell>
  );
}
