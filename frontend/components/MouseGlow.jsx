"use client";
import { useEffect, useState } from "react";

export default function MouseGlow() {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    function handleMove(event) {
      setPosition({ x: event.clientX, y: event.clientY });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="pointer-events-none">
      <div
        className="absolute h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl transition-all duration-200"
        style={{ left: position.x, top: position.y }}
      />
    </div>
  );
}
