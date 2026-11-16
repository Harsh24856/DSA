// LoRA as shapes: a big frozen square W plus a thin B times a flat A, drawn with the real ratio of rank to width.
import { useId } from "react";

const D = 4096, R = 8, full = D * D, low = 2 * D * R;
const S = 112, THIN = Math.max(8, (S * R) / D * 16);   // r is drawn 16 times wider than scale so it stays visible
const n0 = (x: number) => x.toLocaleString("en-US");
const W = 340, Y = 34;

export function Lora() {
  const titleId = useId();
  const bx = 8 + S + 34, ax = bx + THIN + 30;
  return (
    <svg viewBox={`0 0 ${W} 236`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A frozen ${D} by ${D} weight matrix W, ${n0(full)} numbers, plus a low-rank update: B, ${D} by ${R}, times A, ${R} by ${D}. B and A together hold ${n0(low)} numbers, ${Math.round(full / low)} times fewer. B starts at zero, so training starts from the base model.`}</title>
      <text x={8 + S / 2} y={Y - 10} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">W, frozen</text>
      <rect x={8} y={Y} width={S} height={S} rx={6} fill="var(--surface-2)" stroke="var(--line-strong)" strokeDasharray="5 4" />
      <text x={8 + S / 2} y={Y + S / 2 + 4} textAnchor="middle" fontSize={12} fill="var(--muted)">{`${D} × ${D}`}</text>
      <text x={8 + S + 17} y={Y + S / 2 + 6} textAnchor="middle" fontSize={20} fill="var(--ink)">+</text>
      <text x={bx + THIN / 2} y={Y - 10} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--accent)">B</text>
      <rect x={bx} y={Y} width={THIN} height={S} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
      <text x={bx + THIN + 15} y={Y + 10} textAnchor="middle" fontSize={16} fill="var(--ink)">×</text>
      <text x={ax + S / 2} y={Y - 10} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--accent)">A</text>
      <rect x={ax} y={Y} width={S} height={THIN} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
      <text x={ax + S / 2} y={Y + THIN + 16} textAnchor="middle" fontSize={12} fill="var(--muted)">{`${R} × ${D}`}</text>
      <text x={bx + THIN / 2} y={Y + S + 16} textAnchor="middle" fontSize={12} fill="var(--muted)">{`${D} × ${R}`}</text>
      <text x={ax} y={Y + 58} fontSize={12} fill="var(--muted)">B starts at 0,</text>
      <text x={ax} y={Y + 74} fontSize={12} fill="var(--muted)">so B·A = 0 at first</text>
      <text x={8} y={Y + S + 44} fontSize={13} fill="var(--ink)"><tspan fontWeight={600}>W:</tspan>{` ${n0(full)} numbers, frozen`}</text>
      <text x={8} y={Y + S + 64} fontSize={13} fill="var(--ink)"><tspan fontWeight={600} fill="var(--accent)">B + A:</tspan>{` ${n0(low)} trained, ${Math.round(full / low)}x fewer`}</text>
      <text x={8} y={Y + S + 84} fontSize={13} fill="var(--muted)">output h = W x + (α / r) B A x</text>
    </svg>
  );
}
