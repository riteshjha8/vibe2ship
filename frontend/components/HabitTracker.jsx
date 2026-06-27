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
    <div className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <h4 className="font-display font-medium">{habit.title}</h4>
        <p className="text-xs text-slate-400">
          {habit.frequency === "daily" ? "Daily" : "Weekly"} · streak {habit.streak} · best {habit.longestStreak}
        </p>
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
