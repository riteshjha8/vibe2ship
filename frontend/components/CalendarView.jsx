"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dayjs from "@/lib/dayjs";

export default function CalendarView() {
  const [cursor, setCursor] = useState(dayjs());
  const [byDay, setByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/calendar/month", {
        params: { year: cursor.year(), month: cursor.month() + 1 },
      });
      setByDay(data.byDay || {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [cursor]);

  async function exportIcs() {
    setExporting(true);
    try {
      const res = await api.get("/calendar/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "finalping-ai-tasks.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const daysInMonth = cursor.daysInMonth();
  const startWeekday = cursor.startOf("month").day(); // 0 = Sunday
  const cells = [...Array(startWeekday).fill(null), ...Array(daysInMonth).keys()].map((d) =>
    d === null ? null : d + 1
  );

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor((c) => c.subtract(1, "month"))} className="px-2 py-1 rounded hover:bg-white/10">‹</button>
          <h3 className="font-display font-semibold w-40 text-center">{cursor.format("MMMM YYYY")}</h3>
          <button onClick={() => setCursor((c) => c.add(1, "month"))} className="px-2 py-1 rounded hover:bg-white/10">›</button>
        </div>
        <button
          onClick={exportIcs}
          disabled={exporting}
          className="text-xs px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition"
        >
          {exporting ? "Preparing…" : "Export to Google/Outlook (.ics)"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const tasksForDay = day ? byDay[day] || [] : [];
          const isToday = day && cursor.date(day).isSame(dayjs(), "day");
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg p-1.5 text-xs flex flex-col ${
                day ? "bg-white/[0.03] border border-white/8" : ""
              } ${isToday ? "ring-1 ring-teal-400/60" : ""}`}
            >
              {day && (
                <>
                  <span className="text-slate-400">{day}</span>
                  <div className="flex-1 flex flex-wrap gap-0.5 mt-1 overflow-hidden">
                    {tasksForDay.slice(0, 3).map((t) => (
                      <span key={t._id} className="h-1.5 w-1.5 rounded-full bg-teal-400" title={t.title} />
                    ))}
                    {tasksForDay.length > 3 && <span className="text-[9px] text-slate-500">+{tasksForDay.length - 3}</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {loading && <p className="text-xs text-slate-500 mt-3 font-mono">Loading…</p>}
    </div>
  );
}
