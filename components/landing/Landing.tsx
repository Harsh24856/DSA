"use client";
// The public page signed-out visitors see. One action: Continue with Google. Every number comes from lib/landingFacts.ts
// and the screenshots in public/landing are the real app (tools/landing_shots.mjs).
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CaretDown, Play } from "@phosphor-icons/react";
import { FACTS as F } from "@/lib/landingFacts";
import { CTA } from "./CTA";
import { Logo } from "../Logo";
import { Skeleton } from "../ui";
import { PlanDemo } from "./PlanDemo";

const HeroDemo = dynamic(() => import("./HeroDemo").then((m) => m.HeroDemo), { ssr: false, loading: () => <Skeleton className="h-[560px] rounded-2xl" /> });
const Playground = dynamic(() => import("../other/playground/Playground"), { ssr: false, loading: () => <Skeleton className="h-[300px] rounded-2xl" /> });

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-64px" }} transition={{ duration: 0.7, ease: EASE }}>{children}</motion.div>;
}

// pixel sizes of the screenshots, so the page does not shift as they load
const SIZE: Record<string, number[]> = {"/landing/today.jpg": [2560, 1600], "/landing/visualizer.jpg": [1520, 1600], "/landing/playground.jpg": [2108, 984], "/landing/story.jpg": [2108, 904]};

function Shot({ src, alt }: { src: string; alt: string }) {
  const [w, h] = SIZE[src];
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface p-2">
      <Image src={src} alt={alt} width={w} height={h} sizes="(min-width: 1152px) 1104px, 100vw" className="h-auto w-full rounded-lg" />
    </div>
  );
}

/* Tagline: each word lights up as it crosses a line 70% down the screen. */
const TAGLINE = [["Stop spending your evening", "deciding what to study."], ["Open one page, solve what is on it,", "and understand why it worked."]];
function TaglineReveal() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const words = TAGLINE.flat().join(" ").split(" ");
  const [lit, setLit] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const spans = ref.current?.querySelectorAll<HTMLElement>("[data-w]");
      if (!spans) return;
      const line = innerHeight * 0.7;
      let n = 0;
      spans.forEach((s) => { if (s.getBoundingClientRect().top < line) n++; });
      setLit(n);
    };
    const onScroll = () => { raf ||= requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [reduce]);
  let k = 0;
  return (
    <section className="mx-auto max-w-[680px] px-4 py-24 sm:px-6" aria-label={words.join(" ")}>
      <p ref={ref} aria-hidden className="heading-4 sm:heading-3">
        {TAGLINE.map((para, p) => (
          <span key={p} className={`block ${p ? "mt-6" : ""}`}>
            {para.map((line) => (
              <span key={line} className="block">
                {line.split(" ").map((w) => {
                  const i = k++, on = reduce || i < lit;
                  return <span key={i} data-w className="mr-[0.25em] inline-block transition-opacity duration-500" style={{ opacity: on ? 1 : 0.28 }}>{w}</span>;
                })}
              </span>
            ))}
          </span>
        ))}
      </p>
    </section>
  );
}

const SAMPLE = `import { useState } from "react";

export default function App() {
  const [solved, setSolved] = useState(0);
  return (
    <button onClick={() => setSolved(solved + 1)}>
      Solved today: {solved}
    </button>
  );
}`;

/** The screenshot until asked, so a visitor who never tries it downloads nothing extra. */
function TryPlayground({ src, alt }: { src: string; alt: string }) {
  const [on, setOn] = useState(false);
  if (on) return <Playground mode="react" code={SAMPLE} title="Change the code and watch the button update" onClose={() => setOn(false)} />;
  return (
    <div className="relative">
      <Shot src={src} alt={alt} />
      <button type="button" className="btn btn-primary absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap" onClick={() => setOn(true)}><Play size={16} weight="fill" aria-hidden />Try it here</button>
    </div>
  );
}

const BENEFITS: { title: string; body: ReactNode; src: string; alt: string; demo?: "plan" | "code" }[] = [
  { title: "Your plan is already written",
    body: <>Three LeetCode and one SQL on weekdays, more on weekends. Miss a day and it rolls forward, so nothing is lost and the list never piles up. Problems you needed a hint for return after 3, 7 and 21 days.</>,
    src: "/landing/today.jpg", alt: "The Today page showing a daily list of LeetCode problems with difficulty labels, a progress count and a weekly chart.", demo: "plan" },
  { title: "See the algorithm run, step by step",
    body: <>All {F.visualised} LeetCode questions have a written solution and a visualiser you can step through, on a small example you can follow. {F.topics} topics and {F.patterns} patterns teach the idea first, with a template and the traps.</>,
    src: "/landing/visualizer.jpg", alt: "A solution panel with a step by step visualiser of an algorithm running on a small array, with a note explaining the current step." },
  { title: "Write code here and watch it run",
    body: <>React updates as you type. Express answers real requests in the browser. Python and SQL are the real thing compiled to WebAssembly. Every sample has a Try it button, with nothing to install.</>,
    src: "/landing/playground.jpg", alt: "A code editor beside a live preview of a React counter component, with a console below.", demo: "code" },
  { title: "Learn from what actually broke",
    body: <>{F.subjects} CS subjects and {F.chapters} chapters, with {F.stories} real incidents and designs, each linked to its source. A 43 second network blip took GitHub 24 hours to recover from. You will remember why.</>,
    src: "/landing/story.jpg", alt: "A chapter on consistency showing real incidents from GitHub and Amazon, each with a takeaway and a link to the source." },
];

const STEPS = [
  ["Sign in with Google", "Your ticks and notes are saved to your account, so your phone and laptop show the same progress. Set your placement date once."],
  ["Solve today's list", "Open the problem on LeetCode, then tick it and say honestly whether you solved it alone, with a hint, or from the editorial."],
  ["Come back tomorrow", "Unsolved problems roll forward. Ones you struggled with come back on a schedule. Analytics shows whether you are on pace."],
];

const FAQ: [string, string][] = [
  ["Is it free?", "Yes. There is nothing to pay and no card to enter. You only need a Google account to save your progress."],
  ["Does it replace LeetCode?", "No. Problems open on LeetCode and Codeforces, where you submit your answer. DSA Daily decides what to do today, tracks it, and teaches the idea when you are stuck."],
  ["What happens if I miss a day?", "Nothing breaks. Today's list always shows your lowest numbered unsolved problems, so anything you missed simply stays at the top."],
  ["My placements are on a different date. Does it still work?", "Yes. Set your own plan start and placement dates in Settings, and adjust how many problems you want each day. The pace chart follows your dates."],
  ["I am a beginner. Is this too hard?", "The plan starts easier and the patterns section explains each idea from the start. You can also read a solution whenever you need it, and that problem will simply come back later for another try."],
  ["Which languages can I run in the browser?", "JavaScript, TypeScript, React, Node with Express, Python and SQL. C++ and Java samples are there to read and copy, but they need a compiler, so they do not run on the page."],
  ["Are the solutions correct?", `Every Python solution runs against LeetCode's own examples before release, and every SQL answer runs in SQLite. The CS core programs are compiled and run too. If you find a mistake, please report it on GitHub.`],
  ["Who can see my progress?", "Only you. Progress is stored against your email and locked to your account. See the privacy page for exactly what is stored."],
  ["Does it work on my phone?", "Yes. Every page is built for phones as well as laptops, and your progress syncs between them."],
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 title-3 transition-colors duration-300 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        {q}<CaretDown size={16} className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" aria-hidden />
      </summary>
      <p className="px-4 pb-4 body-6 text-muted">{a}</p>
    </details>
  );
}

export function Landing() {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <a href="#main" className="sr-only z-50 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
        <header className="top-nav pointer-events-auto flex w-full max-w-fit items-center gap-2 p-2">
          <Link href="/welcome" aria-label="DSA Daily" className="rounded-lg px-2 py-1"><Logo className="h-6 w-auto" /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Page sections">
            {[["#benefits", "Features"], ["#how", "How it works"], ["#faq", "Questions"]].map(([h, l]) => (
              <a key={h} href={h} className="flex h-8 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors duration-300 hover:text-ink">{l}</a>
            ))}
          </nav>
          <div className="ml-2"><CTA size="sm" /></div>
        </header>
      </div>

      <main id="main">
        <section className="mx-auto flex max-w-[1152px] flex-col items-center px-4 pb-16 pt-32 text-center sm:px-6 sm:pt-40">
          <motion.div className="flex flex-col items-center" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
            <h1 className="hero-text heading-3 max-w-[680px] sm:heading-2">
              Know what to solve today,<br className="hidden sm:block" /> and see exactly why it works
            </h1>
            <p className="mt-6 max-w-[680px] text-base text-muted sm:text-lg">
              A daily placement plan for LeetCode, SQL and Codeforces, with a step by step visualiser for every LeetCode question, live code, and CS core subjects taught through real outages.
            </p>
            <div className="mt-8"><CTA /></div>
            <p className="mt-4 caption-5 text-muted">Free. No card. {F.problems} problems and {F.patterns} patterns ready when you sign in.</p>
          </motion.div>
          <motion.div className="mx-auto mt-16 w-full max-w-[760px]" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}>
            <HeroDemo />
          </motion.div>
        </section>

        <TaglineReveal />

        <section className="mx-auto max-w-[1152px] px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="heading-4 max-w-[680px] sm:heading-3">Placement prep usually fails before you solve anything</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[["Too many lists", "Saved sheets and tabs, and no idea which one to open tonight. You start with a plan for today, already chosen and in a sensible order."],
                ["Solutions you cannot follow", "Reading code rarely shows why it works. Here you step through it on a small example and see what changes at each line."],
                ["Theory that never sticks", "Definitions fade by the interview. A real outage does not, and every story links to the company's own account of what went wrong."]].map(([t, d]) => (
                <div key={t} className="card p-6"><h3 className="title-2">{t}</h3><p className="mt-2 body-6 text-muted">{d}</p></div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="benefits" className="mx-auto flex max-w-[1152px] scroll-mt-24 flex-col gap-24 px-4 py-16 sm:px-6">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} className="grid items-center gap-8 lg:grid-cols-2">
              <div className={i % 2 ? "lg:order-2" : ""}>
                <h2 className="heading-5 sm:heading-4">{b.title}</h2>
                <p className="mt-4 body-3 text-muted">{b.body}</p>
              </div>
              <div className={`min-w-0 ${i % 2 ? "lg:order-1" : ""}`}>{b.demo === "plan" ? <PlanDemo /> : b.demo === "code" ? <TryPlayground src={b.src} alt={b.alt} /> : <Shot src={b.src} alt={b.alt} />}</div>
            </Reveal>
          ))}
        </section>

        <section id="how" className="mx-auto max-w-[1152px] scroll-mt-24 px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="heading-4 sm:heading-3">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="card p-6">
                  <span className="num caption-3 text-accent">Step {i + 1}</span>
                  <h3 className="mt-2 title-2">{t}</h3>
                  <p className="mt-2 body-6 text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section className="mx-auto max-w-[1152px] px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="heading-4 max-w-[680px] sm:heading-3">Everything is checked, not just written</h2>
            <p className="mt-4 max-w-[680px] body-3 text-muted">Python solutions run against LeetCode&apos;s own examples. SQL answers run in SQLite and are compared with their result tables. Java and C++ programs are compiled and run. Incidents link to their sources, so you can read them yourself.</p>
            <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {([[F.problems, `problems: ${F.leetcode} LeetCode, ${F.sql} SQL, ${F.codeforces} Codeforces`], [F.visualised, "LeetCode questions with their own visualiser"], [F.questions, "interview questions with answers you open after trying"], [F.genaiModules, "Gen AI engineer modules with runnable code"]] as const).map(([n, l]) => (
                <div key={l} className="card p-6"><dd className="num text-3xl font-semibold tracking-tight">{n}</dd><dt className="mt-2 caption-5 text-muted">{l}</dt></div>
              ))}
            </dl>
          </Reveal>
        </section>

        <section id="faq" className="mx-auto max-w-[680px] scroll-mt-24 px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="heading-4 sm:heading-3">Questions</h2>
            <div className="mt-8 flex flex-col gap-2">{FAQ.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}</div>
          </Reveal>
        </section>

        <section className="mx-auto flex max-w-[680px] flex-col items-center px-4 py-24 text-center sm:px-6">
          <Reveal className="flex flex-col items-center">
            <h2 className="hero-text heading-4 sm:heading-3">Start with today&apos;s list</h2>
            <p className="mt-4 body-3 text-muted">It takes one click, costs nothing, and you can sign out whenever you like.</p>
            <div className="mt-8"><CTA /></div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1152px] flex-wrap items-center justify-between gap-4 px-4 pb-8 pt-4 sm:px-6">
        <Logo className="h-6 w-auto" />
        <nav className="flex flex-wrap gap-4 body-6 text-muted" aria-label="Legal">
          <Link href="/privacy" className="transition-colors duration-300 hover:text-ink">Privacy</Link>
          <Link href="/terms" className="transition-colors duration-300 hover:text-ink">Terms</Link>
          <a href="https://github.com/Harsh24856/DSA" target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-ink">GitHub</a>
        </nav>
      </footer>
    </div>
  );
}
