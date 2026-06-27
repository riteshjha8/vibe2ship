"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import GoalCard from "@/components/GoalCard";
import api from "@/lib/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ title: "", targetDate: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/goals");
      setGoals(data.goals);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.title) return;
    const { data } = await api.post("/goals", form);
    setGoals((prev) => [data.goal, ...prev]);
    setForm({ title: "", targetDate: "" });
  }

  function handleChange(updated) {
    setGoals((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
  }
  function handleDelete(id) {
    api.delete(`/goals/${id}`).then(() => setGoals((prev) => prev.filter((g) => g._id !== id)));
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Goals</h1>

      <form onSubmit={submit} className="glass-card rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-400 mb-1">Goal</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ship the MVP"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Target date</label>
          <input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          />
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-ink px-4 py-2 rounded-lg font-medium text-sm transition">
          Add goal
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500 font-mono">Loading…</p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-slate-500">No goals yet. Add a long-range goal above.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((g) => (
            <GoalCard key={g._id} goal={g} onChange={handleChange} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </Shell>
  );
}
