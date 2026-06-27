import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/goalController.js";

router.use(protect);
router.post("/", ctrl.createGoal);
router.get("/", ctrl.getGoals);
router.put("/:id", ctrl.updateGoal);
router.delete("/:id", ctrl.deleteGoal);

export default router;
