"use client";
// The landing hero's visual: the app's real player running real solutions, usable before signing in.
import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import type { Solution } from "@/lib/solutions/types";
import { Skeleton } from "../ui";
import { Visualizer } from "../Visualizer";

// each file loads only when its tab is opened
const DEMOS: { label: string; slug: string; name: string; load: () => Promise<Record<string, Solution>> }[] = [
  { label: "Array", slug: "container-with-most-water", name: "Container With Most Water", load: () => import("@/lib/solutions/pattern1").then((m) => m.PATTERN1) },
  { label: "Tree", slug: "binary-tree-level-order-traversal", name: "Binary Tree Level Order Traversal", load: () => import("@/lib/solutions/pattern1").then((m) => m.PATTERN1) },
  { label: "Graph", slug: "course-schedule", name: "Course Schedule", load: () => import("@/lib/solutions/pattern3").then((m) => m.PATTERN3) },
  { label: "SQL", slug: "combine-two-tables", name: "Combine Two Tables", load: () => import("@/lib/solutions/sql").then((m) => m.SQL_SOLUTIONS) },
];

export function HeroDemo() {
  const [at, setAt] = useState(0);
  const [sol, setSol] = useState<{ slug: string; approach: string; diagram: ReturnType<Solution["viz"]> } | null>(null);
  const [failed, setFailed] = useState(false);
  const demo = DEMOS[at];
  const box = useRef<HTMLDivElement>(null);
  const seen = useInView(box, { once: true, amount: 0.5 });   // not before it is on screen, or the run is over by the time you scroll to it

  useEffect(() => {
    let live = true;
    setFailed(false);
    demo.load().then((all) => { if (live) setSol({ slug: demo.slug, approach: all[demo.slug].approach, diagram: all[demo.slug].viz() }); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [demo]);

  return (
    <div ref={box} className="rounded-2xl border border-line-strong bg-surface p-4 text-left sm:p-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Pick a question to run">
        {DEMOS.map((d, i) => <button key={d.slug} type="button" className="chip" aria-pressed={i === at} onClick={() => setAt(i)}>{d.label}</button>)}
        <span className="ml-auto text-sm font-medium max-sm:w-full max-sm:pt-2">{demo.name}</span>
      </div>
      <div className="mt-4 min-h-[360px]">
        {failed ? <p className="empty">The demo did not load. Check your connection and pick a question again.</p>
          : sol?.slug === demo.slug ? <><p className="callout mb-4 text-sm leading-relaxed"><span className="font-semibold">Key move: </span>{sol.approach}</p><Visualizer diagram={sol.diagram} autoplay={seen} /></>
          : <Skeleton className="h-[360px] rounded-xl" />}
      </div>
      <p className="mt-4 caption-5 text-muted">This is the real player from the app. Pause it, drag the slider, or switch question.</p>
    </div>
  );
}
