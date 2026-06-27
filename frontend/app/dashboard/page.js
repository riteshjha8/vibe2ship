"use client";
import { useEffect, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

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

  async function performSearch(query) {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchMessage("Enter a search term to search your tasks.");
      return;
    }
    setSearchLoading(true);
    setSearchMessage("");
    try {
      const { data } = await api.get(`/ai/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data.results || []);
      setSearchMessage(data.message || "");
    } catch {
      setSearchResults([]);
      setSearchMessage("Could not search your knowledge graph right now.");
    } finally {
      setSearchLoading(false);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Hey {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-slate-400">Here's what your clock looks like right now.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-500 hover:bg-teal-400 text-ink px-4 py-2.5 rounded-lg font-medium text-sm transition"
        >
          + New task
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Open tasks" value={pending.length} />
        <StatsCard label="Due today" value={dueToday.length} accent="#FBBF24" />
        <StatsCard label="Overdue" value={overdue.length} accent="#EF4444" />
        <StatsCard label="Completed" value={tasks.filter((t) => t.status === "done").length} accent="#94A3B8" />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5 mb-8">
        <div className="space-y-5">
          <AIRecommendations />
          <div className="glass-card rounded-xl p-5 border border-alarm-500/10 bg-alarm-500/5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-alarm-400">Last-Minute Life Saver</p>
                <h3 className="font-display text-lg font-semibold">Save My Day</h3>
              </div>
              <button
                onClick={loadRescuePlan}
                disabled={rescueLoading}
                className="rounded-full bg-alarm-500 px-4 py-2 text-xs font-semibold text-ink hover:bg-alarm-400 transition disabled:opacity-60"
              >
                {rescueLoading ? "Launching…" : "Emergency rescue"}
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-3">Get a focused, urgent action plan from AI when deadlines are tight or your day is at risk.</p>
            {rescuePlan ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950/70 rounded-xl p-4">{rescuePlan}</pre>
            ) : (
              <p className="text-sm text-slate-400">Tap emergency rescue to see the plan here.</p>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <VoiceAssistant onTaskCreated={handleCreated} />
          <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
            <h3 className="font-display text-lg font-semibold mb-3">Top priority right now</h3>
            {loading ? (
              <p className="text-sm text-slate-500 font-mono">Loading tasks…</p>
            ) : topPriority.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing urgent. Add a task to get started.</p>
            ) : (
              <div className="space-y-3">
                {topPriority.map((t) => (
                  <TaskCard key={t._id} task={t} onChange={handleChange} onDelete={handleDelete} onEdit={handleEdit} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid xl:grid-cols-2 gap-5 mb-8">
        <AIStatusPanel />
        <TaskSearchPanel />
      </div>
      <div className="grid xl:grid-cols-2 gap-5 mb-8">
        <div className="glass-card rounded-xl p-5 bg-slate-950/80 border border-white/10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-alarm-400">Last-Minute Life Saver</p>
              <h3 className="font-display text-lg font-semibold">Emergency rescue plan</h3>
            </div>
            <button
              onClick={loadRescuePlan}
              disabled={rescueLoading}
              className="rounded-full bg-alarm-500 px-4 py-2 text-xs font-semibold text-ink hover:bg-alarm-400 transition disabled:opacity-60"
            >
              {rescueLoading ? "Launching…" : "Emergency rescue"}
            </button>
          </div>
          <p className="text-sm text-slate-300 mb-3">Get a focused, urgent action plan from AI when deadlines are tight or your day is at risk.</p>
          {rescuePlan ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-100 bg-slate-950/70 rounded-xl p-4">{rescuePlan}</pre>
          ) : (
            <p className="text-sm text-slate-400">Tap emergency rescue to see the plan here.</p>
          )}
        </div>
        <IntegrationPanel />
      </div>

      <div className="grid xl:grid-cols-3 gap-5 mb-8">
        <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
          <h3 className="font-display text-lg font-semibold mb-3">Career & Finance AI</h3>
          {careerLoading ? (
            <p className="text-sm text-slate-500">Loading career insights…</p>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed min-h-[5rem]">{careerSummary || "No career or finance insights available yet. Add related tasks to get tailored guidance."}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
          <h3 className="font-display text-lg font-semibold mb-3">Weekly AI report</h3>
          {reportLoading ? (
            <p className="text-sm text-slate-500">Generating your weekly report…</p>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed min-h-[5rem]">{report || "No productivity report has been generated yet."}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Task search</h3>
              <p className="text-sm text-slate-400">Semantic search across tasks and notes.</p>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your tasks or projects"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 focus:border-teal-400 outline-none"
            />
            <button
              type="button"
              onClick={() => performSearch(searchQuery)}
              className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-ink hover:bg-teal-400 transition"
            >
              Search
            </button>
          </div>
          {searchLoading ? (
            <p className="text-sm text-slate-500">Searching…</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-3 bg-slate-900">
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.snippet}</p>
                </div>
              ))}
              {!searchLoading && !searchResults.length && <p className="text-sm text-slate-500">{searchMessage || "No matching items found."}</p>}
            </div>
          )}
        </div>
      </div>

      <footer className="w-full bg-[#040714] border-t border-white/10 py-12 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.35)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 via-cyan-400 to-sky-500 text-lg font-bold text-slate-950 shadow-xl shadow-cyan-500/20">
                V2S
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-teal-300/80">Vibe2Ship</p>
                <p className="text-lg font-semibold text-white">AI planning companion</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <a
                href="mailto:finalping70@gmail.com"
                aria-label="Email"
                className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-teal-300 shadow-sm shadow-teal-500/10 ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M2.25 5.25A2.25 2.25 0 014.5 3h15a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0119.5 21H4.5A2.25 2.25 0 012.25 18.75V5.25zm2.25-.75L12 11.25 19.5 4.5H4.5zm15 1.5v.638l-7.5 6.375-7.5-6.375V6.75h15zm0 11.25V8.397l-7.082 6.02a.75.75 0 01-.836 0L4.5 8.397V18.75h15z" />
                </svg>
              </a>
              <a
                href="https://github.com/riteshjha8"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-teal-300 shadow-sm shadow-teal-500/10 ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.222-.253-4.556-1.111-4.556-4.944 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.845a9.56 9.56 0 012.5.336c1.909-1.295 2.748-1.026 2.748-1.026.546 1.376.203 2.393.1 2.646.64.698 1.03 1.591 1.03 2.682 0 3.842-2.337 4.687-4.566 4.935.36.31.68.923.68 1.86 0 1.342-.012 2.423-.012 2.753 0 .268.18.58.688.482A10.01 10.01 0 0022 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/ritesh-jha-436a54346/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-teal-300 shadow-sm shadow-teal-500/10 ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.5h4.56V24H.22V8.5zm7.13 0h4.37v2.14h.06c.61-1.15 2.08-2.36 4.28-2.36 4.58 0 5.43 3.02 5.43 6.94V24h-4.56v-7.75c0-1.85-.03-4.23-2.58-4.23-2.58 0-2.98 2.02-2.98 4.1V24H7.35V8.5z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center text-slate-400 shadow-[0_20px_50px_rgba(15,23,42,0.25)]">
            <p className="text-sm text-slate-400">Reach out with ideas or feedback — I’m building the AI planner experience for people who need focus fast.</p>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">finalping70@gmail.com</p>
          </div>
        </div>
      </footer>

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
