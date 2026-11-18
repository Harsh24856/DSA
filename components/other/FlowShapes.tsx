// Remotion picture for "scene" walk-throughs (lib/other/flows.ts): dots, lines, boxes, curves and labels in canvas pixels.
// A shape with the same id in the previous step glides from its old place to the new one; a new shape fades in, a dropped
// one fades out, and a box whose colour changes cross-fades. Frame-driven and coloured with the page's tokens only.
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { SceneFlow, SceneTone, Shape } from "@/lib/other/flows";

const COLOR: Record<SceneTone, string> = { ok: "var(--easy)", bad: "var(--hard)", warn: "var(--medium)", hot: "var(--accent)", ink: "var(--ink)", muted: "var(--muted)" };
const mix = (pct: number, c: string) => `color-mix(in oklab, ${c} ${pct}%, var(--bg))`;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const NUM = ["x", "y", "x1", "y1", "x2", "y2", "w", "h", "r"] as const;

/** The shape part way (t from 0 to 1) from its previous version to this one. */
function blend(s: Shape, p: Shape | undefined, t: number): Shape {
  if (!p || p.t !== s.t || t >= 1) return s;
  const out: Record<string, unknown> = { ...s }, a = p as Record<string, unknown>, b = s as Record<string, unknown>;
  for (const k of NUM) if (typeof a[k] === "number" && typeof b[k] === "number") out[k] = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t;
  if (s.t === "path" && p.t === "path" && p.pts.length === s.pts.length) out.pts = s.pts.map((v, i) => p.pts[i] + (v - p.pts[i]) * t);
  return out as Shape;
}

function Draw({ s, opacity }: { s: Shape; opacity: number }) {
  const c = COLOR[s.tone ?? "ink"];
  switch (s.t) {
    case "dot": return <circle cx={s.x} cy={s.y} r={s.r ?? 7} opacity={opacity} fill={s.ring ? "var(--bg)" : c} stroke={c} strokeWidth={s.ring ? 3 : 0} />;
    case "line": return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} opacity={opacity} stroke={c} strokeWidth={s.w ?? 3} strokeDasharray={s.dash ? "8 6" : undefined} strokeLinecap="round" />;
    case "rect": return <rect x={s.x} y={s.y} width={Math.max(0, s.w)} height={Math.max(0, s.h)} opacity={opacity} fill={s.fill === 0 ? "none" : mix(s.fill ?? 20, c)} stroke={s.edge ? c : "none"} strokeWidth={2} />;
    case "path": {
      const d = s.pts.reduce((acc, v, i) => acc + (i % 2 ? `,${v.toFixed(1)}` : `${i ? " L" : "M"}${v.toFixed(1)}`), "");
      return <path d={d} opacity={opacity} fill="none" stroke={c} strokeWidth={s.w ?? 3} strokeDasharray={s.dash ? "8 6" : undefined} strokeLinejoin="round" />;
    }
    case "text": return <text x={s.x} y={s.y} opacity={opacity} fill={c} fontSize={s.size ?? 18} fontWeight={s.bold ? 700 : 500} textAnchor={s.anchor ?? "start"} dominantBaseline="central" style={{ fontVariantNumeric: "tabular-nums" }}>{s.text}</text>;
    case "node": {
      const lines = s.text.split("\n"), h = lines.length * 20 + 12;
      return (
        <g opacity={opacity}>
          <rect x={s.x - s.w / 2} y={s.y - h / 2} width={s.w} height={h} rx={10} fill={mix(s.tone ? 26 : 10, c)} stroke={s.tone ? c : "var(--line-strong)"} strokeWidth={2.5} />
          {lines.map((l, i) => <text key={i} x={s.x} y={s.y - h / 2 + 16 + i * 20} fill="var(--ink)" fontSize={16} fontWeight={i ? 500 : 650} textAnchor="middle" dominantBaseline="central" style={{ fontVariantNumeric: "tabular-nums" }}>{l}</text>)}
        </g>
      );
    }
  }
}

export function Shapes({ flow, width, stepLen }: { flow: SceneFlow; width: number; stepLen: number }) {
  const frame = useCurrentFrame(), n = flow.steps.length, cur = Math.min(n - 1, Math.floor(frame / stepLen)), f = frame - cur * stepLen;
  const now = flow.steps[cur].shapes, before = cur ? flow.steps[cur - 1].shapes : [];
  const prev = new Map(before.map((s) => [s.id, s])), ids = new Set(now.map((s) => s.id));
  const t = interpolate(f, [0, 32], [0, 1], { ...clamp, easing: ease });
  const fadeIn = interpolate(f, [6, 22], [0, 1], clamp), fadeOut = interpolate(f, [0, 12], [1, 0], clamp);
  return (
    <svg viewBox={`0 0 ${width} ${flow.height}`} width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
      {before.filter((s) => !ids.has(s.id)).map((s) => <Draw key={`gone-${s.id}`} s={s} opacity={fadeOut} />)}
      {now.map((s) => {
        const p = prev.get(s.id);
        if (!p) return <Draw key={s.id} s={s} opacity={cur ? fadeIn : 1} />;
        // a box that changes colour: the old colour underneath, the new one fading in on top
        if (s.t === "rect" && p.t === "rect" && (p.tone !== s.tone || p.fill !== s.fill)) return <g key={s.id}><Draw s={blend(p, undefined, 1)} opacity={1 - t} /><Draw s={s} opacity={t} /></g>;
        return <Draw key={s.id} s={blend(s, p, t)} opacity={1} />;
      })}
    </svg>
  );
}
