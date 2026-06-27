import express from "express";
import { protect } from "../middleware/auth.js";
import * as alertController from "../controllers/alertController.js";

const router = express.Router();

// All alert routes require authentication
router.use(protect);

// Add a custom alarm to a task
router.post("/", alertController.addCustomAlert);

// Get all custom alarms for a specific task
router.get("/:taskId", alertController.getTaskAlerts);

// Update a custom alarm
router.put("/:taskId", alertController.updateCustomAlert);

// Delete a custom alarm
router.delete("/:taskId", alertController.deleteCustomAlert);

// Send SMS immediately (optionally persist alert)
router.post("/send", alertController.sendSmsNow);

export default router;
