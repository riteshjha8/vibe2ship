"use client";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";

const TIERS = {
  "24h": { label: "24 hours left", color: "#2DD4BF", ring: "ring-teal-400/40", beeps: 1, pulse: false },
  "5h": { label: "5 hours left", color: "#38BDF8", ring: "ring-sky-400/40", beeps: 1, pulse: false },
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
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
      t += 0.38;
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

    const frequency = current.ringType === "1m" ? 1040 : current.ringType === "5m" ? 980 : current.ringType === "1h" ? 920 : current.ringType === "30m" ? 900 : 760;
    startContinuousRing(frequency, 60_000);
    if (voiceEnabled) {
      speak(current.message);
    }

    return () => stopContinuousRing();
  }, [current, voiceEnabled]);

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
        {current.emailSent && (
          <p className="text-xs text-teal-300 mb-3">Reminder email sent to your logged-in account.</p>
        )}
        {current.emailError && (
          <p className="text-xs text-red-300 mb-3">Email failed: {current.emailError}</p>
        )}
        {current.smsSent && (
          <p className="text-xs text-sky-300 mb-3">SMS reminder sent to your mobile number.</p>
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
            className="w-full mb-2 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-medium py-2 hover:bg-teal-500/30 transition"
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
