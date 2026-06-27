"use client";
import { useState } from "react";
import dayjs from "@/lib/dayjs";
import CountdownRing from "./CountdownRing";
import api from "@/lib/api";

const IMPORTANCE_LABEL = { 1: "Low", 2: "Mild", 3: "Normal", 4: "High", 5: "Critical" };

export default function TaskCard({ task, onChange, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [busy, setBusy] = useState(false);

  async function setStatus(status) {
    setBusy(true);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status });
      onChange(data.task);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSubtask(subId) {
    const { data } = await api.patch(`/tasks/${task._id}/subtasks/${subId}`);
    onChange(data.task);
  }

  async function planWithAI() {
    setPlanning(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/plan`);
      onChange(data.task);
      setExpanded(true);
    } finally {
      setPlanning(false);
    }
  }

  const done = task.status === "done";

  return (
    <div className={`glass-card rounded-xl p-4 transition ${done ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <CountdownRing deadline={task.deadline} createdAt={task.createdAt} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-display font-medium truncate ${done ? "line-through" : ""}`}>{task.title}</h4>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0">
              {IMPORTANCE_LABEL[task.importance] || "Normal"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Due {dayjs(task.deadline).format("ddd, D MMM · h:mm A")} · {task.category || "General"}
          </p>

          {task.description && (
            <p className="text-sm text-slate-300/80 mt-2 line-clamp-2">{task.description}</p>
          )}

          {task.location && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-slate-300">📍</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-200 underline underline-offset-2 hover:text-white"
              >
                {task.location}
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {!done && (
              <button
                disabled={busy}
                onClick={() => setStatus(task.status === "in_progress" ? "pending" : "in_progress")}
                className="text-xs px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/5 transition"
              >
                {task.status === "in_progress" ? "Mark not started" : "Start working"}
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => setStatus(done ? "pending" : "done")}
              className={`text-xs px-2.5 py-1 rounded-full transition ${
                done ? "border border-white/15 hover:bg-white/5" : "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
              }`}
            >
              {done ? "Reopen" : "Mark done"}
            </button>
            <button
              onClick={planWithAI}
              disabled={planning}
              className="text-xs px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/5 transition"
            >
              {planning ? "Planning…" : "AI: break into steps"}
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(task)}
              className="text-xs px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/5 transition"
            >
              Edit
            </button>
            {task.subtasks?.length > 0 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="text-xs px-2.5 py-1 rounded-full border border-white/15 hover:bg-white/5 transition"
              >
                {expanded ? "Hide steps" : `${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length} steps`}
              </button>
            )}
            <button
              onClick={() => onDelete(task._id)}
              className="text-xs px-2.5 py-1 rounded-full text-alarm-500/80 hover:bg-alarm-500/10 transition ml-auto"
            >
              Delete
            </button>
          </div>

          {expanded && task.subtasks?.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-white/8 pt-3">
              {task.subtasks.map((s) => (
                <li key={s._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => toggleSubtask(s._id)}
                    className="accent-teal-500 h-4 w-4"
                  />
                  <span className={s.done ? "line-through text-slate-500" : "text-slate-200"}>{s.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
