"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AIStatusPanel({
  title = "AI planner pulse",
  description = "See current productivity signals and plan insights based on your tasks.",
}) {
  const [summary, setSummary] = useState(null);
  const [productivityReport, setProductivityReport] = useState("");
  const [weeklyReview, setWeeklyReview] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingReview, setLoadingReview] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingSummary(true);
      setLoadingReport(true);
      setLoadingReview(true);
      try {
        const [summaryRes, reportRes, reviewRes] = await Promise.all([
          api.get("/ai/summary"),
          api.get("/ai/productivity-report"),
          api.get("/ai/weekly-review"),
        ]);
        setSummary(summaryRes.data.summary || null);
        setProductivityReport(reportRes.data.report || "");
        setWeeklyReview(reviewRes.data.review || "");
      } catch (err) {
        setSummary(null);
        setProductivityReport("");
        setWeeklyReview("");
      } finally {
        setLoadingSummary(false);
        setLoadingReport(false);
        setLoadingReview(false);
      }
    }

    load();
    const refresh = () => load();
    window.addEventListener("aiSummaryRefresh", refresh);
    return () => window.removeEventListener("aiSummaryRefresh", refresh);
  }, []);

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-sm tracking-wide text-gold-300">{title}</h3>
        <p className="text-[11px] text-slate-500 mt-1">{description}</p>
      </div>

      {loadingSummary ? (
        <p className="text-sm text-slate-500 font-mono">Loading AI pulse…</p>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Current focus</p>
            <p className="text-xl font-semibold text-slate-100">{summary.currentMode || "Focused"}</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Tasks at risk</p>
            <p className="text-xl font-semibold text-slate-100">{summary.overdue ?? 0}</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Due today</p>
            <p className="text-xl font-semibold text-slate-100">{summary.dueToday ?? 0}</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Productivity</p>
            <p className="text-xl font-semibold text-slate-100">{summary.productivityScore ?? "—"}%</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Deep work health</p>
            <p className="text-xl font-semibold text-slate-100">{summary.deepWorkScore ?? "—"}%</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Completion probability</p>
            <p className="text-xl font-semibold text-slate-100">{summary.completionProbability ?? "—"}%</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Goal milestone completion</p>
            <p className="text-xl font-semibold text-slate-100">{summary.goalMilestoneCompletion ?? "—"}%</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Habit checklist completion</p>
            <p className="text-xl font-semibold text-slate-100">{summary.habitChecklistCompletion ?? "—"}%</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-slate-950/80 p-4 border border-white/10 break-words">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Work left</p>
            <p className="text-xl font-semibold text-slate-100">{summary.workLeft ?? 0}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Could not load AI insights right now.</p>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-slate-100 mb-2">Weekly productivity report</h4>
          <p className="min-h-[5rem] break-words text-sm text-slate-400 leading-relaxed">
            {loadingReport ? "Summarizing your current week…" : productivityReport || "No productivity report is available right now."}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-100 mb-2">Weekly review</h4>
          <p className="min-h-[5rem] break-words text-sm text-slate-400 leading-relaxed whitespace-pre-line">
            {loadingReview ? "Generating a weekly review…" : weeklyReview || "No weekly review is available right now."}
          </p>
        </div>
      </div>
    </div>
  );
}
