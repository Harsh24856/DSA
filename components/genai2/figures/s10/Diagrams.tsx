// Stage 10 diagram figures. Counts and sizes computed from s10.calc.
import { useId } from "react";
import { B, CLIP_FIG, CTX_STEPS, kTok, kvGB, LC, moeCount, n0, patchTokens, route, ROUTE_EX, VOICE, videoTokens } from "@/lib/genai2/stages/s10.calc";

const W = 340;

// mixture-of-experts: one token, a router, 8 experts, 2 of them run
export function MoeLayer() {
  const t = useId(), [tok, s] = ROUTE_EX[0], { top } = route(s, 2), on = new Map(top.map((x) => [x.e, x.w])), m = moeCount();
  const bw = 36, gap = (W - 8 * bw) / 7;
  return (
    <svg viewBox={`0 0 ${W} 250`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`The token "${tok}" goes to a router, which scores 8 expert feed-forward networks. Only experts ${top.map((x) => x.e + 1).join(" and ")} run, with weights ${top.map((x) => x.w.toFixed(2)).join(" and ")}. The example model stores ${B(m.total)} parameters but uses ${B(m.active)} per token.`}</title>
      <rect x={130} y={4} width={80} height={26} rx={8} fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x={170} y={21} fontSize={12} textAnchor="middle" fill="var(--ink)">{`token "${tok}"`}</text>
      <rect x={110} y={46} width={120} height={26} rx={8} fill="var(--surface-2)" stroke="var(--line-strong)" />
      <text x={170} y={63} fontSize={12} textAnchor="middle" fill="var(--ink)">router: top 2 of 8</text>
      <line x1={170} y1={30} x2={170} y2={46} stroke="var(--line-strong)" />
      {Array.from({ length: 8 }, (_, e) => {
        const x = e * (bw + gap), lit = on.has(e);
        return (
          <g key={e}>
            <line x1={170} y1={72} x2={x + bw / 2} y2={104} stroke={lit ? "var(--accent)" : "var(--line)"} strokeWidth={lit ? 2 : 1} strokeDasharray={lit ? undefined : "3 3"} />
            <rect x={x} y={104} width={bw} height={44} rx={6} fill={lit ? "var(--accent)" : "var(--surface-2)"} stroke={lit ? "var(--accent)" : "var(--line-strong)"} />
            <text x={x + bw / 2} y={124} fontSize={11} textAnchor="middle" fill={lit ? "var(--accent-ink)" : "var(--muted)"}>{`E${e + 1}`}</text>
            <text x={x + bw / 2} y={140} fontSize={10} textAnchor="middle" fill={lit ? "var(--accent-ink)" : "var(--muted)"}>{lit ? on.get(e)!.toFixed(2) : "off"}</text>
          </g>
        );
      })}
      <text x={0} y={172} fontSize={11} fill="var(--muted)">Output: the two experts' outputs, mixed by those weights.</text>
      {([["stored", m.total, "var(--medium)"], ["used per token", m.active, "var(--accent)"]] as const).map(([label, v, c], i) => (
        <g key={label}>
          <text x={0} y={200 + i * 24} fontSize={11} fill="var(--ink)">{label}</text>
          <rect x={96} y={189 + i * 24} width={((W - 150) * v) / m.total} height={14} rx={3} fill={c} />
          <text x={100 + ((W - 150) * v) / m.total} y={200 + i * 24} fontSize={11} fill="var(--ink)">{B(v)}</text>
        </g>
      ))}
    </svg>
  );
}

// long-context: KV cache size at growing context, against the weights
export function CtxMemory() {
  const t = useId(), L = 44, R = 50, max = kvGB(CTX_STEPS[CTX_STEPS.length - 1]), sx = (gb: number) => ((W - L - R) * gb) / max;
  return (
    <svg viewBox={`0 0 ${W} ${CTX_STEPS.length * 30 + 60}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`KV cache of one request for an example 8B model with ${LC.kvHeads} KV heads: ${CTX_STEPS.map((n) => `${kTok(n)} tokens ${kvGB(n).toFixed(1)} GB`).join(", ")}. The weights are ${LC.weightsGB} GB, so past about 128K tokens the cache is bigger than the model.`}</title>
      <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">KV cache for one request, GB</text>
      {CTX_STEPS.map((n, i) => {
        const gb = kvGB(n), y = 26 + i * 30, over = gb > LC.weightsGB;
        return (
          <g key={n}>
            <text x={0} y={y + 13} fontSize={11} fill="var(--muted)">{kTok(n)}</text>
            <rect x={L} y={y} width={Math.max(2, sx(gb))} height={18} rx={3} fill={over ? "var(--hard)" : "var(--accent)"} />
            <text x={L + Math.max(2, sx(gb)) + 4} y={y + 13} fontSize={11} fill="var(--ink)">{gb.toFixed(1)}</text>
          </g>
        );
      })}
      <line x1={L + sx(LC.weightsGB)} y1={22} x2={L + sx(LC.weightsGB)} y2={26 + CTX_STEPS.length * 30} stroke="var(--ink)" strokeDasharray="4 3" />
      <text x={L + sx(LC.weightsGB) + 4} y={40 + CTX_STEPS.length * 30} fontSize={11} fill="var(--ink)">{`weights: ${LC.weightsGB} GB`}</text>
    </svg>
  );
}

// vision-language: an image cut into patches, each one a token
export function PatchGrid() {
  const t = useId(), side = 224, patch = 28, n = side / patch, cell = 16, toks = patchTokens(side, side, 14);
  return (
    <svg viewBox={`0 0 ${W} 200`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A ${side} by ${side} image drawn as an ${n} by ${n} grid of ${patch} pixel patches, ${n * n} in all. Each patch is flattened into a vector and becomes one token in the language model's input, after the text tokens of the question. With 14 pixel patches the same image is ${toks} tokens.`}</title>
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n), c = i % n, hot = r === 2 && c === 5;
        return <rect key={i} x={c * cell} y={10 + r * cell} width={cell - 1} height={cell - 1} fill={hot ? "var(--accent)" : (r + c) % 2 ? "var(--surface-2)" : "var(--line)"} />;
      })}
      <text x={0} y={10 + n * cell + 16} fontSize={11} fill="var(--muted)">{`${side} x ${side} px, ${patch} px patches: ${n * n}`}</text>
      <line x1={n * cell + 6} y1={10 + 2.5 * cell} x2={n * cell + 34} y2={10 + 2.5 * cell} stroke="var(--accent)" strokeWidth={2} markerEnd="url(#s10arr)" />
      <defs><marker id="s10arr" viewBox="0 0 8 8" refX={6} refY={4} markerWidth={6} markerHeight={6} orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--accent)" /></marker></defs>
      <text x={n * cell + 44} y={22} fontSize={11} fill="var(--ink)">LLM input, in order</text>
      {["What", "is", "this", "?", "img 1", "img 2", "...", `img ${n * n}`].map((w, i) => {
        const y = 32 + i * 18, img = w.startsWith("img");
        return (
          <g key={w + i}>
            <rect x={n * cell + 44} y={y} width={96} height={15} rx={4} fill={img ? "var(--accent-soft)" : "var(--surface-2)"} stroke={i === 5 ? "var(--accent)" : "var(--line)"} />
            <text x={n * cell + 50} y={y + 11} fontSize={10} fill="var(--ink)">{w}</text>
          </g>
        );
      })}
      <text x={0} y={192} fontSize={11} fill="var(--muted)">{`At 14 px patches the same image costs ${toks} tokens.`}</text>
    </svg>
  );
}

// voice-realtime: a streaming cascade as a timeline; each stage starts on the last one's first output
export function VoiceTimeline() {
  const t = useId(), L = 92, parts: [string, number][] = [["end of turn", VOICE.endpoint], ["speech to text", VOICE.stt], ["LLM first token", VOICE.llm], ["first audio", VOICE.tts], ["network", VOICE.net]];
  const total = parts.reduce((a, [, v]) => a + v, 0), sx = (ms: number) => ((W - L - 10) * ms) / total;
  let at = 0;
  return (
    <svg viewBox={`0 0 ${W} ${parts.length * 24 + 56}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Time from the user stopping to the first sound: ${parts.map(([n, v]) => `${n} ${v} ms`).join(", ")}, ${total} ms in all. Each bar starts where the one before it produced its first output.`}</title>
      {parts.map(([name, v], i) => {
        const x = L + sx(at); at += v;
        return (
          <g key={name}>
            <text x={0} y={i * 24 + 16} fontSize={11} fill="var(--muted)">{name}</text>
            <rect x={x} y={i * 24 + 4} width={sx(v)} height={16} rx={3} fill={i === 2 ? "var(--accent)" : "var(--medium)"} />
            {sx(v) > 26 ? <text x={x + 3} y={i * 24 + 16} fontSize={10} fill="var(--accent-ink)">{v}</text> : <text x={x - 3} y={i * 24 + 16} fontSize={10} textAnchor="end" fill="var(--ink)">{v}</text>}
          </g>
        );
      })}
      <line x1={L} y1={parts.length * 24 + 8} x2={W - 10} y2={parts.length * 24 + 8} stroke="var(--line-strong)" />
      <text x={L} y={parts.length * 24 + 24} fontSize={10} fill="var(--muted)">0 ms</text>
      <text x={W - 10} y={parts.length * 24 + 24} fontSize={10} textAnchor="end" fill="var(--ink)">{`${total} ms`}</text>
      <text x={0} y={parts.length * 24 + 46} fontSize={11} fill="var(--muted)">Example numbers. The LLM keeps talking while audio plays.</text>
    </svg>
  );
}

// video-world: a clip as a stack of latent frames, each cut into patches
export function SpaceTime() {
  const t = useId(), v = videoTokens(CLIP_FIG.seconds, CLIP_FIG.fps, CLIP_FIG.w, CLIP_FIG.h), shown = 5, fw = 150, fh = 84, dx = 12, dy = -10;
  return (
    <svg viewBox={`0 0 ${W} 210`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A ${CLIP_FIG.seconds} second ${CLIP_FIG.w} by ${CLIP_FIG.h} clip has ${v.frames} frames. A video autoencoder squeezes them into ${v.lat} latent frames, each cut into ${n0(v.perFrame)} patches, ${n0(v.tokens)} tokens. One transformer denoises them all together, so motion stays consistent.`}</title>
      {Array.from({ length: shown }, (_, i) => {
        const k = shown - 1 - i, x = 10 + k * dx, y = 90 + k * dy, front = k === 0;
        return (
          <g key={k}>
            <rect x={x} y={y} width={fw} height={fh} rx={4} fill={front ? "var(--accent-soft)" : "var(--surface-2)"} stroke="var(--line-strong)" />
            {front && Array.from({ length: 9 }, (_, c) => <line key={c} x1={x + ((c + 1) * fw) / 10} y1={y} x2={x + ((c + 1) * fw) / 10} y2={y + fh} stroke="var(--line)" />)}
            {front && Array.from({ length: 5 }, (_, r) => <line key={"r" + r} x1={x} y1={y + ((r + 1) * fh) / 6} x2={x + fw} y2={y + ((r + 1) * fh) / 6} stroke="var(--line)" />)}
          </g>
        );
      })}
      <text x={10} y={194} fontSize={11} fill="var(--muted)">time, one latent frame per 4 frames</text>
      <text x={218} y={40} fontSize={11} fill="var(--ink)">{`${v.frames} frames`}</text>
      <text x={218} y={58} fontSize={11} fill="var(--ink)">{`to ${v.lat} latent frames`}</text>
      <text x={218} y={76} fontSize={11} fill="var(--ink)">{`x ${n0(v.perFrame)} patches`}</text>
      <text x={218} y={98} fontSize={12} fontWeight={600} fill="var(--accent)">{`${n0(v.tokens)} tokens`}</text>
      <text x={218} y={118} fontSize={11} fill="var(--muted)">all denoised</text>
      <text x={218} y={134} fontSize={11} fill="var(--muted)">together</text>
    </svg>
  );
}
