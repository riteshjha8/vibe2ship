"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◧" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/goals", label: "Goals", icon: "◎" },
  { href: "/habits", label: "Habits", icon: "↻" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/integrations", label: "Integrations", icon: "⛓" },
  { href: "/profile", label: "Profile", icon: "☼" },
];

export default function Shell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-sm">
        Loading your dashboard...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-60 flex-col border-r border-white/8 bg-[#0E1729] px-4 py-6 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-teal-400/70" />
            <span className="text-teal-400 text-xs font-bold">V2S</span>
          </span>
          <span className="font-display font-semibold text-base leading-tight">
            Vibe<span className="text-teal-400">2</span>Ship
          </span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? "bg-teal-400/10 text-teal-300" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="w-5 text-center opacity-80">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 pt-4 mt-4">
          <p className="text-xs text-slate-500 px-3 mb-2 truncate">{user.email}</p>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0E1729]">
          <span className="font-display font-semibold">
            Vibe<span className="text-teal-400">2</span>Ship
          </span>
          <button onClick={logout} className="text-xs text-slate-400">Sign out</button>
        </header>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-white/8 bg-[#0E1729]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                pathname?.startsWith(item.href) ? "bg-teal-400/15 text-teal-300" : "text-slate-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
