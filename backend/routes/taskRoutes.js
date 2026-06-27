import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/taskController.js";

router.use(protect);
router.post("/", ctrl.createTask);
router.get("/", ctrl.getTasks);
router.get("/:id", ctrl.getTask);
router.put("/:id", ctrl.updateTask);
router.delete("/:id", ctrl.deleteTask);
router.patch("/:id/subtasks/:subtaskId", ctrl.toggleSubtask);
router.post("/:id/plan", ctrl.planTask);

export default router;
