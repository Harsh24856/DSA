"use client";
// Shared pieces for the Gen AI labs: the lab frame, a labelled slider, a play/step ticker and token color mixes.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Flask } from "@phosphor-icons/react";

export function Lab({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="gx-lab" aria-label={`Interactive lab: ${title}`}>
      <div className="flex items-center gap-2.5">
        <span className="badge-icon"><Flask size={16} weight="fill" aria-hidden /></span>
        <div className="min-w-0">
          <div className="gx-lab-tag">Try it</div>
          <div className="text-[15px] font-semibold leading-tight">{title}</div>
        </div>
      </div>
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
      {children}
    </section>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, show }: { label: string; value: number; min: number; max: number; step?: number; onChange(v: number): void; show?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="grid gap-1 text-[13px]">
      <span className="flex justify-between gap-2"><span className="text-muted">{label}</span><span className="num font-semibold">{show ?? value}</span></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="gx-range" />
    </label>
  );
}

/** Calls `tick` every `ms` while `on`; the latest tick is always used, so it can read fresh state. */
export function useTicker(on: boolean, ms: number, tick: () => void) {
  const ref = useRef(tick);
  ref.current = tick;
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [on, ms]);
}

/** Accent (or another token) mixed into the surface: pct 0 = surface, 100 = full color. Keep it at 40 or less under ink text. */
export const tint = (pct: number, color = "var(--accent)") => `color-mix(in oklab, ${color} ${Math.round(Math.max(0, Math.min(100, pct)))}%, var(--surface))`;
export const spring = { type: "spring", stiffness: 260, damping: 30 } as const;
