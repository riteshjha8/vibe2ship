import { CohereClient } from "cohere-ai";
import { DateTime } from "luxon";

const COHERE_MODEL = process.env.COHERE_MODEL || "command-a-03-2025";
let client = null;
function getClient() {
  if (!process.env.COHERE_KEY) return null;
  if (!client) client = new CohereClient({ token: process.env.COHERE_KEY });
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
    if (preamble) {
      messages.push({ role: "system", content: preamble });
    }
    messages.push({ role: "user", content: message });

    const response = await c.v2.chat({
      model: COHERE_MODEL,
      messages,
      temperature: 0.4,
    });

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
    if (err?.response?.data) {
      console.error("Cohere response details:", err.response.data);
    }
    return null;
  }
}

async function suggestDailySchedule(tasks, userName) {
  const taskList = tasks
    .map((t) => {
      const locationText = t.location ? ` at ${t.location}` : "";
      return `- "${t.title}"${locationText} (importance ${t.importance}/5, due ${new Date(t.deadline).toLocaleString()}, ~${t.effortMinutes} min)`;
    })
    .join("\n");
  const prompt = `${userName} has these open tasks:\n${taskList}\n\nIn 3-5 short bullet points, recommend the best order to tackle today, accounting for urgency, location, and importance. If a task includes a physical place, note that the user can open Google Maps to go there. Be direct and practical, no fluff.`;
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

async function suggestRescuePlan(tasks, userName) {
  const taskList = tasks
    .map((t) => {
      const locationText = t.location ? ` at ${t.location}` : "";
      return `- "${t.title}"${locationText} (importance ${t.importance}/5, due ${new Date(t.deadline).toLocaleString()}, ~${t.effortMinutes} min)`;
    })
    .join("\n");
  const prompt = `You are an autonomous life rescue assistant for ${userName}. The user needs the fastest possible way to save their day. Here are their current open tasks:\n${taskList}\n\nProvide 4 direct, urgent action items in short bullet points. Focus on immediate next steps, deadline rescue, location-aware planning, and what to do first. If a task has a destination, remind the user they can open Google Maps for navigation. Keep it clear and practical with no extra fluff.`;
  const result = await askCohere(prompt);
  return result;
}

async function summarizeCareerFinance(tasks, userName) {
  const relevant = tasks.filter((t) => /resume|job|internship|budget|expense|subscription|invoice|career|finance|salary|investment/i.test(`${t.title} ${t.description} ${t.category}`));
  const context = relevant.length
    ? `Relevant records:\n${relevant.map((t) => `- ${t.title} (${t.category || "General"})`).join("\n")}`
    : "No explicit career or finance tasks were found.";
  const prompt = `You are a career and finance assistant for ${userName}. ${context}\n\nProvide a short summary of their career and finance readiness, and suggest 3 practical actions they can take next based on their tasks and recent activity.`;
  const result = await askCohere(prompt);
  return result;
}

async function generateProductivityReport(tasks, userName) {
  const recentTasks = tasks
    .map((t) => `- ${t.title} [${t.status}] due ${new Date(t.deadline).toLocaleDateString()}${t.location ? ` at ${t.location}` : ""}`)
    .join("\n");
  const prompt = `You are an AI productivity analyst for ${userName}. Here are their current tasks:\n${recentTasks}\n\nWrite a weekly productivity report with 3 quick insights and one recommended focus area. Keep it concise and action-oriented.`;
  const result = await askCohere(prompt);
  return result;
}

async function semanticSearchTasks(tasks, query) {
  const normalizedQuery = String(query).trim().toLowerCase();
  const directMatches = tasks.filter((task) =>
    [task.title, task.description, task.category, task.location, task.aiPlan]
      .some((field) => typeof field === "string" && field.toLowerCase().includes(normalizedQuery))
  );

  if (directMatches.length) {
    return directMatches.slice(0, 8).map((task) => ({
      id: task._id,
      type: "task",
      title: task.title,
      snippet: task.description ? task.description.slice(0, 120) : `Category: ${task.category}`,
      deadline: task.deadline,
      location: task.location,
    }));
  }

  const jsonSearch = await askCohere(
    `You are a semantic search assistant. The user asked: "${query}". Search these tasks and return up to 5 matching task title and snippet pairs as JSON array objects like {title, snippet}.\n\nTasks:\n${tasks
      .map((t) => `- ${t.title} | ${t.description || ""}`)
      .join("\n")}`,
    { jsonMode: true }
  );

  if (Array.isArray(jsonSearch)) {
    return jsonSearch.slice(0, 5).map((item, index) => ({
      id: `${index}-${normalizedQuery}`,
      type: "semantic",
      title: item.title || item.task || `Result ${index + 1}`,
      snippet: item.snippet || "",
    }));
  }

  return [];
}

export { askCohere, suggestDailySchedule, suggestRescuePlan, breakdownTask, contextualReminderMessage, parseVoiceCommand, summarizeCareerFinance, generateProductivityReport, semanticSearchTasks, };
