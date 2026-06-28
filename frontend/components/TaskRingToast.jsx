"use client";
import { useEffect, useState } from "react";

export default function TaskRingToast() {
  const [toast, setToast] = useState(null);

  // Try to unlock/resume audio context and speech synthesis
  function unlockAudioOnce() {
    try {
      if (typeof window === "undefined") return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(" ");
        utter.volume = 0;
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      // ignore
    }
  }

  function playImmediateRing(beepCount = 2, frequency = 1000) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      for (let i = 0; i < beepCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = frequency - i * 60;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.8, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.34);
        t += 0.44;
      }
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    function handler(e) {
      const payload = e.detail || {};
      const title = payload.title || "Task reminder";
      const message = payload.message || "A task reminder is ringing now.";
      setToast({ title, message, payload });
      // Attempt to play a loud immediate ring and speak the message
      unlockAudioOnce();
      playImmediateRing(3, payload.ringType === "1m" ? 1300 : 1000);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(message);
          u.rate = 1;
          u.pitch = 1;
          window.speechSynthesis.speak(u);
        } catch (err) {
          // ignore
        }
      }
      // auto-hide after 20s
      window.setTimeout(() => setToast((t) => (t && t.payload === payload ? null : t)), 20_000);
    }
    window.addEventListener("task:ring", handler);
    return () => window.removeEventListener("task:ring", handler);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-6 right-6 z-60">
      <div className="rounded-lg bg-slate-900/90 text-slate-100 p-3 shadow-lg max-w-sm w-full">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold">{toast.title}</div>
            <div className="text-xs text-slate-300">{toast.message}</div>
          </div>
          <div className="flex flex-col gap-2 ml-3">
            <a
              href={`/tasks`}
              className="inline-block rounded-md bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/15"
            >
              Open Tasks
            </a>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-200 text-sm px-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
