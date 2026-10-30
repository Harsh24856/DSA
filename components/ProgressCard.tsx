"use client";
// "Share progress": draws a card on a canvas in the current theme's colors (Gen AI modules, CS core chapters,
// pattern and daily problems solved) and offers Download PNG, Copy text and, where the browser supports it, Share.
import { useEffect, useRef, useState } from "react";
import { ShareNetwork, X } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { useStore } from "@/lib/store";
import { GENAI } from "@/lib/genai/content";
import { ALL_LC } from "@/lib/patterns";

/** Resolved token color as an rgba() string the canvas understands (tokens may be color-mix or oklab). */
function token(name: string) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d")!;
  const probe = document.createElement("span"); probe.style.color = `var(${name})`; document.body.append(probe);
  cx.fillStyle = getComputedStyle(probe).color; probe.remove();
  cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}

type Row = { label: string; value: number; total?: number };

function draw(cv: HTMLCanvasElement, rows: Row[], date: string) {
  const W = 1200, H = 630, cx = cv.getContext("2d")!;
  cv.width = W; cv.height = H;
  const font = getComputedStyle(document.body).fontFamily;
  const [bg, surface, ink, muted, accent, line] = ["--bg", "--surface", "--ink", "--muted", "--accent", "--line"].map(token);
  cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
  cx.fillStyle = surface; cx.beginPath(); cx.roundRect(40, 40, W - 80, H - 80, 32); cx.fill();
  cx.strokeStyle = line; cx.lineWidth = 2; cx.stroke();
  cx.fillStyle = accent; cx.beginPath(); cx.roundRect(40, 40, 14, H - 80, [32, 0, 0, 32]); cx.fill();
  cx.fillStyle = ink; cx.font = `700 52px ${font}`; cx.fillText("My placement prep", 100, 130);
  cx.fillStyle = muted; cx.font = `400 26px ${font}`; cx.fillText(`DSA Daily · ${date}`, 100, 172);
  rows.forEach((r, i) => {
    const x = 100 + (i % 2) * 520, y = 250 + Math.floor(i / 2) * 170;
    cx.fillStyle = ink; cx.font = `700 64px ${font}`;
    const big = r.total ? `${r.value}` : r.value.toLocaleString();
    cx.fillText(big, x, y);
    const w = cx.measureText(big).width;
    if (r.total) { cx.fillStyle = muted; cx.font = `400 30px ${font}`; cx.fillText(` / ${r.total}`, x + w, y); }
    cx.fillStyle = muted; cx.font = `500 26px ${font}`; cx.fillText(r.label, x, y + 40);
    if (r.total) {
      cx.fillStyle = line; cx.beginPath(); cx.roundRect(x, y + 62, 420, 12, 6); cx.fill();
      cx.fillStyle = accent; cx.beginPath(); cx.roundRect(x, y + 62, Math.max(12, 420 * Math.min(1, r.value / r.total)), 12, 6); cx.fill();
    }
  });
  cx.fillStyle = muted; cx.font = `400 22px ${font}`; cx.fillText(location.host, 100, H - 70);
}

export function ProgressCard({ otherTotal }: { otherTotal?: number }) {
  const { done } = usePatterns();
  const { state } = useStore();
  const ref = useRef<HTMLDialogElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false), [msg, setMsg] = useState(""), [canShare, setCanShare] = useState(false);
  useEffect(() => { setCanShare(!!navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] })); }, []);   // after mount: no server/client mismatch
  const modules = GENAI.filter((s) => s.module);
  const rows: Row[] = [
    { label: "Gen AI modules done", value: modules.filter((m) => done[`genai:${m.id}`]).length, total: modules.length },
    { label: "CS core chapters done", value: Object.keys(done).filter((k) => k.startsWith("other:")).length, total: otherTotal },
    { label: "pattern problems solved", value: ALL_LC.filter((lc) => done[lc]).length, total: ALL_LC.length },
    { label: "daily problems solved", value: Object.keys(state.done).length },
  ];
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const text = `My placement prep on DSA Daily (${date}): ${rows.map((r) => `${r.value}${r.total ? `/${r.total}` : ""} ${r.label}`).join(", ")}.`;

  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  useEffect(() => { if (open && canvas.current) draw(canvas.current, rows, date); });

  const blob = () => new Promise<Blob | null>((res) => canvas.current?.toBlob(res, "image/png"));
  const download = async () => {
    const b = await blob(); if (!b) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "dsa-daily-progress.png";
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const share = async () => {
    const b = await blob(); if (!b) return;
    const file = new File([b], "dsa-daily-progress.png", { type: "image/png" });
    try { await navigator.share({ files: [file], text }); } catch { /* the user closed the share sheet */ }
  };

  return (
    <>
      <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}><ShareNetwork size={14} aria-hidden />Share progress</button>
      <dialog ref={ref} onClose={() => setOpen(false)} onClick={(e) => { if (e.target === ref.current) setOpen(false); }} aria-labelledby="share-title"
        className="m-auto w-[min(640px,calc(100vw-32px))] rounded-card border border-line bg-surface p-0 text-ink">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="share-title" className="t-h2">Share your progress</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="btn btn-ghost btn-icon -mr-2"><X size={18} aria-hidden /></button>
        </div>
        <div className="grid gap-3 p-5">
          {/* only while open: the locale date would differ between server and client render */}
          {open && <canvas ref={canvas} className="h-auto w-full rounded-tile border border-line" role="img" aria-label={text} />}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => void download()}>Download PNG</button>
            <button type="button" className="btn btn-sm" onClick={() => void navigator.clipboard?.writeText(text).then(() => setMsg("Copied the text."))}>Copy text</button>
            {canShare && <button type="button" className="btn btn-sm" onClick={() => void share()}>Share</button>}
          </div>
          {msg && <p className="text-[13px] text-muted" role="status">{msg}</p>}
        </div>
      </dialog>
    </>
  );
}
