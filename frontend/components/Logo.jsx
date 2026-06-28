export default function Logo({ className = "", withText = true }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[2.75rem] bg-slate-950 shadow-[0_30px_40px_-24px_rgba(212,175,55,0.55)]">
        <span className="absolute inset-0 rounded-[2.75rem] bg-gradient-to-br from-gold-400 via-gold-500 to-slate-950 opacity-90 blur-[0.3px]" />
        <span className="absolute inset-2 rounded-[2.3rem] bg-slate-950/90" />

        <span className="absolute left-1/4 top-3 h-8 w-8 rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-slate-900 opacity-90 blur-sm animate-pulse-slow" />
        <span className="absolute right-1/4 bottom-3 h-8 w-8 rounded-full bg-gradient-to-br from-gold-400 via-gold-400 to-slate-950 opacity-90 blur-sm animate-pulse-slow" />

        <span className="relative h-10 w-10 rounded-[60%_35%_55%_55%] bg-gradient-to-br from-gold-400 via-gold-500 to-slate-900 shadow-inner shadow-slate-950/30 animate-bend">
          <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-[55%_40%_60%_40%] bg-gradient-to-br from-gold-300 to-slate-900 opacity-90 animate-stretch" />
          <span className="absolute inset-0 rounded-[60%_35%_55%_55%] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_35%)] opacity-70" />
        </span>
      </span>
      {withText ? (
        <div className="leading-tight">
          <p className="text-lg font-semibold tracking-tight">FinalPing <span className="text-gold-400">AI</span></p>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Urgent AI productivity</p>
        </div>
      ) : null}
      <style jsx>{`
        @keyframes bend {
          0%, 100% { transform: translateY(0px) rotate(-3deg); border-radius: 58% 42% 56% 44%; }
          50% { transform: translateY(-2px) rotate(3deg); border-radius: 42% 58% 45% 55%; }
        }
        @keyframes stretch {
          0%, 100% { transform: translate(-50%, -50%) scale(0.9); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        .animate-bend {
          animation: bend 2.8s ease-in-out infinite;
        }
        .animate-stretch {
          animation: stretch 2.4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 2.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
