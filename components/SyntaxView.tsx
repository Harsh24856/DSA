"use client";
// Syntax: one idea at a time, the same program in C++, Java, Python, JavaScript, TypeScript and Rust. Edit and run it,
// compare it with another language, and tick it off per language.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { CONTAINERS, SYN_GROUPS, SYN_LANGS, SYN_TOPICS, synKey, type SynLang } from "@/lib/syntax/topics";
import { inline } from "./other/Rich";
import { Bar, Seg } from "./ui";

const Playground = dynamic(() => import("./other/playground/Playground"), { ssr: false, loading: () => <div className="pg h-[360px]" aria-hidden /> });
const LANG_KEY = "dsa-syntax-lang";
const label = (l: SynLang) => SYN_LANGS.find(([k]) => k === l)![1];

export function SyntaxView({ code, out, outBy }: { code: Record<string, Record<SynLang, string>>; out: Record<string, string>; outBy: Record<string, Partial<Record<SynLang, string>>> }) {
  const { done, toggle } = usePatterns();
  const [lang, setLangRaw] = useState<SynLang>("cpp");
  const [topic, setTopicRaw] = useState(SYN_TOPICS[0].id);
  const [compare, setCompare] = useState<SynLang | "">("");
  useEffect(() => {
    try { const l = localStorage.getItem(LANG_KEY); if (SYN_LANGS.some(([k]) => k === l)) setLangRaw(l as SynLang); } catch {}
    const fromHash = () => { const h = location.hash.slice(1); if (SYN_TOPICS.some((t) => t.id === h)) setTopicRaw(h); };
    fromHash();
    addEventListener("hashchange", fromHash);              // a search result or link to another topic on this page
    return () => removeEventListener("hashchange", fromHash);
  }, []);
  const setLang = (l: SynLang) => { setLangRaw(l); if (compare === l) setCompare(""); try { localStorage.setItem(LANG_KEY, l); } catch {} };
  const setTopic = (id: string) => { setTopicRaw(id); history.replaceState(null, "", `#${id}`); };

  const i = SYN_TOPICS.findIndex((t) => t.id === topic), t = SYN_TOPICS[i], prev = SYN_TOPICS[i - 1], next = SYN_TOPICS[i + 1];
  const learned = (id: string, l: SynLang) => !!done[synKey(id, l)];
  const count = SYN_TOPICS.filter((x) => learned(x.id, lang)).length, key = synKey(t.id, lang), on = learned(t.id, lang);
  const expected = outBy[t.id]?.[lang], containers = SYN_GROUPS.find((g) => g.topics.includes(t))?.title === "DSA containers";

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-col gap-4 p-6" aria-labelledby="syn-title">
        <div>
          <h2 id="syn-title" className="t-h2">One program, six languages</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-muted">The same {SYN_TOPICS.length} small programs in six languages, so you can learn a new one by comparing it with one you know, including every map, set and heap you need for DSA and what each language lacks. Edit and run any of them here.</p>
        </div>
        <Seg<SynLang> label="Language" value={lang} onChange={setLang} className="flex w-fit flex-wrap" options={SYN_LANGS} />
        <div className="flex items-center gap-3 text-xs text-muted"><span className="shrink-0">{label(lang)}</span><Bar value={count} max={SYN_TOPICS.length} className="flex-1" /><span className="num">{count} / {SYN_TOPICS.length} learned</span></div>
        <nav aria-label="Topics" className="grid gap-3 border-t border-line pt-4">
          {SYN_GROUPS.map((g) => (
            <div key={g.title} className="flex flex-wrap items-center gap-2">
              <p className="t-eyebrow w-full sm:w-44 sm:shrink-0">{g.title}</p>
              {g.topics.map((x) => (
                <button key={x.id} type="button" className="chip" aria-current={x.id === topic ? "step" : undefined} onClick={() => setTopic(x.id)}>
                  {x.title}{learned(x.id, lang) && <Check size={12} weight="bold" aria-label="learned" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </section>

      <section className="card flex min-w-0 flex-col gap-4 p-6" aria-labelledby="topic-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="t-eyebrow">Topic {i + 1} of {SYN_TOPICS.length}</span>
          <button type="button" onClick={() => toggle(key, !on)} aria-pressed={on} className="btn btn-sm">
            <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>Learned in {label(lang)}
          </button>
        </div>
        <h3 id="topic-title" className="t-h2">{t.title}</h3>
        <p className="max-w-[72ch] text-sm leading-relaxed">{t.idea}</p>
        {t.notes[lang] && <p className="callout text-sm leading-relaxed"><b>{label(lang)}:</b> {inline(t.notes[lang]!)}</p>}
        {containers && (
          <details className="tile p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Every container in {label(lang)}: what exists and what does not</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="pg-table w-full text-left">
                <thead><tr><th>Need</th><th>Use</th><th>Cost</th><th>Watch out</th></tr></thead>
                <tbody>{CONTAINERS[lang].map(([need, use, cost, watch]) => <tr key={need}><td>{need}</td><td className={use.startsWith("not") ? "text-hard" : ""}>{inline(use)}</td><td className="num">{cost}</td><td>{inline(watch)}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        )}
        <Playground key={`${t.id}:${lang}`} mode={lang} code={code[t.id][lang]} title={`${t.title} in ${label(lang)}`} />
        <div className="grid gap-1">
          <p className="text-xs font-semibold text-muted">{expected ? `Expected output in ${label(lang)}: the last lines show what happens when you try the version that does not work` : outBy[t.id] ? "Expected output (some languages print an extra line here)" : "Expected output, the same in every language"}</p>
          <pre className="code overflow-x-auto text-xs" tabIndex={0}>{expected ?? out[t.id]}</pre>
        </div>
        <div className="grid gap-2 border-t border-line pt-4">
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Compare with</span>
            <select className="field w-auto" value={compare} onChange={(e) => setCompare(e.target.value as SynLang | "")}>
              <option value="">nothing</option>
              {SYN_LANGS.filter(([k]) => k !== lang).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          {compare && <>
            {t.notes[compare] && <p className="text-sm text-muted"><b className="text-ink">{label(compare)}:</b> {inline(t.notes[compare]!)}</p>}
            <pre className="code overflow-x-auto text-xs" tabIndex={0} aria-label={`${t.title} in ${label(compare)}`}>{code[t.id][compare]}</pre>
          </>}
        </div>
      </section>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Previous and next topic">
        {prev ? <button type="button" onClick={() => setTopic(prev.id)} className="btn btn-nav justify-start gap-3 text-left"><ArrowLeft size={16} aria-hidden /><span><span className="block text-xs font-normal text-muted">Previous</span>{prev.title}</span></button> : <span />}
        {next && <button type="button" onClick={() => { if (!on) toggle(key, true); setTopic(next.id); }} className="btn btn-nav justify-end gap-3 text-right"><span><span className="block text-xs font-normal text-muted">{on ? "Next" : "Learned, next"}</span>{next.title}</span><ArrowRight size={16} aria-hidden /></button>}
      </nav>
    </div>
  );
}
