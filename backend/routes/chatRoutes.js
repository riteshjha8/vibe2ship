import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/chatController.js";

router.use(protect);
router.get("/sessions", ctrl.listChatSessions);
router.post("/sessions", ctrl.createChatSession);
router.get("/sessions/:sessionId/messages", ctrl.getSessionMessages);
router.post("/sessions/:sessionId/messages", ctrl.postChatMessage);
router.get("/sessions/:sessionId/summary", ctrl.summarizeChatSession);
router.get("/memories", ctrl.listMemories);
router.post("/memories", ctrl.addMemory);
router.get("/insights", ctrl.listInsights);
router.post("/insights", ctrl.addInsight);

export default router;
