"use client";
// One subject page of the "Other" section: header with progress and contents, then chapters. Each chapter has
// notes, a diagram, code, an optional lab and interview questions whose answers open on demand.
import dynamic from "next/dynamic";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CaretDown, Check, Code as CodeIcon, Flask, WarningCircle } from "@phosphor-icons/react";
import type { Card, Chapter, Code, Subject, Table } from "@/lib/other/types";
import { chapterKey } from "@/lib/other";
import { usePatterns } from "@/lib/patternStore";
import { useStore } from "@/lib/store";
import { P } from "@/lib/problems";
import { Bar, Seg } from "../ui";
import { ProblemRow } from "../ProblemRow";
import { useMermaid } from "../useMermaid";
import { Rich, inline } from "./Rich";
import { OtherLab } from "./OtherLab";
import type { PlayMode } from "@/lib/other/playground/compile";
import { STARTERS, type Starter } from "@/lib/other/playground/starters";

const Playground = dynamic(() => import("./playground/Playground"), { ssr: false, loading: () => <div className="pg h-[300px]" aria-hidden /> });
const FlowPlayer = dynamic(() => import("./FlowPlayer"), { ssr: false, loading: () => <div className="gx-diagram h-[420px]" aria-hidden /> });

type Lang = "cpp" | "java" | "python" | "js" | "ts";
const SubjectCtx = createContext("");
const LANG_KEY = "dsa-other-lang";
const LANGS: (readonly [Lang, string])[] = [["cpp", "C++"], ["java", "Java"], ["python", "Python"], ["js", "JavaScript"], ["ts", "TypeScript"]];
const langsIn = (c?: Code) => (c ? LANGS.filter(([k]) => c[k]) : []);

function Mermaid({ src, caption }: { src: string; caption?: string }) {
  const ref = useRef<HTMLElement>(null);
  useMermaid(ref, src);
  return (
    <figure ref={ref} className="gx-diagram">
      <div className="mermaid" data-src={src} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function TableView({ t }: { t: Table }) {
  return (
    <div className="gx-table-wrap">
      <table style={{ minWidth: 0 }}>
        <thead><tr>{t.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{t.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Which playground can run this language, if any. Java and C++ need a compiler, so they have none. */
function playMode(key: string, body: string, subject: string): PlayMode | null {
  if (key === "tsx") return "react";
  if (key === "sql") return "sql";
  if (key === "python") return "python";
  if (key === "ts") return "ts";
  if (key === "js") return subject === "node" || /from "(node:|express)|require\(/.test(body) ? "node" : "js";
  return null;
}

function CodeBlock({ code, lang, setLang }: { code: Code; lang: Lang; setLang(l: Lang): void }) {
  const subject = useContext(SubjectCtx);
  const [trying, setTrying] = useState(false);
  const [copied, setCopied] = useState(false);
  const present = langsIn(code);
  const pick = present.find(([k]) => k === lang) ?? present[0];
  const [label, body] = pick ? [pick[1], code[pick[0]]!]
    : code.tsx ? ["React (TSX)", code.tsx] : code.sql ? ["SQL", code.sql] : ["", code.text ?? ""];
  const copy = () => void navigator.clipboard?.writeText(body).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); });
  const key = pick ? pick[0] : code.tsx ? "tsx" : code.sql ? "sql" : "";
  const mode = playMode(key, body, subject);
  return (
    <div className="grid gap-2">
      {present.length > 1 && <Seg<Lang> label="Language" value={pick![0]} onChange={setLang} className="flex w-fit flex-wrap" options={present} />}
      <div className="gx-code">
        <div className="gx-code-head"><span>{code.file ?? label}</span>{mode && <button type="button" className="gx-copy gx-try" aria-expanded={trying} onClick={() => setTrying((t) => !t)}><CodeIcon size={13} aria-hidden />{trying ? "Close" : "Try it"}</button>}<button type="button" className="gx-copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.pre key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><code>{body}</code></motion.pre>
        </AnimatePresence>
      </div>
      {code.result && <div className="grid gap-1"><span className="t-eyebrow text-[12px]">Result</span><TableView t={code.result} /></div>}
      {trying && mode && <Playground key={`${mode}-${label}`} mode={mode} code={key === "tsx" && code.demo ? `${body}\n\n${code.demo}` : body} setup={code.sqlSetup} title={`Edit and run: ${code.file ?? label}`} onClose={() => setTrying(false)} />}
    </div>
  );
}

function QA({ card, n, lang, setLang }: { card: Card; n: number; lang: Lang; setLang(l: Lang): void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="max-w-none overflow-hidden rounded-tile border border-line bg-bg">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-start gap-3 px-3.5 py-3 text-left text-[14.5px] font-medium transition-colors hover:bg-surface-2">
        <span className="num pt-0.5 text-[12px] text-accent">{String(n).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">{card.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="mt-0.5 text-muted"><CaretDown size={16} aria-hidden /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <div className="grid gap-3 border-t border-line px-3.5 py-3">
              <Rich text={card.a} />
              {card.diagram && <Mermaid src={card.diagram} />}
              {card.table && <TableView t={card.table} />}
              {card.code && <CodeBlock code={card.code} lang={lang} setLang={setLang} />}
              {card.trap && <div className="gx-callout gx-warn"><span className="gx-label inline-flex items-center gap-1"><WarningCircle size={13} weight="bold" aria-hidden />Trap</span><Rich text={card.trap} /></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function ChapterView({ subject, ch, n, lang, setLang }: { subject: string; ch: Chapter; n: number; lang: Lang; setLang(l: Lang): void }) {
  const { done, toggle } = usePatterns();
  const key = chapterKey(subject, ch.id), on = !!done[key];
  return (
    <motion.article id={ch.id} className="card gx-slide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(n, 4) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="gx-slide-tag"><b>Chapter {n}</b>{ch.lab && <span className="ml-2 inline-flex items-center gap-1 text-accent"><Flask size={12} weight="fill" aria-hidden />lab</span>}</div>
        <button type="button" onClick={() => toggle(key, !on)} aria-pressed={on} className="btn btn-sm">
          <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>Done
        </button>
      </div>
      <h3>{ch.title}</h3>
      <Rich text={ch.summary} />
      {ch.points && <ul>{ch.points.map((p) => <li key={p}>{inline(p)}</li>)}</ul>}
      {ch.diagram && <Mermaid src={ch.diagram} caption={ch.caption} />}
      {ch.table && <TableView t={ch.table} />}
      {ch.code && <CodeBlock code={ch.code} lang={lang} setLang={setLang} />}
      {ch.anim && <FlowPlayer id={ch.anim} />}
      {ch.lab && <OtherLab kind={ch.lab} />}
      {ch.cards.length > 0 && (
        <>
          <h4>Interview questions</h4>
          <ol className="grid gap-2">{ch.cards.map((c, i) => <QA key={c.id} card={c} n={i + 1} lang={lang} setLang={setLang} />)}</ol>
        </>
      )}
    </motion.article>
  );
}

function SqlPractice() {
  const { ready } = useStore();
  const seen = new Set<string>();
  const ids = P.flatMap((p, i) => (p[0] === "S" && !seen.has(p[2]) && seen.add(p[2]) ? [i] : []));
  const [shown, setShown] = useState(20);
  return (
    <section className="card gx-slide" id="practice" aria-labelledby="sql-practice">
      <div className="gx-slide-tag"><b>Practice</b> · from your daily plan</div>
      <h3 id="sql-practice">{ids.length} LeetCode SQL problems</h3>
      <p>The same SQL problems as your daily plan, in plan order. Ticking one here ticks it everywhere.</p>
      {ready && <div>{ids.slice(0, shown).map((i) => <ProblemRow key={i} i={i} side={`#${ids.indexOf(i) + 1}`} />)}</div>}
      {ids.length > shown && <div className="flex justify-center"><button type="button" className="btn" onClick={() => setShown((n) => n + 20)}>Show more</button></div>}
    </section>
  );
}

function SubjectPlayground({ starters }: { starters: Starter[] }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState("0");
  const st = starters[+i];
  return (
    <section className="card flex flex-col gap-3 p-5" aria-labelledby="pg-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge-icon"><CodeIcon size={16} weight="bold" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h3 id="pg-title" className="t-h3">Playground</h3>
          <p className="text-[13px] text-muted">Write {starters.map((s) => s.label).join(", ")} here and see the result as you type. Every example below also has a Try it button.</p>
        </div>
        <button type="button" className={`btn btn-sm ${open ? "" : "btn-primary"}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Start coding"}</button>
      </div>
      {open && starters.length > 1 && <Seg<string> label="Language" value={i} onChange={setI} className="flex w-fit flex-wrap" options={starters.map((s, k) => [String(k), s.label] as const)} />}
      {open && <Playground key={st.mode} mode={st.mode} code={st.code} setup={st.setup} />}
    </section>
  );
}

export function OtherView({ subject }: { subject: Subject }) {
  const { done } = usePatterns();
  const [lang, setLangRaw] = useState<Lang>("java");
  useEffect(() => { try { const l = localStorage.getItem(LANG_KEY); if (LANGS.some(([k]) => k === l)) setLangRaw(l as Lang); } catch {} }, []);
  const setLang = (l: Lang) => { setLangRaw(l); try { localStorage.setItem(LANG_KEY, l); } catch {} };
  const n = subject.chapters.filter((c) => done[chapterKey(subject.id, c.id)]).length;
  const cards = subject.chapters.reduce((s, c) => s + c.cards.length, 0);
  // languages that appear together anywhere on this page: offer one switch at the top for all of them
  const pageLangs = LANGS.filter(([k]) => subject.chapters.some((c) => (langsIn(c.code).length > 1 && c.code?.[k]) || c.cards.some((x) => langsIn(x.code).length > 1 && x.code?.[k])));

  return (
    <div className="gx flex flex-col gap-5">
      <Link href="/other" className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted no-underline transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />All subjects</Link>
      <section className="card flex flex-col gap-3 p-5" aria-labelledby="sub-title">
        <span className="t-eyebrow">{subject.chapters.length} chapters · {cards} questions</span>
        <h2 id="sub-title" className="t-title">{subject.name}</h2>
        <p className="max-w-[72ch] text-[15px] leading-relaxed text-muted">{subject.blurb}</p>
        <div className="flex items-center gap-3"><Bar value={n} max={subject.chapters.length} className="flex-1" /><span className="num text-[12px] text-muted">{n} / {subject.chapters.length} done</span></div>
        {pageLangs.length > 1 && <div className="flex flex-wrap items-center gap-2 text-[13px]"><span className="text-muted">Code in</span><Seg<Lang> label="Language" value={pageLangs.some(([k]) => k === lang) ? lang : pageLangs[0][0]} onChange={setLang} className="flex flex-wrap" options={pageLangs} /></div>}
        <nav aria-label="Chapters" className="mt-1 border-t border-line pt-3">
          <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {subject.chapters.map((c, k) => (
              <li key={c.id} className="max-w-none">
                <a href={`#${c.id}`} className="flex gap-2.5 rounded-control py-1 text-[14px] text-ink no-underline transition-colors hover:text-accent">
                  <span className="num w-5 shrink-0 pt-px text-[12px] text-muted">{String(k + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 font-medium">{c.title}{c.lab && <Flask size={12} weight="fill" className="ml-1.5 inline text-accent" aria-label="has a lab" />}{done[chapterKey(subject.id, c.id)] && <Check size={12} weight="bold" className="ml-1.5 inline text-easy" aria-label="done" />}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </section>
      {STARTERS[subject.id] && <SubjectPlayground starters={STARTERS[subject.id]} />}
      <SubjectCtx.Provider value={subject.id}>
        {subject.chapters.map((c, k) => <ChapterView key={c.id} subject={subject.id} ch={c} n={k + 1} lang={lang} setLang={setLang} />)}
      </SubjectCtx.Provider>
      {subject.id === "sql" && <SqlPractice />}
    </div>
  );
}
