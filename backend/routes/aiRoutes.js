import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/aiController.js";

router.use(protect);
router.get("/recommendations", ctrl.getRecommendations);
router.get("/rescue-plan", ctrl.getRescuePlan);
router.get("/habit-suggestions", ctrl.getHabitSuggestions);
router.get("/summary", ctrl.getSummary);
router.get("/search", ctrl.searchKnowledgeGraph);
router.post("/voice-command", ctrl.handleVoiceCommand);
router.get("/career-finance-summary", ctrl.getCareerFinanceSummary);
router.get("/productivity-report", ctrl.getProductivityReport);

export default router;
