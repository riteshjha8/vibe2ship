import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Submission" },
    link: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    remindersSent: { type: Object, default: {} },
  },
  { timestamps: true }
);

assignmentSchema.index({ scheduledAt: 1 });

export default mongoose.model("Assignment", assignmentSchema);
