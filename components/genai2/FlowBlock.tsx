"use client";
// A `flow` block in a Gen AI module. A chain (one idea, step by step) reads best as a still flowchart with every note
// visible, so it is drawn here as one; lanes, grids, bars and scenes keep the Remotion player.
import FlowPlayer from "../other/FlowPlayer";
import { FLOWS, type ChainFlow, type FlowTone } from "@/lib/other/flows";

const TONE: Record<FlowTone, string> = { ok: "var(--easy)", bad: "var(--hard)", warn: "var(--medium)", hot: "var(--accent)" };

function Flowchart({ flow }: { flow: ChainFlow }) {
  return (
    <figure className="gx-diagram gap-4">
      <figcaption className="t-h3 text-ink">{flow.title}</figcaption>
      <ol className="m-0 grid list-none gap-0 p-0">
        {flow.steps.map((s, i) => {
          const c = s.tone ? TONE[s.tone] : "var(--line-strong)";
          return (
            <li key={i} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3">
              {/* the rail: a numbered node, then a line down to the next step */}
              <div className="flex flex-col items-center">
                <span className="num grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold"
                  style={{ borderColor: c, background: `color-mix(in oklab, ${c} 16%, var(--surface))` }}>{i + 1}</span>
                {i < flow.steps.length - 1 && <span className="my-1 w-0.5 flex-1 rounded-full bg-line-strong" aria-hidden />}
              </div>
              <div className={`min-w-0 ${i < flow.steps.length - 1 ? "pb-4" : ""}`}>
                <div className="rounded-tile border px-4 py-2 text-sm font-semibold leading-snug"
                  style={{ borderColor: c, background: `color-mix(in oklab, ${c} 8%, var(--surface))` }}>{s.node}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.note}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export default function FlowBlock({ id }: { id: string }) {
  const flow = FLOWS[id];
  if (!flow) return null;
  return !flow.kind || flow.kind === "chain" ? <Flowchart flow={flow as ChainFlow} /> : <FlowPlayer id={id} />;
}
