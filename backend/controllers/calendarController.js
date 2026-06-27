import { createEvents } from "ics";
import Task from "../models/Task.js";

// Calendar integration: export all open tasks as a downloadable .ics file
// that imports cleanly into Google Calendar, Outlook, or Apple Calendar -
// no OAuth/API keys needed on either side.
async function exportCalendar(req, res) {
  const tasks = await Task.find({ user: req.userId, status: { $ne: "done" } });

  const events = tasks.map((t) => {
    const d = new Date(t.deadline);
    return {
      title: t.title,
      description: t.description || "Created in Vibe2Ship - The Last-Minute Life Saver",
      start: [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()],
      startInputType: "utc",
      duration: { minutes: Math.max(t.effortMinutes || 30, 15) },
      alarms: [
        { action: "display", trigger: { hours: 24, before: true } },
        { action: "display", trigger: { hours: 1, before: true } },
        { action: "display", trigger: { minutes: 20, before: true } },
      ],
    };
  });

  const { error, value } = createEvents(events);
  if (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not generate calendar file" });
  }

  res.setHeader("Content-Type", "text/calendar");
  res.setHeader("Content-Disposition", "attachment; filename=vibe2ship-tasks.ics");
  res.send(value);
}

// Simple month view data: tasks grouped by date for the calendar UI
async function getMonthView(req, res) {
  const { year, month } = req.query; // month is 1-12
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const tasks = await Task.find({
    user: req.userId,
    deadline: { $gte: start, $lt: end },
  });

  const byDay = {};
  tasks.forEach((t) => {
    const day = new Date(t.deadline).getUTCDate();
    byDay[day] = byDay[day] || [];
    byDay[day].push(t);
  });

  res.json({ byDay });
}

export { exportCalendar, getMonthView };
