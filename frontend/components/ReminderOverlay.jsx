"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useSocket } from "@/context/SocketContext";

const TIERS = {
  "24h": { label: "24 hours left", color: "#C9982A", ring: "ring-gold-400/40", beeps: 1, pulse: false },
  "5h": { label: "5 hours left", color: "#D4AF37", ring: "ring-amber-400/40", beeps: 1, pulse: false },
  "1h": { label: "1 hour left", color: "#F59E0B", ring: "ring-amber-400/50", beeps: 2, pulse: true },
  "30m": { label: "30 minutes left", color: "#FB923C", ring: "ring-orange-400/50", beeps: 2, pulse: true },
  "5m": { label: "5 minutes left", color: "#F87171", ring: "ring-red-400/60", beeps: 3, pulse: true },
  "1m": { label: "LAST MINUTE", color: "#EF4444", ring: "ring-alarm-500/60", beeps: 4, pulse: true },
};

let audioUnlocked = false;

function unlockAudioOnce() {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
    const utter = new SpeechSynthesisUtterance(" ");
    utter.volume = 0;
    window.speechSynthesis.speak(utter);
  } catch {}
}

function playRing(beepCount, frequency = 880) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    for (let i = 0; i < beepCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Use a more aggressive waveform and higher peak gain for louder, urgent rings
      osc.type = "sawtooth";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.75, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
      t += 0.44;
    }
  } catch {}
}

function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

export default function ReminderOverlay() {
  const { reminders, dismissReminder } = useSocket();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const announced = useRef(new Set());
  const ringIntervalRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  useEffect(() => {
    const handler = () => unlockAudioOnce();
    window.addEventListener("click", handler, { once: true });
    return () => window.removeEventListener("click", handler);
  }, []);

  const current = reminders[0];
  const tier = current ? TIERS[current.ringType] || TIERS["24h"] : null;

  function startContinuousRing(frequency = 880, duration = 60_000) {
    stopContinuousRing();
    playRing(1, frequency);
    const interval = window.setInterval(() => playRing(1, frequency), 1200);
    const timeout = window.setTimeout(() => stopContinuousRing(), duration);
    ringIntervalRef.current = interval;
    ringTimeoutRef.current = timeout;
  }

  function stopContinuousRing() {
    if (ringIntervalRef.current) window.clearInterval(ringIntervalRef.current);
    if (ringTimeoutRef.current) window.clearTimeout(ringTimeoutRef.current);
    ringIntervalRef.current = null;
    ringTimeoutRef.current = null;
  }

  useEffect(() => {
    if (!current) return;
    if (announced.current.has(current.id)) return;
    announced.current.add(current.id);
    // Best-effort unlock audio when a reminder arrives (may still be blocked).
    try {
      unlockAudioOnce();
    } catch {}

    const frequency = current.ringType === "1m" ? 1200 : current.ringType === "5m" ? 1000 : current.ringType === "1h" ? 920 : current.ringType === "30m" ? 900 : 760;
    const duration = current.ringType === "1m" ? 90_000 : 60_000;
    startContinuousRing(frequency, duration);
    if (voiceEnabled) {
      speak(current.message);
    }

    return () => stopContinuousRing();
  }, [current, voiceEnabled]);

  async function handleAction(action) {
    if (!current) return;

    if (action.kind === "mark_complete") {
      try {
        await api.patch(`/tasks/${current.taskId}`, { status: "done" });
      } catch (err) {
        console.error("Failed to mark task complete", err);
      }
    } else if (action.kind === "open_map" && action.query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.query)}`, "_blank", "noopener,noreferrer");
    } else if (action.kind === "open_url" && action.href) {
      window.open(action.href, "_blank", "noopener,noreferrer");
    } else if (action.kind === "navigate" && action.href) {
      window.location.href = action.href;
    }

    dismissReminder(current.id);
    stopContinuousRing();
  }

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`glass-card rounded-2xl max-w-md w-full p-6 ring-2 ${tier.ring} ${tier.pulse ? "animate-ringPulse" : ""}`}
        style={{ boxShadow: `0 0 60px -10px ${tier.color}55` }}
        role="alertdialog"
        aria-label={tier.label}
      >
        <div className="flex items-center gap-3 mb-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ background: `${tier.color}22`, color: tier.color }}
          >
            🔔
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest font-mono" style={{ color: tier.color }}>
              {tier.label}
            </p>
            <h3 className="font-display font-semibold text-lg leading-tight">{current.title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-200/90 mb-4">{current.message}</p>
        {current.recommendedAction && (
          <div className="mb-4 rounded-xl border border-gold-400/20 bg-gold-500/10 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-gold-300">Recommended next step</p>
            <p className="mt-1 text-sm text-slate-100">{current.recommendedAction}</p>
            {current.remainingSteps?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {current.remainingSteps.slice(0, 3).map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold-300" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {current.actions?.length > 0 && (
          <div className="mb-4 grid gap-2">
            {current.actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left text-sm font-medium text-slate-100 transition hover:bg-white/15"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        {current.emailSent && (
          <p className="text-xs text-gold-300 mb-3">Reminder email sent to your logged-in account.</p>
        )}
        {current.emailError && (
          <p className="text-xs text-red-300 mb-3">Email failed: {current.emailError}</p>
        )}
        {current.smsSent && (
          <p className="text-xs text-amber-300 mb-3">SMS reminder sent to your mobile number.</p>
        )}
        {current.smsError && (
          <p className="text-xs text-orange-300 mb-3">SMS failed: {current.smsError}</p>
        )}

        {!voiceEnabled && (
          <button
            onClick={() => {
              unlockAudioOnce();
              setVoiceEnabled(true);
            }}
            className="w-full mb-2 rounded-lg bg-gold-500/15 text-gold-300 text-sm font-medium py-2 hover:bg-gold-500/30 transition"
          >
            Enable the voice ring for this session
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              dismissReminder(current.id);
              stopContinuousRing();
            }}
            className="flex-1 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium py-2 transition"
          >
            Got it
          </button>
          <button
            onClick={() => {
              dismissReminder(current.id);
              stopContinuousRing();
              window.setTimeout(() => {
                if (voiceEnabled) {
                  startContinuousRing(tier.ring === "ring-alarm-500/60" ? 1040 : 760, 60_000);
                  speak(`Snoozed reminder: ${current.message}`);
                }
              }, 5 * 60 * 1000);
            }}
            className="flex-1 rounded-lg border border-white/15 hover:bg-white/5 text-sm font-medium py-2 transition"
          >
            Snooze 5 min
          </button>
        </div>
      </div>
    </div>
  );
}
