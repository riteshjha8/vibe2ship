import Task from "../models/Task.js";
import { localToUTC } from "../utils/timezone.js";
import Alert from "../models/Alert.js";
import { sendSMS } from "../utils/sms.js";

// Add custom alarm to a task
async function addCustomAlert(req, res) {
  try {
    const { taskId, alarmTimeLocal, timezone, alarmType, notifyBySMS, smsNumber } = req.body;

    if (!taskId || !alarmTimeLocal) {
      return res.status(400).json({ message: "Task ID and alarm time are required" });
    }

    const task = await Task.findById(taskId);
    if (!task || task.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let alarmTimeUTC;
    try {
      alarmTimeUTC = localToUTC(alarmTimeLocal, timezone || task.timezone);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const customAlert = {
      alarmTime: alarmTimeUTC,
      alarmType: alarmType || "medium",
      notifyBySMS: notifyBySMS || false,
      smsNumber: smsNumber || "",
      hasRung: false,
    };

    task.customAlerts = task.customAlerts || [];
    task.customAlerts.push(customAlert);
    await task.save();

    res.status(201).json({
      message: "Custom alarm added",
      alert: customAlert,
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get all custom alarms for a task
async function getTaskAlerts(req, res) {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task || task.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({
      taskId,
      customAlerts: task.customAlerts || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Delete a custom alarm from a task
async function deleteCustomAlert(req, res) {
  try {
    const { taskId, alertIndex } = req.body;

    const task = await Task.findById(taskId);
    if (!task || task.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!Number.isInteger(alertIndex) || alertIndex < 0 || !task.customAlerts || alertIndex >= task.customAlerts.length) {
      return res.status(400).json({ message: "Invalid alert index" });
    }

    task.customAlerts.splice(alertIndex, 1);
    await task.save();

    res.json({
      message: "Custom alarm deleted",
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Update a custom alarm
async function updateCustomAlert(req, res) {
  try {
    const { taskId, alertIndex, alarmTimeLocal, timezone, alarmType, notifyBySMS, smsNumber } = req.body;

    const task = await Task.findById(taskId);
    if (!task || task.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!Number.isInteger(alertIndex) || alertIndex < 0 || !task.customAlerts || alertIndex >= task.customAlerts.length) {
      return res.status(400).json({ message: "Invalid alert index" });
    }

    const alert = task.customAlerts[alertIndex];

    if (alarmTimeLocal) {
      let alarmTimeUTC;
      try {
        alarmTimeUTC = localToUTC(alarmTimeLocal, timezone || task.timezone);
        alert.alarmTime = alarmTimeUTC;
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    if (alarmType) alert.alarmType = alarmType;
    if (notifyBySMS !== undefined) alert.notifyBySMS = notifyBySMS;
    if (smsNumber !== undefined) alert.smsNumber = smsNumber;

    await task.save();

    res.json({
      message: "Custom alarm updated",
      alert: task.customAlerts[alertIndex],
      task,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export { addCustomAlert, getTaskAlerts, deleteCustomAlert, updateCustomAlert, sendSmsNow };

// Send an SMS immediately (protected route). Optionally persist an Alert.
async function sendSmsNow(req, res) {
  try {
    const { to, message, createAlert = false, title, alarmTime, timezone } = req.body;

    if (!to || !message) return res.status(400).json({ message: "Missing 'to' or 'message'" });

    const result = await sendSMS({ to, body: message });

    // If requested, try to persist an Alert record. If DB is offline this will fail - ignore those errors.
    if (createAlert) {
      try {
        const alarm = new Alert({
          user: req.userId,
          title: title || message.slice(0, 120) || "SMS Alert",
          alarmTime: alarmTime ? new Date(alarmTime) : new Date(),
          timezone: timezone || "Asia/Kolkata",
          notifyBySMS: true,
          smsNumber: to,
        });
        await alarm.save();
      } catch (err) {
        console.warn("Failed to save Alert to DB (maybe offline):", err.message);
      }
    }

    return res.json({ sent: result.sent, result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
