// A roofline: what a GPU can reach at each arithmetic intensity (FLOPs per byte moved). Decode at batch 1 sits far left, under the memory slope; prefill sits on the flat compute roof. All values computed.
import { useId } from "react";
import { GPU, intensity, n0, ridge } from "@/lib/genai2/stages/s9.calc";

const W = 340, H = 236, L = 44, R = 8, T = 16, B = 40;
const X1 = 4, Y1 = Math.log10(2000);   // log10 ranges: 1 to 10,000 FLOPs per byte, 1 to 2,000 TFLOP/s
const x = (v: number) => L + (Math.log10(v) / X1) * (W - L - R);
const y = (v: number) => T + (1 - Math.log10(v) / Y1) * (H - T - B);
const reach = (ai: number) => Math.min(GPU.tflops, GPU.bw * ai);   // TB/s times FLOPs per byte = TFLOP/s
const RIDGE = ridge();
const PTS: [string, number, string][] = [["decode, batch 1", intensity(1), "var(--hard)"], ["decode, batch 64", intensity(64), "var(--medium)"], ["prefill, 2k tokens", 2048, "var(--easy)"]];
const r = (v: number) => (v >= 100 ? n0(v) : v.toFixed(1));

export function Roofline() {
  const t = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A roofline for an example GPU with ${GPU.bw} TB/s of memory bandwidth and ${GPU.tflops} TFLOP/s. The roof bends at about ${Math.round(RIDGE)} FLOPs per byte. Decode at batch 1 does about ${intensity(1)} FLOP per byte and reaches only ${r(reach(1))} TFLOP/s. Decode at batch 64 reaches ${r(reach(64))}. Prefill of 2,048 tokens sits on the compute roof.`}</title>
      {[1, 10, 100, 1000, 10000].map((v) => <g key={v}><line x1={x(v)} y1={T} x2={x(v)} y2={H - B} stroke="var(--line)" /><text x={x(v)} y={H - B + 14} fontSize={11} textAnchor="middle" fill="var(--muted)">{n0(v)}</text></g>)}
      {[1, 10, 100, 1000].map((v) => <g key={v}><line x1={L} y1={y(v)} x2={W - R} y2={y(v)} stroke="var(--line)" /><text x={L - 4} y={y(v) + 4} fontSize={11} textAnchor="end" fill="var(--muted)">{n0(v)}</text></g>)}
      <polyline points={[1, RIDGE, 10000].map((v) => `${x(v)},${y(reach(v))}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      <text x={x(4)} y={y(reach(4)) - 10} fontSize={11} fill="var(--ink)" transform={`rotate(-30 ${x(4)} ${y(reach(4)) - 10})`}>memory bound</text>
      <text x={x(RIDGE) + 6} y={y(GPU.tflops) - 6} fontSize={11} fill="var(--ink)">compute bound</text>
      <line x1={x(RIDGE)} y1={y(GPU.tflops)} x2={x(RIDGE)} y2={H - B} stroke="var(--accent)" strokeDasharray="3 3" />
      {PTS.map(([label, ai, c], i) => (
        <g key={label}>
          <circle cx={x(ai)} cy={y(reach(ai))} r={5} fill={c} />
          <text x={i === 2 ? x(ai) - 8 : x(ai) + 8} y={y(reach(ai)) + (i === 2 ? 18 : 4)} fontSize={11} textAnchor={i === 2 ? "end" : "start"} fill="var(--ink)">{label}</text>
        </g>
      ))}
      <text x={(L + W - R) / 2} y={H - 8} fontSize={11} textAnchor="middle" fill="var(--muted)">FLOPs per byte moved (log)</text>
      <text x={10} y={(T + H - B) / 2} fontSize={11} textAnchor="middle" fill="var(--muted)" transform={`rotate(-90 10 ${(T + H - B) / 2})`}>TFLOP/s reached (log)</text>
    </svg>
  );
}
