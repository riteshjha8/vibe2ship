import Goal from "../models/Goal.js";

async function createGoal(req, res) {
  const { title, description, targetDate, milestones } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });
  const normalizedMilestones = Array.isArray(milestones)
    ? milestones.slice(0, 10).map((item) => ({ title: String(item).trim() || "Untitled milestone", done: false }))
    : [];
  const goal = await Goal.create({ user: req.userId, title, description, targetDate, milestones: normalizedMilestones });
  res.status(201).json({ goal });
}

async function getGoals(req, res) {
  const goals = await Goal.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ goals });
}

async function updateGoal(req, res) {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ message: "Goal not found" });
  ["title", "description", "targetDate", "progress", "status"].forEach((f) => {
    if (req.body[f] !== undefined) goal[f] = req.body[f];
  });
  if (goal.progress >= 100) goal.status = "completed";
  await goal.save();
  res.json({ goal });
}

async function toggleMilestone(req, res) {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ message: "Goal not found" });
  const item = goal.milestones.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: "Milestone not found" });
  item.done = !item.done;
  goal.progress = Math.round((goal.milestones.filter((m) => m.done).length / Math.max(goal.milestones.length, 1)) * 100);
  if (goal.progress >= 100) goal.status = "completed";
  await goal.save();
  res.json({ goal });
}

async function deleteGoal(req, res) {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ message: "Goal not found" });
  res.json({ message: "Goal deleted" });
}

export { createGoal, getGoals, updateGoal, toggleMilestone, deleteGoal };
