"use client";
// Small burst around a checkbox when a problem is ticked: feedback that it counted.
import { motion } from "motion/react";

const DOTS = Array.from({ length: 8 }, (_, k) => (k / 8) * Math.PI * 2);

export function TickBurst({ color = "var(--accent)" }: { color?: string }) {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      <motion.span className="absolute inset-0 rounded-full border-2" style={{ borderColor: color }}
        initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} />
      {DOTS.map((a) => (
        <motion.span key={a} className="absolute left-1/2 top-1/2 size-1.5 -ml-[3px] -mt-[3px] rounded-full" style={{ background: color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 20, y: Math.sin(a) * 20, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
      ))}
    </span>
  );
}
