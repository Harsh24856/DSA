// Remotion composition for lib/other/flows.ts: the whole chain is drawn dimmed, then a packet travels down it
// one step at a time, lighting each box and showing that step's caption. Sized phone-first (tall and narrow)
// and coloured with the page's tokens, so it follows the theme. Frame-driven only: no CSS transitions.
import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import type { Flow, FlowTone } from "@/lib/other/flows";

export const FPS = 30, STEP = 75, HOLD = 45;
export const W = 640, TOP = 84, BOX = 76, GAP = 46, CAPTION = 270;   // caption box + room for the player's controls
export const flowHeight = (n: number) => TOP + n * (BOX + GAP) - GAP + CAPTION;
export const flowFrames = (n: number) => n * STEP + HOLD;

const TONE: Record<FlowTone | "none", string> = { ok: "var(--easy)", bad: "var(--hard)", warn: "var(--medium)", hot: "var(--accent)", none: "var(--accent)" };
const mix = (pct: number, c: string) => `color-mix(in oklab, ${c} ${pct}%, var(--surface))`;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export function FlowScene({ flow }: { flow: Flow }) {
  const frame = useCurrentFrame();
  const n = flow.steps.length, cur = Math.min(n - 1, Math.floor(frame / STEP));
  const boxTop = (i: number) => TOP + i * (BOX + GAP);
  return (
    <AbsoluteFill style={{ background: "var(--bg)", fontFamily: "var(--body)", color: "var(--ink)" }}>
      <Interactive.Div name="Title" style={{ position: "absolute", left: 40, right: 40, top: 24, fontSize: 31, fontWeight: 700 }}>{flow.title}</Interactive.Div>
      {flow.steps.map((s, i) => {
        const start = i * STEP, tone = TONE[s.tone ?? "none"], y = boxTop(i);
        return (
          <div key={i}>
            {i > 0 && (
              <>
                <div style={{ position: "absolute", left: W / 2 - 1.5, top: y - GAP, width: 3, height: GAP - 8, background: "var(--line-strong)" }} />
                <div style={{ position: "absolute", left: W / 2 - 9, top: y - 14, width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "12px solid var(--line-strong)" }} />
                {/* the packet slides down the arrow just before its box lights up */}
                <Interactive.Div name={`Packet ${i}`} style={{
                  position: "absolute", left: W / 2 - 11, width: 22, height: 22, borderRadius: 11, background: "var(--accent)",
                  boxShadow: "0 0 18px var(--accent)",
                  top: interpolate(frame, [start - 18, start], [y - GAP - 6, y - 16], { ...clamp, easing: ease }),
                  opacity: interpolate(frame, [start - 20, start - 16, start, start + 4], [0, 1, 1, 0], clamp),
                }} />
              </>
            )}
            <Interactive.Div name={`Step ${i + 1}`} style={{
              position: "absolute", left: 44, right: 44, top: y, height: BOX, borderRadius: 16, display: "flex", alignItems: "center", gap: 16, padding: "0 22px",
              fontSize: 28, fontWeight: 600, lineHeight: 1.12,
              border: `3px solid ${i === cur && frame < n * STEP ? tone : "var(--line-strong)"}`,
              background: frame >= start ? mix(s.tone ? 26 : 12, tone) : "var(--surface)",
              opacity: interpolate(frame, [start - 6, start + 6], [0.4, 1], clamp),
              scale: interpolate(frame, [start, start + 8, start + 22], [1, 1.04, 1], { ...clamp, easing: ease }),
            }}>
              <span style={{ flex: "none", width: 38, height: 38, borderRadius: 19, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, background: mix(frame >= start ? 55 : 15, tone) }}>{i + 1}</span>
              <span>{s.node}</span>
            </Interactive.Div>
          </div>
        );
      })}
      <Interactive.Div name="Caption" key={cur} style={{
        position: "absolute", left: 40, right: 40, top: boxTop(n) - GAP + 26, minHeight: CAPTION - 150, borderRadius: 16, padding: "18px 22px",
        background: "var(--surface)", border: "2px solid var(--line)", fontSize: 27, lineHeight: 1.35,
        opacity: cur === 0 ? 1 : interpolate(frame - cur * STEP, [0, 10], [0, 1], clamp),
        translate: interpolate(frame - cur * STEP, [0, 14], ["0px 12px", "0px 0px"], { ...clamp, easing: ease }),
      }}>
        <span style={{ fontWeight: 700, color: TONE[flow.steps[cur].tone ?? "none"] }}>Step {cur + 1} of {n}. </span>{flow.steps[cur].note}
      </Interactive.Div>
    </AbsoluteFill>
  );
}
