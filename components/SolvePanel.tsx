"use client";
// The solve sheet's provider and button. The sheet itself is split out because it carries every solution.
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { Lightbulb } from "@phosphor-icons/react";
import { title, url, type How } from "@/lib/logic";
import { P } from "@/lib/problems";

/** `i` is the row in the daily plan, when the question has one: it enables ticking and next/previous in the sheet. `again`: a revisit, so a solved question still opens covered. */
export type SolveTarget = { slug: string; title: string; level: string; url: string; sql?: boolean; i?: number; again?: boolean };
/** What the solve sheet revealed for a daily row, so ticking it counts as help. Lasts until a reload, which is fine: the Solo/Hint/Editorial switch can correct it. */
export const peeked = new Map<number, How>();
/** Codeforces rows are filtered lists, so they open the worked example for their tag. */
export const solveTarget = (i: number): SolveTarget => {
  const cf = P[i][0] === "C";
  return { slug: cf ? `cf:${P[i][5]}` : P[i][2], title: cf ? `${title(i)}: ${P[i][5]}` : title(i), level: P[i][3], url: url(i), sql: P[i][0] === "S", i };
};
const Ctx = createContext<(t: SolveTarget) => void>(() => {});
export const useSolve = () => useContext(Ctx);

const loadSheet = () => import("./SolveSheet").then((m) => m.SolveSheet);
const SolveSheet = dynamic(loadSheet, { ssr: false, loading: () => <div className="scrim fixed inset-0 z-50" aria-hidden /> });

export function SolveProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<SolveTarget | null>(null);
  const open = useCallback((t: SolveTarget) => setTarget(t), []);
  return (
    <Ctx.Provider value={open}>
      {children}
      <AnimatePresence>{target && <SolveSheet key="solve" t={target} onGo={setTarget} onClose={() => setTarget(null)} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

/** Small button used on question rows. `short` keeps only the icon on phones, for tight rows. */
export function SolveButton({ t, className = "", short }: { t: SolveTarget; className?: string; short?: boolean }) {
  const open = useSolve();
  return (
    <button type="button" onClick={() => open(t)} onPointerEnter={() => void loadSheet()} className={`chip chip-accent ${className}`} aria-label={`Solution for ${t.title}`}>
      <Lightbulb size={14} weight="fill" aria-hidden /><span className={short ? "max-sm:hidden" : undefined}>Solution</span>
    </button>
  );
}
