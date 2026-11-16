// One chat API call: the request is a list of role-tagged messages your app sends in full, and the reply carries text, a stop reason and token usage.
import { useId } from "react";

const tok = (s: string) => Math.ceil(s.length / 4);   // rough rule: about 4 characters per token in English
const MSGS: [string, string][] = [
  ["system", "You are a tutor. Reply in 2 lines."],
  ["user", "What is a KV cache?"],
  ["assistant", "It keeps past keys and values."],
  ["user", "Why does it use memory?"],
];
const REPLY = "Every past token keeps its K and V.";
const IN = MSGS.reduce((s, [, t]) => s + tok(t), 0), OUT = tok(REPLY);
const W = 340, X = 84, RH = 26, TOP = 30;
const fillOf = (r: string) => (r === "system" ? "var(--accent-soft)" : r === "assistant" ? "var(--surface-2)" : "var(--surface)");

export function ApiCall() {
  const t = useId();
  const reqBottom = TOP + MSGS.length * (RH + 6) + 26;
  const resTop = reqBottom + 34;
  return (
    <svg viewBox={`0 0 ${W} ${resTop + 112}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A request holds four messages: a system message with rules, a user question, the assistant's earlier answer and a new user question, plus settings such as max_tokens. The reply holds the new text, the stop reason end_turn and usage of about ${IN} input and ${OUT} output tokens.`}</title>
      <text x={0} y={16} fontSize={13} fontWeight={600} fill="var(--ink)">Request: your app sends all of this</text>
      {MSGS.map(([role, text], i) => {
        const y = TOP + i * (RH + 6);
        return (
          <g key={i}>
            <text x={X - 8} y={y + 17} textAnchor="end" fontSize={12} fill={role === "system" ? "var(--accent)" : "var(--muted)"} fontWeight={600}>{role}</text>
            <rect x={X} y={y} width={W - X - 1} height={RH} rx={8} fill={fillOf(role)} stroke={role === "system" ? "var(--accent)" : "var(--line-strong)"} />
            <text x={X + 8} y={y + 17} fontSize={12} fill="var(--ink)">{text}</text>
          </g>
        );
      })}
      <text x={X} y={reqBottom - 6} fontSize={12} fill="var(--muted)">model · max_tokens 300 · stream on</text>
      <line x1={W / 2} y1={reqBottom + 2} x2={W / 2} y2={resTop - 6} stroke="var(--accent)" strokeWidth={1.5} markerEnd={`url(#${t}a)`} />
      <defs><marker id={`${t}a`} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" /></marker></defs>
      <text x={W / 2 + 8} y={reqBottom + 20} fontSize={12} fill="var(--muted)">the model reads it once</text>
      <text x={0} y={resTop + 10} fontSize={13} fontWeight={600} fill="var(--ink)">Response: what comes back</text>
      <text x={X - 8} y={resTop + 37} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--muted)">assistant</text>
      <rect x={X} y={resTop + 20} width={W - X - 1} height={RH} rx={8} fill="var(--surface-2)" stroke="var(--accent)" />
      <text x={X + 8} y={resTop + 37} fontSize={12} fill="var(--ink)">{REPLY}</text>
      <text x={X - 8} y={resTop + 68} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--muted)">stop</text>
      <text x={X} y={resTop + 68} fontSize={12} fill="var(--easy)">end_turn: it finished by itself</text>
      <text x={X - 8} y={resTop + 92} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--muted)">usage</text>
      <text x={X} y={resTop + 92} fontSize={12} fill="var(--ink)" className="num">{`input ${IN} · output ${OUT} tokens`}</text>
    </svg>
  );
}
