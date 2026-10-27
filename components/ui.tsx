"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";

// Initial states never branch on useReducedMotion: it is null on the server, so the branch causes a hydration
// mismatch. MotionConfig reducedMotion="user" in Shell skips the transforms and keeps the short fades.

/** Card with a heading row. Fades up on mount (feedback that new content arrived). Not whileInView: a card taller than
 *  the viewport never reaches the visibility threshold, so it stayed invisible until scrolled. */
export function Card({ title, sub, aside, children, className = "", delay = 0 }: { title: string; sub?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; delay?: number }) {
  const id = "h-" + title.toLowerCase().replace(/\W+/g, "-");
  return (
    <motion.section aria-labelledby={id} className={`card p-5 ${className}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}>
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
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <motion.div className="h-full origin-left rounded-full bg-accent" initial={{ scaleX: 0 }}
        animate={{ scaleX: max ? value / max : 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange(v: T): void; label: string }) {
  return (
    <div className="inline-flex rounded-[10px] bg-surface-2 p-0.5" role="group" aria-label={label}>
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}
          className="h-7 cursor-pointer rounded-[8px] px-3 text-[12px] font-medium text-muted transition aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card">{l}</button>
      ))}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}
