"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import HabitTracker from "@/components/HabitTracker";
import AIStatusPanel from "@/components/AIStatusPanel";
import api from "@/lib/api";
import { detectTimezone } from "@/lib/dayjs";

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [checklistText, setChecklistText] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [creatingTaskId, setCreatingTaskId] = useState(null);
  const [taskMessage, setTaskMessage] = useState("");

  function localDateTimeString(timestamp) {
    const date = new Date(timestamp);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/habits");
      setHabits(data.habits);
    } finally {
      setLoading(false);
    }
  }

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    try {
      const { data } = await api.get("/ai/habit-suggestions");
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 8) : []);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  useEffect(() => {
    load();
    loadSuggestions();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!title) return;
    const checklistItems = checklistText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 8);
    const { data } = await api.post("/habits", { title, frequency, checklist: checklistItems });
    setHabits((prev) => [data.habit, ...prev]);
    setTitle("");
    setChecklistText("");
    window.dispatchEvent(new Event("aiSummaryRefresh"));
  }

  function handleChange(updated) {
    setHabits((prev) => prev.map((h) => (h._id === updated._id ? updated : h)));
  }
  function handleDelete(id) {
    api.delete(`/habits/${id}`).then(() => setHabits((prev) => prev.filter((h) => h._id !== id)));
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Habits</h1>

      <form
        onSubmit={submit}
        className="glass-card rounded-3xl border border-slate-800 bg-slate-950/85 p-6 mb-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.75)]"
      >
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Habit</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Morning workout"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Checklist items</label>
              <textarea
                value={checklistText}
                onChange={(e) => setChecklistText(e.target.value)}
                placeholder="Write up to 8 habit checklist items, one per line"
                rows={4}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-400 outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">Keep items short and actionable. Leaving this blank creates a simple habit.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 focus:border-gold-400 outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <button className="inline-flex w-full items-center justify-center rounded-2xl bg-gold-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-gold-400">
              Add habit
            </button>
          </div>
        </div>
      </form>

      <div className="grid min-w-0 xl:grid-cols-[2fr_1fr] gap-5">
        <div className="min-w-0">
          {loading ? (
            <p className="text-sm text-slate-500 font-mono">Loading…</p>
          ) : habits.length === 0 ? (
            <p className="text-sm text-slate-500">No habits yet. Add one above to start a streak.</p>
          ) : (
            <div className="space-y-3">
              {habits.map((h) => (
                <HabitTracker key={h._id} habit={h} onChange={handleChange} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5">
          <AIStatusPanel title="Habit streak coach" description="Use AI signals to keep your routines on track and avoid streak fatigue." />
          <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Habit booster suggestions</h3>
                <p className="text-sm text-slate-400">Select a suggestion to create a supporting task in your planner.</p>
              </div>
              <button
                type="button"
                onClick={loadSuggestions}
                className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>
            {loadingSuggestions ? (
              <p className="text-sm text-slate-500">Loading habit suggestions…</p>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-slate-500">No habit suggestions are available right now.</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-100 break-words">{suggestion.title}</h4>
                          <p className="mt-2 text-sm text-slate-400 leading-relaxed break-words">{suggestion.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setTaskMessage("");
                            setCreatingTaskId(suggestion.id);
                            try {
                              const deadlineLocal = localDateTimeString(Date.now() + 24 * 60 * 60 * 1000);
                              await api.post("/tasks", {
                                title: suggestion.title,
                                description: suggestion.description,
                                category: "Habit",
                                importance: 3,
                                effortMinutes: 30,
                                deadlineLocal,
                                timezone: detectTimezone(),
                              });
                              setTaskMessage(`Task created: ${suggestion.title}`);
                            } catch (err) {
                              setTaskMessage("Unable to create the task. Try again later.");
                            } finally {
                              setCreatingTaskId(null);
                            }
                          }}
                          disabled={creatingTaskId === suggestion.id}
                          className="rounded-full bg-gold-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-gold-400 disabled:opacity-60"
                        >
                          {creatingTaskId === suggestion.id ? "Creating…" : "Create task"}
                        </button>
                      </div>
                      {suggestion.relevantHabit && (
                        <div className="inline-flex items-center rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
                          {suggestion.relevantHabit}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {taskMessage && <p className="mt-4 text-sm text-slate-200">{taskMessage}</p>}
          </div>
        </div>
      </div>
    </Shell>
  );
}
