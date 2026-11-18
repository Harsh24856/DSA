// Stage 10 line-chart figures. Every point is computed from s10.calc.
import { chain, cosineBar, kvNumbers, linearBar, majority, n0, pct, r2, ssmNumbers, SSM } from "@/lib/genai2/stages/s10.calc";
import { Lines } from "./Lines";

const range = (a: number, b: number, s = 1) => Array.from({ length: Math.floor((b - a) / s) + 1 }, (_, i) => a + i * s);
const COLORS = ["var(--hard)", "var(--medium)", "var(--easy)"];

// reasoning-models: majority vote accuracy against the number of samples
const VP = [0.4, 0.6, 0.8], VN = range(1, 31, 2);
export function VoteCurves() {
  const series = VP.map((p, i) => ({ label: `p = ${p}`, color: COLORS[i], pts: VN.map((n) => [n, majority(p, n)] as [number, number]) }));
  return <Lines title={`Majority vote accuracy against samples. ${VP.map((p) => `p ${p}: ${pct(majority(p, 1))} at 1 sample, ${pct(majority(p, 31))} at 31`).join("; ")}. Voting helps only when one sample is right more than half the time.`}
    series={series} xMax={31} yMax={1} xLabel="samples (n), majority vote" yLabel="chance the vote is right" xTicks={[1, 11, 21, 31]} yTicks={[0, 0.25, 0.5, 0.75, 1]} yFmt={(v) => pct(v)}
    note="Wrong answers assumed to agree, the worst case." />;
}

// state-space-hybrids: decode memory per layer, attention against an SSM
const SN = range(0, 32, 2);
export function StateVsKv() {
  const { d, N } = SSM, kv = (n: number) => kvNumbers(n, d) / 1000, st = ssmNumbers(d, N) / 1000, cross = ssmNumbers(d, N) / kvNumbers(1, d);
  return <Lines title={`Numbers kept per layer while decoding, width ${d}. Attention keeps a key and a value per token, ${kvNumbers(1, d)} each, so its cache grows in a straight line. The state space layer keeps ${ssmNumbers(d, N)} numbers at any length; they cross at ${cross} tokens.`}
    series={[{ label: "attention", color: "var(--hard)", pts: SN.map((n) => [n, kv(n)]) }, { label: "SSM state", color: "var(--easy)", dash: "5 3", pts: SN.map((n) => [n, st]) }]}
    xMax={32} yMax={kv(32)} xLabel="tokens so far" yLabel="thousand numbers per layer" xTicks={[0, 8, 16, 24, 32]} yTicks={[0, 32, 64, 96, 128]}
    note={`Equal at ${cross} tokens; at 100K, attention keeps ${n0(kvNumbers(1e5, d) / ssmNumbers(d, N))} times more.`} />;
}

// diffusion-flow: image signal left at each step, linear and cosine schedules
const DT = range(0, 1000, 25);
export function NoiseCurves() {
  return <Lines title={`Share of the image signal, sqrt of alpha-bar, over 1000 steps. At step 500 the linear schedule keeps ${r2(Math.sqrt(linearBar(500)))} and the cosine schedule ${r2(Math.sqrt(cosineBar(500)))}. The linear one is near pure noise for its last few hundred steps.`}
    series={[{ label: "linear", color: "var(--medium)", pts: DT.map((t) => [t, Math.sqrt(linearBar(t))]) }, { label: "cosine", color: "var(--accent)", dash: "5 3", pts: DT.map((t) => [t, Math.sqrt(cosineBar(t))]) }]}
    xMax={1000} yMax={1} xLabel="step t (0 is the clean image)" yLabel="signal left" xTicks={[0, 250, 500, 750, 1000]} yTicks={[0, 0.25, 0.5, 0.75, 1]} yFmt={r2} />;
}

// coding-agents: chance an attempt succeeds against task length
const AP = [0.9, 0.95, 0.99], AK = range(1, 60);
export function AgentCurve() {
  const series = AP.map((p, i) => ({ label: `${pct(p)} a step`, color: COLORS[i], pts: AK.map((k) => [k, chain(p, k)] as [number, number]) }));
  return <Lines title={`Chance a whole task succeeds when every step must succeed. At 30 steps: ${AP.map((p) => `${pct(p)} per step gives ${pct(chain(p, 30))}`).join(", ")}.`}
    series={series} xMax={60} yMax={1} xLabel="steps in the task" yLabel="whole task right" xTicks={[1, 20, 40, 60]} yTicks={[0, 0.25, 0.5, 0.75, 1]} yFmt={(v) => pct(v)}
    note="Small per-step errors compound over long tasks." />;
}
