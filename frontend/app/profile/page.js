"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { detectTimezone } from "@/lib/dayjs";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney",
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [timezone, setTimezone] = useState(user?.timezone || detectTimezone());
  const [emailOn, setEmailOn] = useState(user?.notificationPrefs?.email ?? true);
  const [voiceOn, setVoiceOn] = useState(user?.notificationPrefs?.voice ?? true);
  const [saved, setSaved] = useState(false);

  async function save(e) {
    e.preventDefault();
    const { data } = await api.put("/auth/me", {
      name,
      timezone,
      notificationPrefs: { email: emailOn, voice: voiceOn },
    });
    updateUser(data.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Profile</h1>
      <form onSubmit={save} className="glass-card rounded-xl p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input
            disabled
            value={user?.email}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Timezone <span className="text-slate-500">(used for every deadline & reminder)</span>
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <span className="text-sm">Email reminders</span>
          <input type="checkbox" checked={emailOn} onChange={(e) => setEmailOn(e.target.checked)} className="accent-teal-500 h-4 w-4" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Voice ring alerts</span>
          <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="accent-teal-500 h-4 w-4" />
        </div>

        <button className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 text-ink font-medium py-2.5 transition">
          {saved ? "Saved ✓" : "Save changes"}
        </button>
      </form>
    </Shell>
  );
}
