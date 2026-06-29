import express from "express";
const router = express.Router();
import { sendTestSMS, generateTestAssistant } from "../controllers/testController.js";

// POST /api/test/sms
router.post("/sms", sendTestSMS);

// POST /api/test/cohere - unauthenticated quick test for Cohere assistant
router.post("/cohere", generateTestAssistant);

export default router;
