import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Memory", memorySchema);
