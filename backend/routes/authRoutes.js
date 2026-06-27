import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/authController.js";

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", protect, ctrl.logout);
router.get("/me", protect, ctrl.me);
router.put("/me", protect, ctrl.updateProfile);

export default router;
