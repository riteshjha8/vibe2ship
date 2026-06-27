"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dayjs from "@/lib/dayjs";

export default function GoalCard({ goal, onChange, onDelete }) {
  const [progress, setProgress] = useState(goal.progress);
  const totalMilestones = Array.isArray(goal.milestones) ? goal.milestones.length : 0;
  const completedMilestones = Array.isArray(goal.milestones) ? goal.milestones.filter((item) => item.done).length : 0;

  useEffect(() => {
    setProgress(goal.progress);
  }, [goal.progress]);

  async function save(value) {
    setProgress(value);
    const { data } = await api.put(`/goals/${goal._id}`, { progress: value });
    onChange(data.goal);
    window.dispatchEvent(new Event("aiSummaryRefresh"));
  }

  async function toggleMilestone(itemId) {
    try {
      const { data } = await api.post(`/goals/${goal._id}/milestones/${itemId}/toggle`);
      onChange(data.goal);
      window.dispatchEvent(new Event("aiSummaryRefresh"));
    } catch {}
  }

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/85 p-5 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:border-teal-500/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <h4 className="font-display w-full text-lg font-semibold text-slate-100 truncate break-words">{goal.title}</h4>
            <button
              onClick={() => onDelete(goal._id)}
              className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs font-medium text-rose-400 transition hover:border-rose-400/50 hover:bg-rose-500/10"
            >
              Delete
            </button>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {goal.targetDate && (
              <span className="min-w-0 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400 break-words">
                Target {dayjs(goal.targetDate).format("MMM D")}
              </span>
            )}
            <span className="min-w-0 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400 break-words">
              {goal.status === "completed" ? "Completed" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-900/80 p-4 border border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">Progress</p>
            <p className="text-2xl font-semibold text-slate-100">{progress}%</p>
          </div>
          <button
            type="button"
            onClick={() => save(Math.min(100, progress + 10))}
            className="rounded-2xl bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            +10%
          </button>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-400" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {totalMilestones > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
            <span>Milestones</span>
            <span>{completedMilestones}/{totalMilestones}</span>
          </div>
          <div className="space-y-2">
            {goal.milestones.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => toggleMilestone(item._id)}
                className={`group flex w-full min-w-0 items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                  item.done
                    ? "border-teal-500/40 bg-teal-500/10 text-slate-100 shadow-inner shadow-teal-500/10"
                    : "border-slate-800 bg-slate-900/90 text-slate-300 hover:border-teal-500/40 hover:bg-slate-900"
                }`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${item.done ? "border-teal-400 bg-teal-400 text-slate-950" : "border-slate-700"}`}>
                  {item.done ? "✓" : ""}
                </span>
                <span className="min-w-0 text-sm leading-6 break-words">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {goal.status === "completed" && (
        <p className="text-xs text-teal-300 mt-5">Completed 🎉 Great work staying on track.</p>
      )}
    </div>
  );
}
