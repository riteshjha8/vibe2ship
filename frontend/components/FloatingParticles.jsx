"use client";
import { useEffect, useState } from "react";

const PARTICLE_COUNT = 24;

export default function FloatingParticles() {
  const [positions] = useState(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 3,
      scale: 0.4 + Math.random() * 0.8,
    }))
  );

  useEffect(() => {
    let frame = 0;
    const interval = window.setInterval(() => {
      positions.forEach((particle) => {
        particle.top += 0.08 + Math.random() * 0.08;
        if (particle.top > 104) {
          particle.top = -4;
          particle.left = Math.random() * 100;
        }
      });
      frame += 1;
      if (frame > 1200) frame = 0;
    }, 80);

    return () => window.clearInterval(interval);
  }, [positions]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {positions.map((particle, index) => (
        <div
          key={index}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            transform: `scale(${particle.scale})`,
          }}
          className="absolute rounded-full bg-white/10 blur-sm opacity-70 animate-float"
        />
      ))}
    </div>
  );
}
