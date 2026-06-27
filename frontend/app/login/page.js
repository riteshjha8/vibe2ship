"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="glass-card rounded-2xl w-full max-w-sm p-8 space-y-4">
        <Link href="/" className="font-display font-semibold text-lg block mb-2">
          FinalPing <span className="text-teal-400">AI</span>
        </Link>
        <h1 className="font-display text-xl font-semibold">Welcome back</h1>
        {error && <p className="text-sm text-alarm-500">{error}</p>}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none"
          />
        </div>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 text-ink font-medium py-2.5 transition disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-slate-400 text-center">
          No account? <Link href="/register" className="text-teal-400 hover:underline">Create one</Link>
        </p>
      </form>
    </main>
  );
}
