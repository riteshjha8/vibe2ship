"use client";
/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a graceful error UI instead of
 * crashing the entire application.
 * 
 * @component
 * @example
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ChildComponent />
 * </ErrorBoundary>
 */
import { useEffect, useState } from "react";

export default function ErrorBoundary({ children, fallback }) {
  const [error, setError] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleError = (event) => {
      console.error("Error caught by boundary:", event.error);
      setError(event.error || new Error("An unexpected error occurred"));
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (!isHydrated) return null;
  
  if (error) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="glass-card rounded-lg sm:rounded-xl p-6 sm:p-8 max-w-md w-full border border-red-500/20 bg-red-950/20">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-red-300 mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
              We encountered an unexpected error. Please try refreshing the page or contacting support.
            </p>
            <div className="bg-slate-900/50 rounded px-3 sm:px-4 py-2 sm:py-3 mb-4 border border-slate-700/50">
              <p className="text-[10px] sm:text-xs text-slate-500 font-mono break-words">
                {error.message || "Unknown error"}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gold-500 hover:bg-gold-600 text-slate-950 font-semibold text-xs sm:text-sm transition"
              >
                Refresh Page
              </button>
              <button
                onClick={() => setError(null)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )
    );
  }

  return children;
}
