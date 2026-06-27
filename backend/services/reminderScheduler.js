import cron from "node-cron";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { sendMail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import { contextualReminderMessage } from "../utils/cohere.js";
import { describeTimeLeft } from "../utils/timezone.js";
import { emitToUser } from "../sockets/index.js";

const THRESHOLD_META = {
  "24h": { key: "24h", ms: 24 * 60 * 60 * 1000, label: "24 hours", urgency: "planning reminder: still plenty of time but don't wait too long" },
  "5h": { key: "5h", ms: 5 * 60 * 60 * 1000, label: "5 hours", urgency: "midday progress reminder: the clock is moving" },
  "1h": { key: "1h", ms: 60 * 60 * 1000, label: "1 hour", urgency: "elevated urgency, time is getting short" },
  "30m": { key: "30m", ms: 30 * 60 * 1000, label: "30 minutes", urgency: "the deadline is very near, finalize your focus" },
  "5m": { key: "5m", ms: 5 * 60 * 1000, label: "5 minutes", urgency: "final push reminder, last chance to wrap this up" },
  "1m": { key: "1m", ms: 1 * 60 * 1000, label: "1 minute", urgency: "immediate alert, this is the last possible moment" },
};

const DEFAULT_THRESHOLDS = ["24h", "5h", "1h", "30m", "5m", "1m"];
const CUSTOM_THRESHOLD_PATTERN = /^(\d+)([dhm])$/;

function parseThresholdKey(key) {
  const normalized = String(key).trim().toLowerCase();
  if (THRESHOLD_META[normalized]) return THRESHOLD_META[normalized];

  const match = normalized.match(CUSTOM_THRESHOLD_PATTERN);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!amount || amount <= 0) return null;

  let ms;
  let label;
  if (unit === "d") {
    ms = amount * 24 * 60 * 60 * 1000;
    label = `${amount} day${amount === 1 ? "" : "s"}`;
  } else if (unit === "h") {
    ms = amount * 60 * 60 * 1000;
    label = `${amount} hour${amount === 1 ? "" : "s"}`;
  } else if (unit === "m") {
    ms = amount * 60 * 1000;
    label = `${amount} minute${amount === 1 ? "" : "s"}`;
  }

  return {
    key: normalized,
    ms,
    label,
    urgency: `Reminder set ${label} before deadline`,
  };
}

function taskThresholds(task) {
  const keys = Array.isArray(task.reminderThresholds) && task.reminderThresholds.length ? task.reminderThresholds : DEFAULT_THRESHOLDS;
  return keys
    .map((key) => parseThresholdKey(key))
    .filter(Boolean)
    .sort((a, b) => b.ms - a.ms);
}

function fallbackMessage(title, label) {
  return `Heads up: "${title}" is due in ${label}. Time to act now.`;
}

async function fireReminder(io, task, user, threshold) {
  const timeLeft = describeTimeLeft(task.deadline, user.timezone);
  const label = threshold.label || threshold.key;

  let message = await contextualReminderMessage({ title: task.title, timeLeftLabel: label, urgency: threshold.urgency });
  if (!message) message = fallbackMessage(task.title, label);

  const payload = {
    taskId: task._id,
    title: task.title,
    ringType: threshold.key, // "day" | "hour" | "lastCall" -> frontend decides how loud/urgent the voice ring is
    message,
    deadline: task.deadline,
    timeLeft,
  };

  let emailSent = false;
  let smsSent = false;
  let emailError = null;
  let smsError = null;

  if (user.email) {
    const urgentColor = threshold.key === "1m" || threshold.key === "5m" ? "#EF4444" : threshold.key === "30m" || threshold.key === "1h" ? "#F59E0B" : "#14B8A6";
    const mailResult = await sendMail({
      to: user.email,
      subject: `Reminder: "${task.title}" is due in ${threshold.label}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 16px;">
          <h2 style="color:${urgentColor};">${message}</h2>
          <p>Deadline: ${new Date(task.deadline).toLocaleString("en-US", { timeZone: user.timezone })} (${user.timezone})</p>
          <p style="color:#64748b;">Sent by Vibe2Ship - The Last-Minute Life Saver</p>
        </div>
      `,
    });
    emailSent = !!mailResult.sent;
    if (mailResult.error) {
      emailError = mailResult.error;
    }
  }

  if (task.notifyBySMS && task.smsNumber) {
    console.log("[Reminder Scheduler] sending SMS reminder", {
      taskId: task._id.toString(),
      to: task.smsNumber,
      threshold: threshold.key,
    });
    const smsResult = await sendSMS({
      to: task.smsNumber,
      body: `${message}\nDue: ${new Date(task.deadline).toLocaleString("en-US", { timeZone: user.timezone })} (${user.timezone})`,
    });
    console.log("[Reminder Scheduler] SMS result", { taskId: task._id.toString(), smsResult });
    smsSent = !!smsResult.sent;
    if (smsResult.error) {
      smsError = smsResult.error;
    }
  }

  emitToUser(io, task.user, "task:reminder", { ...payload, emailSent, smsSent, emailError, smsError });
}

async function fireCustomAlert(io, task, user, customAlert, alertIndex) {
  // Custom alarm set to ring at a specific user-chosen time
  const alarmTime = new Date(customAlert.alarmTime).toLocaleString("en-US", { timeZone: user.timezone });
  const message = `🔔 ALARM: "${task.title}" - Your custom alarm is ringing!`;

  const payload = {
    taskId: task._id,
    title: task.title,
    ringType: customAlert.alarmType || "medium", // "soft" | "medium" | "loud"
    message,
    deadline: task.deadline,
    alarmTime: customAlert.alarmTime,
    isCustomAlert: true,
  };

  let emailSent = false;
  let smsSent = false;
  let emailError = null;
  let smsError = null;

  if (user.email) {
    const mailResult = await sendMail({
      to: user.email,
      subject: `🔔 ALARM: "${task.title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 16px; background: linear-gradient(to right, #8B5CF6, #EC4899);">
          <h2 style="color: white; font-size: 24px;">🔔 CUSTOM ALARM!</h2>
          <p style="color: white; font-size: 18px;"><strong>${task.title}</strong></p>
          <p style="color: white;">Set for: <strong>${alarmTime}</strong></p>
          <p style="color: white;">Intensity: <strong>${customAlert.alarmType}</strong></p>
          <p style="color: #E0E7FF;">Act now!</p>
        </div>
      `,
    });
    emailSent = !!mailResult.sent;
    if (mailResult.error) emailError = mailResult.error;
  }

  if (customAlert.notifyBySMS && customAlert.smsNumber) {
    const smsResult = await sendSMS({
      to: customAlert.smsNumber,
      body: `🔔 ALARM: "${task.title}" is set to ring now! Intensity: ${customAlert.alarmType}`,
    });
    smsSent = !!smsResult.sent;
    if (smsResult.error) smsError = smsResult.error;
  }

  // Mark this alert as rung (update will be saved by the scheduler)
  task.customAlerts[alertIndex].hasRung = true;
  task.customAlerts[alertIndex].ringedAt = new Date();

  emitToUser(io, task.user, "task:customalarm", { ...payload, emailSent, smsSent, emailError, smsError });
}

function startReminderScheduler(io) {
  // Runs every minute. Each threshold fires exactly once per task because we
  // flip a remindersSent flag the moment it fires - safe even if the server
  // restarts or a tick is missed, since it just checks "time left <= threshold".
  cron.schedule("* * * * *", async () => {
    const now = Date.now();
    try {
      const tasks = await Task.find({
        status: { $ne: "done" },
        deadline: { $gt: new Date(now - 10 * 60 * 1000) }, // ignore tasks overdue by >10 min
      }).populate("user");

      for (const task of tasks) {
        if (!task.user) continue;
        const msLeft = new Date(task.deadline).getTime() - now;
        const thresholds = taskThresholds(task);
        const previousMsLeft = msLeft + 70 * 1000; // account for the minute-level scheduler and small drift

        // Check threshold-based reminders. If the scheduler missed the exact tick, fire when the
        // current window has crossed the threshold but the deadline has not passed.
        for (const threshold of thresholds) {
          const alreadySent = task.remindersSent?.get?.(threshold.key) || task.remindersSent?.[threshold.key];
          if (
            !alreadySent &&
            msLeft > 0 &&
            msLeft <= threshold.ms &&
            previousMsLeft > threshold.ms
          ) {
            task.remindersSent = task.remindersSent || {};
            task.remindersSent[threshold.key] = true;
            await fireReminder(io, task, task.user, threshold);
          }
        }

        // Check custom alerts (specific times set by user)
        if (Array.isArray(task.customAlerts) && task.customAlerts.length > 0) {
          for (let idx = 0; idx < task.customAlerts.length; idx++) {
            const customAlert = task.customAlerts[idx];
            if (!customAlert || customAlert.hasRung) continue;

            try {
              const alarmMs = new Date(customAlert.alarmTime).getTime();
              if (Number.isNaN(alarmMs)) {
                console.warn(
                  `[Reminder Scheduler] invalid custom alert time for task ${task._id}, alertIndex=${idx}`
                );
                continue;
              }
              const isWithinWindow = Math.abs(alarmMs - now) <= 60 * 1000;
              if (isWithinWindow) {
                console.log(
                  `[Reminder Scheduler] firing custom alert`,
                  { taskId: task._id.toString(), alertIndex: idx, alarmTime: customAlert.alarmTime }
                );
                await fireCustomAlert(io, task, task.user, customAlert, idx);
              }
            } catch (err) {
              console.error(
                `Error firing custom alert for task ${task._id} alertIndex=${idx}:`,
                err.message || err
              );
            }
          }
        }

        await task.save();
      }
    } catch (err) {
      console.warn("Reminder scheduler skipped because MongoDB is unavailable:", err.message || err);
    }
  });

  console.log("Reminder scheduler started (checks every minute for 24h, 5h, 1h, 30m, 5m, and 1m thresholds).");
}

export { startReminderScheduler };
