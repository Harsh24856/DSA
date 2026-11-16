"use client";
// Renders one block of a Gen AI module. Blocks are plain data (lib/genai2/types.ts); this is the only place that knows how they look.
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { Block } from "@/lib/genai2";
import { mcqOptions, seededRng } from "@/lib/genai2";
import { GenaiLab } from "../labs";
import { RunPanel } from "../GenaiDoc";
import { Rich } from "../other/Rich";
import { useMermaid } from "../useMermaid";
import { FIGURES } from "./figures";

const FlowPlayer = dynamic(() => import("../other/FlowPlayer"), { ssr: false, loading: () => <div className="gx-diagram h-[420px]" aria-hidden /> });
const FlowLab = dynamic(() => import("../other/FlowLab"), { ssr: false, loading: () => <div className="gx-diagram h-[560px]" aria-hidden /> });

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
  const [pick, setPick] = useState<string | null>(null);
  return (
    <div className="tile grid gap-3 p-4">
      <h3 className="t-h3">Predict first: {b.q}</h3>
      <div className="grid gap-2">
        {opts.map((o) => (
          <button key={o} type="button" className="btn justify-start whitespace-normal text-left" disabled={pick !== null} aria-pressed={pick === o} onClick={() => setPick(o)}>{o}</button>
        ))}
      </div>
      <div className="text-sm leading-relaxed" role="status">{pick !== null && <>
          <strong className={pick === b.answer ? "text-easy" : "text-hard"}>{pick === b.answer ? "Right. " : `Not quite, it is ${b.answer}. `}</strong>
          <Rich text={b.why} />
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
      const F = (FIGURES as Record<string, () => React.JSX.Element>)[b.id];
      return F ? <figure className="gx-diagram"><F /><figcaption>{b.caption}</figcaption></figure> : null;
    }
    case "mermaid": return <Mermaid src={b.src} caption={b.caption} />;
    case "text": return <div className="max-w-[72ch] text-sm leading-relaxed"><Rich text={b.md} /></div>;
    case "compare":
      return (
        <div className="tile overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>{b.head.map((h) => <th key={h} className="p-2 text-left font-semibold">{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="p-2 align-top">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <div className="grid gap-2">
          <pre className="code"><code>{b.src}</code></pre>
          {b.run && <RunPanel src={b.src} />}
        </div>
      );
    case "predict": return <Predict b={b} seed={seed} />;
  }
}
