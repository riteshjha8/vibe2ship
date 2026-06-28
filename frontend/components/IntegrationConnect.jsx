"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function IntegrationConnect({ provider }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get("/integrations");
        const found = data.integrations.find((i) => i.type === provider);
        if (mounted) setStatus(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [provider]);

  async function handleConnect() {
    try {
      setLoading(true);
      const { data } = await api.post("/integrations/connect", { type: provider });
      if (data.landing && data.landingUrl) {
        window.open(data.landingUrl, "_blank");
        return;
      }
      if (data.oauth && data.redirectUrl) {
        // redirect browser to OAuth start (server will set state with user id)
        window.location.href = data.redirectUrl;
        return;
      }
      // fallback
      alert(data.message || "Started connection flow.");
    } catch (err) {
      console.error(err);
      alert("Failed to start connect flow");
    } finally {
      setLoading(false);
    }
  }

  if (!status) return null;

  return (
    <div className="p-3 rounded-xl border border-white/6 bg-slate-900/40">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{status.label}</div>
          <div className="text-xs text-slate-400">{status.connected ? `Connected as ${status.account}` : "Not connected"}</div>
        </div>
        <div>
          {status.connected ? (
            <button className="text-xs px-3 py-1 rounded-full bg-white/5">Connected</button>
          ) : (
            <button onClick={handleConnect} disabled={loading} className="text-xs px-3 py-1 rounded-full bg-gold-500 text-ink">
              {loading ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
