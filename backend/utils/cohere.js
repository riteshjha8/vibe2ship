import { CohereClient } from "cohere-ai";
import { DateTime } from "luxon";

const COHERE_MODEL = process.env.COHERE_MODEL || "command-a-03-2025";
let client = null;
function getCohereKey() {
  return process.env.COHERE_KEY;
}
function getClient() {
  const cohereKey = getCohereKey();
  if (!cohereKey) {
    if (!client) {
      console.warn("Cohere API key is missing: set COHERE_KEY in backend/.env or deployment environment");
    }
    return null;
  }
  if (!client) {
    console.log("Cohere API key detected: creating Cohere client from environment.");
    client = new CohereClient({ token: cohereKey });
  }
  return client;
}

function extractJsonString(source) {
  const jsonMatch = source.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return jsonMatch ? jsonMatch[0] : source;
}

/**
 * Generic helper: ask Cohere chat for a reply, with a JSON-only mode option.
 * Always fails soft - returns null on any error/missing key so the rest of the
 * app can fall back to rule-based logic instead of crashing.
 */
async function askCohere(message, { preamble, jsonMode = false } = {}) {
  const c = getClient();
  if (!c) return null;
  try {
    const messages = [];
    // default system preamble to enforce persona if none provided
    const defaultPreamble =
      "You are a world-class AI assistant with a pro Gemini mindset. Reply like the best LLM model: expert, practical, friendly, and task-focused. You are the user's best task reminder, offering clear suggestions, alerts, and tips for what to do next. Speak naturally when appropriate, including greetings like 'hi', 'hello', 'good morning', 'thank you', and 'welcome', while still delivering sharp productivity advice and concrete next steps.";
    messages.push({ role: "system", content: preamble || defaultPreamble });
    messages.push({ role: "user", content: message });

    console.log("[askCohere] sending chat request", { model: COHERE_MODEL, messagesLength: messages.length });
    const response = await c.v2.chat({
      model: COHERE_MODEL,
      messages,
      temperature: 0.4,
    });
    console.log("[askCohere] cohere response received", { hasMessage: !!response?.message, messageTypes: response?.message?.content?.map?.((i) => i.type) });

    const text = (response?.message?.content || [])
      .filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("")
      .trim();

    if (jsonMode) {
      const cleaned = text.replace(/```json|```/g, "").trim();
      try {
        return JSON.parse(cleaned);
      } catch (parseErr) {
        const jsonString = extractJsonString(cleaned);
        if (jsonString !== cleaned) {
          try {
            return JSON.parse(jsonString);
          } catch (secondErr) {
            console.error("Cohere JSON parse failed after extraction:", secondErr.message, "raw:", cleaned);
            return null;
          }
        }
        console.error("Cohere JSON parse failed:", parseErr.message, "raw:", cleaned);
        return null;
      }
    }
    return text || null;
  } catch (err) {
    console.error("Cohere request failed:", err?.message || err);
    try {
      if (err?.response) console.error("Cohere response object:", JSON.stringify(err.response, Object.getOwnPropertyNames(err.response)));
    } catch (e) {
      console.error("Failed to stringify Cohere error response", e?.message || e);
    }
    if (err?.response?.data) {
      console.error("Cohere response details:", err.response.data);
    }
    return null;
  }
}

async function suggestDailySchedule(tasks, userName, goals = [], habits = []) {
  const taskList = tasks
    .map((t) => {
      const locationText = t.location ? ` at ${t.location}` : "";
      return `- "${t.title}"${locationText} (importance ${t.importance}/5, due ${new Date(t.deadline).toLocaleString()}, ~${t.effortMinutes} min)`;
    })
    .join("\n");
  const goalList = goals
    .map((g) => `- "${g.title}" (progress ${g.progress || 0}%, target ${g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "unknown"})`)
    .slice(0, 4)
    .join("\n");
  const habitList = habits.map((h) => `- "${h.title}" (${h.frequency || "daily"}, streak ${h.streak || 0})`).slice(0, 4).join("\n");
  const prompt = `${userName} has these open tasks:\n${taskList}${goalList ? `\n\nActive goals:\n${goalList}` : ""}${habitList ? `\n\nKey habits:\n${habitList}` : ""}\n\nIn 3-5 short bullet points, recommend the best order to tackle today, accounting for urgency, importance, goals, and habit rhythm. If a task includes a physical place, note that the user can open Google Maps. Be direct and practical, no fluff.`;
  const result = await askCohere(prompt);
  return result;
}

async function breakdownTask(title, description) {
  const prompt = `Break this task into 3-6 concrete, actionable subtasks a person could check off one by one.\nTask: "${title}"\nDetails: ${description || "none"}\n\nRespond ONLY with a JSON array of short subtask title strings, nothing else. Example: ["Step one", "Step two"]`;
  const result = await askCohere(prompt, { jsonMode: true });
  if (Array.isArray(result)) return result.filter((s) => typeof s === "string");
  return null;
}

async function contextualReminderMessage({ title, timeLeftLabel, urgency }) {
  const prompt = `Write ONE short, professional, friendly-but-firm reminder sentence (max 22 words) telling the user their task "${title}" is due in ${timeLeftLabel}. Urgency level: ${urgency}. No emojis, no quotes around it, just the sentence.`;
  const result = await askCohere(prompt);
  return result;
}

function normalizeReplyText(text = "") {
  return text.toLowerCase().trim();
}

function isSimpleGreeting(message = "") {
  const normalized = normalizeReplyText(message).replace(/[!?.]+$/, "").trim();
  return /^(hi|hello|hey|hii|hyy|yo|sup)( there| friend| everyone| all| team)?$/i.test(normalized) ||
    /^(good morning|good afternoon|good evening)( there| friend| everyone| all| team)?$/i.test(normalized);
}

function isExpressionOfGratitude(message = "") {
  const normalized = normalizeReplyText(message).replace(/[!?.]+$/, "").trim();
  return /^(thank you|thanks|thankyou|thx|ty|thank you so much|thanks a lot|thank you very much|many thanks)\b/i.test(normalized);
}

function getRandomGratitudeReply() {
  const replies = [
    "Most welcome! What I suggest next is picking one small task you can finish in the next 15 minutes.",
    "Most welcome! If you'd like, I can help you choose the next best task to take action on.",
    "Most welcome! Let’s decide the next step: finish the nearest deadline task or make a small advance on a big goal.",
    "Most welcome! I can recommend the next practical thing to do — tell me the task you want to move forward with.",
    "Most welcome! Focus on one quick win now, and I’ll help you plan the next one after that.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function looksLikeGreeting(message = "") {
  const normalized = normalizeReplyText(message).replace(/[!?.]+$/, "").trim();
  if (isSimpleGreeting(normalized)) return true;
  return /^(hi|hello|hey|hii|hyy|yo|sup|good morning|good afternoon|good evening)\b/i.test(normalized) &&
    normalized.split(/\s+/).length <= 3;
}

function classifyReplyTopic(message = "") {
  const normalized = normalizeReplyText(message);
  if (/(payment|payments|bill|bills|invoice|invoices|salary|expense|expenses|budget|finance|money|loan|debt|refund|wallet|bank)/.test(normalized)) {
    return "finance";
  }
  if (/(assignment|assignments|homework|project|study|exam|deadline|deadlines|late|due date|submission|report|task|tasks|schedule|planning)/.test(normalized)) {
    return "task";
  }
  if (/(health|fitness|sleep|exercise|gym|workout|training|diet|wellness|hydration|stress|mental health|medicine)/.test(normalized)) {
    return "health";
  }
  return null;
}

function buildLocalAssistantReply(history = []) {
  const latestUserMessage = [...history].reverse().find((message) => message?.role === "user" && typeof message?.content === "string" && message.content.trim());
  const message = latestUserMessage?.content || "";
  if (!message.trim()) {
    return "Hi there! I’m your task reminder and productivity assistant. What would you like help with today?";
  }

  if (looksLikeGreeting(message)) {
    return "Hello! I’m here to help — I can give you reminders, alerts, tips, and next steps. What would you like to work on today?";
  }

  const topic = classifyReplyTopic(message);
  if (!topic) return null;

  if (topic === "finance") {
    return [
      "Here’s a clear way to handle this:",
      "- Review your current expenses and separate essentials from non-essential spending.",
      "- Contact the relevant person or service early if a payment is delayed or a bill is overdue.",
      "- Set a simple payment plan and track due dates so you avoid future delays.",
    ].join("\n");
  }

  if (topic === "health") {
    return [
      "Here’s a practical approach:",
      "- Keep your routine simple with regular hydration, meals, and sleep.",
      "- Take short breaks and move around if you have been sitting for long periods.",
      "- Reduce pressure by focusing on one important task at a time.",
    ].join("\n");
  }

  if (topic === "task") {
    return [
      "Start with the one task that will give you the most momentum.",
      "- Choose the task with the nearest deadline or highest consequence.",
      "- Break it into three small next steps you can finish in under 30 minutes.",
      "- Remove one distraction and begin the first step immediately.",
    ].join("\n");
  }

  return [
    "Focus on the next small move that moves your work forward.",
    "- Pick one task you can complete or meaningfully advance in under 30 minutes.",
    "- Break it into the smallest possible next step and do that first.",
    "- Remove one distraction and keep the first block short so momentum builds.",
  ].join("\n");
}

function buildContextSummary({ tasks = [], goals = [], habits = [], alerts = [], memories = [], summaries = [], preferences = {} } = {}) {
  const sections = [];
  if (tasks.length) {
    const lines = tasks.slice(0, 6).map((t) => {
      const due = t.deadline ? `due ${new Date(t.deadline).toLocaleDateString()}` : "no deadline";
      const importance = typeof t.importance === "number" ? `importance ${t.importance}/5` : "importance unknown";
      const effort = t.effortMinutes ? `~${t.effortMinutes} min` : "effort unknown";
      const location = t.location ? ` at ${t.location}` : "";
      return `- ${t.title}${location} (${importance}, ${due}, ${effort})`;
    });
    sections.push(`Open tasks:\n${lines.join("\n")}`);
  }
  if (goals.length) {
    const lines = goals.slice(0, 5).map((g) => {
      const target = g.targetDate ? `target ${new Date(g.targetDate).toLocaleDateString()}` : "target date unknown";
      const progress = typeof g.progress === "number" ? `progress ${g.progress}%` : "progress unknown";
      return `- ${g.title} (${progress}, ${target})`;
    });
    sections.push(`Goals:\n${lines.join("\n")}`);
  }
  if (habits.length) {
    const lines = habits.slice(0, 4).map((h) => {
      const frequency = h.frequency || "daily";
      const streak = typeof h.streak === "number" ? `streak ${h.streak}` : "streak unknown";
      const lastDone = h.lastCompletedAt ? `last completed ${new Date(h.lastCompletedAt).toLocaleDateString()}` : "not completed recently";
      return `- ${h.title} (${frequency}, ${streak}, ${lastDone})`;
    });
    sections.push(`Habits:\n${lines.join("\n")}`);
  }
  if (alerts.length) {
    const lines = alerts.slice(0, 5).map((a) => {
      const time = a.alarmTime ? `${new Date(a.alarmTime).toLocaleString()}` : "time unknown";
      return `- ${a.title} (at ${time})`;
    });
    sections.push(`Reminders and calendar alerts:\n${lines.join("\n")}`);
  }
  if (memories.length) {
    const lines = memories.slice(0, 4).map((m) => `- ${m.title}: ${m.content.slice(0, 120).replace(/\s+/g, " ")}`);
    sections.push(`Recent notes and memories:\n${lines.join("\n")}`);
  }
  if (summaries.length) {
    const lines = summaries.slice(0, 2).map((s) => `- ${s.summary.slice(0, 120).replace(/\s+/g, " ")}`);
    sections.push(`Recent chat summaries:\n${lines.join("\n")}`);
  }
  if (Object.keys(preferences).length) {
    const prefLines = [];
    if (preferences.timezone) prefLines.push(`timezone ${preferences.timezone}`);
    if (preferences.country) prefLines.push(`country ${preferences.country}`);
    if (preferences.notificationPrefs) prefLines.push(`notifications ${JSON.stringify(preferences.notificationPrefs)}`);
    if (preferences.integrations) prefLines.push(`integrations ${Object.keys(preferences.integrations).join(", ") || "none"}`);
    sections.push(`User preferences:\n- ${prefLines.join("; ")}`);
  }
  return sections.length ? sections.join("\n\n") : "No active productivity data was found in the user's current context.";
}

function simplifyVoiceTitle(transcript) {
  return String(transcript)
    .replace(/\b(remind me to|remind me|add|create|schedule|set a reminder to|please|today|tomorrow|tonight|this morning|this afternoon|this evening)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s,:-]+|[\s,:-]+$/g, "");
}

function detectRelativeDeadline(transcript) {
  const text = String(transcript).toLowerCase();
  if (/\btomorrow\b/.test(text)) return "tomorrow";
  if (/\btoday\b|\btonight\b|\bthis (?:morning|afternoon|evening)\b/.test(text)) return "today";
  const timeOnly = text.match(/(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  return timeOnly ? timeOnly[0].trim() : null;
}

async function parseVoiceCommand(transcript) {
  const prompt = `The user said this voice command to a task manager app: "${transcript}"\n\nDecide the intent and respond ONLY with JSON in this exact shape:\n{"intent": "create_task" | "query" | "unknown", "title": string|null, "deadlineHint": string|null, "reply": string}\n"reply" is a short spoken confirmation (max 18 words). If intent is create_task but no clear deadline was said, set deadlineHint to null.`;
  const result = await askCohere(prompt, { jsonMode: true });
  if (result && result.intent && result.title) return result;

  const fallbackTitle = simplifyVoiceTitle(transcript) || transcript;
  const relative = detectRelativeDeadline(transcript);
  return {
    intent: "create_task",
    title: fallbackTitle,
    deadlineHint: relative,
    reply: `Added "${fallbackTitle}"${relative ? ` for ${relative}` : ""}.`,
  };
}

async function suggestRescuePlan(tasks, userName, goals = [], habits = []) {
  const taskList = tasks
    .map((t) => {
      const locationText = t.location ? ` at ${t.location}` : "";
      return `- "${t.title}"${locationText} (importance ${t.importance}/5, due ${new Date(t.deadline).toLocaleString()}, ~${t.effortMinutes} min)`;
    })
    .join("\n");
  const goalList = goals
    .map((g) => `- "${g.title}" (progress ${g.progress || 0}%, target ${g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "unknown"})`)
    .slice(0, 4)
    .join("\n");
  const habitList = habits.map((h) => `- "${h.title}" (${h.frequency || "daily"}, streak ${h.streak || 0})`).slice(0, 4).join("\n");
  const prompt = `You are an autonomous life rescue assistant for ${userName}. The user needs the fastest possible way to save their day. Here are their current open tasks:\n${taskList}${goalList ? `\n\nActive goals:\n${goalList}` : ""}${habitList ? `\n\nKey habits:\n${habitList}` : ""}\n\nProvide 4 direct, urgent action items in short bullet points. Focus on immediate next steps, deadline rescue, location-aware planning, and what to do first. If a task has a destination, remind the user they can open Google Maps for navigation. Keep it clear and practical with no extra fluff.`;
  const result = await askCohere(prompt);
  return result;
}

async function suggestHabitActions(userName, tasks = [], goals = [], habits = []) {
  const taskList = tasks
    .map((t) => {
      const due = t.deadline ? `due ${new Date(t.deadline).toLocaleDateString()}` : "no deadline";
      return `- "${t.title}" (${t.category || "task"}, importance ${t.importance || 3}/5, ${due})`;
    })
    .slice(0, 10)
    .join("\n");
  const goalList = goals
    .map((g) => `- "${g.title}" (progress ${g.progress || 0}%, target ${g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "unknown"})`)
    .slice(0, 5)
    .join("\n");
  const habitList = habits
    .map((h) => {
      const streak = typeof h.streak === "number" ? `streak ${h.streak}` : "streak unknown";
      const lastDone = h.lastCompletedAt ? `last done ${new Date(h.lastCompletedAt).toLocaleDateString()}` : "not recently completed";
      return `- "${h.title}" (${h.frequency || "daily"}, ${streak}, ${lastDone})`;
    })
    .slice(0, 8)
    .join("\n");

  const prompt = `You are a smart habit coach for ${userName}. Based on the user's open tasks, active goals, and current habits, provide 5 to 8 habit-building suggestions the user can take action on today. For each suggestion, respond with JSON in this exact shape:
[
  {"id": "string", "title": "string", "description": "string", "relevantHabit": "string"}
]
Do not add any extra text outside the JSON array.

Open tasks:\n${taskList || "- none"}${goalList ? `\n\nActive goals:\n${goalList}` : ""}${habitList ? `\n\nCurrent habits:\n${habitList}` : ""}

Focus on energy, focus, burnout prevention, and creating easy wins that support daily routines and task completion probability.`;

  const result = await askCohere(prompt, { jsonMode: true });
  if (Array.isArray(result) && result.length) {
    const normalized = result
      .filter((item) => item && typeof item.title === "string" && item.title.trim())
      .slice(0, 8)
      .map((item, index) => ({
        id: item.id || `suggestion-${index + 1}`,
        title: item.title.trim(),
        description: item.description?.trim() || "No details provided.",
        relevantHabit: item.relevantHabit?.trim() || "General habit support",
      }));
    if (normalized.length) return normalized;
  }

  const fallback = [
    {
      id: "habit-suggestion-1",
      title: "Add a 10-minute energy check-in",
      description: "Each morning, write one quick note about your focus, energy, and the single most important task for the day.",
      relevantHabit: "Energy awareness",
    },
    {
      id: "habit-suggestion-2",
      title: "Schedule a midday focus block",
      description: "Block 25–30 minutes for your most important task to protect deep work time and reduce decision fatigue.",
      relevantHabit: "Deep work",
    },
    {
      id: "habit-suggestion-3",
      title: "Plan a short recovery break",
      description: "Every 90 minutes, take 5 minutes to stretch, hydrate, or step outside to avoid burnout build-up.",
      relevantHabit: "Burnout prevention",
    },
    {
      id: "habit-suggestion-4",
      title: "Review your top task before finishing work",
      description: "End your day by picking one task to start first tomorrow, so you keep momentum and improve completion probability.",
      relevantHabit: "Task planning",
    },
    {
      id: "habit-suggestion-5",
      title: "Break a task into a quick checklist",
      description: "If a task feels large, list 3 simple next actions to make progress without overwhelm.",
      relevantHabit: "Task focus",
    },
  ]; 

  if (habits.length < 3) {
    fallback.push({
      id: "habit-suggestion-6",
      title: "Start a small daily habit",
      description: "Commit to a tiny habit like 5 minutes of review or journaling to build consistency without pressure.",
      relevantHabit: "Habit creation",
    });
  }

  return fallback;
}

async function summarizeCareerFinance(tasks, userName, goals = [], habits = []) {
  const relevant = tasks.filter((t) => /resume|job|internship|budget|expense|subscription|invoice|career|finance|salary|investment/i.test(`${t.title} ${t.description} ${t.category}`));
  const context = relevant.length
    ? `Relevant records:\n${relevant.map((t) => `- ${t.title} (${t.category || "General"})`).join("\n")}`
    : "No explicit career or finance tasks were found.";
  const goalSummary = goals.length
    ? `\n\nActive goals related to career or finance:\n${goals
        .filter((g) => /career|finance|budget|money|income|salary|investment|resume|job|internship/i.test(`${g.title} ${g.description}`))
        .map((g) => `- ${g.title} (${g.progress || 0}% done)`)
        .slice(0, 5)
        .join("\n")}`
    : "";
  const habitSummary = habits.length
    ? `\n\nRelevant habits:\n${habits
        .filter((h) => /finance|budget|money|saving|planning|routine|workflow/i.test(h.title))
        .map((h) => `- ${h.title} (${h.frequency || "daily"})`)
        .slice(0, 5)
        .join("\n")}`
    : "";
  const prompt = `You are a career and finance assistant for ${userName}. ${context}${goalSummary}${habitSummary}\n\nProvide a short summary of their career and finance readiness, and suggest 3 practical actions they can take next based on their tasks, goals, and habits.`;
  const result = await askCohere(prompt);
  return result;
}

async function generateProductivityReport(tasks, userName, goals = [], habits = []) {
  const recentTasks = tasks
    .map((t) => `- ${t.title} [${t.status}] due ${t.deadline ? new Date(t.deadline).toLocaleDateString() : "unscheduled"}${t.location ? ` at ${t.location}` : ""}`)
    .join("\n");
  const goalSummary = goals.length
    ? `\nActive goals:\n${goals.slice(0, 5).map((g) => `- ${g.title} (${g.progress || 0}% complete)`).join("\n")}`
    : "";
  const habitSummary = habits.length
    ? `\nHabits:\n${habits.slice(0, 4).map((h) => `- ${h.title} (${h.frequency || "daily"}, streak ${h.streak || 0})`).join("\n")}`
    : "";
  const prompt = `You are an AI productivity analyst for ${userName}. Here are their current tasks:${recentTasks ? `\n${recentTasks}` : " none"}${goalSummary}${habitSummary}\n\nWrite a weekly productivity report with 3 quick insights, one recommended focus area, and one short missed-opportunity note. Keep it concise, practical, and in plain language.`;
  const result = await askCohere(prompt);
  return result;
}

async function generateWeeklyReview(tasks, userName, goals = [], habits = []) {
  const recentTasks = tasks
    .map((t) => `- ${t.title} (${t.status}) due ${t.deadline ? new Date(t.deadline).toLocaleDateString() : "unscheduled"}${t.location ? ` at ${t.location}` : ""}`)
    .join("\n");
  const goalSummary = goals.length
    ? `\nGoals:\n${goals.slice(0, 5).map((g) => `- ${g.title} (${g.progress || 0}% complete)`).join("\n")}`
    : "";
  const habitSummary = habits.length
    ? `\nHabits:\n${habits.slice(0, 4).map((h) => `- ${h.title} (${h.frequency || "daily"}, streak ${h.streak || 0})`).join("\n")}`
    : "";
  const prompt = `You are an AI weekly review coach for ${userName}. Here is what happened this week:${recentTasks ? `\n${recentTasks}` : " none"}${goalSummary}${habitSummary}\n\nProvide a clear weekly review in short bullet points. Include: 1) what went well, 2) what was missed or fell behind, and 3) 2 practical suggestions for next week so the user can improve their planning and focus. Use numbered or bullet format.`;
  const result = await askCohere(prompt);
  return result;
}

async function semanticSearchTasks(tasks, goals = [], habits = [], query) {
  const normalizedQuery = String(query).trim().toLowerCase();
  const items = [
    ...tasks.map((task) => ({
      id: task._id,
      type: "task",
      title: task.title,
      text: `${task.title} ${task.description || ""} ${task.category || ""} ${task.location || ""}`,
      snippet: task.description ? task.description.slice(0, 120) : `Category: ${task.category}`,
      deadline: task.deadline,
      location: task.location,
    })),
    ...goals.map((goal) => ({
      id: goal._id,
      type: "goal",
      title: goal.title,
      text: `${goal.title} ${goal.description || ""}`,
      snippet: goal.description ? goal.description.slice(0, 120) : "Goal overview",
    })),
    ...habits.map((habit) => ({
      id: habit._id,
      type: "habit",
      title: habit.title,
      text: `${habit.title}`,
      snippet: `${habit.title} (${habit.frequency || "daily"})`,
    })),
  ];

  const directMatches = items.filter((item) =>
    item.text.toLowerCase().includes(normalizedQuery)
  );

  if (directMatches.length) {
    return directMatches.slice(0, 8).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      snippet: item.snippet,
      deadline: item.deadline,
      location: item.location,
    }));
  }

  const inputBlock = `Tasks:\n${tasks.map((t) => `- ${t.title} | ${t.description || ""}`).join("\n")}\n\nGoals:\n${goals.map((g) => `- ${g.title} | ${g.description || ""}`).join("\n")}\n\nHabits:\n${habits.map((h) => `- ${h.title} | ${h.frequency || "daily"}`).join("\n")}`;

  const jsonSearch = await askCohere(
    `You are a semantic search assistant. The user asked: "${query}". Search these tasks, goals, and habits and return up to 5 matching items as JSON array objects like {title, snippet}.

${inputBlock}`,
    { jsonMode: true }
  );

  if (Array.isArray(jsonSearch)) {
    return jsonSearch.slice(0, 5).map((item, index) => ({
      id: `${index}-${normalizedQuery}`,
      type: item.type || "semantic",
      title: item.title || item.task || `Result ${index + 1}`,
      snippet: item.snippet || "",
    }));
  }

  return [];
}

async function generateAssistantResponse(history, userName, sessionTitle, context = {}) {
  const historyText = history
    .map((message) => `${message.role === "user" ? "User" : message.role === "assistant" ? "Assistant" : "System"}: ${message.content}`)
    .join("\n");
  const contextText = buildContextSummary(context);

  // Debug: log incoming user message and context summary for troubleshooting
  try {
    const latestUser = [...history].reverse().find((m) => m?.role === "user")?.content || "";
    console.log("[generateAssistantResponse] latestUser=", latestUser);
    console.log("[generateAssistantResponse] contextSummary=", contextText ? contextText.slice(0, 800) : "<none>");
  } catch (e) {
    console.error("[generateAssistantResponse] debug log failed", e?.message || e);
  }

  // Strong system prompt to steer the assistant to produce a one-line recommendation
  // followed by clear action steps and a short rationale. We also instruct the model
  // to avoid repetition and to expand if the initial answer is too terse.
  const basePrompt = `You are the Cohere-powered LastMinute Assistant for ${userName}. Think like a pro Gemini model and reply like the best LLM: expert, practical, confident, and conversational when it fits. You are the user's best task reminder — deliver suggestions, alerts, tips, and concrete next actions. Use ONLY the authenticated user context (tasks, goals, habits, reminders, calendar, preferences). Do NOT invent facts or make unsupported medical, legal, or financial claims; when a question requires licensed advice, recommend a qualified professional.

Persona and style:
- Be friendly and natural when the user greets you. You can say “hi”, “hello”, “good morning”, “thank you”, or “welcome” naturally while still staying focused.
- Be concise, decisive, and empathetic. Start with a single-line top recommendation or summary, then provide 3 to 6 prioritized, actionable steps. End with a one-line "Why" explaining the top recommendation.
- Offer suggestions, alerts, and tips about what the user should do next, especially when they ask for guidance on tasks, plans, reminders, or productivity.

Behavior rules:
- Use only the supplied user context; avoid hallucination.
- If details are missing, ask a single clarifying question and offer a safe fallback plan.
- If the user asks for something outside the assistant's scope (medical emergency, legal advice, financial transactions), give a safe disclaimer and recommend a qualified professional.

Productivity context:
${contextText}

Conversation history:
${historyText}

Respond as the assistant in a clear, human-friendly message following the required structure: 1) one-line recommendation, 2) numbered or bulleted action steps (3-6 items), 3) one-line "Why". Avoid repeating earlier assistant messages. Do not include system or internal notes.`;

  const latestUserMessage = [...history].reverse().find((m) => m?.role === "user")?.content || "";
  const latestUserIsGreeting = looksLikeGreeting(latestUserMessage);
  const localGreeting = buildLocalAssistantReply(history);

  // If the user just said hello, reply locally and skip the Cohere call.
  if (latestUserIsGreeting && localGreeting) {
    return localGreeting;
  }

  if (isExpressionOfGratitude(latestUserMessage)) {
    return getRandomGratitudeReply();
  }

  const hasCohereKey = Boolean(getCohereKey());
  let result = null;

  if (hasCohereKey) {
    let retryAllowed = true;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        console.log("[generateAssistantResponse] calling Cohere, attempt", attempt + 1);
        result = await askCohere(attempt === 0 ? basePrompt : `${basePrompt}\n\nDo not respond with a greeting. Answer the user's question directly with clear, actionable advice in the required format.`);
        console.log("[generateAssistantResponse] cohere result length=", result ? String(result).length : 0);
      } catch (e) {
        console.error("[generateAssistantResponse] cohere call error:", e?.message || e);
        result = null;
      }

      const latestUser = normalizeReplyText(latestUserMessage);
      if (typeof result === "string" && looksLikeGreeting(result) && latestUser && !looksLikeGreeting(latestUser)) {
        console.warn("[generateAssistantResponse] detected greeting-like model reply for non-greeting input; retrying if allowed.");
        result = null;
        if (!retryAllowed) break;
        retryAllowed = false;
        continue;
      }
      break;
    }

    const isShort = !result || (typeof result === "string" && result.trim().length < 40);
    const lastAssistant = Array.isArray(history) ? [...history].reverse().find((m) => m.role === "assistant") : null;
    const repeatsLast = lastAssistant && result && typeof result === "string" && lastAssistant.content && result.trim() === lastAssistant.content.trim();

    if ((isShort || repeatsLast) && !latestUserIsGreeting) {
      try {
        const expandPrompt = `${basePrompt}\n\nThe previous reply was too short or repetitive. Please expand the assistant's reply now into the required format: one-line recommendation, then 3-6 numbered action steps, then a one-line \"Why\". Be specific and avoid repetition. If you cannot expand safely, say so.`;
        console.log("[generateAssistantResponse] attempting expansion prompt");
        const expanded = await askCohere(expandPrompt);
        console.log("[generateAssistantResponse] expanded length=", expanded ? String(expanded).length : 0);
        if (expanded && typeof expanded === "string" && expanded.trim().length > 20) {
          result = expanded;
        }
      } catch (e) {
        console.error("Assistant expansion attempt failed:", e?.message || e);
        result = null;
      }
    }

    if (typeof result === "string" && looksLikeGreeting(result) && latestUser && !looksLikeGreeting(latestUser)) {
      console.warn("[generateAssistantResponse] expanded response still greeting-like; discarding result.");
      result = null;
    }
  } else {
    console.warn("[generateAssistantResponse] no Cohere API key available; using local fallback.");
  }

  if (!result) {
    const fallback = buildLocalAssistantReply(history);
    if (fallback) {
      console.warn("[generateAssistantResponse] using hard-coded fallback reply.");
      return fallback;
    }
    return "I’m sorry, I can’t access the AI assistant right now. Please try again in a moment.";
  }

  // Debug: final result preview
  try {
    console.log("[generateAssistantResponse] finalResultPreview=", (result && typeof result === 'string' ? result.slice(0, 400) : String(result)));
  } catch (e) {
    /* ignore */
  }

  return result;
}

async function summarizeConversation(messages, userName) {
  const conversationText = messages
    .map((message) => `${message.role === "user" ? "User" : message.role === "assistant" ? "Assistant" : "System"}: ${message.content}`)
    .join("\n");
  const prompt = `You are summarizing a conversation for ${userName}. Provide a short summary of the main points, decisions, and follow-up actions in 3-4 sentences.

Conversation:
${conversationText}`;
  const result = await askCohere(prompt);
  return result;
}

export {
  askCohere,
  suggestDailySchedule,
  suggestRescuePlan,
  suggestHabitActions,
  breakdownTask,
  contextualReminderMessage,
  parseVoiceCommand,
  summarizeCareerFinance,
  generateProductivityReport,
  generateWeeklyReview,
  semanticSearchTasks,
  generateAssistantResponse,
  summarizeConversation,
  buildLocalAssistantReply,
};
