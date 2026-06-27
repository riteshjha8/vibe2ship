import mongoose from "mongoose";

const conversationSummarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true, index: true },
    summary: { type: String, default: "" },
    source: { type: String, default: "chat" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("ConversationSummary", conversationSummarySchema);
