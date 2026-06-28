import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    location: { type: String, default: "" },
    importance: { type: Number, min: 1, max: 5, default: 3 },
    effortMinutes: { type: Number, default: 30 },
    deadline: { type: Date, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    status: { type: String, enum: ["pending", "in_progress", "done"], default: "pending" },
    priorityScore: { type: Number, default: 0 },
    subtasks: [subtaskSchema],
    aiPlan: { type: String, default: "" },
    smsNumber: { type: String, trim: true, default: "" },
    notifyBySMS: { type: Boolean, default: false },
    reminderThresholds: { type: [String], default: ["24h", "5h", "1h", "30m", "5m", "1m"] },
    remindersSent: { type: Map, of: Boolean, default: {} },
    // Whether we've already sent external contact (email/SMS) for this task's reminders.
    // When true, subsequent threshold reminders will still ring in-app but won't resend email/SMS.
    remindersContactSent: { type: Boolean, default: false },
    customAlerts: [
      {
        alarmTime: Date, // exact time user wants alarm to ring
        alarmType: { type: String, enum: ["soft", "medium", "loud"], default: "medium" },
        notifyBySMS: { type: Boolean, default: false },
        smsNumber: { type: String, trim: true, default: "" },
        hasRung: { type: Boolean, default: false },
        ringedAt: Date,
      },
    ], // custom alarms set by user
  },
  { timestamps: true }
);

// `user` field already indexed; create compound index on deadline only
taskSchema.index({ deadline: 1 });

export default mongoose.model("Task", taskSchema);
