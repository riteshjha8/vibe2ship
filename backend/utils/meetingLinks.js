function normalizeMeetingProvider(meeting) {
  const raw = String(meeting?.provider || meeting?.providerName || meeting?.type || "").trim().toLowerCase();
  if (!raw) return "other";

  if (["zoom", "google", "teams", "other"].includes(raw)) return raw;
  if (raw.includes("zoom")) return "zoom";
  if (raw.includes("google") || raw.includes("meet")) return "google";
  if (raw.includes("teams") || raw.includes("microsoft")) return "teams";

  const meetingUrl = String(meeting?.meetingUrl || "").trim().toLowerCase();
  if (meetingUrl.includes("zoom")) return "zoom";
  if (meetingUrl.includes("meet.google") || meetingUrl.includes("google.com")) return "google";
  if (meetingUrl.includes("teams.microsoft") || meetingUrl.includes("teams")) return "teams";

  return "other";
}

function buildMeetingJoinUrl(meeting, meetingId, meetingPassword) {
  const meetingUrl = String(meeting?.meetingUrl || "").trim();
  if (meetingUrl) return meetingUrl;

  const provider = normalizeMeetingProvider(meeting);
  const id = String(meetingId || meeting?.meetingId || "").trim();
  if (!id) return "";

  if (/^https?:\/\//i.test(id) || /^[a-z]+:\/\//i.test(id)) return id;

  if (provider === "zoom") {
    const base = `https://zoom.us/j/${encodeURIComponent(id)}`;
    const password = String(meetingPassword || meeting?.meetingPassword || "").trim();
    return password ? `${base}?pwd=${encodeURIComponent(password)}` : base;
  }

  if (provider === "google") {
    return `https://meet.google.com/${encodeURIComponent(id)}`;
  }

  if (provider === "teams") {
    return `https://teams.microsoft.com/l/meetup-join/${encodeURIComponent(id)}`;
  }

  return "";
}

function shouldAutoJoinMeeting(meeting, msLeft) {
  if (!meeting?.autoJoin) return false;
  const joinBeforeMs = Number(meeting?.joinBeforeMinutes) > 0 ? Number(meeting.joinBeforeMinutes) * 60 * 1000 : 0;
  if (!joinBeforeMs) return true;
  const parsedMsLeft = Number(msLeft);
  if (!Number.isFinite(parsedMsLeft)) return false;
  return parsedMsLeft <= joinBeforeMs;
}

export { normalizeMeetingProvider, buildMeetingJoinUrl, shouldAutoJoinMeeting };
