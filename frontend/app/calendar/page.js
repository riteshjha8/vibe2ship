"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import CalendarView from "@/components/CalendarView";
import AIStatusPanel from "@/components/AIStatusPanel";
import TaskSearchPanel from "@/components/TaskSearchPanel";
import api from "@/lib/api";
import dayjs from "@/lib/dayjs";

const emptyForm = {
  title: "",
  description: "",
  location: "",
  startLocal: dayjs().format("YYYY-MM-DDTHH:mm"),
  durationMinutes: "45",
};

export default function CalendarPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [events, setEvents] = useState([]);

  async function loadEvents() {
    try {
      const { data } = await api.get("/calendar/events");
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback("");

    try {
      await api.post("/calendar/events", {
        ...form,
        durationMinutes: Number(form.durationMinutes) || 45,
      });
      setFeedback("Event created and saved for your calendar.");
      setForm(emptyForm);
      setShowComposer(false);
      await loadEvents();
    } catch (error) {
      setFeedback(error?.response?.data?.message || "Unable to save this event right now.");
    } finally {
      setSubmitting(false);
    }
  }


  async function deleteEvent(eventId) {
    try {
      await api.delete(`/calendar/events/${eventId}`);
      setFeedback("Event deleted.");
      await loadEvents();
    } catch (error) {
      setFeedback(error?.response?.data?.message || "Unable to delete the event.");
    }
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Calendar</h1>
            <p className="text-sm text-slate-400">A central view for your schedule, deadlines, and AI-guided planning.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowComposer(true)}
              className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition"
            >
              Add event
            </button>
          </div>
        </div>

        {feedback ? <p className="text-sm text-gold-300">{feedback}</p> : null}

        {showComposer ? (
          <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">Quick event</h2>
                <p className="text-sm text-slate-400">Save a meeting or focus block that shows up in your calendar view.</p>
              </div>
              <button type="button" onClick={() => setShowComposer(false)} className="text-sm text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm"
                placeholder="Event title"
              />
              <input
                required
                type="datetime-local"
                value={form.startLocal}
                onChange={(e) => setForm((current) => ({ ...current, startLocal: e.target.value }))}
                className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm"
              />
              <input
                value={form.location}
                onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm"
                placeholder="Location or link"
              />
              <input
                type="number"
                min="15"
                value={form.durationMinutes}
                onChange={(e) => setForm((current) => ({ ...current, durationMinutes: e.target.value }))}
                className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm"
                placeholder="Minutes"
              />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              className="min-h-24 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm"
              placeholder="Notes"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="rounded-full bg-gold-500 px-3 py-2 text-xs font-semibold text-ink hover:bg-gold-400 transition disabled:opacity-60">
                {submitting ? "Saving…" : "Save event"}
              </button>
              <button type="button" onClick={() => setForm(emptyForm)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition">
                Reset
              </button>
            </div>
          </form>
        ) : null}

        {events.length ? (
          <div className="glass-card rounded-xl border border-white/10 p-4">
            <h2 className="font-display text-lg font-semibold">Upcoming events</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {events.slice(0, 5).map((event) => (
                <li key={event._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{event.title}</p>
                    <p className="text-xs text-slate-400">
                      {dayjs(event.startAt).format("MMM D, HH:mm")}
                      {event.location ? ` • ${event.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deleteEvent(event._id)}
                      className="rounded-full border border-red-500/30 px-3 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
          <CalendarView />
          <div className="space-y-5">
            <AIStatusPanel title="Schedule intelligence" description="AI summaries of your week and the busiest days ahead." />
            <TaskSearchPanel />
          </div>
        </div>
      </div>
    </Shell>
  );
}
