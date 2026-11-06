"use client";
// The "Other" section's subject page (chapter list with progress) and chapter page (one chapter: notes, a diagram,
// code, walk-through, lab, stories and interview questions whose answers open on demand, then prev/next).
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowSquareOut, Briefcase, Buildings, CaretDown, Check, Code as CodeIcon, Flask, Play, WarningCircle } from "@phosphor-icons/react";
import type { Card, Chapter, Code, Table } from "@/lib/other/types";
import { chapterKey, type ChapterMeta, type SubjectMeta } from "@/lib/other";
import { usePatterns } from "@/lib/patternStore";
import { useStore } from "@/lib/store";
import { P } from "@/lib/problems";
import { Bar, Seg } from "../ui";
import { ProblemRow } from "../ProblemRow";
import { useMermaid } from "../useMermaid";
import { Rich, inline } from "./Rich";
import { OtherLab } from "./OtherLab";
import { joinFiles, type PlayMode } from "@/lib/other/playground/compile";
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
  const project = code.files?.length && code.js ? [{ name: code.file ?? "server.js", js: code.js }, ...code.files] : null;
  const [fileAt, setFileAt] = useState("0");
  const present = project ? [] : langsIn(code);
  const pick = project ? (["js", "JavaScript"] as const) : present.find(([k]) => k === lang) ?? present[0];
  const shown = project?.[Number(fileAt)];
  const [label, body] = shown ? [shown.name, shown.js] : pick ? [pick[1], code[pick[0]]!]
    : code.tsx ? ["React (TSX)", code.tsx] : code.sql ? ["SQL", code.sql] : ["", code.text ?? ""];
  const copy = () => void navigator.clipboard?.writeText(body).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); });
  const key = pick ? pick[0] : code.tsx ? "tsx" : code.sql ? "sql" : "";
  const playBody = project ? joinFiles(project) : body;
  const mode = playMode(key, playBody, subject);
  return (
    <div className="grid gap-2">
      {present.length > 1 && <Seg<Lang> label="Language" value={pick![0]} onChange={setLang} className="flex w-fit flex-wrap" options={present} />}
      {project && <Seg<string> label="Files in this project" value={fileAt} onChange={setFileAt} className="flex w-fit flex-wrap" options={project.map((f, i) => [String(i), f.name] as const)} />}
      <div className="gx-code">
        <div className="gx-code-head"><span>{shown ? shown.name : code.file ?? label}</span>{mode && <button type="button" className="gx-copy gx-try" aria-expanded={trying} onClick={() => setTrying((t) => !t)}><CodeIcon size={13} aria-hidden />{trying ? "Close" : project ? "Try the project" : "Try it"}</button>}<button type="button" className="gx-copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.pre key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><code>{body}</code></motion.pre>
        </AnimatePresence>
      </div>
      {code.result && <div className="grid gap-1"><span className="t-eyebrow text-xs">Result</span><TableView t={code.result} /></div>}
      {trying && mode && <Playground key={`${mode}-${project ? "project" : label}`} mode={mode} code={key === "tsx" && code.demo ? `${body}\n\n${code.demo}` : playBody} setup={code.sqlSetup} title={`Edit and run: ${project ? "every file, each after its // @file line" : code.file ?? label}`} onClose={() => setTrying(false)} />}
    </div>
  );
}

function QA({ card, n, lang, setLang }: { card: Card; n: number; lang: Lang; setLang(l: Lang): void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="max-w-none overflow-hidden rounded-tile border border-line bg-bg">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-surface-2">
        <span className="num pt-0.5 text-xs text-accent">{String(n).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">{card.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="mt-0.5 text-muted"><CaretDown size={16} aria-hidden /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="grid gap-3 border-t border-line px-4 py-3">
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

function RealWorld({ ch }: { ch: Chapter }) {
  return (
    <>
      {ch.real && ch.real.length > 0 && (
        <div className="grid gap-2">
          <h4 className="flex items-center gap-2"><Buildings size={16} className="text-accent" aria-hidden />In the real world</h4>
          {ch.real.map((s) => (
            <article key={s.who + s.when} className="inset grid gap-2 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2"><b>{s.who}</b><span className="pill pill-muted num text-xs">{s.when}</span></div>
              <p className="m-0">{inline(s.what)}</p>
              <p className="m-0"><b>Takeaway:</b> {inline(s.lesson)}</p>
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-xs text-muted hover:text-accent">Read the source<ArrowSquareOut size={12} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
            </article>
          ))}
        </div>
      )}
      {ch.work && ch.work.length > 0 && (
        <div className="grid gap-1">
          <h4 className="flex items-center gap-2"><Briefcase size={16} className="text-accent" aria-hidden />On the job</h4>
          <ul>{ch.work.map((w) => <li key={w}>{inline(w)}</li>)}</ul>
        </div>
      )}
    </>
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
    <section className="card flex flex-col gap-3 p-6" aria-labelledby="pg-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="badge-icon"><CodeIcon size={16} weight="bold" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h3 id="pg-title" className="t-h3">Playground</h3>
          <p className="text-sm text-muted">Write {starters.map((s) => s.label).join(", ")} here and see the result as you type. Every example below also has a Try it button.</p>
        </div>
        <button type="button" className={`btn btn-sm ${open ? "" : "btn-primary"}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Start coding"}</button>
      </div>
      {open && starters.length > 1 && <Seg<string> label="Language" value={i} onChange={setI} className="flex w-fit flex-wrap" options={starters.map((s, k) => [String(k), s.label] as const)} />}
      {open && <Playground key={st.mode} mode={st.mode} code={st.code} setup={st.setup} />}
    </section>
  );
}


/** The code language picked last, shared by every code block and remembered across pages. */
function useLang() {
  const [lang, setLangRaw] = useState<Lang>("java");
  useEffect(() => { try { const l = localStorage.getItem(LANG_KEY); if (LANGS.some(([k]) => k === l)) setLangRaw(l as Lang); } catch {} }, []);
  const setLang = (l: Lang) => { setLangRaw(l); try { localStorage.setItem(LANG_KEY, l); } catch {} };
  return [lang, setLang] as const;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const href = (subject: string, chapter: string) => `/other/${subject}/${chapter}`;

/** One subject: progress, the playground and the list of chapters, each opening on its own page. */
export function SubjectHub({ subject }: { subject: SubjectMeta }) {
  const { done } = usePatterns();
  const router = useRouter();
  const chs = subject.chapters, isDone = (c: ChapterMeta) => !!done[chapterKey(subject.id, c.id)];
  const n = chs.filter(isDone).length, cards = chs.reduce((s, c) => s + c.cards, 0), next = chs.find((c) => !isDone(c));
  // old links pointed at /other/<subject>#<chapter>: send them to the chapter's own page
  useEffect(() => { const id = location.hash.slice(1); if (chs.some((c) => c.id === id)) router.replace(href(subject.id, id)); }, [chs, router, subject.id]);

  return (
    <div className="gx flex flex-col gap-6">
      <Link href="/other" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted no-underline transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />All subjects</Link>
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="sub-title">
        <span className="t-eyebrow">{chs.length} chapters · {cards} questions</span>
        <h2 id="sub-title" className="t-title">{subject.name}</h2>
        <p className="max-w-[72ch] text-sm leading-relaxed text-muted">{subject.blurb}</p>
        <div className="flex items-center gap-3"><Bar value={n} max={chs.length} className="flex-1" /><span className="num text-xs text-muted">{n} / {chs.length} done</span></div>
        {next && <Link href={href(subject.id, next.id)} className="btn btn-primary w-fit text-accent-ink no-underline">{n ? "Continue" : "Start"}: {next.title}<ArrowRight size={16} aria-hidden /></Link>}
      </section>
      {STARTERS[subject.id] && <SubjectPlayground starters={STARTERS[subject.id]} />}
      <nav aria-label="Chapters">
        <ol className="grid gap-4 sm:grid-cols-2">
          {chs.map((c, k) => (
            <motion.li key={c.id} className="max-w-none" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(k, 6) * 0.03, ease: EASE }}>
              <Link href={href(subject.id, c.id)} className="card group flex h-full flex-col gap-2 p-6 text-ink no-underline transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="num text-xs text-muted">{String(k + 1).padStart(2, "0")}</span>
                  <h3 className="t-h3 min-w-0 flex-1">{c.title}</h3>
                  {isDone(c) ? <Check size={16} weight="bold" className="shrink-0 text-easy" aria-label="done" /> : <ArrowRight size={16} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />}
                </div>
                <p className="m-0 line-clamp-2 flex-1 text-sm text-muted">{inline(c.blurb)}</p>
                <div className="flex flex-wrap gap-2">
                  {c.lab && <span className="pill pill-accent inline-flex items-center gap-1"><Flask size={12} weight="fill" aria-hidden />lab</span>}
                  {c.anim && <span className="pill pill-accent inline-flex items-center gap-1"><Play size={12} weight="fill" aria-hidden />walk-through</span>}
                  {c.cards > 0 && <span className="pill pill-muted">{c.cards} questions</span>}
                </div>
              </Link>
            </motion.li>
          ))}
        </ol>
      </nav>
      {subject.id === "sql" && <SqlPractice />}
    </div>
  );
}

/** One chapter on its own page: head with the Done tick, notes, diagram, code, walk-through, lab, stories,
 *  interview questions, then links to the previous and next chapter. */
export function ChapterPage({ subject, chapter: ch }: { subject: SubjectMeta; chapter: Chapter }) {
  const { done, toggle } = usePatterns();
  const [lang, setLang] = useLang();
  const chs = subject.chapters, i = chs.findIndex((c) => c.id === ch.id), prev = chs[i - 1], next = chs[i + 1];
  const key = chapterKey(subject.id, ch.id), on = !!done[key];
  const n = chs.filter((c) => done[chapterKey(subject.id, c.id)]).length;
  // languages that appear together on this page: one switch at the top for all of them
  const pageLangs = LANGS.filter(([k]) => (langsIn(ch.code).length > 1 && ch.code?.[k]) || ch.cards.some((x) => langsIn(x.code).length > 1 && x.code?.[k]));

  return (
    <div className="gx flex flex-col gap-6">
      <Link href={`/other/${subject.id}`} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted no-underline transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />{subject.name}</Link>
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="ch-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="t-eyebrow">Chapter {i + 1} of {chs.length}</span>
          <button type="button" onClick={() => toggle(key, !on)} aria-pressed={on} className="btn btn-sm">
            <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>Chapter done
          </button>
        </div>
        <h2 id="ch-title" className="t-title">{ch.title}</h2>
        <div className="flex flex-wrap gap-2">
          {ch.lab && <span className="pill pill-accent inline-flex items-center gap-1"><Flask size={12} weight="fill" aria-hidden />lab</span>}
          {ch.anim && <span className="pill pill-accent inline-flex items-center gap-1"><Play size={12} weight="fill" aria-hidden />walk-through</span>}
          {ch.cards.length > 0 && <span className="pill pill-muted">{ch.cards.length} questions</span>}
        </div>
        <div className="flex items-center gap-3"><Bar value={n} max={chs.length} className="flex-1" /><span className="num text-xs text-muted">{n} / {chs.length} chapters done</span></div>
        {pageLangs.length > 1 && <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted">Code in</span><Seg<Lang> label="Language" value={pageLangs.some(([k]) => k === lang) ? lang : pageLangs[0][0]} onChange={setLang} className="flex flex-wrap" options={pageLangs} /></div>}
      </section>

      <SubjectCtx.Provider value={subject.id}>
        <motion.article key={ch.id} className="card gx-slide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
          <Rich text={ch.summary} />
          {ch.points && <ul>{ch.points.map((p) => <li key={p}>{inline(p)}</li>)}</ul>}
          {ch.diagram && <Mermaid src={ch.diagram} caption={ch.caption} />}
          {ch.table && <TableView t={ch.table} />}
          {ch.code && <CodeBlock code={ch.code} lang={lang} setLang={setLang} />}
          {ch.anim && <FlowPlayer id={ch.anim} />}
          {ch.lab && <OtherLab kind={ch.lab} />}
          <RealWorld ch={ch} />
        </motion.article>
        {ch.cards.length > 0 && (
          <section className="card gx-slide" aria-labelledby="ch-qs">
            <h3 id="ch-qs">Interview questions</h3>
            <p className="m-0 text-sm text-muted">Answer out loud first, then open the card.</p>
            <ol className="grid gap-2">{ch.cards.map((c, k) => <QA key={c.id} card={c} n={k + 1} lang={lang} setLang={setLang} />)}</ol>
          </section>
        )}
      </SubjectCtx.Provider>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Chapters">
        {prev ? <Link href={href(subject.id, prev.id)} className="btn btn-nav text-ink no-underline justify-start gap-3"><ArrowLeft size={16} aria-hidden /><span><span className="block text-xs font-normal text-muted">Previous</span>{prev.title}</span></Link> : <span />}
        {next
          ? <Link href={href(subject.id, next.id)} onClick={() => { if (!on) toggle(key, true); }} className="btn btn-nav text-ink no-underline justify-end gap-3 text-right"><span><span className="block text-xs font-normal text-muted">{on ? "Next" : "Done, next"}</span>{next.title}</span><ArrowRight size={16} aria-hidden /></Link>
          : <Link href={`/other/${subject.id}`} onClick={() => { if (!on) toggle(key, true); }} className="btn btn-nav text-ink no-underline justify-end gap-3 text-right"><span><span className="block text-xs font-normal text-muted">{on ? "Back to" : "Done, back to"}</span>{subject.name}</span><ArrowRight size={16} aria-hidden /></Link>}
      </nav>
    </div>
  );
}
