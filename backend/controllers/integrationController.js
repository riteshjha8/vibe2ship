import User from "../models/User.js";

const AVAILABLE_CONNECTORS = [
  { type: "gmail", label: "Gmail", oauth: true, landingUrl: "https://mail.google.com" },
  { type: "outlook", label: "Outlook", oauth: true, landingUrl: "https://outlook.live.com" },
  { type: "github", label: "GitHub", oauth: true, landingUrl: "https://github.com" },
  { type: "vscode", label: "VS Code", oauth: false, landingUrl: "https://vscode.dev", appProtocol: "vscode://" },
  { type: "discord", label: "Discord", oauth: false, landingUrl: "https://discord.com/app", appProtocol: "discord://" },
  { type: "whatsapp", label: "WhatsApp", oauth: true, landingUrl: "https://web.whatsapp.com", appProtocol: "whatsapp://send" },
  { type: "google-meet", label: "Google Meet", oauth: false, landingUrl: "https://meet.google.com", appProtocol: "https://meet.google.com" },
  { type: "google-drive", label: "Google Drive", oauth: false, landingUrl: "https://drive.google.com" },
  { type: "one-drive", label: "OneDrive", oauth: false, landingUrl: "https://onedrive.live.com" },
  { type: "zoom", label: "Zoom", oauth: false, landingUrl: "https://zoom.us", appProtocol: "zoommtg://" },
  { type: "teams", label: "Microsoft Teams", oauth: false, landingUrl: "https://teams.microsoft.com", appProtocol: "msteams://" },
];

function normalizeType(type) {
  return String(type || "").toLowerCase();
}

function buildStatus(user, type) {
  const current = user.integrations && user.integrations[type] ? user.integrations[type] : {};
  return {
    type,
    label: AVAILABLE_CONNECTORS.find((item) => item.type === type)?.label || type,
    oauth: AVAILABLE_CONNECTORS.find((item) => item.type === type)?.oauth || false,
    landingUrl: AVAILABLE_CONNECTORS.find((item) => item.type === type)?.landingUrl || null,
    appProtocol: AVAILABLE_CONNECTORS.find((item) => item.type === type)?.appProtocol || null,
    connected: !!current.connected,
    account: current.account || "",
    linkedAt: current.linkedAt || null,
    payment: current.payment || null,
  };
}

async function getIntegrationStatus(req, res) {
  const user = await User.findById(req.userId);
  const statuses = AVAILABLE_CONNECTORS.map((connector) => buildStatus(user, connector.type));
  res.json({ integrations: statuses });
}

async function connectIntegration(req, res) {
  const { type, account } = req.body;
  const connectorType = normalizeType(type);
  if (!connectorType) return res.status(400).json({ message: "Integration type is required." });
  const connector = AVAILABLE_CONNECTORS.find((item) => item.type === connectorType);
  if (!connector) {
    return res.status(400).json({ message: "Unsupported integration type." });
  }

  if (connector.oauth) {
    // If a landingUrl is configured, prefer sending the client there directly
    if (connector.landingUrl) {
      // For simple landing connectors (no full OAuth flow), just tell the client to open the landing URL.
      // Do not modify the user's integrations so the UI continues to show the actual connected state.
      return res.json({ landing: true, landingUrl: connector.landingUrl });
    }

    const redirectUrl = `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/integrations/oauth/start?type=${connectorType}`;
    return res.json({ oauth: true, provider: connectorType, redirectUrl });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  user.integrations = user.integrations || {};
  user.integrations[connectorType] = {
    connected: !connector.payment,
    account: connector.payment ? "" : String(account || connectorType).trim(),
    linkedAt: connector.payment ? null : new Date(),
    payment: connector.payment ? {
      setupUrl: getPaymentSetupUrl(connectorType),
      instructions: getPaymentInstructions(connectorType),
      status: "setup_required",
    } : null,
  };

  await user.save();

  const statuses = AVAILABLE_CONNECTORS.map((connector) => buildStatus(user, connector.type));
  res.json({
    message: connector.payment ? `${connector.label} setup started.` : `${connectorType} connected.`,
    integration: buildStatus(user, connectorType),
    integrations: statuses,
    payment: user.integrations[connectorType].payment,
  });
}

async function disconnectIntegration(req, res) {
  const { type } = req.body;
  const connectorType = normalizeType(type);
  if (!connectorType) return res.status(400).json({ message: "Integration type is required." });
  if (!AVAILABLE_CONNECTORS.some((item) => item.type === connectorType)) {
    return res.status(400).json({ message: "Unsupported integration type." });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  user.integrations = user.integrations || {};
  user.integrations[connectorType] = {
    connected: false,
    account: "",
    linkedAt: null,
    oauth: null,
    payment: null,
  };
  await user.save();

  const statuses = AVAILABLE_CONNECTORS.map((connector) => buildStatus(user, connector.type));
  res.json({ message: `${connectorType} disconnected.`, integration: buildStatus(user, connectorType), integrations: statuses });
}

function getPaymentSetupUrl(type) {
  const dashboardBase = process.env.PAYMENT_DASHBOARD_URL || "https://dashboard.example.com";
  switch (type) {
    case "stripe":
      return `${dashboardBase}/stripe/connect`;
    case "paypal":
      return `${dashboardBase}/paypal/connect`;
    case "upigpay":
      return `${dashboardBase}/upigpay/connect`;
    default:
      return dashboardBase;
  }
}

function getPaymentInstructions(type) {
  switch (type) {
    case "stripe":
      return "Finish your Stripe onboarding in the payments dashboard, then paste your live/test keys into the Vibe2Ship payment settings.";
    case "paypal":
      return "Authorize PayPal and set up webhook callbacks so payments can be tied to your workflow reminders.";
    case "upigpay":
      return "Connect a UPI ID or Google Pay account so Vibe2Ship can suggest pay-by reminders and invoice tracking.";
    default:
      return "Follow the provider integration steps to complete setup.";
  }
}

export { getIntegrationStatus, connectIntegration, disconnectIntegration };