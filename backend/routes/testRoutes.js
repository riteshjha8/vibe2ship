import express from "express";
const router = express.Router();
import { sendTestSMS } from "../controllers/testController.js";

// POST /api/test/sms
router.post("/sms", sendTestSMS);

export default router;
