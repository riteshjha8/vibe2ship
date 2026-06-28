"use client";
/**
 * ErrorAlert Component
 * 
 * Displays error messages in a beautiful, dismissible card format.
 * Supports different error types and automatic dismissal.
 * 
 * @param {string} message - Error message to display
 * @param {string} [type='error'] - 'error', 'warning', 'info'
 * @param {function} [onDismiss] - Callback when dismissed
 * @param {number} [autoDismissMs] - Auto-dismiss after ms (0 = no auto-dismiss)
 * @example
 * <ErrorAlert 
 *   message="Failed to load data" 
 *   onDismiss={() => setError(null)}
 *   autoDismissMs={5000}
 * />
 */
import { useEffect, useState } from "react";

export default function ErrorAlert({ 
  message, 
  type = "error", 
  onDismiss, 
  autoDismissMs = 0 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs <= 0) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  if (!isVisible) return null;

  const typeConfig = {
    error: {
      bg: "bg-red-950/30",
      border: "border-red-500/30",
      icon: "⚠",
      text: "text-red-200",
      button: "hover:bg-red-900/40",
    },
    warning: {
      bg: "bg-amber-950/30",
      border: "border-amber-500/30",
      icon: "⚡",
      text: "text-amber-200",
      button: "hover:bg-amber-900/40",
    },
    info: {
      bg: "bg-blue-950/30",
      border: "border-blue-500/30",
      icon: "ℹ",
      text: "text-blue-200",
      button: "hover:bg-blue-900/40",
    },
  };

  const config = typeConfig[type] || typeConfig.error;

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-lg p-3 sm:p-4 flex items-start gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300`}
      role="alert"
      aria-live="polite"
    >
      <span className={`${config.text} text-lg sm:text-xl flex-shrink-0 mt-0.5`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`${config.text} text-xs sm:text-sm leading-relaxed`}>
          {message}
        </p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className={`flex-shrink-0 text-slate-400 hover:text-slate-300 ${config.button} rounded p-1 transition`}
        aria-label="Dismiss alert"
      >
        ✕
      </button>
    </div>
  );
}
