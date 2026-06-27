import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/habitController.js";

router.use(protect);
router.post("/", ctrl.createHabit);
router.get("/", ctrl.getHabits);
router.post("/:id/checkin", ctrl.checkInHabit);
router.delete("/:id", ctrl.deleteHabit);

export default router;
