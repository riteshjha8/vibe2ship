import dayjs from "dayjs";
export default dayjs;

export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export function msUntil(deadline) {
  return new Date(deadline).getTime() - Date.now();
}

export function formatCountdown(ms) {
  if (ms <= 0) return "Overdue";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// Returns a 0..1 fraction of how "burned down" a task is, for the countdown ring.
// Assumes a typical task window; clamps sensibly so the ring always reads correctly.
export function urgencyFraction(deadline, createdAt) {
  const total = new Date(deadline).getTime() - new Date(createdAt).getTime();
  const left = new Date(deadline).getTime() - Date.now();
  if (total <= 0) return 1;
  const fraction = 1 - left / total;
  return Math.min(Math.max(fraction, 0), 1);
}
