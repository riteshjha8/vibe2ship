"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FloatingAssistant from "@/components/FloatingAssistant";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◧" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/goals", label: "Goals", icon: "◎" },
  { href: "/habits", label: "Habits", icon: "↻" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/integrations", label: "Integrations", icon: "⛓" },
  { href: "/quick-attender", label: "Quick Attender", icon: "⚡" },
  { href: "/profile", label: "Profile", icon: "☼" },
];

export default function Shell({ children }) {
  const { user, loading, loggingOut, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !loggingOut && !user) router.replace("/");
  }, [loading, loggingOut, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-sm">
        Loading your dashboard...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-slate-950 focus:rounded focus:font-bold"
      >
        Skip to main content
      </a>

      <aside 
        className="hidden md:flex md:w-72 flex-col border-r border-slate-800 bg-slate-950 px-6 py-6"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="space-y-3">
          <Link href="/dashboard" aria-label="Home - Vibe2Ship" className="flex items-center gap-4">
            <Logo />
          </Link>

          <nav className="space-y-2" aria-label="Navigation menu">
            {NAV.slice(0, 1).map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-gold-300 shadow-[0_10px_30px_-20px_rgba(217,165,59,0.8)]"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="w-6 text-center text-slate-500" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {NAV.slice(1).map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-gold-300 shadow-[0_10px_30px_-20px_rgba(217,165,59,0.8)]"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="w-6 text-center text-slate-500" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header 
          className="md:hidden flex items-center justify-between px-3 py-3 border-b border-slate-800 bg-slate-950"
          role="banner"
        >
          <Logo withText={false} />
          <button 
            onClick={logout} 
            className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </header>

        <nav 
          className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-slate-800 bg-slate-950"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
              className={`rounded-full border border-slate-800 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition whitespace-nowrap ${
                pathname?.startsWith(item.href) ? "bg-gold-500/10 text-gold-300" : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main 
          id="main-content" 
          className="flex-1 px-3 py-2 sm:p-4 max-w-6xl w-full mx-auto"
          role="main"
        >
          {children}
        </main>
        <footer 
          className="border-t border-slate-800 bg-slate-950 px-3 py-6 sm:px-4 sm:py-10"
          role="contentinfo"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Logo withText={false} />
                <div>
                  <p className="text-base font-semibold text-slate-100">FinalPing AI</p>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Urgent AI productivity</p>
                </div>
              </div>
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</p>
                <p className="text-base leading-7 text-slate-300">
                  FinalPing AI is the best place to reach me for work, collaboration, or a product demo. I respond quickly to email and professional messages.
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm text-slate-300 sm:gap-3 sm:w-[320px]">
              <a
                href="mailto:finalping70@gmail.com"
                className="flex items-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl bg-white/5 px-3 sm:px-4 py-2 sm:py-3 transition hover:bg-white/10"
              >
                <span className="inline-flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-lg sm:rounded-2xl bg-gold-400/10 text-sm sm:text-base text-gold-300">✉️</span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-100 text-xs sm:text-sm">Email</p>
                  <p className="text-slate-400 truncate text-xs sm:text-sm">finalping70@gmail.com</p>
                </div>
              </a>
              <a
                href="https://github.com/riteshjha8"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-3xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.222-.253-4.556-1.111-4.556-4.944 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.845a9.56 9.56 0 012.5.336c1.909-1.295 2.748-1.026 2.748-1.026.546 1.376.203 2.393.1 2.646.64.698 1.03 1.591 1.03 2.682 0 3.842-2.337 4.687-4.566 4.935.36.31.68.923.68 1.86 0 1.342-.012 2.423-.012 2.753 0 .268.18.58.688.482A10.01 10.01 0 0022 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium text-slate-100">GitHub</p>
                  <p className="text-slate-400">riteshjha8</p>
                </div>
              </a>
              <a
                href="https://www.linkedin.com/in/ritesh-jha-436a54346/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-3xl bg-white/5 px-4 py-3 transition hover:bg-white/10"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.5h4.56V24H.22V8.5zm7.13 0h4.37v2.14h.06c.61-1.15 2.08-2.36 4.28-2.36 4.58 0 5.43 3.02 5.43 6.94V24h-4.56v-7.75c0-1.85-.03-4.23-2.58-4.23-2.58 0-2.98 2.02-2.98 4.10V24H7.35V8.5z" />
                  </svg>
                </span>
                <div>
                  <p className="font-medium text-slate-100">LinkedIn</p>
                  <p className="text-slate-400">ritesh-jha-436a54346</p>
                </div>
              </a>
            </div>
          </div>
        </footer>
      </div>
      <FloatingAssistant />
    </div>
  );
}
