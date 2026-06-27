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
      setMessage("");
    } catch (error) {
      console.error("Integration load failed", error);
      setMessage("Unable to load integrations. Check your backend or network connection.");
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
        // For native app protocols, ask first before opening external apps.
        if (local.appProtocol && local.landingUrl) {
          const promptMessage = type === "vscode"
            ? `Open ${label} in VS Code desktop? Press OK for desktop or Cancel for browser.`
            : `Open ${label} in the native app? Press Cancel to open the browser version instead.`;
          const openNative = window.confirm(promptMessage);
          if (openNative) {
            await tryOpenApp(local.appProtocol, local.landingUrl, 2000);
            setMessage(`Attempted to open ${label} native app.`);
            return;
          }
          window.open(local.landingUrl, "_blank");
          setMessage(`${label} opened in browser.`);
          return;
        }

        await tryOpenApp(null, local.landingUrl, 2000);
        setMessage(`${label} opened in a new tab.`);
        return;
      }
      const { data } = await api.post("/integrations/connect", { type, account: `${label} account` });
      if (data.landing && data.landingUrl) {
        if (data.appProtocol && data.landingUrl && type === "vscode") {
          const openNative = window.confirm(`Open ${label} in VS Code desktop? Press OK for desktop or Cancel for browser.`);
          if (openNative) {
            await tryOpenApp(data.appProtocol, data.landingUrl, 2000);
            setMessage(`Attempted to open ${label} native app.`);
            return;
          }
          window.open(data.landingUrl, "_blank");
          setMessage(`${label} opened in browser.`);
          return;
        }

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
