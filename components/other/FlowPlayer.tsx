"use client";
// Plays one animated walk-through (lib/other/flows.ts) with the Remotion Player. Loaded with next/dynamic and mounted only
// near the viewport, so pages stay light. Back and Next move one step at a time, animating the step; Play runs them all.
// The title and caption are page text, so they stay sharp on phones and screen readers announce each step.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { FLOWS, stepNote, type Flow } from "@/lib/other/flows";
import { FPS, FlowScene, STEP, W, flowFrames, flowHeight } from "./FlowScene";

/** `id` plays a registered walk-through; `flow` plays one computed on the page (FlowLab, from the learner's numbers). */
export default function FlowPlayer({ id, flow: given }: { id?: string; flow?: Flow }) {
  const flow = given ?? FLOWS[id ?? ""], reduce = useReducedMotion();
  const inputProps = useMemo(() => ({ flow }), [flow]);   // a new object only when the flow itself changes
  const player = useRef<PlayerRef>(null), stopAt = useRef<number | null>(null), io = useRef<IntersectionObserver | null>(null);
  const el = useRef<HTMLElement | null>(null), pending = useRef<(() => void) | null>(null);
  const [near, setNear] = useState(false), [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false);

  // a callback ref, not a mount effect: the observer starts whenever the figure itself mounts, however late that is
  const box = useCallback((node: HTMLElement | null) => {
    io.current?.disconnect(); io.current = null; el.current = node;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); obs.disconnect(); } }, { rootMargin: "400px" });
    obs.observe(node); io.current = obs;
  }, []);
  useEffect(() => () => io.current?.disconnect(), []);
  // fallback: observer callbacks are not always delivered (busy or embedded views), so also check the position twice a
  // second until the player is mounted; cheap, and it stops as soon as it is near
  useEffect(() => {
    if (near) return;
    const t = setInterval(() => {
      const r = el.current?.getBoundingClientRect();
      if (r && r.top < innerHeight + 400 && r.bottom > -400) setNear(true);
    }, 500);
    return () => clearInterval(t);
  }, [near]);
  // a button pressed before the player existed: mount it, then do what was asked
  useEffect(() => {
    if (!near || !pending.current) return;
    const run = pending.current; pending.current = null;
    const id = requestAnimationFrame(() => run());
    return () => cancelAnimationFrame(id);
  }, [near]);

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

  // a recomputed flow keeps the learner's place: stay on the same step, settled, if it still exists
  const lastFlow = useRef(flow);
  useEffect(() => {
    if (lastFlow.current === flow) return;
    lastFlow.current = flow;
    const p = player.current;
    if (!p || !flow) return;
    p.pause(); stopAt.current = null;
    const step = Math.min(flow.steps.length - 1, Math.floor(frame / STEP));
    const to = step * STEP + STEP - 2;
    requestAnimationFrame(() => { p.seekTo(to); setFrame(to); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  if (!flow) return null;
  const n = flow.steps.length, total = flowFrames(flow), cur = Math.min(n - 1, Math.floor(frame / STEP)), atEnd = frame >= total - 2;
  const settled = (i: number) => i * STEP + STEP - 2;       // a step after its animation has finished

  const go = (i: number, animate: boolean) => {
    const p = player.current;
    if (!p) { pending.current = () => go(i, animate); setNear(true); return; }
    const to = Math.max(0, Math.min(n - 1, i));
    p.pause(); stopAt.current = null;
    if (animate && !reduce) { p.seekTo(to * STEP); setFrame(to * STEP); stopAt.current = settled(to); p.play(); }
    else { p.seekTo(settled(to)); setFrame(settled(to)); }
  };
  const toggle = () => {
    const p = player.current;
    if (!p) { pending.current = () => toggle(); setNear(true); return; }
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
        {near && <Player ref={player} component={FlowScene} inputProps={inputProps} durationInFrames={total} fps={FPS} compositionWidth={W} compositionHeight={flowHeight(flow)}
          style={{ width: "100%" }} controls={false} loop={false} moveToBeginningWhenEnded={false} autoPlay={false} numberOfSharedAudioTags={0} acknowledgeRemotionLicense />}
      </div>
      <p className="flow-note mx-auto w-full max-w-[560px] body-6" data-tone={tone} aria-live="polite"><b className="num">Step {cur + 1} of {n}.</b> {stepNote(flow, cur)}</p>
      <div className="mx-auto flex w-full max-w-[560px] flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-sm btn-icon" aria-label="Previous step" disabled={cur === 0} onClick={() => go(cur - 1, false)}><CaretLeft size={16} aria-hidden /></button>
        <button type="button" className="btn btn-sm btn-primary min-w-[96px]" onClick={toggle}>
          {playing ? <Pause size={14} weight="fill" aria-hidden /> : atEnd ? <ArrowCounterClockwise size={14} aria-hidden /> : <Play size={14} weight="fill" aria-hidden />}
          {playing ? "Pause" : atEnd ? "Replay" : "Play all"}
        </button>
        <button type="button" className="btn btn-sm btn-icon" aria-label="Next step" disabled={cur === n - 1} onClick={() => go(cur + 1, true)}><CaretRight size={16} aria-hidden /></button>
      </div>
    </figure>
  );
}
