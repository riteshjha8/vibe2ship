"use client";
import api from "@/lib/api";

export default function HabitTracker({ habit, onChange, onDelete }) {
  const checkedToday = habit.lastCompletedAt && new Date(habit.lastCompletedAt).toDateString() === new Date().toDateString();

  async function checkIn() {
    try {
      const { data } = await api.post(`/habits/${habit._id}/checkin`);
      onChange(data.habit);
    } catch {}
  }

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3 bg-slate-950/80 border border-slate-700">
      <div className="min-w-0">
        <h4 className="font-display font-medium text-base text-slate-100">{habit.title}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span className="rounded-full border border-slate-700 bg-slate-900/90 px-2 py-0.5 font-medium text-slate-100">
            {habit.frequency === "daily" ? "Daily" : "Weekly"}
          </span>
          <span>streak {habit.streak}</span>
          <span>best {habit.longestStreak}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={checkIn}
          disabled={checkedToday}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            checkedToday ? "bg-teal-500/20 text-teal-300 cursor-default" : "bg-teal-500 text-ink hover:bg-teal-400"
          }`}
        >
          {checkedToday ? "Done today" : "Check in"}
        </button>
        <button onClick={() => onDelete(habit._id)} className="text-xs text-alarm-500/80 hover:bg-alarm-500/10 rounded px-2 py-1">
          ✕
        </button>
      </div>
    </div>
  );
}
