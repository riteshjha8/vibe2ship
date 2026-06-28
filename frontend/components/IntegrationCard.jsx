"use client";
import dayjs from "@/lib/dayjs";

export default function IntegrationCard({ integration, onConnect }) {
  return (
    <div className="glass-card rounded-xl p-4 border border-white/10 bg-slate-950/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display font-semibold text-sm text-slate-100">{integration.label}</h4>
          <p className="text-xs text-slate-500 mt-1">
            {integration.connected ? `Connected as ${integration.account}` : "Not connected"}
          </p>
          {integration.linkedAt && (
            <p className="text-[11px] text-slate-500 mt-1">
              Linked {dayjs(integration.linkedAt).format("D MMM YYYY")}
            </p>
          )}
          {integration.payment?.instructions && !integration.connected && (
            <p className="text-[11px] text-slate-400 mt-2">{integration.payment.instructions}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onConnect(integration.type, integration.label)}
          className={`text-xs px-3 py-2 rounded-full font-semibold transition bg-gold-500 text-ink hover:bg-gold-400`}
        >
          {integration.landingUrl ? "Open" : integration.payment?.setupUrl ? "Set up" : "Open"}
        </button>
      </div>
    </div>
  );
}
