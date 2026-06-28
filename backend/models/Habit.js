import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedAt: { type: Date, default: null },
    missedReminderSentAt: { type: Date, default: null },
    history: [{ type: Date }],
    checklist: [
      {
        title: { type: String, required: true, trim: true },
        done: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Habit", habitSchema);
