export default function StatsCard({ label, value, accent = "#C9982A" }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-mono text-2xl font-semibold" style={{ color: accent }}>{value}</p>
    </div>
  );
}
