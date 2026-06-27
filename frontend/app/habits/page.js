"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import HabitTracker from "@/components/HabitTracker";
import AIStatusPanel from "@/components/AIStatusPanel";
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

      <form onSubmit={submit} className="glass-card rounded-xl p-4 mb-6 grid gap-4 sm:grid-cols-[minmax(220px,1fr)_180px_auto] items-end bg-slate-950/80 border border-slate-700">
        <div className="min-w-[180px]">
          <label className="block text-xs text-slate-400 mb-1">Habit</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning workout"
            className="w-full rounded-lg bg-slate-950/90 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-lg bg-slate-950/90 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <p className="mt-2 text-xs text-slate-400">
            Choose how often this habit should repeat so it is easy to scan on small screens.
          </p>
        </div>
        <button className="min-w-[100px] bg-teal-500 hover:bg-teal-400 text-ink px-4 py-2 rounded-lg font-medium text-sm transition">
          Add habit
        </button>
      </form>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div>
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
        </div>
        <AIStatusPanel title="Habit streak coach" description="Use AI signals to keep your routines on track and avoid streak fatigue." />
      </div>
    </Shell>
  );
}
