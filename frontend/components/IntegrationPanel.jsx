"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import tryOpenApp from "@/lib/launchApp";
import IntegrationCard from "./IntegrationCard";

export default function IntegrationPanel() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/integrations");
      setIntegrations(data.integrations || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function connect(type, label) {
    setMessage(`Connecting ${label}...`);
    try {
      // If we already have a landing URL for this integration, open it directly
      const local = integrations.find((i) => i.type === type);
      if (local && local.landingUrl) {
        // Special case: for VS Code offer choice between desktop app and browser
        if (type === "vscode" && local.appProtocol && local.landingUrl) {
          const openDesktop = window.confirm("Open in VS Code desktop app? OK = Desktop, Cancel = Browser");
          if (openDesktop) {
            await tryOpenApp(local.appProtocol, local.landingUrl, 2000);
            setMessage(`Attempted to open VS Code desktop app.`);
            return;
          }
          // fallthrough: open in browser
          window.open(local.landingUrl, "_blank");
          setMessage(`${label} opened in browser.`);
          return;
        }

        await tryOpenApp(local.appProtocol || null, local.landingUrl, 2000);
        setMessage(`${label} opened in a new tab.`);
        return;
      }
      const { data } = await api.post("/integrations/connect", { type, account: `${label} account` });
      if (data.landing && data.landingUrl) {
        // Attempt intelligent app launch: try native app protocol first, fallback to web URL after 2s
        await tryOpenApp(data.appProtocol || null, data.landingUrl, 2000);
        // Do not change integration state — opening provider should not mark it connected.
        setMessage(`${label} opened in a new tab.`);
        return;
      }
      if (data.oauth && data.redirectUrl) {
        // Open OAuth start in a new tab so the user stays in the app
        window.open(data.redirectUrl, "_blank");
        return;
      }
      if (data.payment?.setupUrl) {
        window.open(data.payment.setupUrl, "_blank");
        setMessage(data.payment.instructions || "Open the payment setup page in a new tab.");
      }
      setIntegrations(data.integrations || integrations);
    } catch {
      setMessage("Unable to connect integration right now.");
    }
  }

  async function disconnect(type) {
    setMessage("Disconnecting…");
    try {
      await api.post("/integrations/disconnect", { type });
      setIntegrations((prev) => prev.map((item) => (item.type === type ? { ...item, connected: false, account: "", linkedAt: null } : item)));
      setMessage("Integration disconnected.");
    } catch {
      setMessage("Unable to disconnect integration right now.");
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-white/10 bg-slate-950/80">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Integrations</h3>
          <p className="text-sm text-slate-400">Connect the services that matter for email, calendar, docs, payments, and workflow automation.</p>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading integrations…</p>
      ) : (
        <div className="grid gap-3">{integrations.map((integration) => (
          <IntegrationCard
            key={integration.type}
            integration={integration}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        ))}</div>
      )}
      {message && <p className="text-xs text-slate-400 mt-3">{message}</p>}
    </div>
  );
}
