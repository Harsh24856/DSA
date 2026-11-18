// The integration problem MCP solves: every app wired to every tool, against every app and tool speaking one protocol. Line counts are computed.
import { useId } from "react";
import { glue } from "@/lib/genai2/stages/s8.calc";

const APPS = ["chat app", "IDE", "agent"], TOOLS = ["files", "database", "tickets", "calendar"];
const W = 340, PH = 132, AX = 76, TX = 262, HX = (AX + TX) / 2;
const ay = (top: number, i: number) => top + 30 + i * ((PH - 60) / (APPS.length - 1));
const ty = (top: number, i: number) => top + 20 + i * ((PH - 40) / (TOOLS.length - 1));

function Side({ top, hub, label }: { top: number; hub: boolean; label: string }) {
  const hy = top + PH / 2;
  return (
    <g>
      <text x={W / 2} y={top + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">{label}</text>
      {hub
        ? <>
            {APPS.map((a, i) => <line key={a} x1={AX} y1={ay(top, i)} x2={HX} y2={hy} stroke="var(--easy)" strokeWidth={1.5} />)}
            {TOOLS.map((t, i) => <line key={t} x1={TX} y1={ty(top, i)} x2={HX} y2={hy} stroke="var(--easy)" strokeWidth={1.5} />)}
            <rect x={HX - 24} y={hy - 12} width={48} height={24} rx={12} fill="var(--accent)" />
            <text x={HX} y={hy + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--accent-ink)">MCP</text>
          </>
        : APPS.flatMap((a, i) => TOOLS.map((t, j) => <line key={a + t} x1={AX} y1={ay(top, i)} x2={TX} y2={ty(top, j)} stroke="var(--medium)" strokeWidth={1.2} />))}
      {APPS.map((a, i) => (
        <g key={a}>
          <circle cx={AX} cy={ay(top, i)} r={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
          <text x={AX - 12} y={ay(top, i) + 4} textAnchor="end" fontSize={12} fill="var(--ink)">{a}</text>
        </g>
      ))}
      {TOOLS.map((t, i) => (
        <g key={t}>
          <rect x={TX - 6} y={ty(top, i) - 6} width={12} height={12} rx={3} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
          <text x={TX + 12} y={ty(top, i) + 4} fontSize={12} fill="var(--ink)">{t}</text>
        </g>
      ))}
    </g>
  );
}

export function Glue() {
  const t = useId(), g = glue(APPS.length, TOOLS.length);
  return (
    <svg viewBox={`0 0 ${W} ${2 * PH + 56}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`${APPS.length} apps and ${TOOLS.length} tools. Wired pair by pair they need ${g.pairs} connectors. Through one shared protocol, each app and each tool implements it once: ${g.protocol} adapters.`}</title>
      <Side top={12} hub={false} label={`Pair by pair: ${APPS.length} × ${TOOLS.length} = ${g.pairs} connectors`} />
      <Side top={PH + 40} hub label={`One protocol: ${APPS.length} + ${TOOLS.length} = ${g.protocol} adapters`} />
    </svg>
  );
}
