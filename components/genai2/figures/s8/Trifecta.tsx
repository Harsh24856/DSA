// Three capabilities that together let injected text steal data. All three in one run are the danger; remove one to close that path.
import { useId } from "react";

const LEGS: [string, string, number, number][] = [
  ["private data", "your files, mail, database", 120, 92],
  ["untrusted text", "web pages, uploads, emails", 220, 92],
  ["a way out", "send, post, fetch a URL", 170, 176],
];
const R = 62, W = 340, Y = 262;

export function Trifecta() {
  const t = useId();
  return (
    <svg viewBox={`0 0 ${W} ${Y + LEGS.length * 16 + 22}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>Three overlapping circles: access to private data, exposure to untrusted text, and a way to send data out. Where all three overlap, injected instructions can steal data. Remove any one and that path is closed.</title>
      {LEGS.map(([name, , cx, cy]) => <circle key={name} cx={cx} cy={cy} r={R} fill="var(--accent-soft)" fillOpacity={0.55} stroke="var(--accent)" strokeWidth={1.5} />)}
      <circle cx={170} cy={122} r={14} fill="var(--hard)" />
      <text x={170} y={127} fontSize={13} textAnchor="middle" fill="var(--surface)" fontWeight={600}>!</text>
      {LEGS.map(([name, , cx, cy], i) => (
        <text key={name} x={i === 0 ? cx - 28 : i === 1 ? cx + 28 : cx} y={i === 2 ? cy + 32 : cy - 24} fontSize={12} fontWeight={600} textAnchor="middle" fill="var(--ink)">{name}</text>
      ))}
      {LEGS.map(([name, ex], i) => <text key={name} x={0} y={Y + i * 16} fontSize={11} fill="var(--muted)">{`${name}: ${ex}`}</text>)}
      <text x={0} y={Y + LEGS.length * 16 + 8} fontSize={11} fill="var(--ink)">The red centre is the danger. Cut any one circle.</text>
    </svg>
  );
}
