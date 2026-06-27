import Task from "../models/Task.js";
import { localToUTC } from "../utils/timezone.js";
import { breakdownTask } from "../utils/cohere.js";

// Priority score = urgency (deadline proximity) + importance, weighted.
// Higher score = do it sooner. Purely rule-based so it always works even
// without an AI key; Cohere is layered on top for explanations/scheduling.
function computePriorityScore(task) {
  const now = Date.now();
  const msLeft = new Date(task.deadline).getTime() - now;
  const hoursLeft = Math.max(msLeft / (1000 * 60 * 60), 0.1);
  const urgencyScore = 100 / hoursLeft; // grows fast as deadline approaches
  const importanceScore = task.importance * 4;
  return Math.round((urgencyScore * 1.5 + importanceScore) * 10) / 10;
}

const BUILT_IN_THRESHOLDS = ["24h", "5h", "1h", "30m", "5m", "1m"];
const CUSTOM_THRESHOLD_PATTERN = /^(\d+)([dhm])$/;

function normalizeThresholdValue(value) {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  if (BUILT_IN_THRESHOLDS.includes(key)) return key;
  const match = key.match(CUSTOM_THRESHOLD_PATTERN);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  if (!amount || amount <= 0) return null;
  return `${amount}${unit}`;
}

function normalizeThresholds(values) {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map(normalizeThresholdValue)
    .filter(Boolean);
  return [...new Set(normalized)];
}

async function createTask(req, res) {
  const {
    title,
    description,
    category,
    location,
    importance,
    effortMinutes,
    deadlineLocal,
    timezone,
    smsNumber,
    notifyBySMS,
    reminderThresholds,
  } = req.body;
  if (!title || !deadlineLocal) {
    return res.status(400).json({ message: "Title and deadline are required" });
  }
  let deadlineUTC;
  try {
    deadlineUTC = localToUTC(deadlineLocal, timezone);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const userThresholds = normalizeThresholds(reminderThresholds);
  const validThresholds = userThresholds.length ? userThresholds : ["24h", "5h", "1h", "30m", "5m", "1m"];

  if (reminderThresholds && !userThresholds.length) {
    return res.status(400).json({ message: "Invalid custom reminder thresholds provided" });
  }

  const task = await Task.create({
    user: req.userId,
    title,
    description,
    category,
    location: location?.trim() || "",
    importance,
    effortMinutes,
    deadline: deadlineUTC,
    timezone,
    smsNumber: smsNumber?.trim() || "",
    notifyBySMS: !!notifyBySMS,
    reminderThresholds: validThresholds.length ? validThresholds : ["24h", "5h", "1h", "30m", "5m", "1m"],
  });
  task.priorityScore = computePriorityScore(task);
  await task.save();

  res.status(201).json({ task });
}

async function getTasks(req, res) {
  const { status } = req.query;
  const filter = { user: req.userId };
  if (status) filter.status = status;
  const tasks = await Task.find(filter).sort({ deadline: 1 });
  const withScores = tasks.map((t) => {
    t.priorityScore = computePriorityScore(t);
    return t;
  });
  // Persist refreshed scores in background, don't block response
  Promise.all(withScores.map((t) => t.save())).catch(() => {});
  const sorted = [...withScores].sort((a, b) => b.priorityScore - a.priorityScore);
  res.json({ tasks: sorted });
}

async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ task });
}

async function updateTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const editable = [
    "title",
    "description",
    "category",
    "location",
    "importance",
    "effortMinutes",
    "status",
    "smsNumber",
    "notifyBySMS",
    "reminderThresholds",
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  if (req.body.deadlineLocal) {
    try {
      task.deadline = localToUTC(req.body.deadlineLocal, req.body.timezone || task.timezone);
      // deadline changed -> allow reminders to fire again
      task.remindersSent = {};
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  if (req.body.reminderThresholds) {
    const userThresholds = normalizeThresholds(req.body.reminderThresholds);
    if (!userThresholds.length) {
      return res.status(400).json({ message: "Invalid custom reminder thresholds provided" });
    }
    task.reminderThresholds = userThresholds;
    task.remindersSent = {};
  }

  task.priorityScore = computePriorityScore(task);
  await task.save();
  res.json({ task });
}

async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Task deleted" });
}

async function toggleSubtask(req, res) {
  const { id, subtaskId } = req.params;
  const task = await Task.findOne({ _id: id, user: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found" });
  const sub = task.subtasks.id(subtaskId);
  if (!sub) return res.status(404).json({ message: "Subtask not found" });
  sub.done = !sub.done;
  await task.save();
  res.json({ task });
}

// Autonomous task planning: AI breaks the task into a checklist.
async function planTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const subtaskTitles = await breakdownTask(task.title, task.description);
  if (!subtaskTitles) {
    return res.status(200).json({
      task,
      message: "AI planning unavailable right now (check COHERE_KEY). Add subtasks manually instead.",
    });
  }
  task.subtasks = subtaskTitles.map((title) => ({ title, done: false }));
  task.aiPlan = `Auto-generated ${subtaskTitles.length}-step plan.`;
  await task.save();
  res.json({ task });
}

export { createTask, getTasks, getTask, updateTask, deleteTask, toggleSubtask, planTask, computePriorityScore, };
