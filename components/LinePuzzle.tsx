"use client";
// Rebuild a solution from its shuffled lines. Tap a line to place it, tap a placed line to take it back.
import { useState } from "react";
import { ArrowCounterClockwise, CheckCircle } from "@phosphor-icons/react";
import { puzzleLines, puzzleRight, puzzleSolved, puzzleTiles } from "@/lib/practice";

const LINE = "w-full cursor-pointer rounded-control border border-line bg-surface px-2 py-1 text-left font-mono text-xs leading-5 whitespace-pre-wrap transition-colors hover:border-line-strong";

export function LinePuzzle({ code }: { code: string }) {
  const [tiles] = useState(() => puzzleTiles(code));
  const [placed, setPlaced] = useState<number[]>([]);   // positions in tiles, since two lines can read the same
  const [checked, setChecked] = useState(false);
  const total = puzzleLines(code).length, text = placed.map((k) => tiles[k]);
  const solved = puzzleSolved(code, text), left = tiles.flatMap((_, k) => (placed.includes(k) ? [] : [k]));

  const place = (k: number) => { setPlaced((p) => [...p, k]); setChecked(false); };
  const remove = (k: number) => { setPlaced((p) => p.filter((x) => x !== k)); setChecked(false); };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Put the {total} lines back in order. Indentation is a clue.</p>
      <ol className="inset flex min-h-12 flex-col gap-1 p-2" aria-label="Your answer">
        {placed.map((k) => <li key={k}><button type="button" className={LINE} disabled={solved} aria-label={`Take back: ${tiles[k].trim()}`} onClick={() => remove(k)}>{tiles[k]}</button></li>)}
        {!placed.length && <li className="px-2 py-1 text-xs text-muted">Tap a line below to start.</li>}
      </ol>
      {left.length > 0 && <ul className="flex flex-col gap-1" aria-label="Lines left">{left.map((k) => <li key={k}><button type="button" className={LINE} aria-label={`Place: ${tiles[k].trim()}`} onClick={() => place(k)}>{tiles[k]}</button></li>)}</ul>}
      {solved ? (
        <p className="callout flex items-center gap-2 text-sm font-medium text-accent" role="status"><CheckCircle size={18} weight="fill" aria-hidden />All {total} lines are in order.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-sm btn-primary" disabled={left.length > 0} onClick={() => setChecked(true)}>Check order</button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={!placed.length} onClick={() => { setPlaced([]); setChecked(false); }}><ArrowCounterClockwise size={14} aria-hidden />Start again</button>
          {checked && <p className="text-sm" role="status">The first {puzzleRight(code, text)} of {total} lines are right. Take back the rest.</p>}
        </div>
      )}
    </div>
  );
}
