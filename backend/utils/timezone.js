import { DateTime } from "luxon";

/**
 * Converts a "local wall clock" date+time string plus an IANA timezone
 * into a correct absolute UTC JS Date. This is what makes deadlines work
 * correctly no matter where the user is (India, US, anywhere).
 *
 * @param {string} localDateTime - e.g. "2026-06-25T18:30" (from <input type="datetime-local">)
 * @param {string} timezone - IANA zone, e.g. "Asia/Kolkata" or "America/New_York"
 */
function localToUTC(localDateTime, timezone) {
  const dt = DateTime.fromISO(localDateTime, { zone: timezone || "Asia/Kolkata" });
  if (!dt.isValid) {
    throw new Error("Invalid date/time or timezone supplied");
  }
  return dt.toUTC().toJSDate();
}

function parseDeadlineHint(deadlineHint, timezone = "Asia/Kolkata") {
  if (!deadlineHint) return null;
  const text = String(deadlineHint).trim();
  const normal = text.toLowerCase();
  const now = DateTime.now().setZone(timezone);

  const iso = DateTime.fromISO(text, { zone: timezone });
  if (iso.isValid) return iso.toUTC().toJSDate();

  const rfc = DateTime.fromRFC2822(text, { zone: timezone });
  if (rfc.isValid) return rfc.toUTC().toJSDate();

  const timeMatch = normal.match(/(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  const hasTomorrow = /\btomorrow\b/.test(normal);
  const hasToday = /\btoday\b|\btonight\b|\bthis (?:evening|morning|afternoon)\b/.test(normal);
  const hasMorning = /\bmorning\b/.test(normal);
  const hasAfternoon = /\bafternoon\b/.test(normal);
  const hasEvening = /\b(?:evening|tonight)\b/.test(normal);

  let targetDate = null;
  if (hasTomorrow) targetDate = now.plus({ days: 1 });
  else if (hasToday) targetDate = now;

  if (timeMatch) {
    const rawHour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] || "0");
    const ampm = (timeMatch[3] || "").toLowerCase();
    let hour = rawHour;

    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    if (!ampm && hour === 12 && rawHour < 8) {
      // leave as midday / midnight if ambiguous
    }
    if (!targetDate) targetDate = now;

    const candidate = targetDate.set({ hour, minute, second: 0, millisecond: 0 });
    if (candidate < now && !hasTomorrow) {
      targetDate = targetDate.plus({ days: 1 });
    }

    const final = (targetDate || now).set({ hour, minute, second: 0, millisecond: 0 });
    return final.toUTC().toJSDate();
  }

  if (hasToday || hasTomorrow || hasMorning || hasAfternoon || hasEvening) {
    if (!targetDate) targetDate = hasTomorrow ? now.plus({ days: 1 }) : now;
    let hour = 21;
    if (hasMorning) hour = 9;
    else if (hasAfternoon) hour = 14;
    else if (hasEvening) hour = 20;

    const candidate = targetDate.set({ hour, minute: 0, second: 0, millisecond: 0 });
    if (candidate < now && hasToday) {
      return targetDate.plus({ days: 1 }).set({ hour, minute: 0, second: 0, millisecond: 0 }).toUTC().toJSDate();
    }
    return candidate.toUTC().toJSDate();
  }

  return null;
}

/**
 * Human friendly "time left" string in the user's own timezone.
 */
function describeTimeLeft(deadlineUTC, timezone) {
  const now = DateTime.utc();
  const deadline = DateTime.fromJSDate(deadlineUTC, { zone: "utc" }).setZone(timezone || "Asia/Kolkata");
  const diff = deadline.diff(now, ["days", "hours", "minutes"]).toObject();
  return diff;
}

export { localToUTC, parseDeadlineHint, describeTimeLeft };
