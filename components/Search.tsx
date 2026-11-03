"use client";
// Ctrl/Cmd + K: jump to any question (opens its solution and visualiser), pattern or page.
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { lcUrl, TOPICS } from "@/lib/patterns";
import { PATTERN_PROBLEMS } from "@/lib/patterns/problems";
import { title, url } from "@/lib/logic";
import { P } from "@/lib/problems";
import { useSolve } from "./SolvePanel";

type Item = { key: string; label: string; tag: string; go: () => void; text: string };

export function Search({ nav, onClose }: { nav: { href: string; label: string }[]; onClose(): void }) {
  const router = useRouter(), solve = useSolve();
  const [q, setQ] = useState(""), [at, setAt] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const all = useMemo(() => {
    const out: Item[] = [], seen = new Set<string>();
    const open = (href: string) => () => { router.push(href); onClose(); };
    for (const n of nav) out.push({ key: n.href, label: n.label, tag: "Page", go: open(n.href), text: n.label.toLowerCase() });
    for (const t of TOPICS) {
      out.push({ key: t.id, label: t.name, tag: "Topic", go: open(`/patterns/${t.id}`), text: t.name.toLowerCase() });
      for (const p of t.patterns) out.push({ key: `${t.id}:${p.n}`, label: p.name, tag: t.name, go: open(`/patterns/${t.id}#p-${p.n}`), text: `${p.name} ${t.name}`.toLowerCase() });
    }
    P.forEach((p, i) => {
      if (seen.has(p[2])) return;
      seen.add(p[2]);
      const name = title(i), lc = p[0] !== "C";
      out.push({ key: p[2], label: name, tag: p[0] === "L" ? p[3] : p[0] === "S" ? "SQL" : "Codeforces", text: name.toLowerCase(),
        go: () => { onClose(); if (lc) solve({ slug: p[2], title: name, level: p[3], url: url(i), sql: p[0] === "S", i }); else window.open(url(i), "_blank", "noopener"); } });
    });
    for (const [lc, name, slug, lv] of Object.values(PATTERN_PROBLEMS).flatMap((t) => Object.values(t).flat())) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({ key: slug, label: `${lc}. ${name}`, tag: lv, text: `${lc} ${name}`.toLowerCase(), go: () => { onClose(); solve({ slug, title: name, level: lv, url: lcUrl(slug) }); } });
    }
    return out;
  }, [nav, onClose, router, solve]);

  const needle = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!needle) return all.slice(0, nav.length);
    const words = needle.split(/\s+/);
    return all.filter((x) => words.every((w) => x.text.includes(w))).sort((a, b) => +b.text.startsWith(needle) - +a.text.startsWith(needle)).slice(0, 30);
  }, [all, needle, nav.length]);

  useEffect(() => { setAt(0); }, [needle]);
  useEffect(() => { list.current?.children[at]?.scrollIntoView({ block: "nearest" }); }, [at]);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setAt((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAt((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); hits[at]?.go(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center px-4 pt-20">
      <motion.div className="scrim absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} onClick={onClose} aria-hidden />
      <motion.div role="dialog" aria-modal="true" aria-label="Search" className="relative flex max-h-[min(560px,calc(100dvh-112px))] w-full max-w-[640px] flex-col self-start overflow-hidden rounded-card border border-line bg-surface shadow-card"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        <label className="flex items-center gap-3 border-b border-line px-4">
          <MagnifyingGlass size={18} className="shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Search questions, patterns and pages</span>
          <input autoFocus role="combobox" aria-expanded="true" aria-controls="search-list" aria-activedescendant={hits[at] ? `s-${hits[at].key}` : undefined} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Question or pattern name" className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
        </label>
        <ul id="search-list" ref={list} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-2">
          {hits.map((x, k) => (
            <li key={x.key} id={`s-${x.key}`} role="option" aria-selected={k === at}>
              <button type="button" tabIndex={-1} onClick={x.go} onPointerMove={() => setAt(k)} className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${k === at ? "bg-surface-2" : ""}`}>
                <span className="min-w-0 flex-1 truncate font-medium">{x.label}</span>
                <span className="shrink-0 text-xs text-muted">{x.tag}</span>
              </button>
            </li>
          ))}
          {!hits.length && <li className="empty">No match for &ldquo;{q}&rdquo;. Try part of the question name, or a pattern such as sliding window.</li>}
        </ul>
      </motion.div>
    </div>
  );
}
