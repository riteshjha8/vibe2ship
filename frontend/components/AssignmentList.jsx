"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AssignmentList({ limit } = {}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/assignments");
      setList(data.assignments || []);
    } catch (err) {
      console.error(err);
      setMessage("Unable to load reminders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    function onRefresh() { load(); }
    window.addEventListener("assignments:refresh", onRefresh);
    return () => window.removeEventListener("assignments:refresh", onRefresh);
  }, []);
  useEffect(() => {
    function onResult(e) {
      const payload = e.detail || {};
      const text = payload.status === "submitted" ? "Assignment submitted" : `Submission ${payload.status || 'failed'}`;
      setMessage(text + (payload.result && payload.result.message ? `: ${payload.result.message}` : ""));
      load();
      setTimeout(() => setMessage(""), 8000);
    }
    window.addEventListener("assignment:result", onResult);
    return () => window.removeEventListener("assignment:result", onResult);
  }, []);

  async function deleteReminder(id) {
    try {
      await api.delete(`/assignments/${id}`);
      setList((prev) => prev.filter((item) => item._id !== id));
      setMessage("Reminder deleted.");
      setTimeout(() => setMessage(""), 8000);
    } catch (err) {
      console.error(err);
      setMessage("Unable to delete reminder.");
      setTimeout(() => setMessage(""), 8000);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 border border-white/8 bg-slate-950/60">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-semibold">Assignments</h4>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-500">No submission reminders set.</p>
      ) : (
        <div className="space-y-2">
          {(limit ? list.slice(0, limit) : list).map((a) => (
            <div key={a._id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-white/6">
              <div>
                <div className="text-sm font-medium">{a.title || 'Submission'}</div>
                <div className="text-xs text-slate-400">Due: {new Date(a.scheduledAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                
                <button
                  type="button"
                  onClick={() => deleteReminder(a._id)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {message && <p className="text-xs text-slate-400 mt-3">{message}</p>}
    </div>
  );
}
