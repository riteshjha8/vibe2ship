import Meeting from "../models/Meeting.js";
import { encryptText, decryptText } from "../utils/crypto.js";

async function createMeeting(req, res) {
  const userId = req.userId;
  const { provider, label, meetingUrl, meetingId, meetingPassword, joinBeforeMinutes, timezone, autoJoin, scheduledAt } = req.body;
  try {
    const m = await Meeting.create({
      user: userId,
      provider: provider || "other",
      label: label || "",
      meetingUrl: meetingUrl || "",
      meetingIdEncrypted: encryptText(meetingId || ""),
      meetingPasswordEncrypted: encryptText(meetingPassword || ""),
      joinBeforeMinutes: Number(joinBeforeMinutes) || 5,
      autoJoin: !!autoJoin,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      timezone: timezone || "UTC",
    });
    return res.status(201).json({ meeting: m });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create meeting" });
  }
}

async function listMeetings(req, res) {
  const userId = req.userId;
  try {
    const list = await Meeting.find({ user: userId }).sort({ createdAt: -1 });
    // do not return decrypted secrets by default
    const safeList = list.map((m) => ({
      _id: m._id,
      provider: m.provider,
      label: m.label,
      meetingUrl: m.meetingUrl,
      autoJoin: !!m.autoJoin,
      joinBeforeMinutes: m.joinBeforeMinutes,
      scheduledAt: m.scheduledAt,
      timezone: m.timezone,
      isActive: m.isActive,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
    return res.json({ meetings: safeList });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not fetch meetings" });
  }
}

async function getMeeting(req, res) {
  const userId = req.userId;
  const id = req.params.id;
  try {
    const m = await Meeting.findOne({ _id: id, user: userId });
    if (!m) return res.status(404).json({ message: "Not found" });
    // return decrypted id/password so client may use it if authorized
    const meetingId = decryptText(m.meetingIdEncrypted);
    const meetingPassword = decryptText(m.meetingPasswordEncrypted);
    return res.json({
      meeting: {
        _id: m._id,
        provider: m.provider,
        label: m.label,
        meetingUrl: m.meetingUrl,
        meetingId,
        meetingPassword,
        joinBeforeMinutes: m.joinBeforeMinutes,
        scheduledAt: m.scheduledAt,
        timezone: m.timezone,
        isActive: m.isActive,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching meeting" });
  }
}

async function updateMeeting(req, res) {
  const userId = req.userId;
  const id = req.params.id;
  const { provider, label, meetingUrl, meetingId, meetingPassword, joinBeforeMinutes, timezone, isActive, autoJoin, scheduledAt } = req.body;
  try {
    const m = await Meeting.findOne({ _id: id, user: userId });
    if (!m) return res.status(404).json({ message: "Not found" });
    m.provider = provider ?? m.provider;
    m.label = label ?? m.label;
    m.meetingUrl = meetingUrl ?? m.meetingUrl;
    if (typeof meetingId !== "undefined") m.meetingIdEncrypted = encryptText(meetingId || "");
    if (typeof meetingPassword !== "undefined") m.meetingPasswordEncrypted = encryptText(meetingPassword || "");
    m.joinBeforeMinutes = Number(joinBeforeMinutes) || m.joinBeforeMinutes;
    m.timezone = timezone || m.timezone;
    if (typeof scheduledAt !== "undefined") m.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (typeof autoJoin !== "undefined") m.autoJoin = !!autoJoin;
    if (typeof isActive !== "undefined") m.isActive = Boolean(isActive);
    await m.save();
    return res.json({ meeting: m });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not update meeting" });
  }
}

async function deleteMeeting(req, res) {
  const userId = req.userId;
  const id = req.params.id;
  try {
    const m = await Meeting.findOneAndDelete({ _id: id, user: userId });
    if (!m) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete meeting" });
  }
}

export { createMeeting, listMeetings, getMeeting, updateMeeting, deleteMeeting };
