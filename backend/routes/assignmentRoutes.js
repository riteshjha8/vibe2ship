import express from "express";
import { uploadAssignment, listAssignments, deleteAssignment } from "../controllers/assignmentController.js";
import { protect as requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/assignments -> create a submission reminder { title, link, scheduledAt }
router.post("/", requireAuth, uploadAssignment);
router.get("/", requireAuth, listAssignments);
router.delete("/:id", requireAuth, deleteAssignment);

export default router;
