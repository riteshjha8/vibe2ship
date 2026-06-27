import mongoose from "mongoose";

const aiInsightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("AIInsight", aiInsightSchema);
