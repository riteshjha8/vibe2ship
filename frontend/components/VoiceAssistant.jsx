"use client";
import { useRef, useState } from "react";
import api from "@/lib/api";

// Voice-enabled assistance: tap the mic, speak a task, the backend (via
// Cohere) parses it into a real task and we read the confirmation back.
export default function VoiceAssistant({ onTaskCreated }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  function getRecognition() {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) return null;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    return rec;
  }

  function startListening() {
    const rec = getRecognition();
    if (!rec) {
      setSupported(false);
      return;
    }
    recognitionRef.current = rec;
    setTranscript("");
    setReply("");
    setListening(true);

    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      try {
        const { data } = await api.post("/ai/voice-command", { transcript: text });
        setReply(data.reply);
        if (data.intent === "create_task" && data.task) onTaskCreated?.(data.task);
        if (window.speechSynthesis) {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.reply));
        }
      } catch {
        setReply("Something went wrong reaching the assistant.");
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  if (!supported) {
    return (
      <div className="glass-card rounded-xl p-5 text-sm text-slate-400">
        Voice input isn't supported in this browser. Try Chrome on desktop or Android.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-display font-semibold text-sm tracking-wide text-teal-300 mb-3">Voice assistant</h3>
      <button
        onClick={startListening}
        className={`w-full rounded-lg py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
          listening ? "bg-alarm-500/20 text-alarm-500" : "bg-teal-500/15 text-teal-300 hover:bg-teal-500/25"
        }`}
      >
        <span className={listening ? "animate-pulse" : ""}>🎙️</span>
        {listening ? "Listening…" : "Tap and say a task"}
      </button>
      <p className="text-[11px] text-slate-500 mt-3">
        Try: “Remind me to email the report today at 5pm” or “Create a task for tomorrow morning.”
      </p>
      {transcript && <p className="text-xs text-slate-400 mt-3">You said: "{transcript}"</p>}
      {reply && <p className="text-sm text-slate-200 mt-2">{reply}</p>}
    </div>
  );
}
