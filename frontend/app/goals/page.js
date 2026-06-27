"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import GoalCard from "@/components/GoalCard";
import AIStatusPanel from "@/components/AIStatusPanel";
import api from "@/lib/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ title: "", targetDate: "", milestonesText: "" });
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
    const milestones = String(form.milestonesText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 10);
    const { data } = await api.post("/goals", { title: form.title, targetDate: form.targetDate, milestones });
    setGoals((prev) => [data.goal, ...prev]);
    setForm({ title: "", targetDate: "", milestonesText: "" });
    window.dispatchEvent(new Event("aiSummaryRefresh"));
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

      <form
        onSubmit={submit}
        className="glass-card rounded-3xl border border-slate-800 bg-slate-950/85 p-6 mb-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.75)]"
      >
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(260px,1fr)_360px] lg:items-end">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Goal</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ship the MVP"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Target date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 focus:border-teal-400 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Milestones</label>
              <textarea
                value={form.milestonesText}
                onChange={(e) => setForm((f) => ({ ...f, milestonesText: e.target.value }))}
                placeholder="Add 5–10 milestones, one per line"
                rows={4}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400 outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">Milestones help the AI estimate progress and keep your goal actionable.</p>
            </div>
            <button className="inline-flex items-center justify-center rounded-2xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400">
              Add goal
            </button>
          </div>
        </div>
      </form>

      <div className="grid min-w-0 xl:grid-cols-[2fr_1fr] gap-5">
        <div className="min-w-0">
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
        </div>
        <AIStatusPanel title="Goal planning coach" description="AI insights to help keep your long-range goals aligned with today’s priorities." />
      </div>
    </Shell>
  );
}
