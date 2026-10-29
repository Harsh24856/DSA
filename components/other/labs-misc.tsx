"use client";
// OOP dispatch (vtable) and aptitude drills.
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { aptitude, dispatch, type AptTopic, type Cls } from "@/lib/other/sim";
import { Seg } from "../ui";
import { Lab, spring, tint } from "../labs/kit";

/* ---------- vtable dispatch ---------- */
const CLASSES: Cls[] = [
  { name: "Shape", methods: ["area", "name"] },
  { name: "Circle", parent: "Shape", methods: ["area"] },
  { name: "Square", parent: "Shape", methods: ["area", "name"] },
];
const ORDER = ["area", "name"];
type CName = "Shape" | "Circle" | "Square";

export function VtableLab() {
  const [obj, setObj] = useState<CName>("Circle");
  const [method, setMethod] = useState<"area" | "name">("area");
  const [virt, setVirt] = useState(true);
  const run = dispatch(CLASSES, "Shape", obj, method, virt);
  const row = (m: string) => dispatch(CLASSES, "Shape", obj, m, true);
  return (
    <Lab title="What really happens on shape->area()" hint="In C++ a call through a base pointer is resolved at run time only if the method is virtual: the object carries a hidden pointer (vptr) to its class's table of function addresses (vtable). In Java every instance method behaves as if virtual.">
      <div className="flex flex-wrap gap-2">
        <Seg<CName> label="Object created" value={obj} onChange={setObj} options={[["Shape", "new Shape"], ["Circle", "new Circle"], ["Square", "new Square"]]} />
        <Seg<"area" | "name"> label="Method called" value={method} onChange={setMethod} options={[["area", "area()"], ["name", "name()"]]} />
        <Seg<"v" | "nv"> label="Declared virtual" value={virt ? "v" : "nv"} onChange={(v) => setVirt(v === "v")} options={[["v", "virtual"], ["nv", "not virtual"]]} />
      </div>
      <pre className="code text-[12.5px]">{`Shape* shape = new ${obj}();\nshape->${method}();   // static type Shape*, dynamic type ${obj}`}</pre>
      <div className="grid items-start gap-3 sm:grid-cols-3" aria-label="Dispatch path">
        <div className="inset grid gap-1 p-3 text-[13px]">
          <div className="t-eyebrow text-[12px]">object on the heap</div>
          <div className="font-semibold">{obj}</div>
          <motion.div className="num rounded-control px-2 py-1" animate={{ background: virt ? tint(30) : "var(--surface-2)" }}>vptr →</motion.div>
          <div className="text-muted">fields...</div>
        </div>
        <div className="inset grid gap-1 p-3 text-[13px]">
          <div className="t-eyebrow text-[12px]">vtable of {obj}</div>
          {ORDER.map((m) => (
            <motion.div key={m} className="num flex justify-between gap-2 rounded-control px-2 py-1" animate={{ background: virt && m === method ? tint(30) : "var(--surface-2)" }} transition={{ duration: 0.3 }}>
              <span>{m}</span><span className={virt && m === method ? "text-ink" : "text-muted"}>→ {row(m)}::{m}</span>
            </motion.div>
          ))}
        </div>
        <div className="inset grid gap-1 p-3 text-[13px]">
          <div className="t-eyebrow text-[12px]">code that runs</div>
          <AnimatePresence mode="wait">
            <motion.div key={`${run}-${method}`} className="num rounded-control bg-accent-soft px-2 py-2 font-semibold" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={spring}>{run}::{method}()</motion.div>
          </AnimatePresence>
          <div className="text-muted">{virt ? "chosen at run time from the object" : "chosen at compile time from the pointer type"}</div>
        </div>
      </div>
      <p className="callout text-[13px]" role="status">
        {virt ? `Virtual: the call follows vptr to ${obj}'s vtable, which points to ${run}::${method}. ${run !== obj ? `${obj} does not override ${method}, so its vtable reuses ${run}'s entry.` : ""}`
          : `Not virtual: the compiler binds shape->${method}() to Shape::${method} because shape is a Shape*. The object's real type is ignored. This is static binding, and with a non-virtual destructor it is also how memory leaks through base pointers happen.`}
      </p>
    </Lab>
  );
}

/* ---------- aptitude drills ---------- */
const TOPICS: [AptTopic, string][] = [["percent", "Percent change"], ["profit", "Profit and discount"], ["interest", "SI vs CI"], ["work", "Time and work"], ["trains", "Trains"], ["boats", "Boats and streams"], ["pnc", "Combinations"], ["dice", "Probability"], ["mixture", "Mixtures"], ["hcf", "HCF and LCM"]];

export function AptitudeLab() {
  const [topic, setTopic] = useState<AptTopic>("percent");
  const [seed, setSeed] = useState(1);
  const [guess, setGuess] = useState("");
  const [shown, setShown] = useState(false);
  const p = aptitude(topic, seed);
  const val = parseFloat(guess);
  const right = Number.isFinite(val) && Math.abs(val - p.answer) <= Math.max(0.01, Math.abs(p.answer) * 0.005);
  const next = () => { setSeed((s) => s + 1); setGuess(""); setShown(false); };
  return (
    <Lab title="Aptitude drill: fresh problems every time" hint="Pick a topic, solve on paper, type the number. Every problem is generated with its answer computed, so you can practise as many as you like.">
      <ul className="flex flex-wrap gap-1.5" aria-label="Topic">
        {TOPICS.map(([k, l]) => <li key={k}><button type="button" className="chip" aria-pressed={topic === k} onClick={() => { setTopic(k); setGuess(""); setShown(false); }}>{l}</button></li>)}
      </ul>
      <AnimatePresence mode="wait">
        <motion.p key={`${topic}-${seed}`} className="rounded-tile bg-surface px-4 py-3 text-[15px] leading-relaxed" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>{p.q}</motion.p>
      </AnimatePresence>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); setShown(true); }}>
        <label className="sr-only" htmlFor="apt-answer">Your answer</label>
        <input id="apt-answer" className="field num w-40" inputMode="decimal" placeholder="Your answer" value={guess} onChange={(e) => { setGuess(e.target.value); setShown(false); }} />
        <span className="text-[13px] text-muted">{p.unit}</span>
        <button type="submit" className="btn btn-sm btn-primary">Check</button>
        <button type="button" className="btn btn-sm" onClick={next}>New problem</button>
      </form>
      <AnimatePresence>
        {shown && (
          <motion.div className="grid gap-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <p className={`rounded-tile px-3 py-2 text-[14px] font-semibold ${right ? "bg-accent-soft" : "bg-hard/10 text-hard"}`} role="status">
              {guess.trim() === "" ? `Answer: ${p.answer} ${p.unit}` : right ? `Correct: ${p.answer} ${p.unit}` : `Not quite. The answer is ${p.answer} ${p.unit}.`}
            </p>
            <ol className="grid list-decimal gap-1 pl-5 text-[13px] marker:text-accent">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </motion.div>
        )}
      </AnimatePresence>
    </Lab>
  );
}
