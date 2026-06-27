"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { detectTimezone } from "@/lib/dayjs";

function toLocalDateTimeString(value) {
  if (!value) return "";
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function splitPhoneNumber(fullNumber) {
  const input = String(fullNumber || "").trim();
  const match = input.match(/^\+(\d{1,3})(\d{6,})$/);
  if (match) {
    return { smsCountryCode: `+${match[1]}`, smsNumber: match[2] };
  }
  const digits = input.replace(/\D/g, "");
  return { smsCountryCode: "+91", smsNumber: digits };
}

export default function TaskForm({ task, onCreated, onUpdated, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    location: "",
    importance: 3,
    effortMinutes: 30,
    deadlineLocal: "",
    smsCountryCode: "+91",
    smsNumber: "",
    notifyBySMS: false,
    reminderThresholds: ["24h", "5h", "1h", "30m", "5m", "1m"],
  });
  const [error, setError] = useState("");
  const [thresholdError, setThresholdError] = useState("");
  const [customThresholdInput, setCustomThresholdInput] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    if (!task) return;
    const { smsCountryCode, smsNumber } = splitPhoneNumber(task.smsNumber);
    setForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "General",
      location: task.location || "",
      importance: task.importance || 3,
      effortMinutes: task.effortMinutes || 30,
      deadlineLocal: toLocalDateTimeString(task.deadline),
      smsCountryCode,
      smsNumber,
      notifyBySMS: !!task.notifyBySMS,
      reminderThresholds: Array.isArray(task.reminderThresholds) && task.reminderThresholds.length
        ? task.reminderThresholds
        : ["24h", "5h", "1h", "30m", "5m", "1m"],
    });
  }, [task]);

  function normalizeThreshold(value) {
    return String(value).trim().toLowerCase().replace(/\s+/g, "");
  }

  function addCustomThreshold() {
    const normalized = normalizeThreshold(customThresholdInput);
    if (!normalized) {
      setThresholdError("Enter a custom reminder like 15m, 2h, or 1d.");
      return;
    }
    if (!/^[0-9]+[dhm]$/.test(normalized)) {
      setThresholdError("Custom reminders must use d, h, or m (for days, hours, minutes).");
      return;
    }
    if (form.reminderThresholds.includes(normalized)) {
      setThresholdError("This reminder threshold is already selected.");
      return;
    }
    setForm((f) => ({
      ...f,
      reminderThresholds: [...f.reminderThresholds, normalized],
    }));
    setCustomThresholdInput("");
    setThresholdError("");
  }

  function removeThreshold(removedValue) {
    setForm((f) => ({
      ...f,
      reminderThresholds: f.reminderThresholds.filter((value) => value !== removedValue),
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title || !form.deadlineLocal) {
      setError("Title and deadline are required.");
      return;
    }
    if (form.notifyBySMS) {
      if (!form.smsNumber) {
        setError("Enter a mobile number to receive SMS reminders.");
        return;
      }
      const cleanedNumber = form.smsNumber.replace(/\D/g, "");
      if (!cleanedNumber) {
        setError("Enter a valid mobile number.");
        return;
      }
    }
    if (!form.reminderThresholds.length) {
      setError("Select at least one reminder threshold.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const smsNumber = form.smsNumber ? `${form.smsCountryCode}${form.smsNumber.replace(/\D/g, "")}` : "";
      const payload = {
        ...form,
        smsNumber,
        timezone: detectTimezone(),
      };
      delete payload.smsCountryCode;

      const method = task ? api.put : api.post;
      const url = task ? `/tasks/${task._id}` : "/tasks";
      const { data } = await method(url, payload);
      if (task) {
        onUpdated?.(data.task);
      } else {
        onCreated(data.task);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">{task ? "Edit task" : "New task"}</h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>

        {error && <p className="text-sm text-alarm-500">{error}</p>}

        <div>
          <label className="block text-xs text-slate-400 mb-1">Title</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
            placeholder="Submit visa application"
            required
          />
        </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Location (optional)</label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
              placeholder="Starbucks, 5th Ave, Seattle"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Add a physical location or venue. If the task has a destination, you'll get a direct Google Maps link in the task card.
            </p>
          </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Importance</label>
            <select
              value={form.importance}
              onChange={(e) => update("importance", Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} {n === 5 ? "(Critical)" : n === 1 ? "(Low)" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Deadline (your local time)</label>
          <input
            type="datetime-local"
            value={form.deadlineLocal}
            onChange={(e) => update("deadlineLocal", e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Detected timezone: {detectTimezone()}. Reminders fire at the thresholds you choose, adjusted correctly for your location.
          </p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Mobile number for SMS reminders</label>
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <select
              value={form.smsCountryCode}
              onChange={(e) => update("smsCountryCode", e.target.value)}
              className="rounded-lg bg-slate-950/90 border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-transparent focus:ring-2 focus:ring-teal-400 outline-none"
            >
              <option value="+1">+1 US</option>
              <option value="+44">+44 UK</option>
              <option value="+61">+61 AU</option>
              <option value="+91">+91 IN</option>
              <option value="+49">+49 DE</option>
              <option value="+81">+81 JP</option>
              <option value="+86">+86 CN</option>
            </select>
            <input
              type="tel"
              value={form.smsNumber}
              onChange={(e) => update("smsNumber", e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
              placeholder="1234567890"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Choose your country code and enter the rest of your mobile number. SMS reminders will be sent to the full international number.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="notifyBySMS"
            type="checkbox"
            checked={form.notifyBySMS}
            onChange={(e) => update("notifyBySMS", e.target.checked)}
            className="accent-teal-500 h-4 w-4"
          />
          <label htmlFor="notifyBySMS" className="text-sm text-slate-300">
            Send SMS reminders for this task
          </label>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Reminder times</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "24h", label: "24 hours" },
              { value: "5h", label: "5 hours" },
              { value: "1h", label: "1 hour" },
              { value: "30m", label: "30 minutes" },
              { value: "5m", label: "5 minutes" },
              { value: "1m", label: "1 minute" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.reminderThresholds.includes(option.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...form.reminderThresholds, option.value]
                      : form.reminderThresholds.filter((value) => value !== option.value);
                    update("reminderThresholds", next);
                  }}
                  className="accent-teal-500 h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={customThresholdInput}
                onChange={(e) => setCustomThresholdInput(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
                placeholder="e.g. 15m, 2h, 1d"
              />
              <button
                type="button"
                onClick={addCustomThreshold}
                className="rounded-lg bg-teal-500 hover:bg-teal-400 px-3 py-2 text-sm text-ink"
              >
                Add
              </button>
            </div>
            {thresholdError && <p className="text-[11px] text-alarm-500">{thresholdError}</p>}
            <div className="flex flex-wrap gap-2">
              {form.reminderThresholds.map((threshold) => (
                <button
                  key={threshold}
                  type="button"
                  onClick={() => removeThreshold(threshold)}
                  className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-white/5"
                >
                  {threshold} ×
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Choose built-in reminder times or add a custom lead time. Use d/h/m for days, hours, minutes.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 text-ink font-medium py-2.5 transition disabled:opacity-60"
        >
          {busy ? (task ? "Updating…" : "Saving…") : task ? "Update task" : "Create task"}
        </button>
      </form>
    </div>
  );
}
