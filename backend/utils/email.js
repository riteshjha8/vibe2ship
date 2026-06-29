import nodemailer from "nodemailer";

let transporter = null;

function buildTransportOptions() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE.toLowerCase() === "true" : port === 465;
  const service = process.env.EMAIL_SERVICE;

  const base = {
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  if (host) {
    return {
      host,
      port: port || 465,
      secure: secure ?? true,
      ...base,
      tls: {
        rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED?.toLowerCase() !== "false",
      },
    };
  }

  if (service) {
    return {
      service,
      secure: secure ?? true,
      ...base,
    };
  }

  return {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    ...base,
  };
}

async function getTransporter() {
  if (transporter) return transporter;

  const transportOptions = buildTransportOptions();
  if (!transportOptions) {
    console.warn("EMAIL_USER and EMAIL_PASS/EMAIL_APP_PASSWORD are required for email sending. Email reminders disabled.");
    return null;
  }

  transporter = nodemailer.createTransport(transportOptions);
  transporter.verify().then(
    () => console.debug("Email transporter verified."),
    (err) => console.warn("Email transporter verification failed:", err.message || err)
  );
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = await getTransporter();
  if (!t) return { skipped: true, error: "Email transporter unavailable" };
  try {
    await t.sendMail({
      from: `"Vibe2Ship - Last-Minute Life Saver" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("Email send failed:", err.message || err);
    return { sent: false, error: err.message || String(err) };
  }
}

export { sendMail };
