import express from "express";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import * as ctrl from "../controllers/integrationController.js";
import * as oauthCtrl from "../controllers/oauthController.js";

router.get("/oauth/callback", oauthCtrl.handleOAuthCallback);
router.use(protect);
router.get("/oauth/start", oauthCtrl.startOAuth);
router.get("/", ctrl.getIntegrationStatus);
router.post("/connect", ctrl.connectIntegration);
router.post("/disconnect", ctrl.disconnectIntegration);

export default router;
