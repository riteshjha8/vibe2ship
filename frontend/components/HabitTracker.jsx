"use client";
import api from "@/lib/api";

export default function HabitTracker({ habit, onChange, onDelete }) {
  const checkedToday = habit.lastCompletedAt && new Date(habit.lastCompletedAt).toDateString() === new Date().toDateString();
  const totalChecklist = Array.isArray(habit.checklist) ? habit.checklist.length : 0;
  const completedChecklist = Array.isArray(habit.checklist) ? habit.checklist.filter((item) => item.done).length : 0;
  const checklistProgress = totalChecklist ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  async function checkIn() {
    try {
      const { data } = await api.post(`/habits/${habit._id}/checkin`);
      onChange(data.habit);
      window.dispatchEvent(new Event("aiSummaryRefresh"));
    } catch {}
  }

  async function toggleChecklistItem(itemId) {
    try {
      const { data } = await api.post(`/habits/${habit._id}/checklist/${itemId}/toggle`);
      onChange(data.habit);
      window.dispatchEvent(new Event("aiSummaryRefresh"));
    } catch {}
  }

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/85 p-5 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:border-gold-500/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-center gap-2 flex-wrap">
            <span className="font-display w-full text-lg font-semibold text-slate-100 truncate break-words">{habit.title}</span>
            <span className="rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
              {habit.frequency === "daily" ? "Daily" : "Weekly"}
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800">Streak {habit.streak}</span>
            <span className="px-2 py-1 rounded-full bg-slate-900/90 border border-slate-800">Best {habit.longestStreak}</span>
          </div>

          {totalChecklist > 0 && (
            <div className="rounded-3xl bg-slate-900/80 p-4 border border-slate-800">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500 mb-3">
                <span>Checklist progress</span>
                <span>{checklistProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-300 via-gold-500 to-amber-400" style={{ width: `${checklistProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <button
            onClick={checkIn}
            disabled={checkedToday}
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              checkedToday ? "bg-slate-800 text-slate-400 cursor-default" : "bg-gold-500 text-slate-950 hover:bg-gold-400"
            }`}
          >
            {checkedToday ? "Done today" : "Check in"}
          </button>
          <button
            onClick={() => onDelete(habit._id)}
            className="rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold text-rose-300 transition hover:border-rose-400/50 hover:bg-rose-500/10"
          >
            Delete
          </button>
        </div>
      </div>

      {totalChecklist > 0 && (
        <div className="mt-5 space-y-2">
          {habit.checklist.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => toggleChecklistItem(item._id)}
              className={`group flex w-full min-w-0 items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                item.done
                  ? "border-gold-500/40 bg-gold-500/10 text-slate-100 shadow-inner shadow-gold-500/10"
                  : "border-slate-800 bg-slate-900/90 text-slate-300 hover:border-gold-500/40 hover:bg-slate-900"
              }`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${item.done ? "border-gold-300 bg-gold-300 text-slate-950" : "border-slate-700"}`}>
                {item.done ? "✓" : ""}
              </span>
              <span className="min-w-0 text-sm leading-6 break-words">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
