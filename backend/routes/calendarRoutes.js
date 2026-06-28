import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/calendarController.js";

router.use(protect);
router.get("/month", ctrl.getMonthView);
router.get("/events", ctrl.listEvents);
router.post("/events", ctrl.createEvent);
router.delete("/events/:id", ctrl.deleteEvent);

export default router;
