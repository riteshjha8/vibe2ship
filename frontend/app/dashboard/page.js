"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import StatsCard from "@/components/StatsCard";
import AIRecommendations from "@/components/AIRecommendations";
import VoiceAssistant from "@/components/VoiceAssistant";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import SchedulePanel from "@/components/SchedulePanel";
import IntegrationPanel from "@/components/IntegrationPanel";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
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
    load();
    loadSummary();
    loadCareerSummary();
    loadProductivityReport();
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

      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 space-y-5">
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
        <VoiceAssistant onTaskCreated={handleCreated} />
      </div>
      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-5 mb-8">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-teal-400">AI Productivity Pulse</p>
              <h3 className="font-display text-lg font-semibold">Your current AI operating mode</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Real-time</span>
          </div>
          {summaryLoading ? (
            <p className="text-sm text-slate-500">Loading AI insights…</p>
          ) : summary ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Productivity", value: `${summary.productivityScore}%` },
                { label: "Deadline risk", value: `${summary.deadlineRisk}%` },
                { label: "Burnout risk", value: `${summary.burnoutRisk}%` },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 p-4 bg-slate-950/80">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">{card.label}</p>
                  <p className="text-2xl font-semibold text-slate-100">{card.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Unable to load AI pulse metrics right now.</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-5 bg-slate-950/80 border border-white/10">
          <h3 className="font-display text-lg font-semibold mb-3">AI task health</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex justify-between gap-2"><span>Open tasks</span><span className="font-semibold text-slate-100">{pending.length}</span></li>
            <li className="flex justify-between gap-2"><span>Due today</span><span className="font-semibold text-slate-100">{dueToday.length}</span></li>
            <li className="flex justify-between gap-2"><span>Overdue</span><span className="font-semibold text-slate-100">{overdue.length}</span></li>
            <li className="flex justify-between gap-2"><span>Urgent now</span><span className="font-semibold text-slate-100">{summary?.urgentNow ?? "—"}</span></li>
          </ul>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-5 mb-8">
        <SchedulePanel />
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

      <h2 className="font-display font-semibold mb-3">Top priority right now</h2>
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
