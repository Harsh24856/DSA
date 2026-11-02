"use client";
// Plays one animated walk-through (lib/other/flows.ts) with the Remotion Player. Loaded with next/dynamic and mounted only
// near the viewport, so pages stay light. Back and Next move one step at a time, animating the step; Play runs them all.
// The title and caption are page text, so they stay sharp on phones and screen readers announce each step.
import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { FLOWS, stepNote } from "@/lib/other/flows";
import { FPS, FlowScene, STEP, W, flowFrames, flowHeight } from "./FlowScene";

export default function FlowPlayer({ id }: { id: string }) {
  const flow = FLOWS[id], reduce = useReducedMotion();
  const box = useRef<HTMLElement>(null), player = useRef<PlayerRef>(null), stopAt = useRef<number | null>(null);
  const [near, setNear] = useState(false), [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "400px" });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      setFrame(e.detail.frame);
      if (stopAt.current !== null && e.detail.frame >= stopAt.current) { stopAt.current = null; p.pause(); }
    };
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setFrame(Infinity); };   // the last frameupdate can land a frame or two early
    p.addEventListener("frameupdate", onFrame); p.addEventListener("play", onPlay); p.addEventListener("pause", onPause); p.addEventListener("ended", onEnded);
    return () => { p.removeEventListener("frameupdate", onFrame); p.removeEventListener("play", onPlay); p.removeEventListener("pause", onPause); p.removeEventListener("ended", onEnded); };
  }, [near]);

  if (!flow) return null;
  const n = flow.steps.length, total = flowFrames(flow), cur = Math.min(n - 1, Math.floor(frame / STEP)), atEnd = frame >= total - 2;
  const settled = (i: number) => i * STEP + STEP - 2;       // a step after its animation has finished

  const go = (i: number, animate: boolean) => {
    const p = player.current;
    if (!p) return;
    const to = Math.max(0, Math.min(n - 1, i));
    p.pause(); stopAt.current = null;
    if (animate && !reduce) { p.seekTo(to * STEP); setFrame(to * STEP); stopAt.current = settled(to); p.play(); }
    else { p.seekTo(settled(to)); setFrame(settled(to)); }
  };
  const toggle = () => {
    const p = player.current;
    if (!p) return;
    stopAt.current = null;
    if (reduce) return go(atEnd ? 0 : cur + 1, false);
    if (playing) p.pause();
    else { if (atEnd) { p.seekTo(0); setFrame(0); } p.play(); }
  };
  const tone = flow.steps[cur].tone;

  return (
    <figure ref={box} className="gx-diagram gx-flow">
      <figcaption className="title-3 text-ink">{flow.title}</figcaption>
      <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-tile border border-line bg-bg" style={{ aspectRatio: `${W} / ${flowHeight(flow)}` }}>
        {near && <Player ref={player} component={FlowScene} inputProps={{ flow }} durationInFrames={total} fps={FPS} compositionWidth={W} compositionHeight={flowHeight(flow)}
          style={{ width: "100%" }} controls={false} loop={false} moveToBeginningWhenEnded={false} autoPlay={false} numberOfSharedAudioTags={0} acknowledgeRemotionLicense />}
      </div>
      <p className="flow-note mx-auto w-full max-w-[560px] body-6" data-tone={tone} aria-live="polite"><b className="num">Step {cur + 1} of {n}.</b> {stepNote(flow, cur)}</p>
      <div className="mx-auto flex w-full max-w-[560px] flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-sm btn-icon" aria-label="Previous step" disabled={cur === 0} onClick={() => go(cur - 1, false)}><CaretLeft size={16} aria-hidden /></button>
        <button type="button" className="btn btn-sm btn-primary min-w-[96px]" disabled={!near} onClick={toggle}>
          {playing ? <Pause size={14} weight="fill" aria-hidden /> : atEnd ? <ArrowCounterClockwise size={14} aria-hidden /> : <Play size={14} weight="fill" aria-hidden />}
          {playing ? "Pause" : atEnd ? "Replay" : "Play all"}
        </button>
        <button type="button" className="btn btn-sm btn-icon" aria-label="Next step" disabled={!near || cur === n - 1} onClick={() => go(cur + 1, true)}><CaretRight size={16} aria-hidden /></button>
      </div>
    </figure>
  );
}
