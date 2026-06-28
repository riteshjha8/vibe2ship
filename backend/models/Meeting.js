import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["zoom", "google", "teams", "other"], default: "other" },
    label: { type: String, default: "" },
    meetingUrl: { type: String, default: "" },
    meetingIdEncrypted: { type: String, default: "" },
    meetingPasswordEncrypted: { type: String, default: "" },
    autoJoin: { type: Boolean, default: false },
    joinBeforeMinutes: { type: Number, default: 5 },
    scheduledAt: { type: Date, default: null },
    remindersSent: { type: Map, of: Boolean, default: {} },
    timezone: { type: String, default: "UTC" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// `user` already indexed on the field; keep schema indexes minimal

export default mongoose.model("Meeting", meetingSchema);
