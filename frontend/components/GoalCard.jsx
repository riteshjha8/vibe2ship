"use client";
import { useState } from "react";
import dayjs from "@/lib/dayjs";
import api from "@/lib/api";

export default function GoalCard({ goal, onChange, onDelete }) {
  const [progress, setProgress] = useState(goal.progress);

  async function save(value) {
    setProgress(value);
    const { data } = await api.put(`/goals/${goal._id}`, { progress: value });
    onChange(data.goal);
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-display font-medium">{goal.title}</h4>
        <button onClick={() => onDelete(goal._id)} className="text-xs text-alarm-500/80 hover:bg-alarm-500/10 rounded px-2 py-1">
          Delete
        </button>
      </div>
      {goal.targetDate && (
        <p className="text-xs text-slate-400 mb-3">Target: {dayjs(goal.targetDate).format("D MMM YYYY")}</p>
      )}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => save(Number(e.target.value))}
          className="flex-1 accent-teal-500"
        />
        <span className="font-mono text-sm text-teal-300 w-10 text-right">{progress}%</span>
      </div>
      {goal.status === "completed" && (
        <p className="text-xs text-teal-400 mt-2">Completed 🎉</p>
      )}
    </div>
  );
}
