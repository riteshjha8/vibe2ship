import Habit from "../models/Habit.js";

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(prev, now) {
  const oneDay = 24 * 60 * 60 * 1000;
  const diff = now.setHours(0, 0, 0, 0) - new Date(prev).setHours(0, 0, 0, 0);
  return diff === oneDay;
}

async function createHabit(req, res) {
  const { title, frequency } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });
  const habit = await Habit.create({ user: req.userId, title, frequency });
  res.status(201).json({ habit });
}

async function getHabits(req, res) {
  const habits = await Habit.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ habits });
}

async function checkInHabit(req, res) {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });
  if (!habit) return res.status(404).json({ message: "Habit not found" });

  const now = new Date();
  if (habit.lastCompletedAt && isSameDay(new Date(habit.lastCompletedAt), now)) {
    return res.status(400).json({ message: "Already checked in today" });
  }

  if (habit.lastCompletedAt && isYesterday(habit.lastCompletedAt, new Date(now))) {
    habit.streak += 1;
  } else {
    habit.streak = 1;
  }
  habit.longestStreak = Math.max(habit.longestStreak, habit.streak);
  habit.lastCompletedAt = now;
  habit.history.push(now);
  await habit.save();
  res.json({ habit });
}

async function deleteHabit(req, res) {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!habit) return res.status(404).json({ message: "Habit not found" });
  res.json({ message: "Habit deleted" });
}

export { createHabit, getHabits, checkInHabit, deleteHabit };
