import cron from "node-cron";
import Task from "../models/Task.js";
import Habit from "../models/Habit.js";
import Goal from "../models/Goal.js";
import User from "../models/User.js";
import { sendMail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";
import { contextualReminderMessage } from "../utils/cohere.js";
import { describeTimeLeft } from "../utils/timezone.js";
import { emitToUser } from "../sockets/index.js";
import { decryptText } from "../utils/crypto.js";
import Meeting from "../models/Meeting.js";
import Assignment from "../models/Assignment.js";
import { buildMeetingJoinUrl, shouldAutoJoinMeeting } from "../utils/meetingLinks.js";
import { submitAssignmentToGoogleClassroom } from "../services/googleClassroom.js";

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

function isMongooseMap(value) {
  return value && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
}

function getThresholdSent(container, key) {
  if (!container || !key) return false;
  return isMongooseMap(container) ? !!container.get(key) : !!container[key];
}

function markThresholdSent(container, key) {
  if (!container || !key) return;
  if (isMongooseMap(container)) {
    container.set(key, true);
    return;
  }
  container[key] = true;
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

function buildReminderActions(task) {
  const title = String(task.title || "").toLowerCase();
  const description = String(task.description || "").toLowerCase();
  const actions = [];

  const addAction = (action) => {
    if (!action) return;
    actions.push(action);
  };

  if (/assignment|submission|report|paper|essay|homework|lab/i.test(title) || /assignment|submission|report|paper|essay|homework|lab/i.test(description)) {
    addAction({ id: "continue-work", label: "Continue work", kind: "navigate", href: "/tasks" });
    addAction({ id: "mark-complete", label: "Mark complete", kind: "mark_complete" });
  } else if (/meeting|call|zoom|teams|interview|webinar/i.test(title) || /meeting|call|zoom|teams|interview|webinar/i.test(description)) {
    addAction({ id: "join-meeting", label: "Join meeting", kind: "open_url", href: "https://meet.google.com/" });
    addAction({ id: "open-task", label: "Open task", kind: "navigate", href: "/tasks" });
  } else if (/email|reply|message|draft|professor|client/i.test(title) || /email|reply|message|draft|professor|client/i.test(description)) {
    addAction({ id: "open-draft", label: "Open draft", kind: "navigate", href: "/tasks" });
    addAction({ id: "ai-reply", label: "AI reply", kind: "navigate", href: "/tasks" });
  } else if (/study|learn|lecture|revision|exam|quiz|chapter/i.test(title) || /study|learn|lecture|revision|exam|quiz|chapter/i.test(description)) {
    addAction({ id: "resume-study", label: "Resume study", kind: "navigate", href: "/tasks" });
    addAction({ id: "mark-complete", label: "Mark complete", kind: "mark_complete" });
  } else if (/code|coding|project|github|vscode|debug|build|api/i.test(title) || /code|coding|project|github|vscode|debug|build|api/i.test(description)) {
    addAction({ id: "open-work", label: "Open work", kind: "navigate", href: "/tasks" });
    addAction({ id: "mark-complete", label: "Mark complete", kind: "mark_complete" });
  } else if (/medicine|pill|tablet|dose|take/i.test(title) || /medicine|pill|tablet|dose|take/i.test(description)) {
    addAction({ id: "taken", label: "Taken", kind: "mark_complete" });
    addAction({ id: "snooze", label: "Snooze 15 min", kind: "dismiss" });
  } else if (/shop|grocery|groceries|buy|market/i.test(title) || /shop|grocery|groceries|buy|market/i.test(description)) {
    addAction({ id: "open-list", label: "Open list", kind: "navigate", href: "/tasks" });
    addAction({ id: "mark-complete", label: "Mark complete", kind: "mark_complete" });
  } else if (/gym|workout|run|exercise|fit/i.test(title) || /gym|workout|run|exercise|fit/i.test(description)) {
    addAction({ id: "start-workout", label: "Start workout", kind: "navigate", href: "/tasks" });
    addAction({ id: "delay", label: "Delay 30 min", kind: "dismiss" });
  } else {
    addAction({ id: "open-task", label: "Open task", kind: "navigate", href: "/tasks" });
    addAction({ id: "mark-complete", label: "Mark complete", kind: "mark_complete" });
  }

  if (task.location) {
    addAction({ id: "open-map", label: "Open map", kind: "open_map", query: task.location });
  }

  return actions.slice(0, 3);
}

function buildReminderSuggestion(task) {
  const remainingSteps = Array.isArray(task.subtasks)
    ? task.subtasks.filter((subtask) => !subtask.done).slice(0, 3).map((subtask) => subtask.title)
    : [];

  if (remainingSteps.length) {
    return {
      suggestedAction: `Continue with: ${remainingSteps[0]}`,
      steps: remainingSteps,
    };
  }

  return {
    suggestedAction: "Start with the next small step and keep momentum going.",
    steps: [],
  };
}

async function fireMeetingReminder(io, meeting, user, threshold) {
  const title = meeting.label || "Meeting";
  const timeLeft = describeTimeLeft(meeting.scheduledAt, user.timezone);
  const label = threshold.label || threshold.key;
  const message = `Reminder: Your meeting "${title}" starts in ${label}.`;

  let actionPlan = [];
  try {
    let meetingId = "";
    let meetingPassword = "";
    if (meeting.meetingIdEncrypted) {
      meetingId = decryptText(meeting.meetingIdEncrypted);
    }
    if (meeting.meetingPasswordEncrypted) {
      meetingPassword = decryptText(meeting.meetingPasswordEncrypted);
    }
    const joinHref = buildMeetingJoinUrl(meeting, meetingId, meetingPassword);
    if (joinHref) {
      actionPlan.push({ id: "join-meeting", label: "Join meeting", kind: "open_url", href: joinHref });
    }
  } catch (err) {
    console.error("Error resolving meeting reminder for meeting", meeting._id, err);
  }

  if (!actionPlan.length) {
    actionPlan.push({ id: "open-meeting", label: "Open meeting", kind: "navigate", href: "/meetings" });
  }

  const deadline = meeting.scheduledAt ? new Date(meeting.scheduledAt).getTime() : null;
  const now = Date.now();
  const msLeft = deadline && Number.isFinite(deadline) ? deadline - now : null;
  const payload = {
    kind: "meeting",
    taskId: meeting._id,
    title,
    ringType: threshold.key,
    message,
    deadline: meeting.scheduledAt,
    timeLeft,
    actions: actionPlan,
    recommendedAction: "Open the meeting and join on time.",
    meeting: {
      id: meeting._id,
      autoJoin: !!meeting.autoJoin,
      joinBeforeMinutes: Number(meeting.joinBeforeMinutes) || 5,
      shouldAutoJoin: shouldAutoJoinMeeting(meeting, msLeft),
    },
  };

  let emailSent = false;
  let smsSent = false;
  let emailError = null;
  let smsError = null;

  if (user?.email && user.notificationPrefs?.email !== false) {
    const mailResult = await sendMail({
      to: user.email,
      subject: `Reminder: "${title}" starts in ${label}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 16px;">
          <h2 style="color:#0F766E;">${message}</h2>
          <p>Scheduled: ${new Date(meeting.scheduledAt).toLocaleString("en-US", { timeZone: user.timezone })} (${user.timezone})</p>
          <p style="color:#64748b;">Sent by Vibe2Ship - The Last-Minute Life Saver</p>
        </div>
      `,
    });
    emailSent = !!mailResult.sent;
    if (mailResult.error) emailError = mailResult.error;
  }

  if (user?.mobileNumber && user.notificationPrefs?.sms !== false) {
    const smsResult = await sendSMS({
      to: user.mobileNumber,
      body: `${message}\nScheduled: ${new Date(meeting.scheduledAt).toLocaleString("en-US", { timeZone: user.timezone })} (${user.timezone})`,
    });
    smsSent = !!smsResult.sent;
    if (smsResult.error) smsError = smsResult.error;
  }

  emitToUser(io, meeting.user, "task:reminder", { ...payload, emailSent, smsSent, emailError, smsError });
}

async function fireReminder(io, task, user, threshold) {
  const timeLeft = describeTimeLeft(task.deadline, user.timezone);
  const label = threshold.label || threshold.key;

  let message = await contextualReminderMessage({ title: task.title, timeLeftLabel: label, urgency: threshold.urgency });
  if (!message) message = fallbackMessage(task.title, label);

  let actionPlan = buildReminderActions(task);
  const suggestion = buildReminderSuggestion(task);

  // If this task references a saved meeting, attempt to resolve a join URL
  if (task.meeting) {
    try {
      const m = task.meeting; // populated by the query
      let meetingId = "";
      let meetingPassword = "";
      if (m.meetingIdEncrypted) {
        meetingId = decryptText(m.meetingIdEncrypted);
      }
      if (m.meetingPasswordEncrypted) {
        meetingPassword = decryptText(m.meetingPasswordEncrypted);
      }

      const joinHref = buildMeetingJoinUrl(m, meetingId, meetingPassword);
      if (joinHref) {
        const joinAction = { id: "join-meeting", label: "Join meeting", kind: "open_url", href: joinHref };
        const idx = actionPlan.findIndex((a) => a.id === "join-meeting" || (a.label && a.label.toLowerCase().includes("join")));
        if (idx >= 0) actionPlan[idx] = joinAction;
        else actionPlan.unshift(joinAction);
      }
    } catch (err) {
      console.error("Error resolving meeting for task", task._id, err);
    }
  }
  const payload = {
    taskId: task._id,
    title: task.title,
    ringType: threshold.key, // "day" | "hour" | "lastCall" -> frontend decides how loud/urgent the voice ring is
    message,
    deadline: task.deadline,
    timeLeft,
    actions: actionPlan,
    recommendedAction: suggestion.suggestedAction,
    remainingSteps: suggestion.steps,
  };

  // Include meeting metadata for the client; clients may attempt to auto-open the link
  if (task.meeting) {
    const deadline = task.deadline ? new Date(task.deadline).getTime() : null;
    const now = Date.now();
    const msLeft = deadline && Number.isFinite(deadline) ? deadline - now : null;
    payload.meeting = {
      id: task.meeting._id,
      autoJoin: !!task.meeting.autoJoin,
      joinBeforeMinutes: Number(task.meeting.joinBeforeMinutes) || 5,
      shouldAutoJoin: shouldAutoJoinMeeting(task.meeting, msLeft),
    };
  }

  let emailSent = false;
  let smsSent = false;
  let emailError = null;
  let smsError = null;
  // Only send external contact (email/SMS) once per task. Subsequent thresholds
  // will still emit in-app reminders but won't re-send email/SMS if already sent.
  const shouldSendContact = !task.remindersContactSent;

  if (user.email && shouldSendContact) {
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

  if (task.notifyBySMS && task.smsNumber && shouldSendContact) {
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

  // If we did send either email or SMS, mark the task so we don't resend later.
  if (emailSent || smsSent) {
    try {
      task.remindersContactSent = true;
    } catch (err) {
      // ignore
    }
  }

  emitToUser(io, task.user, "task:reminder", { ...payload, emailSent, smsSent, emailError, smsError });
}

async function sendMissedItemReminder(io, user, kind, item, reason) {
  const title = item?.title || "your item";
  const subject = kind === "habit"
    ? `Missed habit reminder: ${title}`
    : `Goal reminder: ${title}`;
  const body = kind === "habit"
    ? `You have not checked in on your habit "${title}" yet. A quick reset today can help you get back on track.`
    : `Your goal "${title}" needs attention. ${reason || "A small step today can help you recover momentum."}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 16px;">
      <h2 style="color:#0F766E;">${subject}</h2>
      <p>${body}</p>
      <p style="color:#64748b;">Sent by Vibe2Ship - The Last-Minute Life Saver</p>
    </div>
  `;

  let emailSent = false;
  let smsSent = false;
  let emailError = null;
  let smsError = null;

  if (user?.email && user.notificationPrefs?.email !== false) {
    const mailResult = await sendMail({ to: user.email, subject, html });
    emailSent = !!mailResult.sent;
    if (mailResult.error) emailError = mailResult.error;
  }

  if (user?.mobileNumber && user.notificationPrefs?.sms !== false) {
    const smsResult = await sendSMS({
      to: user.mobileNumber,
      body: `${subject}\n${body}`,
    });
    smsSent = !!smsResult.sent;
    if (smsResult.error) smsError = smsResult.error;
  }

  emitToUser(io, user._id, kind === "habit" ? "habit:missed" : "goal:missed", {
    kind,
    title,
    message: body,
    emailSent,
    smsSent,
    emailError,
    smsError,
  });

  return { emailSent, smsSent, emailError, smsError };
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
      }).populate("user").populate("meeting");

      for (const task of tasks) {
        if (!task.user) continue;
        const msLeft = new Date(task.deadline).getTime() - now;
        const thresholds = taskThresholds(task);
        const previousMsLeft = msLeft + 70 * 1000; // account for the minute-level scheduler and small drift

        // Check threshold-based reminders. If the scheduler missed the exact tick, fire when the
        // current window has crossed the threshold but the deadline has not passed.
        for (const threshold of thresholds) {
          const alreadySent = getThresholdSent(task.remindersSent, threshold.key);
          if (
            !alreadySent &&
            msLeft > 0 &&
            msLeft <= threshold.ms &&
            previousMsLeft > threshold.ms
          ) {
            task.remindersSent = task.remindersSent || {};
            markThresholdSent(task.remindersSent, threshold.key);
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

      const meetings = await Meeting.find({
        isActive: true,
        scheduledAt: { $gt: new Date(now - 10 * 60 * 1000) },
      }).populate("user");
      for (const meeting of meetings) {
        if (!meeting.user) continue;
        const scheduledAt = meeting.scheduledAt ? new Date(meeting.scheduledAt).getTime() : null;
        if (!scheduledAt || !Number.isFinite(scheduledAt)) continue;
        const msLeft = scheduledAt - now;
        const thresholds = taskThresholds({ reminderThresholds: DEFAULT_THRESHOLDS });
        const previousMsLeft = msLeft + 70 * 1000;

        for (const threshold of thresholds) {
          const alreadySent = getThresholdSent(meeting.remindersSent, threshold.key);
          if (!alreadySent && msLeft > 0 && msLeft <= threshold.ms && previousMsLeft > threshold.ms) {
            meeting.remindersSent = meeting.remindersSent || {};
            markThresholdSent(meeting.remindersSent, threshold.key);
            await fireMeetingReminder(io, meeting, meeting.user, threshold);
          }
        }

        await meeting.save();
      }

      // Send reminders for submission links (simple link reminders)
      try {
        const windowMs = 60 * 1000; // 1 minute window
        const reminders = await Assignment.find({
          scheduledAt: { $gte: new Date(now - windowMs), $lte: new Date(now + windowMs) },
        }).populate("user");

        for (const r of reminders) {
          if (!r.user) continue;
          try {
            const title = r.title || "Submission Reminder";
            const message = `Reminder: your submission "${title}" is due now. Open the submission link to complete.`;
            const actions = [{ id: "open-link", label: "Open submission", kind: "open_url", href: r.link }];

            // send email
            if (r.user?.email && r.user.notificationPrefs?.email !== false) {
              await sendMail({
                to: r.user.email,
                subject: `Reminder: "${title}" is due now`,
                html: `<div style="font-family: Arial, sans-serif; padding: 16px;"><h2>${message}</h2><p><a href=\"${r.link}\">Open submission link</a></p></div>`,
              });
            }

            // send sms
            if (r.user?.mobileNumber && r.user.notificationPrefs?.sms !== false) {
              await sendSMS({ to: r.user.mobileNumber, body: `${message}
Open: ${r.link}` });
            }

            emitToUser(io, r.user, "task:reminder", {
              kind: "submission",
              taskId: r._id,
              title,
              ringType: "1m",
              message,
              deadline: r.scheduledAt,
              timeLeft: "now",
              actions,
              meeting: null,
              emailSent: !!r.user?.email,
              smsSent: !!r.user?.mobileNumber,
            });
          } catch (err) {
            console.error("Error sending submission reminder", r._id, err);
          }
        }
      } catch (err) {
        console.error("Error checking submission reminders", err);
      }

      const habits = await Habit.find({}).populate("user");
      for (const habit of habits) {
        if (!habit.user) continue;
        const baseTime = habit.lastCompletedAt || habit.createdAt || new Date(0);
        const ageMs = now - new Date(baseTime).getTime();
        const cooldownPassed = !habit.missedReminderSentAt || now - new Date(habit.missedReminderSentAt).getTime() >= 24 * 60 * 60 * 1000;
        if (ageMs >= 24 * 60 * 60 * 1000 && cooldownPassed) {
          await sendMissedItemReminder(io, habit.user, "habit", habit, "A quick reset today can help you get back on track.");
          habit.missedReminderSentAt = new Date(now);
          await habit.save();
        }
      }

      const goals = await Goal.find({ status: "active" }).populate("user");
      for (const goal of goals) {
        if (!goal.user) continue;
        const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
        const overdue = !!targetDate && targetDate.getTime() < now;
        const stale = !targetDate && goal.updatedAt && now - new Date(goal.updatedAt).getTime() >= 3 * 24 * 60 * 60 * 1000;
        const cooldownPassed = !goal.missedReminderSentAt || now - new Date(goal.missedReminderSentAt).getTime() >= 24 * 60 * 60 * 1000;
        if ((overdue || stale) && cooldownPassed) {
          const reason = overdue ? "Your deadline has passed, so a small step today can help you recover momentum." : "You have not updated this goal recently, so a small action today can help you get moving again.";
          await sendMissedItemReminder(io, goal.user, "goal", goal, reason);
          goal.missedReminderSentAt = new Date(now);
          await goal.save();
        }
      }
    } catch (err) {
      console.warn("Reminder scheduler skipped because MongoDB is unavailable:", err.message || err);
    }
  });

  console.log("Reminder scheduler started (checks every minute for 24h, 5h, 1h, 30m, 5m, and 1m thresholds).");
}

export { startReminderScheduler };
