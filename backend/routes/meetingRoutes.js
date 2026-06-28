import express from "express";
import { protect } from "../middleware/auth.js";
import { createMeeting, listMeetings, getMeeting, updateMeeting, deleteMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.use(protect);

router.post("/", createMeeting);
router.get("/", listMeetings);
router.get("/:id", getMeeting);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

export default router;
