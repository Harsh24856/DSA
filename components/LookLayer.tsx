"use client";
// Fixed background for picture themes: the picture (slow drift + pointer parallax), a readability overlay,
// and the theme's effect. Crossfades when the theme changes.
import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { lookById, type Fx } from "@/lib/looks";
import { useStore } from "@/lib/store";

// fixed pseudo-random positions, so the layout is stable between renders
const seq = (n: number, seed: number) => Array.from({ length: n }, (_, i) => { const x = Math.sin(seed * 999 + i * 12.9898) * 43758.5453; return x - Math.floor(x); });

function Effect({ fx, color }: { fx: Fx; color?: string }) {
  const r = useMemo(() => [seq(40, 1), seq(40, 2), seq(40, 3)], []);
  if (fx === "stars") return <>{r[0].slice(0, 36).map((x, i) => <span key={i} className="star" style={{ left: `${x * 100}%`, top: `${r[1][i] * 55}%`, animationDuration: `${2 + r[2][i] * 4}s`, animationDelay: `${-r[2][i] * 6}s` }} />)}</>;
  if (fx === "rain") return <>{r[0].slice(0, 28).map((x, i) => <span key={i} className="drop" style={{ left: `${x * 110}%`, animationDuration: `${0.7 + r[1][i] * 0.6}s`, animationDelay: `${-r[2][i] * 2}s`, opacity: 0.25 + r[1][i] * 0.35, ...(color ? { background: `linear-gradient(transparent, color-mix(in oklab, ${color} 60%, transparent))` } : {}) }} />)}</>;
  return <>{r[0].slice(0, 18).map((x, i) => <span key={i} className="petal" style={{ left: `${x * 100}%`, animationDuration: `${9 + r[1][i] * 9}s`, animationDelay: `${-r[2][i] * 14}s`, ["--drift" as string]: `${(r[1][i] - 0.5) * 160}px`, ["--petal" as string]: color, scale: 0.7 + r[2][i] * 0.6 }} />)}</>;
}

export function LookLayer() {
  const { look, ready } = useStore();
  const reduce = useReducedMotion();
  const L = lookById(look);
  // pointer parallax: the picture leans a few pixels away from the cursor
  const px = useMotionValue(0), py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20 }), sy = useSpring(py, { stiffness: 60, damping: 20 });
  const x = useTransform(sx, (v) => v * -14), y = useTransform(sy, (v) => v * -10);
  useEffect(() => {
    if (reduce || !matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => { px.set(e.clientX / innerWidth - 0.5); py.set(e.clientY / innerHeight - 0.5); };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, [reduce, px, py]);

  if (!ready || !L.photo) return null;
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <AnimatePresence>
        <motion.div key={L.id} className="absolute -inset-6" style={{ x, y }}
          initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
          <img src={L.photo.full} srcSet={`${L.photo.small} 1280w, ${L.photo.full} 2560w`} sizes="100vw" alt=""
            className="look-photo h-full w-full object-cover" style={{ objectPosition: L.photo.pos ?? "50% 50%" }} />
        </motion.div>
      </AnimatePresence>
      {/* darken (or lighten) so text on glass stays readable, strongest at the edges */}
      <div className="absolute inset-0" style={{ background: L.light
        ? "linear-gradient(180deg, color-mix(in oklab,var(--bg) 30%,transparent), color-mix(in oklab,var(--bg) 60%,transparent))"
        : "radial-gradient(120% 90% at 50% 30%, color-mix(in oklab,var(--bg) 22%,transparent), color-mix(in oklab,var(--bg) 62%,transparent))" }} />
      {L.fx && <Effect fx={L.fx} color={L.fxColor} />}
    </div>
  );
}
