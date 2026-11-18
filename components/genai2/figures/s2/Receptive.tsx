// Why convolutions: each output pixel sees a small window that grows with depth, and the same few weights are shared
// across the whole picture. Click a layer to see how much of the input one output pixel depends on.
"use client";
import { useId, useState } from "react";
import { denseVsConv, receptive } from "@/lib/genai2/stages/s2.calc";

const N = 9, C = 17, X0 = 10, Y0 = 34, W = 340;
const n0 = (x: number) => x.toLocaleString("en-US");

export function Receptive() {
  const titleId = useId(), [layers, setLayers] = useState(2), rf = receptive(layers), lo = (N - rf) / 2;
  const { dense, conv } = denseVsConv(), ratio = Math.round(dense / conv);
  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Stacked 3 by 3 conv layers">
        {[1, 2, 3, 4].map((l) => (
          <button key={l} type="button" className="chip" aria-pressed={layers === l} onClick={() => setLayers(l)}>{l} layer{l > 1 ? "s" : ""}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 250`} className="w-full" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{`After ${layers} stacked 3 by 3 convolutions, one output pixel depends on a ${rf} by ${rf} patch of the input. A dense layer from a 28 by 28 image to 8 maps of 26 by 26 needs ${n0(dense)} parameters; a 3 by 3 convolution with 8 filters needs ${conv}, about ${n0(ratio)} times fewer.`}</title>
        <text x={X0} y={18} fontSize={14} fill="var(--muted)">input pixels one output sees</text>
        {Array.from({ length: N * N }, (_, k) => {
          const r = Math.floor(k / N), c = k % N, inside = r >= lo && r < lo + rf && c >= lo && c < lo + rf, centre = r === (N - 1) / 2 && c === (N - 1) / 2;
          return <rect key={k} x={X0 + c * C} y={Y0 + r * C} width={C - 2} height={C - 2} rx={3}
            fill={centre ? "var(--accent)" : inside ? "color-mix(in oklab, var(--accent) 35%, var(--bg))" : "var(--surface-2)"}
            style={{ transition: "fill 300ms cubic-bezier(0.22, 1, 0.36, 1)" }} />;
        })}
        <text x={X0} y={Y0 + N * C + 18} fontSize={15} fontWeight={650} fill="var(--ink)">{`${rf}×${rf} after ${layers}`}</text>
        <g transform="translate(178 0)">
          <text x={0} y={18} fontSize={14} fill="var(--muted)">params for one layer</text>
          <text x={0} y={52} fontSize={14} fill="var(--ink)">dense</text>
          <rect x={0} y={60} width={150} height={16} rx={4} fill="var(--hard)" />
          <text x={0} y={94} fontSize={14} fill="var(--ink)" style={{ fontVariantNumeric: "tabular-nums" }}>{n0(dense)}</text>
          <text x={0} y={132} fontSize={14} fill="var(--ink)">3×3 conv</text>
          <rect x={0} y={140} width={3} height={16} rx={1} fill="var(--easy)" />
          <text x={0} y={174} fontSize={14} fill="var(--ink)" style={{ fontVariantNumeric: "tabular-nums" }}>{conv}</text>
          <text x={0} y={206} fontSize={14} fill="var(--muted)">{`${n0(ratio)}× fewer`}</text>
          <text x={0} y={226} fontSize={13} fill="var(--muted)">bars not to scale</text>
        </g>
      </svg>
    </div>
  );
}
