import { sendSMS } from "../utils/sms.js";

async function sendTestSMS(req, res) {
  try {
    const { to, message } = req.body;
    console.log("[sendTestSMS] request body", { to, message });
    if (!to || !message) return res.status(400).json({ error: "Provide 'to' and 'message' in JSON body" });

    const result = await sendSMS({ to, body: message });
    console.log("[sendTestSMS] result", result);
    return res.json({ result });
  } catch (err) {
    console.error("sendTestSMS error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}

export { sendTestSMS };
