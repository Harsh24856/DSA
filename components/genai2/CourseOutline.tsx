"use client";
// The whole course as a list beside a module: every stage, its modules with done ticks, and where you are now.
// Only the current stage is open at first; the others show their progress and open on click.
import Link from "next/link";
import { useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { moduleKey, STAGES } from "@/lib/genai2/core";
import { usePatterns } from "@/lib/patternStore";

export function CourseOutline({ current }: { current: string }) {
  const { done } = usePatterns();
  const here = STAGES.find((s) => s.modules.some((m) => m.id === current))?.n;
  const [open, setOpen] = useState<Set<number>>(() => new Set(here === undefined ? [] : [here]));
  const flip = (n: number) => setOpen((o) => { const x = new Set(o); if (x.has(n)) x.delete(n); else x.add(n); return x; });

  return (
    <nav aria-label="Course outline" className="grid gap-1">
      {STAGES.map((s) => {
        const n = s.modules.filter((m) => done[moduleKey(m.id)]).length, isOpen = open.has(s.n);
        return (
          <div key={s.n}>
            <button type="button" onClick={() => flip(s.n)} aria-expanded={isOpen}
              className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left transition-colors hover:bg-surface-2">
              <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold" data-here={s.n === here || undefined}>{s.n}</span>
              <span className={`min-w-0 flex-1 truncate text-sm ${s.n === here ? "font-semibold text-ink" : "text-muted"}`}>{s.title}</span>
              <span className="num shrink-0 text-xs text-muted">{n}/{s.modules.length}</span>
              <CaretDown size={12} className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {isOpen && (
              <ul className="m-0 mb-2 ml-5 grid list-none gap-0.5 border-l border-line p-0 pl-2">
                {s.modules.map((m) => {
                  const ok = !!done[moduleKey(m.id)], cur = m.id === current;
                  return (
                    <li key={m.id}>
                      <Link href={`/genai/${m.id}`} aria-current={cur ? "page" : undefined}
                        className={`flex items-start gap-2 rounded-control px-2 py-1 text-sm leading-snug transition-colors hover:bg-surface-2 ${cur ? "bg-accent-soft font-semibold text-ink" : "text-muted hover:text-ink"}`}>
                        <span className="tick pointer-events-none mt-0.5 size-4 shrink-0" data-on={ok || undefined} aria-hidden>{ok && <Check size={10} weight="bold" />}</span>
                        <span className="min-w-0">{m.title}<span className="sr-only">{ok ? " (done)" : ""}</span></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
