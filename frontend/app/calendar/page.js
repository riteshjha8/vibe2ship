"use client";
import Shell from "@/components/Shell";
import CalendarView from "@/components/CalendarView";
import AIStatusPanel from "@/components/AIStatusPanel";
import TaskSearchPanel from "@/components/TaskSearchPanel";

export default function CalendarPage() {
  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Calendar</h1>
            <p className="text-sm text-slate-400">A central view for your schedule, deadlines, and AI-guided planning.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 transition">Add event</button>
            <button className="rounded-full bg-teal-500 px-3 py-2 text-xs font-semibold text-ink hover:bg-teal-400 transition">Sync with calendar</button>
          </div>
        </div>

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
