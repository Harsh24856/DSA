// A two-step tree of next-word probabilities: greedy takes the best first word, but the most likely sentence starts with the second.
import { useId } from "react";
import { TREE } from "@/lib/genai2/stages/s4.flows";

const W = 340, r2 = (x: number) => x.toFixed(2);
const leaves = TREE.first.flatMap(([a, pa]) => TREE.second[a].map(([b, pb]) => ({ a, b, p: pa * pb })));
const best = leaves.reduce((m, l) => (l.p > m.p ? l : m));
const g1 = TREE.first.reduce((m, x) => (x[1] > m[1] ? x : m)), g2 = TREE.second[g1[0]].reduce((m, x) => (x[1] > m[1] ? x : m));
const LW = W / leaves.length, leafX = (i: number) => LW * i + LW / 2;
const FIRST = TREE.first.map(([a, p]) => { const idx = leaves.flatMap((l, i) => (l.a === a ? [i] : [])); return { a, p, x: (leafX(idx[0]) + leafX(idx[idx.length - 1])) / 2 }; });

export function DecodeTree() {
  const titleId = useId();
  const tone = (a: string, b?: string) => (a === best.a && (!b || b === best.b) ? "var(--easy)" : a === g1[0] && (!b || b === g2[0]) ? "var(--medium)" : "var(--line-strong)");
  return (
    <svg viewBox={`0 0 ${W} 262`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A tree of next words after "the". ${FIRST.map((f) => `${f.a} ${r2(f.p)}`).join(", ")}. Greedy takes ${g1[0]}, then ${g2[0]}: ${r2(g1[1])} times ${r2(g2[1])} = ${r2(g1[1] * g2[1])}. The most likely sentence is the ${best.a} ${best.b}, with ${r2(best.p)}.`}</title>
      <text x={W / 2} y={18} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">the</text>
      {FIRST.map((f) => (
        <g key={f.a}>
          <line x1={W / 2} y1={26} x2={f.x} y2={72} stroke={tone(f.a)} strokeWidth={f.a === best.a || f.a === g1[0] ? 2.5 : 1} />
          <text x={(W / 2 + f.x) / 2 + (f.x < W / 2 ? -14 : 14)} y={50} textAnchor="middle" fontSize={13} fill="var(--muted)">{r2(f.p)}</text>
          <text x={f.x} y={88} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">{f.a}</text>
        </g>
      ))}
      {leaves.map((l, i) => {
        const f = FIRST.find((x) => x.a === l.a)!;
        return (
          <g key={l.a + l.b}>
            <line x1={f.x} y1={96} x2={leafX(i)} y2={138} stroke={tone(l.a, l.b)} strokeWidth={(l.a === best.a && l.b === best.b) || (l.a === g1[0] && l.b === g2[0]) ? 2.5 : 1} />
            <text x={leafX(i)} y={154} textAnchor="middle" fontSize={13} fill="var(--ink)">{l.b}</text>
            <text x={leafX(i)} y={172} textAnchor="middle" fontSize={13} fill="var(--muted)">{r2(l.p)}</text>
          </g>
        );
      })}
      <text x={8} y={208} fontSize={13} fill="var(--ink)"><tspan fontWeight={600} fill="var(--medium)">greedy:</tspan> the {g1[0]} {g2[0]} = {r2(g1[1])} x {r2(g2[1])} = {r2(g1[1] * g2[1])}</text>
      <text x={8} y={230} fontSize={13} fill="var(--ink)"><tspan fontWeight={600} fill="var(--easy)">best:</tspan> the {best.a} {best.b} = {r2(TREE.first.find((x) => x[0] === best.a)![1])} x {r2(TREE.second[best.a].find((x) => x[0] === best.b)![1])} = {r2(best.p)}</text>
      <text x={8} y={252} fontSize={13} fill="var(--muted)">bottom numbers: probability of the whole sentence</text>
    </svg>
  );
}
