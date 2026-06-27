import Task from "../models/Task.js";
import { suggestDailySchedule,
  suggestRescuePlan,
  parseVoiceCommand,
  summarizeCareerFinance,
  generateProductivityReport,
  semanticSearchTasks, } from "../utils/cohere.js";
import { localToUTC, parseDeadlineHint } from "../utils/timezone.js";
import User from "../models/User.js";

// Personalized recommendations + AI scheduling assistance
async function getRecommendations(req, res) {
  const user = await User.findById(req.userId);
  const tasks = await Task.find({ user: req.userId, status: { $ne: "done" } }).sort({ deadline: 1 }).limit(15);

  if (tasks.length === 0) {
    return res.json({ recommendation: "No open tasks. Add one to get a personalized plan for your day." });
  }

  const recommendation = await suggestDailySchedule(tasks, user?.name || "there");
  if (!recommendation) {
    // Rule-based fallback if no Cohere key / call failed
    const top3 = tasks.slice(0, 3).map((t) => `- ${t.title} (due ${new Date(t.deadline).toLocaleString()})`);
    return res.json({
      recommendation: `AI scheduling is unavailable right now. Based on deadlines alone, focus on:\n${top3.join("\n")}`,
      fallback: true,
    });
  }
  res.json({ recommendation });
}

// Voice-enabled assistance: turn a spoken transcript into an action
async function handleVoiceCommand(req, res) {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ message: "transcript is required" });

  const user = await User.findById(req.userId);
  const parsed = await parseVoiceCommand(transcript);

  if (!parsed) {
    return res.json({
      intent: "unknown",
      reply: "I couldn't reach the AI assistant right now. Please try typing the task instead.",
    });
  }

  if (parsed.intent === "create_task" && parsed.title) {
    let deadline = parseDeadlineHint(parsed.deadlineHint, user?.timezone || "Asia/Kolkata");
    if (!deadline) {
      deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    const task = await Task.create({
      user: req.userId,
      title: parsed.title,
      deadline,
      timezone: user?.timezone || "Asia/Kolkata",
    });
    return res.json({ intent: "create_task", task, reply: parsed.reply || `Added "${parsed.title}" to your tasks.` });
  }

  res.json({ intent: parsed.intent || "unknown", reply: parsed.reply || "Got it." });
}

async function getRescuePlan(req, res) {
  const user = await User.findById(req.userId);
  const tasks = await Task.find({ user: req.userId, status: { $ne: "done" } }).sort({ deadline: 1 }).limit(25);
  if (tasks.length === 0) {
    return res.json({ plan: "No open tasks yet — add one and the AI will help you rescue your day.", fallback: true });
  }

  const plan = await suggestRescuePlan(tasks, user?.name || "there");
  if (!plan) {
    return res.json({
      plan: `AI rescue mode is unavailable right now. Based on your deadlines, focus immediately on: ${tasks
        .slice(0, 3)
        .map((t) => `${t.title} due ${new Date(t.deadline).toLocaleString()}`)
        .join(", ")}`,
      fallback: true,
    });
  }

  res.json({ plan, fallback: false });
}

async function getSummary(req, res) {
  const user = await User.findById(req.userId);
  const tasks = await Task.find({ user: req.userId });
  const pending = tasks.filter((t) => t.status !== "done");
  const overdue = pending.filter((t) => new Date(t.deadline).getTime() < Date.now());
  const dueToday = pending.filter((t) => new Date(t.deadline).toDateString() === new Date().toDateString());
  const urgent = pending.filter((t) => {
    const ms = new Date(t.deadline).getTime() - Date.now();
    return ms <= 2 * 60 * 60 * 1000 && ms > 0;
  });
  const productivityScore = Math.max(15, Math.min(98, 100 - Math.round((overdue.length * 8 + dueToday.length * 4 + urgent.length * 3))));
  const deadlineRisk = Math.min(100, overdue.length * 20 + dueToday.length * 10 + urgent.length * 6);
  const burnoutRisk = Math.min(100, Math.round((pending.length / 10) * 30 + (overdue.length * 10)));

  res.json({
    summary: {
      userName: user?.name || "there",
      activeTasks: pending.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      urgentNow: urgent.length,
      productivityScore,
      deadlineRisk,
      burnoutRisk,
      currentMode: deadlineRisk > 40 ? "Rescue" : "Focused",
    },
  });
}

async function getCareerFinanceSummary(req, res) {
  const user = await User.findById(req.userId);
  const tasks = await Task.find({ user: req.userId });
  const summary = await summarizeCareerFinance(tasks, user?.name || "there");
  res.json({
    summary:
      summary ||
      "No career and finance insights are available yet. Add tasks for resume work, job applications, internship prep, or budget planning to get tailored guidance.",
  });
}

async function getProductivityReport(req, res) {
  const user = await User.findById(req.userId);
  const tasks = await Task.find({ user: req.userId });
  const report = await generateProductivityReport(tasks, user?.name || "there");
  res.json({
    report:
      report ||
      "Weekly productivity reports are not available yet. Keep tracking tasks and the AI will synthesize your focus, energy, and schedule insights.",
  });
}

async function searchKnowledgeGraph(req, res) {
  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ results: [], message: "Search query is required." });
  }
  const tasks = await Task.find({ user: req.userId });
  const results = await semanticSearchTasks(tasks, query);
  res.json({ query, results, message: results.length ? "" : "No matching items found yet." });
}

export { getRecommendations, handleVoiceCommand, getRescuePlan, getSummary, getCareerFinanceSummary, getProductivityReport, searchKnowledgeGraph, };
