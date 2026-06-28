"use client";
import Shell from "@/components/Shell";
import IntegrationPanel from "@/components/IntegrationPanel";

export default function IntegrationsPage() {
  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Integrations</h1>
          <p className="text-sm text-slate-400">Link GitHub, Discord, WhatsApp, payments, and more.</p>
        </div>
      </div>
      <IntegrationPanel />
    </Shell>
  );
}
