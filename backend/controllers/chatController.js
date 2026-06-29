import User from "../models/User.js";
import ChatSession from "../models/ChatSession.js";
import Message from "../models/Message.js";
import Memory from "../models/Memory.js";
import Alert from "../models/Alert.js";
import AIInsight from "../models/AIInsight.js";
import ConversationSummary from "../models/ConversationSummary.js";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import Habit from "../models/Habit.js";
import { generateAssistantResponse, summarizeConversation } from "../utils/cohere.js";

async function listChatSessions(req, res) {
  const sessions = await ChatSession.find({ user: req.userId }).sort({ updatedAt: -1 });
  res.json({ sessions });
}

async function createChatSession(req, res) {
  const { title, pinned } = req.body;
  const session = await ChatSession.create({
    user: req.userId,
    title: title?.trim() || "AI Assistant",
    pinned: !!pinned,
    lastMessage: "",
  });
  res.status(201).json({ session });
}

async function getSessionMessages(req, res) {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
  if (!session) return res.status(404).json({ message: "Chat session not found." });

  const messages = await Message.find({ session: session._id }).sort({ createdAt: 1 });
  res.json({ session, messages });
}

async function postChatMessage(req, res) {
  const { content, role = "user", metadata = {} } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Message content is required." });
  }

  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
  if (!session) return res.status(404).json({ message: "Chat session not found." });

  const userMsg = await Message.create({
    session: session._id,
    user: req.userId,
    role: role === "assistant" ? "assistant" : "user",
    content: content.trim(),
    metadata,
  });

  let assistantContent = null;
  if (userMsg.role === "user") {
    const user = await User.findById(req.userId);
    const history = await Message.find({ session: session._id }).sort({ createdAt: 1 }).limit(40);
    const tasks = await Task.find({ user: req.userId, status: { $ne: "done" } }).sort({ deadline: 1 }).limit(40);
    const goals = await Goal.find({ user: req.userId, status: "active" }).sort({ targetDate: 1 }).limit(10);
    const habits = await Habit.find({ user: req.userId }).sort({ updatedAt: -1 }).limit(10);
    const alerts = await Alert.find({ user: req.userId, active: true }).sort({ alarmTime: 1 }).limit(10);
    const memories = await Memory.find({ user: req.userId }).sort({ updatedAt: -1 }).limit(6);
    const summaries = await ConversationSummary.find({ user: req.userId }).sort({ updatedAt: -1 }).limit(2);
    const preferences = {
      timezone: user?.timezone || "Asia/Kolkata",
      country: user?.country || "IN",
      notificationPrefs: user?.notificationPrefs || {},
      integrations: user?.integrations || {},
    };

    assistantContent =
      (await generateAssistantResponse(history, user?.name || "there", session.title, {
        tasks,
        goals,
        habits,
        alerts,
        memories,
        summaries,
        preferences,
      })) ||
      "I couldn't generate a reply right now. Try again in a moment.";

    const assistantMsg = await Message.create({
      session: session._id,
      user: req.userId,
      role: "assistant",
      content: assistantContent,
      metadata: { generated: true },
    });

    session.lastMessage = assistantMsg.content;
    await session.save();

    return res.status(201).json({ session, userMessage: userMsg, assistantMessage: assistantMsg });
  }

  session.lastMessage = userMsg.content;
  await session.save();
  res.status(201).json({ session, userMessage: userMsg });
}

async function summarizeChatSession(req, res) {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
  if (!session) return res.status(404).json({ message: "Chat session not found." });

  const messages = await Message.find({ session: session._id }).sort({ createdAt: 1 });
  const user = await User.findById(req.userId);
  const summaryText =
    (await summarizeConversation(messages, user?.name || "there")) ||
    "Unable to summarize this conversation at this time.";

  const summary = await ConversationSummary.findOneAndUpdate(
    { user: req.userId, session: session._id },
    { summary: summaryText, source: "chat" },
    { upsert: true, new: true }
  );

  res.json({ session, summary });
}

async function deleteChatSession(req, res) {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.userId });
  if (!session) return res.status(404).json({ message: "Chat session not found." });

  await Message.deleteMany({ session: session._id });
  await ConversationSummary.deleteMany({ user: req.userId, session: session._id });
  await ChatSession.deleteOne({ _id: session._id });

  res.json({ message: "Chat session deleted." });
}

async function listMemories(req, res) {
  const memories = await Memory.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ memories });
}

async function addMemory(req, res) {
  const { title, content, tags = [], metadata = {} } = req.body;
  if (!title || !content) return res.status(400).json({ message: "Memory title and content are required." });

  const memory = await Memory.create({
    user: req.userId,
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    metadata,
  });

  res.status(201).json({ memory });
}

async function listInsights(req, res) {
  const insights = await AIInsight.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ insights });
}

async function addInsight(req, res) {
  const { type, title, content, metadata = {} } = req.body;
  if (!type || !content) return res.status(400).json({ message: "Insight type and content are required." });

  const insight = await AIInsight.create({
    user: req.userId,
    type: type.trim(),
    title: title?.trim() || "",
    content: content.trim(),
    metadata,
  });

  res.status(201).json({ insight });
}

export {
  listChatSessions,
  createChatSession,
  getSessionMessages,
  postChatMessage,
  summarizeChatSession,
  deleteChatSession,
  listMemories,
  addMemory,
  listInsights,
  addInsight,
};
