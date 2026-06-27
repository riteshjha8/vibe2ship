"use client";
import Shell from "@/components/Shell";
import CalendarView from "@/components/CalendarView";

export default function CalendarPage() {
  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Calendar</h1>
      <CalendarView />
    </Shell>
  );
}
