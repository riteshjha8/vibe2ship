"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import AIStatusPanel from "@/components/AIStatusPanel";
import TaskSearchPanel from "@/components/TaskSearchPanel";
import TaskRingToast from "@/components/TaskRingToast";
import api from "@/lib/api";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks");
      setTasks(data.tasks);
    } catch (error) {
      console.error("Failed to load tasks", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(updated) {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }
  function handleDelete(id) {
    api.delete(`/tasks/${id}`).then(() => setTasks((prev) => prev.filter((t) => t._id !== id)));
  }
  function handleCreated(task) {
    setTasks((prev) => [task, ...prev]);
  }
  function handleUpdated(task) {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
  }
  function handleEdit(task) {
    setEditingTask(task);
    setShowForm(true);
  }

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <Shell>
      <TaskRingToast />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold">Tasks</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gold-500 hover:bg-gold-400 text-ink px-4 py-2.5 rounded-lg font-medium text-sm transition"
        >
          + New task
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full transition ${
              filter === f.key ? "bg-gold-400/15 text-gold-300" : "text-slate-400 hover:bg-white/5"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div>
          {loading ? (
            <p className="text-sm text-slate-500 font-mono">Loading tasks…</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-slate-500">No tasks in this view yet.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((t) => (
                <TaskCard key={t._id} task={t} onChange={handleChange} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5">
          <AIStatusPanel title="Task planner pulse" description="AI context for your task focus, due dates, and urgency." />
          <TaskSearchPanel />
        </div>
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </Shell>
  );
}
