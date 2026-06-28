"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import dayjs from "@/lib/dayjs";

export default function CalendarView() {
  const [cursor, setCursor] = useState(dayjs());
  const [byDay, setByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

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

  const daysInMonth = cursor.daysInMonth();
  const startWeekday = cursor.startOf("month").day(); // 0 = Sunday
  const cells = [...Array(startWeekday).fill(null), ...Array(daysInMonth).keys()].map((d) =>
    d === null ? null : d + 1
  );

  return (
    <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor((c) => c.subtract(1, "month"))} className="px-2 py-1 rounded hover:bg-white/10 text-sm">‹</button>
          <h3 className="font-display font-semibold w-32 sm:w-40 text-center text-sm sm:text-base">{cursor.format("MMMM YYYY")}</h3>
          <button onClick={() => setCursor((c) => c.add(1, "month"))} className="px-2 py-1 rounded hover:bg-white/10 text-sm">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[9px] sm:text-[11px] text-slate-500 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((day, i) => {
          const itemsForDay = day ? byDay[day] || [] : [];
          const isToday = day && cursor.date(day).isSame(dayjs(), "day");
          const doneCount = itemsForDay.filter(t => t.status === "done").length;
          const upcomingCount = itemsForDay.filter(t => t.status !== "done").length;
          
          return (
            <div
              key={i}
              className={`rounded p-1 sm:p-2 text-[10px] sm:text-xs flex flex-col min-h-20 sm:min-h-24 cursor-pointer transition hover:bg-white/10 ${
                day ? "bg-white/[0.03] border border-white/8" : ""
              } ${isToday ? "ring-2 ring-gold-400/80 bg-gold-400/5" : ""}`}
              onClick={() => day && setExpandedDay(expandedDay === day ? null : day)}
            >
              {day && (
                <>
                  <span className={`font-semibold text-xs sm:text-sm ${isToday ? "text-gold-300" : "text-slate-300"}`}>{day}</span>
                  
                  {itemsForDay.length > 0 && (
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-y-auto">
                      {expandedDay === day ? (
                        // Expanded view - show all tasks with details
                        itemsForDay.map((item) => (
                          <div
                            key={item._id}
                            className={`rounded px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[10px] leading-tight truncate ${
                              item.status === "done"
                                ? "bg-slate-700/40 text-slate-400 line-through"
                                : "bg-gold-500/20 text-gold-200"
                            }`}
                            title={item.title}
                          >
                            {item.status === "done" && "✓ "}
                            {item.title}
                          </div>
                        ))
                      ) : (
                        // Collapsed view - show summary
                        <>
                          {doneCount > 0 && (
                            <div className="text-[9px] sm:text-[10px] text-slate-400">✓ {doneCount} done</div>
                          )}
                          {upcomingCount > 0 && (
                            <div className="text-[9px] sm:text-[10px] text-gold-300">→ {upcomingCount} upcoming</div>
                          )}
                          {itemsForDay.length > 2 && (
                            <div className="text-[8px] sm:text-[9px] text-slate-500 mt-1">Click to expand</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {itemsForDay.length === 0 && (
                    <div className="text-[8px] sm:text-[9px] text-slate-600 mt-1">No tasks</div>
                  )}
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
