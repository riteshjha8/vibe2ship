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
  const { user, updateUser, logout } = useAuth();
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
      <div className="space-y-6">
        <div className="max-w-4xl">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">Profile</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Manage your account, timezone, notification preferences, and security actions for FinalPing AI.
          </p>
        </div>

        <form onSubmit={save} className="glass-card rounded-3xl p-8 shadow-2xl shadow-slate-950/30 max-w-4xl space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.95fr]">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">Email</label>
                <input
                  disabled
                  value={user?.email}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-2">
                  Timezone
                </label>
                <p className="text-xs text-slate-500 mb-2">This timezone is used for every deadline, reminder, and alert.</p>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-slate-950 text-slate-100">
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <h2 className="font-semibold text-xl text-slate-100 mb-4">Account summary</h2>
              <dl className="space-y-4 text-sm text-slate-400">
                <div>
                  <dt className="font-medium text-slate-200">Registered email</dt>
                  <dd className="mt-1 text-slate-400 break-all">{user?.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-200">Current timezone</dt>
                  <dd className="mt-1 text-slate-400">{timezone}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-200">Alert settings</dt>
                  <dd className="mt-1 text-slate-400">Email reminders and voice ring alerts keep you on track.</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">Email reminders</p>
                <p className="text-sm text-slate-500">Receive timely reminder emails for all upcoming deadlines.</p>
              </div>
              <input type="checkbox" checked={emailOn} onChange={(e) => setEmailOn(e.target.checked)} className="accent-teal-500 h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">Voice ring alerts</p>
                <p className="text-sm text-slate-500">Enable audible voice alerts at the final countdown stages.</p>
              </div>
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="accent-teal-500 h-5 w-5" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto rounded-3xl border border-red-500 text-red-400 hover:bg-red-500/10 px-4 py-3 font-semibold transition"
            >
              Sign out
            </button>
            <button className="w-full sm:w-auto rounded-3xl bg-teal-500 hover:bg-teal-400 text-ink font-semibold px-6 py-3 transition">
              {saved ? "Saved ✓" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
