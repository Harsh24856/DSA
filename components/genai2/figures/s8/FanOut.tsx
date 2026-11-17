// The same three subtasks done in turn by one agent, and at once by three workers. The slowest worker sets the parallel time. Times are computed.
import { useId } from "react";
import { fanTime } from "@/lib/genai2/stages/s8.calc";

const PLAN = 2, MERGE = 3;
const TASKS: [string, number][] = [["prices", 8], ["reviews", 12], ["specs", 6]];
const mins = TASKS.map(([, m]) => m);
const SEQ = fanTime(PLAN, mins, MERGE, false), PAR = fanTime(PLAN, mins, MERGE, true);
const W = 340, X0 = 64, SCALE = (W - X0 - 8) / SEQ, BAR = 20;
const x = (t: number) => X0 + t * SCALE;

type Seg = { label: string; t0: number; t1: number; tone: string };
function Row({ y, name, segs }: { y: number; name: string; segs: Seg[] }) {
  return (
    <g>
      <text x={0} y={y + 14} fontSize={12} fill="var(--ink)">{name}</text>
      {segs.map((s) => (
        <g key={s.label + s.t0}>
          <rect x={x(s.t0)} y={y} width={(s.t1 - s.t0) * SCALE - 2} height={BAR} rx={5} fill={s.tone} />
          {(s.t1 - s.t0) * SCALE > s.label.length * 6.4 + 6 && <text x={x(s.t0) + 4} y={y + 14} fontSize={11} fill={s.tone === "var(--accent)" ? "var(--accent-ink)" : "var(--ink)"}>{s.label}</text>}
        </g>
      ))}
    </g>
  );
}

export function FanOut() {
  const t = useId();
  let at = PLAN;
  const seqSegs: Seg[] = [{ label: "plan", t0: 0, t1: PLAN, tone: "var(--line)" },
    ...TASKS.map(([n, m]) => { const s = { label: n, t0: at, t1: at + m, tone: "var(--accent)" }; at += m; return s; }),
    { label: "merge", t0: at, t1: at + MERGE, tone: "var(--line)" }];
  const longest = Math.max(...mins);
  const top1 = 26, top2 = top1 + BAR + 46;
  return (
    <svg viewBox={`0 0 ${W} ${top2 + (TASKS.length + 2) * (BAR + 6) + 46}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`${TASKS.length} subtasks of ${mins.join(", ")} minutes, with ${PLAN} minutes to plan and ${MERGE} to merge. One agent in turn takes ${SEQ} minutes. ${TASKS.length} workers at once take ${PAR} minutes, set by the slowest subtask of ${longest} minutes.`}</title>
      <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`One agent, in turn: ${SEQ} min`}</text>
      <Row y={top1} name="agent" segs={seqSegs} />
      <text x={0} y={top2 - 12} fontSize={12} fontWeight={600} fill="var(--ink)">{`Lead and ${TASKS.length} workers: ${PAR} min`}</text>
      <Row y={top2} name="lead" segs={[{ label: "plan", t0: 0, t1: PLAN, tone: "var(--line)" }]} />
      {TASKS.map(([n, m], i) => <Row key={n} y={top2 + (i + 1) * (BAR + 6)} name={`worker ${i + 1}`} segs={[{ label: n, t0: PLAN, t1: PLAN + m, tone: "var(--accent)" }]} />)}
      <Row y={top2 + (TASKS.length + 1) * (BAR + 6)} name="lead" segs={[{ label: "merge", t0: PLAN + longest, t1: PAR, tone: "var(--line)" }]} />
      <line x1={x(PAR)} y1={top2 - 4} x2={x(PAR)} y2={top2 + (TASKS.length + 2) * (BAR + 6)} stroke="var(--easy)" strokeWidth={2} strokeDasharray="4 3" />
      <text x={0} y={top2 + (TASKS.length + 2) * (BAR + 6) + 18} fontSize={12} fill="var(--muted)">{`The slowest worker (${longest} min) sets the pace.`}</text>
      <text x={0} y={top2 + (TASKS.length + 2) * (BAR + 6) + 36} fontSize={12} fill="var(--muted)">Tokens are not saved: every worker still reads.</text>
    </svg>
  );
}
