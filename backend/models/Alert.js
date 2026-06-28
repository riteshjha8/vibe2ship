import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }, // optional: link to a task
    title: { type: String, required: true, trim: true }, // e.g., "Meeting at 3 PM"
    alarmTime: { type: Date, required: true }, // specific time alarm should ring
    timezone: { type: String, default: "Asia/Kolkata" }, // user's timezone
    alarmType: { type: String, enum: ["soft", "medium", "loud"], default: "medium" }, // how loud the alarm rings
    notifyBySMS: { type: Boolean, default: false }, // send SMS reminder too
    smsNumber: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
    hasRung: { type: Boolean, default: false }, // track if alarm already fired
    ringedAt: { type: Date }, // timestamp when alarm actually rang
  },
  { timestamps: true }
);

// Index for efficient querying of active alarms
// `user` field is already indexed via `index: true` on the schema field.
alertSchema.index({ alarmTime: 1, active: 1 });

export default mongoose.model("Alert", alertSchema);
