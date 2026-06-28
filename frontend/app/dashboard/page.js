"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import StatsCard from "@/components/StatsCard";
import AIRecommendations from "@/components/AIRecommendations";
import AIStatusPanel from "@/components/AIStatusPanel";
import TaskSearchPanel from "@/components/TaskSearchPanel";
import VoiceAssistant from "@/components/VoiceAssistant";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import IntegrationPanel from "@/components/IntegrationPanel";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescuePlan, setRescuePlan] = useState("");
  const [rescueLoading, setRescueLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [careerSummary, setCareerSummary] = useState("");
  const [careerLoading, setCareerLoading] = useState(true);
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks");
      setTasks(data.tasks);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn("Dashboard task load failed with unauthorized status. Waiting for auth refresh or login.");
      } else {
        console.error("Failed to load dashboard tasks", error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    setSummaryLoading(true);
    try {
      const { data } = await api.get("/ai/summary");
      setSummary(data.summary);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadCareerSummary() {
    setCareerLoading(true);
    try {
      const { data } = await api.get("/ai/career-finance-summary");
      setCareerSummary(data.summary);
    } catch {
      setCareerSummary("");
    } finally {
      setCareerLoading(false);
    }
  }

  async function loadProductivityReport() {
    setReportLoading(true);
    try {
      const { data } = await api.get("/ai/productivity-report");
      setReport(data.report);
    } catch {
      setReport("");
    } finally {
      setReportLoading(false);
    }
  }

  async function loadRescuePlan() {
    setRescueLoading(true);
    setRescuePlan("");
    try {
      const { data } = await api.get("/ai/rescue-plan");
      setRescuePlan(data.plan || "The AI rescue plan could not load right now.");
    } catch {
      setRescuePlan("Unable to load emergency rescue planning at the moment.");
    } finally {
      setRescueLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      load();
      loadSummary();
      loadCareerSummary();
      loadProductivityReport();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const targets = document.querySelectorAll(".reveal-on-scroll");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
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

  const pending = tasks.filter((t) => t.status !== "done");
  const dueToday = pending.filter((t) => new Date(t.deadline).toDateString() === new Date().toDateString());
  const overdue = pending.filter((t) => new Date(t.deadline).getTime() < Date.now());
  const topPriority = [...pending].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  return (
    <Shell>
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-[-6rem] top-[-4rem] h-64 w-64 rounded-full bg-gold-400/10 blur-3xl animate-float" />
          <div className="absolute left-[-7rem] top-28 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl animate-float" style={{ animationDelay: "1.6s" }} />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-0 pb-4">
          <div className="mb-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-4 sm:p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)] animate-slide-in-right">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em] text-white">Hey {user?.name?.split(" ")[0]}</h1>
                <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm text-slate-400">You're in the right place to keep focus, habits, and AI-powered planning flowing smoothly.</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center rounded-3xl bg-gold-500 px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-ink transition hover:bg-gold-400"
              >
                + New task
              </button>
            </div>
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gold-300">Faster daily flow</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-300">Smart priority insights</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-300">Modern dashboard</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Your workspace</p>
              <h2 className="font-display text-lg sm:text-2xl font-semibold text-white">Designed for fast action and AI-guided clarity.</h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <div className="h-2 w-14 rounded-full bg-gold-400/30" />
              <div className="h-2 w-10 rounded-full bg-slate-600/60" />
              <div className="h-2 w-10 rounded-full bg-slate-600/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 reveal-on-scroll">
            <StatsCard label="Open tasks" value={pending.length} />
            <StatsCard label="Due today" value={dueToday.length} accent="#FBBF24" />
            <StatsCard label="Overdue" value={overdue.length} accent="#EF4444" />
            <StatsCard label="Completed" value={tasks.filter((t) => t.status === "done").length} accent="#94A3B8" />
          </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-3 mb-4 reveal-on-scroll">
            <div className="space-y-3">
              <AIRecommendations />
              <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-5 border border-alarm-500/10 bg-alarm-500/5">
                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-alarm-400">Last-Minute Life Saver</p>
                    <h3 className="font-display text-base sm:text-lg font-semibold">Save My Day</h3>
                  </div>
                  <button
                    onClick={loadRescuePlan}
                    disabled={rescueLoading}
                    className="rounded-full bg-alarm-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-ink hover:bg-alarm-400 transition disabled:opacity-60 whitespace-nowrap"
                  >
                    {rescueLoading ? "Launching…" : "Emergency rescue"}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3">Get a focused, urgent action plan from AI when deadlines are tight or your day is at risk.</p>
                {rescuePlan ? (
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-slate-100 bg-slate-950/70 rounded-lg sm:rounded-xl p-3 sm:p-4">{rescuePlan}</pre>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400">Tap emergency rescue to see the plan here.</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <VoiceAssistant onTaskCreated={handleCreated} />
              <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-5 border border-white/10 bg-slate-950/80">
                <h3 className="font-display text-base sm:text-lg font-semibold mb-2 sm:mb-3">Top priority right now</h3>
                {loading ? (
                  <p className="text-xs sm:text-sm text-slate-500 font-mono">Loading tasks…</p>
                ) : topPriority.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500">Nothing urgent. Add a task to get started.</p>
                ) : (
                  <div className="space-y-2">
                    {topPriority.map((t) => (
                      <TaskCard key={t._id} task={t} onChange={handleChange} onDelete={handleDelete} onEdit={handleEdit} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 mb-4 reveal-on-scroll">
            <AIStatusPanel />
            <TaskSearchPanel />
          </div>
          <div className="grid lg:grid-cols-[2fr_1fr] gap-4 mb-4 reveal-on-scroll">
            <div className="space-y-3">
              <div className="glass-card h-full rounded-lg sm:rounded-xl p-3 sm:p-5 bg-slate-950/80 border border-white/10">
                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-alarm-400">Last-Minute Life Saver</p>
                    <h3 className="font-display text-base sm:text-lg font-semibold">Emergency rescue plan</h3>
                  </div>
                  <button
                    onClick={loadRescuePlan}
                    disabled={rescueLoading}
                    className="rounded-full bg-alarm-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-ink hover:bg-alarm-400 transition disabled:opacity-60 whitespace-nowrap"
                  >
                    {rescueLoading ? "Launching…" : "Emergency rescue"}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3">Get a focused, urgent action plan from AI when deadlines are tight or your day is at risk.</p>
                {rescuePlan ? (
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-slate-100 bg-slate-950/70 rounded-lg sm:rounded-xl p-3 sm:p-4">{rescuePlan}</pre>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400">Tap emergency rescue to see the plan here.</p>
                )}
              </div>
            </div>
            <IntegrationPanel />
          </div>

          {/* Floating AI assistant is available in the Shell; removed inline chat to avoid duplication */}

          <div className="grid lg:grid-cols-2 gap-5 reveal-on-scroll">
            <div className="glass-card h-full rounded-lg sm:rounded-xl p-3 sm:p-5 border border-white/10 bg-slate-950/80">
              <h3 className="font-display text-base sm:text-lg font-semibold mb-2 sm:mb-3">Career & Finance AI</h3>
              {careerLoading ? (
                <p className="text-xs sm:text-sm text-slate-500">Loading career insights…</p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed min-h-[5rem]">{careerSummary || "No career or finance insights available yet. Add related tasks to get tailored guidance."}</p>
              )}
            </div>
            <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-5 border border-white/10 bg-slate-950/80">
              <h3 className="font-display text-base sm:text-lg font-semibold mb-2 sm:mb-3">Weekly AI report</h3>
              {reportLoading ? (
                <p className="text-xs sm:text-sm text-slate-500">Generating your weekly report…</p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed min-h-[5rem]">{report || "No productivity report has been generated yet."}</p>
              )}
            </div>
          </div>
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
