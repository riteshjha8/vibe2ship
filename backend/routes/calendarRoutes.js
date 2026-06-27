import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/calendarController.js";

router.use(protect);
router.get("/export", ctrl.exportCalendar);
router.get("/month", ctrl.getMonthView);

export default router;
