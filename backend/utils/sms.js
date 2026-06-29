import https from "https";

function getSmsConfig() {
  const {
    FAST2SMS_API_KEY,
    FAST2SMS_KEY,
    Fast2sms,
    SMS_API_KEY,
    FAST2SMS_ROUTE,
    FAST2SMS_SENDER_ID,
  } = process.env;

  const fast2smsKey = FAST2SMS_API_KEY || FAST2SMS_KEY || SMS_API_KEY || Fast2sms;
  if (fast2smsKey) {
    return {
      provider: "fast2sms",
      apiKey: fast2smsKey,
      route: FAST2SMS_ROUTE || "q",
      senderId: FAST2SMS_SENDER_ID || undefined,
    };
  }

  console.warn(
    "SMS provider not configured. Set FAST2SMS_API_KEY to enable SMS reminders."
  );
  return null;
}

function normalizeNumber(number) {
  if (!number) return null;
  const digits = number.toString().replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3);
  return digits;
}

function formatNumberForProvider(normalizedNumber) {
  if (!normalizedNumber) return null;
  return normalizedNumber;
}

async function sendViaFast2SMS({ apiKey, to, body, route, senderId }) {
  const payload = {
    message: body,
    language: "english",
    route: route || "q",
    numbers: to,
  };

  if (senderId) {
    payload.sender_id = senderId;
  }

  console.log("[Fast2SMS] sending", {
    to,
    body: body?.slice(0, 160),
    apiKey: apiKey ? `${apiKey.slice(0, 6)}...` : undefined,
    route: payload.route,
    sender_id: senderId,
  });

  const dataString = JSON.stringify(payload);

  return new Promise((resolve) => {
    const options = {
      hostname: "www.fast2sms.com",
      port: 443,
      path: "/dev/bulkV2",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: apiKey,
        "Content-Length": Buffer.byteLength(dataString),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data || "{}");
        } catch (err) {
          return resolve({ sent: false, error: `Fast2SMS parse error: ${err.message} - ${data}` });
        }

        if (parsed.return === true || parsed.success === true) {
          return resolve({ sent: true, response: parsed });
        }
        return resolve({
          sent: false,
          error: parsed.message || parsed.error || JSON.stringify(parsed),
          response: parsed,
        });
      });
    });

    req.on("error", (err) => resolve({ sent: false, error: err.message }));
    req.write(dataString);
    req.end();
  });
}

async function sendSMS({ to, body }) {
  const config = getSmsConfig();
  if (!config) return { skipped: true, error: "SMS provider not configured" };
  if (!to || !body) return { skipped: true, error: "Missing to or body" };

  const normalizedTo = normalizeNumber(to);
  if (!normalizedTo) return { sent: false, error: "Unable to normalize destination number" };
  const formattedTo = formatNumberForProvider(normalizedTo);

  return sendViaFast2SMS({ apiKey: config.apiKey, to: formattedTo, body, route: config.route, senderId: config.senderId });
}

export { sendSMS };
