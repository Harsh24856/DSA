"use client";
// Renders one block of a Gen AI module. Blocks are plain data (lib/genai2/types.ts); this is the only place that knows how they look.
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { Block } from "@/lib/genai2/core";
import { mcqOptions, seededRng } from "@/lib/genai2/core";
import { RunPanel } from "../RunPanel";
import { useMermaid } from "../useMermaid";
import { Choices, ginline, GRich } from "./Questions";

const FlowPlayer = dynamic(() => import("../other/FlowPlayer"), { ssr: false, loading: () => <div className="gx-diagram h-[420px]" aria-hidden /> });
const FlowLab = dynamic(() => import("../other/FlowLab"), { ssr: false, loading: () => <div className="gx-diagram h-[560px]" aria-hidden /> });
const GenaiLab = dynamic(() => import("../labs").then((m) => m.GenaiLab), { ssr: false, loading: () => <div className="gx-diagram h-[420px]" aria-hidden /> });

// Figures load per stage: a page fetches only figures/s<N>.tsx for its own stage (each sN.tsx type-checks its own keys; genai.check asserts FIGURE_IDS is their union).
type FigMap = Record<string, () => React.JSX.Element>;
const byId = (map: FigMap) => function StageFigure({ id }: { id: string }) { const F = map[id]; return F ? <F /> : null; };
const STAGE_FIGURES = [
  dynamic(() => import("./figures/s0").then((m) => byId(m.FIGURES_0))),
  dynamic(() => import("./figures/s1").then((m) => byId(m.FIGURES_1))),
  dynamic(() => import("./figures/s2").then((m) => byId(m.FIGURES_2))),
  dynamic(() => import("./figures/s3").then((m) => byId(m.FIGURES_3))),
  dynamic(() => import("./figures/s4").then((m) => byId(m.FIGURES_4))),
  dynamic(() => import("./figures/s5").then((m) => byId(m.FIGURES_5))),
  dynamic(() => import("./figures/s6").then((m) => byId(m.FIGURES_6))),
  dynamic(() => import("./figures/s7").then((m) => byId(m.FIGURES_7))),
  dynamic(() => import("./figures/s8").then((m) => byId(m.FIGURES_8))),
  dynamic(() => import("./figures/s9").then((m) => byId(m.FIGURES_9))),
  dynamic(() => import("./figures/s10").then((m) => byId(m.FIGURES_10))),
];

function Mermaid({ src, caption }: { src: string; caption: string }) {
  const ref = useRef<HTMLElement>(null);
  useMermaid(ref, src);
  return (
    <figure ref={ref} className="gx-diagram">
      <div className="mermaid" data-src={src} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Predict({ b, seed }: { b: Extract<Block, { kind: "predict" }>; seed: string }) {
  const opts = useMemo(() => mcqOptions(b, seededRng(seed)), [b, seed]);
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <div className="tile grid gap-3 p-4">
      <h3 className="t-h3">Predict first: {b.q}</h3>
      <Choices className="grid gap-2" opts={opts} answer={b.answer} pick={choice} onPick={setChoice} />
      <div className="text-sm leading-relaxed" role="status">{choice !== null && <>
          <strong className={choice === b.answer ? "text-easy" : "text-hard"}>{choice === b.answer ? "Right. " : `Not quite, it is ${b.answer}. `}</strong>
          <GRich text={b.why} />
        </>}</div>
    </div>
  );
}

export function BlockView({ b, seed }: { b: Block; seed: string }) {
  switch (b.kind) {
    case "flow": return <FlowPlayer id={b.id} />;
    case "play": return <FlowLab id={b.id} />;
    case "lab": return <GenaiLab kind={b.id} />;
    case "figure": {
      const F = STAGE_FIGURES[Number(/^s(\d+)-/.exec(b.id)?.[1])];
      return F ? <figure className="gx-diagram"><F id={b.id} /><figcaption>{b.caption}</figcaption></figure> : null;
    }
    case "mermaid": return <Mermaid src={b.src} caption={b.caption} />;
    case "text": return <div className="max-w-[72ch] text-sm leading-relaxed"><GRich text={b.md} /></div>;
    case "compare":
      return (
        <div className="tile overflow-x-auto" tabIndex={0} role="region" aria-label={`Table: ${b.head.join(", ")}`}>
          <table className="w-full text-sm">
            <thead><tr>{b.head.map((h) => <th key={h} scope="col" className="p-2 text-left font-semibold">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="p-2 align-top">{ginline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <div className="grid gap-2">
          <pre className="code"><code>{b.src}</code></pre>
          {b.run && <RunPanel src={b.src} />}
          {b.torch && <p className="caption-1 text-muted">PyTorch does not run in the browser: copy this into Python with torch installed.</p>}
        </div>
      );
    case "predict": return <Predict b={b} seed={seed} />;
  }
}
