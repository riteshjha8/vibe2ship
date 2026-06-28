"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

function EmptyForm() {
  return {
    provider: "zoom",
    label: "",
    meetingUrl: "",
    meetingId: "",
    meetingPassword: "",
    joinBeforeMinutes: 5,
    scheduledAt: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function MeetingManager({ compact } = {}) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EmptyForm());
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/meetings");
      setMeetings(data.meetings || []);
    } catch (err) {
      console.error(err);
      setMessage("Unable to load meetings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(null);
    setForm(EmptyForm());
  }

  function startEdit(m) {
    setEditing(m._id);
    setForm({
      provider: m.provider,
      label: m.label,
      meetingUrl: m.meetingUrl,
      meetingId: "",
      meetingPassword: "",
      joinBeforeMinutes: m.joinBeforeMinutes,
      scheduledAt: toDateTimeLocalValue(m.scheduledAt),
      timezone: m.timezone,
      autoJoin: !!m.autoJoin,
    });
  }

  async function save(e) {
    e.preventDefault();
    setMessage("Saving…");
    try {
      const payload = {
        ...form,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      };
      if (editing) {
        const { data } = await api.put(`/meetings/${editing}`, payload);
        setMessage("Updated.");
      } else {
        const { data } = await api.post(`/meetings`, payload);
        setMessage("Created.");
      }
      await load();
      setEditing(null);
      setForm(EmptyForm());
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Could not save meeting.");
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this meeting?")) return;
    try {
      await api.delete(`/meetings/${id}`);
      setMessage("Deleted.");
      await load();
    } catch (err) {
      setMessage("Unable to delete.");
    }
  }

  function joinNow(m) {
    // Open meeting URL in new tab; if empty, attempt provider-specific url build
    if (m.meetingUrl) {
      window.open(m.meetingUrl, "_blank");
      return;
    }
    // fallback: prompt
    window.alert("No meeting URL saved for this meeting.");
  }

  return (
    <div className={`glass-card rounded-xl p-5 border border-white/8 bg-slate-950/60 mt-4 ${compact?"p-3":""}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-semibold">Meetings</h4>
        {!compact && (
          <div className="flex items-center gap-2">
            <button onClick={startCreate} className="rounded-md bg-gold-500 hover:bg-gold-400 text-ink px-3 py-1 text-sm">Add</button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading meetings…</p>
      ) : (
        <div className="space-y-3">
          {meetings.length === 0 && <p className="text-sm text-slate-500">No meetings saved.</p>}
          {meetings.map((m) => (
            <div key={m._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/6">
              <div>
                <div className="text-sm font-medium">{m.label || m.provider}</div>
                <div className="text-xs text-slate-400">{m.meetingUrl || "(no url)"}</div>
                {m.scheduledAt && <div className="text-[11px] text-slate-500">{new Date(m.scheduledAt).toLocaleString()}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => joinNow(m)} className="rounded-md bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700">Join</button>
                <button onClick={() => startEdit(m)} className="rounded-md border border-white/8 px-2 py-1 text-sm">Edit</button>
                <button onClick={() => remove(m._id)} className="rounded-md text-sm px-2 py-1 text-alarm-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={save} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select value={form.provider} onChange={(e)=>setForm({...form, provider:e.target.value})} className="rounded-lg bg-white/3 border border-white/8 px-2 py-2 text-sm">
            <option value="zoom">Zoom</option>
            <option value="google">Google Meet</option>
            <option value="teams">Microsoft Teams</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Label" value={form.label} onChange={(e)=>setForm({...form, label:e.target.value})} className="rounded-lg bg-white/3 border border-white/8 px-2 py-2 text-sm" />
          <input placeholder="Join before (minutes)" type="number" value={form.joinBeforeMinutes} onChange={(e)=>setForm({...form, joinBeforeMinutes: Number(e.target.value)})} className="rounded-lg bg-white/3 border border-white/8 px-2 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <input id="autoJoin" type="checkbox" checked={!!form.autoJoin} onChange={(e)=>setForm({...form, autoJoin: e.target.checked})} className="h-4 w-4 accent-gold-500" />
          <label htmlFor="autoJoin" className="text-sm text-slate-300">Attempt to auto-join when reminder fires</label>
        </div>
        <div>
          <input placeholder="Meeting URL (preferred)" value={form.meetingUrl} onChange={(e)=>setForm({...form, meetingUrl:e.target.value})} className="w-full rounded-lg bg-white/3 border border-white/8 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input placeholder="Meeting ID" value={form.meetingId} onChange={(e)=>setForm({...form, meetingId:e.target.value})} className="rounded-lg bg-white/3 border border-white/8 px-2 py-2 text-sm" />
          <input placeholder="Password / Passcode" value={form.meetingPassword} onChange={(e)=>setForm({...form, meetingPassword:e.target.value})} className="rounded-lg bg-white/3 border border-white/8 px-2 py-2 text-sm" />
        </div>
        <div>
          <input type="datetime-local" value={form.scheduledAt || ""} onChange={(e)=>setForm({...form, scheduledAt:e.target.value})} className="w-full rounded-lg bg-white/3 border border-white/8 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="rounded-md bg-gold-500 hover:bg-gold-400 text-ink px-3 py-1 text-sm">Save</button>
          <button type="button" onClick={()=>{setEditing(null); setForm(EmptyForm());}} className="rounded-md border border-white/8 px-3 py-1 text-sm">Cancel</button>
        </div>
      </form>

      {message && <p className="text-xs text-slate-400 mt-3">{message}</p>}
    </div>
  );
}
