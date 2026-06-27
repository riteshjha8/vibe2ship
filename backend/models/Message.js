import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], default: "user" },
    content: { type: String, default: "" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
