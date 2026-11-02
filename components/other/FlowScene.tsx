// Remotion compositions for the animated walk-throughs in lib/other/flows.ts. Four kinds: a chain a packet travels down,
// message lanes between participants, grids of real values that change step by step, and bars that grow and shrink.
// Only the picture lives here: the title, caption and controls are normal page text in FlowPlayer. Frame-driven, coloured
// with the page's tokens so every theme works, and sized phone-first.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Bar, BarFlow, ChainFlow, Flow, FlowTone, GridFlow, GridTable, LaneFlow } from "@/lib/other/flows";

export const FPS = 30, STEP = 100, W = 480;   // narrow canvas: on a phone it scales to about 55%, so text stays readable
const PAD = 20;
const CHAIN_BOX = 88, CHAIN_GAP = 40, LANE_HEAD = 72, LANE_ROW = 76, BAR_ROW = 64, CELL = 46, HEAD = 34, LABEL = 36, TABLE_GAP = 24;

const tableHeight = (t: GridTable) => (t.label ? LABEL : 0) + (t.head ? HEAD : 0) + t.rows.length * CELL;
export function flowHeight(f: Flow): number {
  switch (f.kind) {
    case "lanes": return PAD + LANE_HEAD + 16 + f.steps.length * LANE_ROW + 8;
    case "grid": return Math.max(...f.steps.map((s) => s.tables.reduce((h, t) => h + tableHeight(t) + TABLE_GAP, 0))) - TABLE_GAP + PAD * 2;
    case "bars": return PAD * 2 + f.steps[0].bars.length * BAR_ROW;
    default: return PAD * 2 + f.steps.length * (CHAIN_BOX + CHAIN_GAP) - CHAIN_GAP;
  }
}
export const flowFrames = (f: Flow) => f.steps.length * STEP;

const TONE: Record<FlowTone | "none", string> = { ok: "var(--easy)", bad: "var(--hard)", warn: "var(--medium)", hot: "var(--accent)", none: "var(--accent)" };
const mix = (pct: number, c: string) => `color-mix(in oklab, ${c} ${pct}%, var(--surface))`;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const stepOf = (frame: number, n: number) => Math.min(n - 1, Math.floor(frame / STEP));

function Chain({ flow }: { flow: ChainFlow }) {
  const frame = useCurrentFrame(), n = flow.steps.length, cur = stepOf(frame, n);
  return <>
    {flow.steps.map((s, i) => {
      const start = i * STEP, tone = TONE[s.tone ?? "none"], y = PAD + i * (CHAIN_BOX + CHAIN_GAP), lit = i === 0 ? 0 : start + 14;
      return (
        <div key={i}>
          {i > 0 && <>
            <div style={{ position: "absolute", left: W / 2 - 1.5, top: y - CHAIN_GAP, width: 3, height: CHAIN_GAP - 8, background: "var(--line-strong)" }} />
            <div style={{ position: "absolute", left: W / 2 - 9, top: y - 14, width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "12px solid var(--line-strong)" }} />
            <div style={{ position: "absolute", left: W / 2 - 11, width: 22, height: 22, borderRadius: 11, background: "var(--accent)",
              top: interpolate(frame, [start, start + 18], [y - CHAIN_GAP - 8, y - 16], { ...clamp, easing: ease }),
              opacity: interpolate(frame, [start - 1, start, start + 18, start + 22], [0, 1, 1, 0], clamp) }} />
          </>}
          <div style={{ position: "absolute", left: 16, right: 16, top: y, height: CHAIN_BOX, borderRadius: 16, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", fontSize: 24, fontWeight: 600, lineHeight: 1.12,
            border: `3px solid ${i === cur ? tone : "var(--line-strong)"}`, background: frame >= lit ? mix(s.tone ? 26 : 12, tone) : "var(--surface)",
            opacity: interpolate(frame, [lit - 6, lit + 6], [0.62, 1], clamp), scale: interpolate(frame, [lit, lit + 8, lit + 22], [1, 1.03, 1], { ...clamp, easing: ease }) }}>
            <span style={{ flex: "none", width: 36, height: 36, borderRadius: 18, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, background: mix(frame >= lit ? 55 : 15, tone) }}>{i + 1}</span>
            <span>{s.node}</span>
          </div>
        </div>
      );
    })}
  </>;
}

function Lanes({ flow }: { flow: LaneFlow }) {
  const frame = useCurrentFrame(), n = flow.steps.length, cur = stepOf(frame, n), L = flow.lanes.length;
  const x = (i: number) => (W / L) * (i + 0.5), bottom = PAD + LANE_HEAD + 16 + n * LANE_ROW;
  return <>
    {flow.lanes.map((name, i) => (
      <div key={name}>
        <div style={{ position: "absolute", left: x(i) - 1, top: PAD + LANE_HEAD, width: 2, height: bottom - PAD - LANE_HEAD, background: "var(--line-strong)" }} />
        <div style={{ position: "absolute", left: x(i) - W / L / 2 + 6, width: W / L - 12, top: PAD, height: LANE_HEAD - 8, borderRadius: 12, display: "grid", placeItems: "center", textAlign: "center", padding: 4, fontSize: L > 3 ? 17 : 21, fontWeight: 600, lineHeight: 1.1, background: "var(--surface)", border: "2px solid var(--line-strong)" }}>{name}</div>
      </div>
    ))}
    {flow.steps.map((s, i) => {
      const start = i * STEP, y = PAD + LANE_HEAD + 16 + i * LANE_ROW + 48, tone = TONE[s.tone ?? "none"];
      const self = s.from === s.to, a = x(s.from), b = x(s.to), left = Math.min(a, b), width = Math.abs(a - b), right = b > a;
      const shown = frame >= start, draw = interpolate(frame, [start + 4, start + 28], [0, 1], { ...clamp, easing: ease });
      const textW = s.label.length * 11.5 + 16, mid = self ? a : (a + b) / 2, cx = Math.max(textW / 2 + 4, Math.min(W - textW / 2 - 4, mid));
      const dim = i === cur ? 1 : 0.7;
      if (!shown) return null;
      return (
        <div key={i} style={{ opacity: i === cur ? interpolate(frame, [start, start + 8], [0, 1], clamp) : dim }}>
          <div style={{ position: "absolute", left: cx - textW / 2, width: textW, top: self ? y - 34 : y - 38, textAlign: "center", fontSize: 20, fontWeight: 600, lineHeight: "30px", whiteSpace: "nowrap", borderRadius: 8, background: self ? mix(26, tone) : "var(--bg)", border: self ? `2px solid ${tone}` : "none" }}>{s.label}</div>
          {!self && <>
            <div style={{ position: "absolute", left, top: y - 2, height: 4, width, borderRadius: 2, background: tone, transformOrigin: right ? "left" : "right", scale: `${draw} 1` }} />
            <div style={{ position: "absolute", top: y - 9, left: right ? a + width * draw - 16 : a - width * draw, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", ...(right ? { borderLeft: `16px solid ${tone}` } : { borderRight: `16px solid ${tone}` }) }} />
          </>}
        </div>
      );
    })}
  </>;
}

function Grid({ flow }: { flow: GridFlow }) {
  const frame = useCurrentFrame(), n = flow.steps.length, cur = stepOf(frame, n), f = frame - cur * STEP;
  const step = flow.steps[cur], prev = cur ? flow.steps[cur - 1] : null;
  const fade = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: ease });
  let y = PAD;
  return <>
    {step.tables.map((t, ti) => {
      const top = y; y += tableHeight(t) + TABLE_GAP;
      const cols = t.rows[0]?.length ?? t.head?.length ?? 1, rh = t.rowHead ? 56 : 0, cw = (W - PAD * 2 - rh) / cols, longest = Math.max(1, ...t.rows.flat().map((v) => String(v).length), ...(t.head ?? []).map((h) => h.length)), fs = Math.max(13, Math.min(cols > 6 ? 16 : cols > 4 ? 18 : 21, (cw - 12) / (longest * 0.56))), headY = top + (t.label ? LABEL : 0), bodyY = headY + (t.head ? HEAD : 0);
      const before = prev?.tables[ti];
      return (
        <div key={ti}>
          {t.label && <div style={{ position: "absolute", left: PAD, top, fontSize: 21, fontWeight: 600, color: "var(--muted)" }}>{t.label}</div>}
          {t.head?.map((h, c) => <div key={c} style={{ position: "absolute", left: PAD + rh + c * cw, width: cw, top: headY, height: HEAD, display: "grid", placeItems: "center", fontSize: fs - 3, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden" }}>{h}</div>)}
          {t.rows.map((row, r) => (
            <div key={r}>
              {t.rowHead && <div style={{ position: "absolute", left: PAD, width: rh - 6, top: bodyY + r * CELL, height: CELL, display: "flex", alignItems: "center", fontSize: fs - 3, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden" }}>{t.rowHead[r]}</div>}
              {row.map((v, c) => {
                const key = t.tones?.[`${r}:${c}`] ?? t.tones?.[`${r}`] ?? t.tones?.[`:${c}`];
                const changed = before ? before.rows[r]?.[c] !== v : false;
                return (
                  <div key={c} style={{ position: "absolute", left: PAD + rh + c * cw + 2, width: cw - 4, top: bodyY + r * CELL + 2, height: CELL - 4, borderRadius: 8, display: "grid", placeItems: "center", fontSize: fs, fontWeight: key ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden",
                    background: key ? mix(interpolate(fade, [0, 1], [8, 32]), TONE[key]) : "var(--surface)", border: `2px solid ${key ? TONE[key] : "var(--line)"}`,
                    scale: changed ? interpolate(f, [0, 8, 20], [0.92, 1.05, 1], { ...clamp, easing: ease }) : 1 }}>{v}</div>
                );
              })}
            </div>
          ))}
        </div>
      );
    })}
  </>;
}

function Bars({ flow }: { flow: BarFlow }) {
  const frame = useCurrentFrame(), n = flow.steps.length, cur = stepOf(frame, n), f = frame - cur * STEP;
  const step = flow.steps[cur], prev = flow.steps[cur - 1] ?? step;
  const max = flow.max ?? Math.max(...flow.steps.flatMap((s) => s.bars.map((b) => b.value)), 1e-9);
  const t = interpolate(f, [0, 36], [0, 1], { ...clamp, easing: ease });
  return <>
    {step.bars.map((b: Bar, i) => {
      const before = prev.bars[i]?.value ?? 0, v = before + (b.value - before) * t, y = PAD + i * BAR_ROW, labelW = 150, valueW = 92, track = W - PAD * 2 - labelW - valueW;
      const tone = TONE[b.tone ?? "none"];
      return (
        <div key={b.label}>
          <div style={{ position: "absolute", left: PAD, width: labelW - 10, top: y, height: BAR_ROW - 12, display: "flex", alignItems: "center", fontSize: 20, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>{b.label}</div>
          <div style={{ position: "absolute", left: PAD + labelW, width: track, top: y + 6, height: BAR_ROW - 24, borderRadius: 8, background: "var(--surface)", border: "2px solid var(--line)" }} />
          <div style={{ position: "absolute", left: PAD + labelW, width: track, top: y + 6, height: BAR_ROW - 24, borderRadius: 8, background: tone, transformOrigin: "left", scale: `${Math.max(0, v / max)} 1` }} />
          <div style={{ position: "absolute", left: PAD + labelW + track, width: valueW, top: y, height: BAR_ROW - 12, display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 19, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{(flow.format ?? ((x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(2))))(t >= 1 ? b.value : v)}</div>
        </div>
      );
    })}
  </>;
}

export function FlowScene({ flow }: { flow: Flow }) {
  return (
    <AbsoluteFill style={{ background: "var(--bg)", fontFamily: "var(--body)", color: "var(--ink)" }}>
      {flow.kind === "lanes" ? <Lanes flow={flow} /> : flow.kind === "grid" ? <Grid flow={flow} /> : flow.kind === "bars" ? <Bars flow={flow} /> : <Chain flow={flow} />}
    </AbsoluteFill>
  );
}
