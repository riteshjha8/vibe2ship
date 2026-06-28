export default function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[-12rem] top-12 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-gold-500/20 via-gold-400/10 to-transparent blur-[120px]" />
      <div className="absolute right-[-10rem] top-24 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-slate-800/20 via-gold-500/10 to-transparent blur-[110px]" />
      <div className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-gold-500/15 via-gold-400/0 to-transparent blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_30%)] opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_40%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'><path d=\'M0 0h120v120H0z\' fill=\'none\'/><path d=\'M0 0h120v120H0z\' fill=\'none\'/><path stroke=\'rgba(255,255,255,0.04)\' stroke-width=\'1\' d=\'M0 20h120M0 40h120M0 60h120M0 80h120M0 100h120M20 0v120M40 0v120M60 0v120M80 0v120M100 0v120\'/></svg>')] opacity-20" />
    </div>
  );
}
