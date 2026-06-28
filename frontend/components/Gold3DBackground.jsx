"use client";
import { useEffect, useRef } from "react";

export default function Gold3DBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMove(e) {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const x = (cx / window.innerWidth - 0.5) * 2; // -1..1
      const y = (cy / window.innerHeight - 0.5) * 2;
      el.style.setProperty("--mx", String(x));
      el.style.setProperty("--my", String(y));
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="fixed inset-0 pointer-events-none -z-10">
      <div className="gold-3d-layer layer-1" />
      <div className="gold-3d-layer layer-2" />
      <div className="gold-3d-layer layer-3" />
      <div className="gold-3d-lights" />
    </div>
  );
}
