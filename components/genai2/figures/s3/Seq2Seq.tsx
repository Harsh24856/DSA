// Seq2seq: the encoder reads the source, only its last state (the context) reaches the decoder, which feeds each output word back in.
import { useId } from "react";

const SRC = ["the", "cat", "sleeps"], TGT = ["le", "chat", "dort", "<end>"];
const W = 340, BH = 24, ENC_Y = 30, CTX_Y = 92, DEC_Y = 150, OUT_Y = 196;
const ex = (i: number) => 90 + i * 80, dx = (i: number) => 76 + i * 72;

export function Seq2Seq() {
  const titleId = useId(), m = useId().replace(/:/g, ""), ma = m + "a";
  const line = { stroke: "var(--line-strong)", strokeWidth: 1.5, markerEnd: `url(#${m})` };
  return (
    <svg viewBox={`0 0 ${W} 232`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`The encoder reads ${SRC.join(", ")} into states h1 to h${SRC.length}. Only the last state becomes the context vector c, of fixed size. The decoder starts from c and writes ${TGT.join(", ")}, feeding each word back in as its next input.`}</title>
      <defs>
        <marker id={m} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" /></marker>
        <marker id={ma} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" /></marker>
      </defs>
      <text x={4} y={ENC_Y + 16} fontSize={13} fill="var(--muted)">enc</text>
      {SRC.map((w, i) => (
        <g key={w}>
          <text x={ex(i)} y={ENC_Y - 10} textAnchor="middle" fontSize={13} fill="var(--ink)">{w}</text>
          <rect x={ex(i) - 26} y={ENC_Y} width={52} height={BH} rx={6} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={ex(i)} y={ENC_Y + 16} textAnchor="middle" fontSize={13} fill="var(--ink)">{`h${i + 1}`}</text>
          {i < SRC.length - 1 && <line x1={ex(i) + 26} y1={ENC_Y + BH / 2} x2={ex(i + 1) - 28} y2={ENC_Y + BH / 2} {...line} />}
        </g>
      ))}
      <line x1={ex(SRC.length - 1)} y1={ENC_Y + BH} x2={W / 2 + 22} y2={CTX_Y + 4} stroke="var(--accent)" strokeWidth={1.5} markerEnd={`url(#${ma})`} />
      <rect x={W / 2 - 18} y={CTX_Y} width={36} height={BH} rx={12} fill="var(--accent-soft)" stroke="var(--hard)" strokeWidth={1.5} />
      <text x={W / 2} y={CTX_Y + 16} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">c</text>
      <text x={W / 2 + 26} y={CTX_Y + 16} fontSize={12} fill="var(--hard)">fixed size</text>
      <line x1={W / 2 - 18} y1={CTX_Y + BH / 2} x2={dx(0) + 4} y2={DEC_Y - 2} stroke="var(--accent)" strokeWidth={1.5} markerEnd={`url(#${ma})`} />
      <text x={4} y={DEC_Y + 16} fontSize={13} fill="var(--muted)">dec</text>
      {TGT.map((w, i) => (
        <g key={w}>
          <rect x={dx(i) - 24} y={DEC_Y} width={48} height={BH} rx={6} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={dx(i)} y={DEC_Y + 16} textAnchor="middle" fontSize={13} fill="var(--ink)">{`s${i + 1}`}</text>
          <line x1={dx(i)} y1={DEC_Y + BH} x2={dx(i)} y2={OUT_Y - 14} {...line} />
          <text x={dx(i)} y={OUT_Y} textAnchor="middle" fontSize={13} fontWeight={600} fill={i === TGT.length - 1 ? "var(--muted)" : "var(--ink)"}>{w}</text>
          {i < TGT.length - 1 && <>
            <line x1={dx(i) + 24} y1={DEC_Y + BH / 2} x2={dx(i + 1) - 26} y2={DEC_Y + BH / 2} {...line} />
            <path d={`M ${dx(i) + 10} ${OUT_Y + 6} Q ${dx(i) + 40} ${OUT_Y + 26} ${dx(i + 1) - 14} ${DEC_Y + BH + 4}`} fill="none" stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="4 3" markerEnd={`url(#${ma})`} />
          </>}
        </g>
      ))}
    </svg>
  );
}
