import Assignment from "../models/Assignment.js";

// Create a simple submission reminder: user provides a link and a scheduled time.
async function createSubmissionReminder(req, res) {
  try {
    const userId = req.userId;
    const { title, link, scheduledAt } = req.body;
    if (!link || !scheduledAt) return res.status(400).json({ message: "Missing link or scheduledAt" });
    const scheduled = new Date(scheduledAt);
    if (Number.isNaN(scheduled.getTime())) return res.status(400).json({ message: "Invalid scheduledAt" });

    const a = await Assignment.create({ user: userId, title: title || "Submission", link, scheduledAt: scheduled });
    return res.status(201).json({ assignment: a });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create submission reminder" });
  }
}

async function listAssignments(req, res) {
  try {
    const userId = req.userId;
    const list = await Assignment.find({ user: userId }).sort({ scheduledAt: 1 });
    return res.json({ assignments: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not fetch submission reminders" });
  }
}

async function deleteAssignment(req, res) {
  try {
    const userId = req.userId;
    const id = req.params.id;
    const deleted = await Assignment.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      return res.status(404).json({ message: "Submission reminder not found." });
    }
    return res.json({ message: "deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete submission reminder" });
  }
}

// No download endpoint — assignments are now just links
export { createSubmissionReminder as uploadAssignment, listAssignments, deleteAssignment };
