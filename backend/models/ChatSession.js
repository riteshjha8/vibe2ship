import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "AI Assistant" },
    pinned: { type: Boolean, default: false },
    lastMessage: { type: String, default: "" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);
