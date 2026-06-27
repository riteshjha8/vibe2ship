import querystring from "querystring";
import axios from "axios";
import User from "../models/User.js";

function normalizeType(type) {
  return String(type || "").toLowerCase();
}

const OAUTH_CONFIG = {
  gmail: {
    label: "Gmail",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: ["openid", "profile", "email", "https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar.events"].join(" "),
    authorizeParams: { access_type: "offline", prompt: "consent" },
  },
  outlook: {
    label: "Outlook",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: ["openid", "offline_access", "profile", "email", "https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/Calendars.ReadWrite"].join(" "),
  },
  github: {
    label: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: ["repo", "read:user", "user:email"].join(" "),
  },
  whatsapp: {
    label: "WhatsApp",
    authorizeUrl: "https://graph.facebook.com/v16.0/oauth/authorize",
    tokenUrl: "https://graph.facebook.com/v16.0/oauth/access_token",
    scope: ["whatsapp_business_management", "whatsapp_business_messaging", "email"].join(" "),
  },
};

function buildRedirectUrl(req, type) {
  const provider = OAUTH_CONFIG[type];
  if (!provider) return null;
  const redirectUri = `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/integrations/oauth/callback`;
  const params = {
    client_id: process.env[`OAUTH_${type.toUpperCase()}_CLIENT_ID`],
    redirect_uri: redirectUri,
    response_type: "code",
    scope: provider.scope,
    state: `${req.userId}:${type}`,
    ...provider.authorizeParams,
  };

  if (type === "github") {
    params.allow_signup = "true";
  }

  return `${provider.authorizeUrl}?${querystring.stringify(params)}`;
}

async function startOAuth(req, res) {
  const type = normalizeType(req.query.type);
  if (!type || !OAUTH_CONFIG[type]) {
    return res.status(400).json({ message: "Unsupported OAuth provider." });
  }

  const redirectUrl = buildRedirectUrl(req, type);
  if (!redirectUrl) {
    return res.status(500).json({ message: "OAuth configuration is incomplete." });
  }

  // Redirect the browser directly to the provider's authorization URL so
  // clicking "Connect" lands the user on the provider page immediately.
  return res.redirect(redirectUrl);
}

async function exchangeCode(code, type, redirectUri) {
  const provider = OAUTH_CONFIG[type];
  if (!provider) throw new Error("Unsupported OAuth provider.");

  const tokenParams = {
    client_id: process.env[`OAUTH_${type.toUpperCase()}_CLIENT_ID`],
    client_secret: process.env[`OAUTH_${type.toUpperCase()}_CLIENT_SECRET`],
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  const headers = { Accept: "application/json" };
  const response = await axios.post(provider.tokenUrl, querystring.stringify(tokenParams), { headers });
  return response.data;
}

async function handleOAuthCallback(req, res) {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).json({ message: "Missing OAuth callback parameters." });
  }

  const [userId, type] = String(state).split(":");
  if (!userId || !type || !OAUTH_CONFIG[type]) {
    return res.status(400).json({ message: "Invalid OAuth state." });
  }

  const redirectUri = `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/integrations/oauth/callback`;
  let tokenData;
  try {
    tokenData = await exchangeCode(code, type, redirectUri);
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const redirectQuery = new URLSearchParams({ provider: type || "unknown", status: "error", error: "exchange_failed" });
    return res.redirect(`${clientUrl}/integrations?${redirectQuery.toString()}`);
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  user.integrations = user.integrations || {};
  user.integrations[type] = {
    connected: true,
    account: type === "github" ? tokenData.scope || "GitHub user" : tokenData.id_token || tokenData.user_id || type,
    linkedAt: new Date(),
    oauth: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresIn: tokenData.expires_in || null,
      tokenType: tokenData.token_type || "Bearer",
      scope: tokenData.scope || OAUTH_CONFIG[type].scope,
      raw: tokenData,
    },
  };

  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const redirectQuery = new URLSearchParams({ provider: type, status: "connected" });
  res.redirect(`${clientUrl}/integrations?${redirectQuery.toString()}`);
}

function buildStatus(user, type) {
  const current = user.integrations && user.integrations[type] ? user.integrations[type] : {};
  return {
    type,
    label: OAUTH_CONFIG[type]?.label || type,
    connected: !!current.connected,
    account: current.account || "",
    linkedAt: current.linkedAt || null,
  };
}

export { startOAuth, handleOAuthCallback };
