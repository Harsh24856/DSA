"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";

/** Card with a heading row. Fades up when it scrolls into view (feedback that new content arrived). */
export function Card({ title, sub, aside, children, className = "", delay = 0 }: { title: string; sub?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const id = "h-" + title.toLowerCase().replace(/\W+/g, "-");
  return (
    <motion.section aria-labelledby={id} className={`card p-5 ${className}`}
      initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-[16px] font-semibold">{title}</h2>
          {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </motion.section>
  );
}

/** Number that counts up to its value, so changes read as change. */
export function Count({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    // prev tracks what is on screen, so an interrupted count resumes from where it stopped
    if (reduce || prev.current === value) { el.textContent = String(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { prev.current = v; el.textContent = String(Math.round(v)); }, onComplete: () => { prev.current = value; } });
    return () => c.stop();
  }, [value, inView, reduce]);
  return <span ref={ref} className={`num ${className}`}>0</span>;
}

export function Bar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <motion.div className="h-full origin-left rounded-full bg-accent" initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: max ? value / max : 0 }}
        animate={{ scaleX: max ? value / max : 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}

/** Segmented control (.seg). Used for chart ranges, how a problem was solved, and light/dark. */
export function Seg<T extends string>({ value, options, onChange, label, className = "" }: { value: T; options: readonly (readonly [T, string])[]; onChange(v: T): void; label: string; className?: string }) {
  return (
    <div className={`seg ${className}`} role="group" aria-label={label}>
      {options.map(([k, l]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Key number tile (Today and Analytics): icon + label, big number, one-line note. Fades up as the page arrives. */
export function Stat({ icon, label, children, note }: { icon: ReactNode; label: string; children: ReactNode; note: string }) {
  return (
    <motion.div className="card flex min-w-0 flex-col gap-2 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted"><span className="badge-icon">{icon}</span>{label}</div>
      <div className="flex min-w-0 items-baseline gap-1.5 text-[26px] font-semibold leading-none">{children}</div>
      <p className="line-clamp-2 text-[12px] text-muted">{note}</p>
    </motion.div>
  );
}
