// The model clicks on the screenshot it saw, which is smaller than the real screen; your code scales the point back before clicking.
import { useId } from "react";
import { SCREEN, SHOT, toScreen } from "@/lib/genai2/stages/s8.calc";

const CLICK: [number, number] = [1004, 92];
const W = 340, BIG = 300, SMALL = BIG * (SHOT.w / SCREEN.w);

function Screen({ x, y, w, label, pt, size }: { x: number; y: number; w: number; label: string; pt: [number, number]; size: { w: number; h: number } }) {
  const h = (w * size.h) / size.w, px = x + (pt[0] / size.w) * w, py = y + (pt[1] / size.h) * h;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1.5} />
      <rect x={x} y={y} width={w} height={h * 0.2} rx={8} fill="var(--line)" />
      <rect x={x + w * 0.62} y={y + h * 0.075} width={w * 0.3} height={h * 0.1} rx={3} fill="var(--surface)" stroke="var(--line-strong)" />
      {[0.32, 0.47, 0.62].map((r) => <rect key={r} x={x + w * 0.08} y={y + h * r} width={w * 0.6} height={h * 0.07} rx={3} fill="var(--line)" />)}
      <circle cx={px} cy={py} r={6} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      <text x={x} y={y + h + 16} fontSize={12} fill="var(--ink)">{label}</text>
      <text x={x} y={y + h + 32} fontSize={12} fontFamily="var(--mono)" fill="var(--accent)">{`click (${pt[0]}, ${pt[1]})`}</text>
    </g>
  );
}

export function ScreenScale() {
  const t = useId(), real = toScreen(CLICK), k = SCREEN.w / SHOT.w;
  const smallH = (SMALL * SHOT.h) / SHOT.w, bigTop = smallH + 60;
  return (
    <svg viewBox={`0 0 ${W} ${bigTop + (BIG * SCREEN.h) / SCREEN.w + 44}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`The model sees a ${SHOT.w} by ${SHOT.h} screenshot and asks to click at ${CLICK.join(", ")} on the search box. The real screen is ${SCREEN.w} by ${SCREEN.h}, so your code multiplies by ${k} and clicks at ${real.join(", ")}: the same spot.`}</title>
      <Screen x={0} y={4} w={SMALL} size={SHOT} pt={CLICK} label={`what the model sees: ${SHOT.w} × ${SHOT.h}`} />
      <text x={SMALL + 16} y={30} fontSize={12} fill="var(--muted)">{`your code: × ${k}`}</text>
      <text x={SMALL + 16} y={48} fontSize={12} fill="var(--muted)">on both axes</text>
      <path d={`M ${SMALL + 90} 60 L ${SMALL + 90} ${bigTop - 8}`} stroke="var(--accent)" strokeWidth={2} />
      <path d={`M ${SMALL + 84} ${bigTop - 16} L ${SMALL + 90} ${bigTop - 6} L ${SMALL + 96} ${bigTop - 16}`} stroke="var(--accent)" strokeWidth={2} fill="none" />
      <Screen x={0} y={bigTop} w={BIG} size={SCREEN} pt={real} label={`the real screen: ${SCREEN.w} × ${SCREEN.h}`} />
    </svg>
  );
}
