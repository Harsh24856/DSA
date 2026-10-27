"use client";
// Fixed background for photo themes: the photo (slow drift), a readability overlay, and the theme's effect.
import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { lookById, type Fx } from "@/lib/looks";
import { useStore } from "@/lib/store";

// fixed pseudo-random positions, so the layout is stable between renders
const seq = (n: number, seed: number) => Array.from({ length: n }, (_, i) => { const x = Math.sin(seed * 999 + i * 12.9898) * 43758.5453; return x - Math.floor(x); });

function Effect({ fx }: { fx: Fx }) {
  const r = useMemo(() => [seq(40, 1), seq(40, 2), seq(40, 3)], []);
  if (fx === "stars") return <>{r[0].slice(0, 36).map((x, i) => <span key={i} className="star" style={{ left: `${x * 100}%`, top: `${r[1][i] * 55}%`, animationDuration: `${2 + r[2][i] * 4}s`, animationDelay: `${-r[2][i] * 6}s` }} />)}</>;
  if (fx === "rain") return <>{r[0].slice(0, 28).map((x, i) => <span key={i} className="drop" style={{ left: `${x * 110}%`, animationDuration: `${0.7 + r[1][i] * 0.6}s`, animationDelay: `${-r[2][i] * 2}s`, opacity: 0.25 + r[1][i] * 0.35 }} />)}</>;
  return <>{r[0].slice(0, 16).map((x, i) => <span key={i} className="petal" style={{ left: `${x * 100}%`, animationDuration: `${9 + r[1][i] * 9}s`, animationDelay: `${-r[2][i] * 14}s`, ["--drift" as string]: `${(r[1][i] - 0.5) * 160}px`, transform: `scale(${0.7 + r[2][i] * 0.6})` }} />)}</>;
}

export function LookLayer() {
  const { look, ready } = useStore();
  const L = lookById(look);
  if (!ready || !L.photo) return null;
  const light = L.id === "pinksky";
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <AnimatePresence>
        <motion.img key={L.id} src={`${L.photo.src}&w=1920`} srcSet={`${L.photo.src}&w=1080 1080w, ${L.photo.src}&w=1920 1920w, ${L.photo.src}&w=2560 2560w`} sizes="100vw" alt=""
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }}
          className="look-photo absolute inset-0 h-full w-full object-cover" />
      </AnimatePresence>
      {/* darken (or lighten) so text on glass stays readable, strongest at the edges */}
      <div className="absolute inset-0" style={{ background: light
        ? "linear-gradient(180deg, color-mix(in oklab,var(--bg) 25%,transparent), color-mix(in oklab,var(--bg) 55%,transparent))"
        : "radial-gradient(120% 90% at 50% 30%, color-mix(in oklab,var(--bg) 22%,transparent), color-mix(in oklab,var(--bg) 62%,transparent))" }} />
      {L.fx && <Effect fx={L.fx} />}
    </div>
  );
}
