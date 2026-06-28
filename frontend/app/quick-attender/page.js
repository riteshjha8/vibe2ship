"use client";
import Shell from "@/components/Shell";
import MeetingManager from "@/components/MeetingManager";
import AssignmentList from "@/components/AssignmentList";
import { useRef, useState } from "react";
import api from "@/lib/api";

export default function QuickAttenderPage(){
  const [platformLink, setPlatformLink] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function createReminder(e) {
    e?.preventDefault();
    if (!platformLink || !scheduledAt) return setMessage("Provide a link and scheduled time.");
    try {
      const { data } = await api.post("/assignments", { title, link: platformLink, scheduledAt });
      setPlatformLink("");
      setTitle("");
      setScheduledAt("");
      setShowModal(false);
      window.dispatchEvent(new Event("assignments:refresh"));
      setMessage("Reminder saved.");
      setTimeout(() => setMessage(""), 8000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Save failed.";
      setMessage(msg);
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Quick Attender</h1>
          <div className="flex items-center gap-3">
          <button onClick={()=>setShowModal(true)} className="rounded-md bg-gold-500 hover:bg-gold-400 text-ink px-3 py-1 text-sm">Assigment Reminder</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <MeetingManager compact />
        </div>
        <div>
          <div className="glass-card rounded-xl p-4 border border-white/8 bg-slate-950/60">
            <h4 className="font-display font-semibold mb-2">Recent Assignments</h4>
            <AssignmentList limit={6} />
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-slate-950 rounded-2xl p-6 border border-white/6">
            <h4 className="font-display font-semibold mb-2">Write your Reminder</h4>
            <form onSubmit={createReminder} className="space-y-3">
              <input placeholder="Title (optional)" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-sm" />
              <input placeholder="Submission portal link" value={platformLink} onChange={(e)=>setPlatformLink(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-sm" />
              <input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-sm" />
              <div className="flex items-center gap-2">
                <button type="submit" className="rounded-md bg-gold-500 hover:bg-gold-400 text-ink px-3 py-1 text-sm">Save Reminder</button>
                <button type="button" onClick={()=>setShowModal(false)} className="rounded-md bg-white/5 text-xs px-3 py-1">Cancel</button>
                <div className="text-xs text-slate-400">{message}</div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
