"use client";
// Plays one lib/other/flows.ts walk-through with the Remotion Player. Loaded with next/dynamic from OtherView,
// so Remotion ships only to pages that have an animated flow. Starts paused (and stays put under reduced motion
// until the viewer presses play); the caption under the player repeats every step for screen readers.
import { Player } from "@remotion/player";
import { useReducedMotion } from "motion/react";
import { FLOWS } from "@/lib/other/flows";
import { FPS, FlowScene, W, flowFrames, flowHeight } from "./FlowScene";

export default function FlowPlayer({ id }: { id: string }) {
  const flow = FLOWS[id], reduce = useReducedMotion();
  if (!flow) return null;
  const n = flow.steps.length;
  return (
    <figure className="gx-diagram gx-flow">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-tile border border-line">
        <Player component={FlowScene} inputProps={{ flow }} durationInFrames={flowFrames(n)} fps={FPS} compositionWidth={W} compositionHeight={flowHeight(n)}
          style={{ width: "100%" }} controls showVolumeControls={false} loop autoPlay={false} clickToPlay initialFrame={reduce ? flowFrames(n) - 1 : 0}
          acknowledgeRemotionLicense />
      </div>
      <figcaption>
        <span className="font-semibold text-ink">Animated: {flow.title}.</span> Press play to follow one request through the system.
        <ol className="sr-only">{flow.steps.map((s, i) => <li key={i}>{s.node}: {s.note}</li>)}</ol>
      </figcaption>
    </figure>
  );
}
