import Task from "../models/Task.js";
import CalendarEvent from "../models/CalendarEvent.js";
import { localToUTC } from "../utils/timezone.js";

async function getMonthView(req, res) {
  const { year, month } = req.query;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const [tasks, events] = await Promise.all([
    Task.find({
      user: req.userId,
      deadline: { $gte: start, $lt: end },
    }),
    CalendarEvent.find({
      user: req.userId,
      startAt: { $gte: start, $lt: end },
    }),
  ]);

  const byDay = {};
  tasks.forEach((t) => {
    const day = new Date(t.deadline).getUTCDate();
    byDay[day] = byDay[day] || [];
    byDay[day].push({ ...t.toObject(), kind: "task" });
  });
  events.forEach((event) => {
    const day = new Date(event.startAt).getUTCDate();
    byDay[day] = byDay[day] || [];
    byDay[day].push({ ...event.toObject(), kind: "event" });
  });

  res.json({ byDay, events });
}

async function createEvent(req, res) {
  const { title, description = "", location = "", startLocal, timezone = "Asia/Kolkata", durationMinutes = 30 } = req.body;

  if (!title || !startLocal) {
    return res.status(400).json({ message: "Title and start time are required." });
  }

  let startAt;
  try {
    startAt = localToUTC(startLocal, timezone);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const endAt = new Date(startAt.getTime() + Math.max(Number(durationMinutes) || 30, 15) * 60000);

  const event = await CalendarEvent.create({
    user: req.userId,
    title: String(title).trim(),
    description: String(description).trim(),
    location: String(location).trim(),
    startAt,
    endAt,
    timezone,
    source: "manual",
  });

  res.status(201).json({ event });
}

async function deleteEvent(req, res) {
  const { id } = req.params;
  const event = await CalendarEvent.findOne({ _id: id, user: req.userId });
  if (!event) return res.status(404).json({ message: "Calendar event not found." });

  await event.deleteOne();
  res.json({ message: "Event deleted." });
}

async function listEvents(req, res) {
  const events = await CalendarEvent.find({ user: req.userId }).sort({ startAt: 1 });
  res.json({ events });
}

export { getMonthView, createEvent, listEvents, deleteEvent };
