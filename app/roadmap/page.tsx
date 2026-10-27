"use client";
import { motion, useReducedMotion } from "motion/react";
import { useStore } from "@/lib/store";
import { parse, phases, todayPlan } from "@/lib/logic";
import { P } from "@/lib/problems";
import { Bar, Card } from "@/components/ui";

export default function Roadmap() {
  const { state, now } = useStore();
  const reduce = useReducedMotion();
  const plan = todayPlan(state, now);
  const cur = plan.main.length ? P[plan.main[0]][4] : 4;

  return (
    <Card title={`Roadmap to ${parse(state.quota.placement).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`} sub="Four phases, about 2 hours a day">
      <ol className="relative flex flex-col gap-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-0.5 before:bg-line">
        {phases(state.quota).map((ph, k) => {
          const tot = P.filter((p) => p[4] === ph.n).length;
          const dn = Object.keys(state.done).filter((i) => P[+i] && P[+i][4] === ph.n).length;
          const now_ = ph.n === cur, past = ph.n < cur;
          return (
            <motion.li key={ph.n} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-4"
              initial={reduce ? false : { opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: k * 0.08, ease: [0.16, 1, 0.3, 1] }}>
              <span className={`num relative z-10 grid size-8 place-items-center rounded-full border-2 text-[13px] font-semibold ${now_ ? "border-accent bg-accent text-accent-ink" : past ? "border-accent bg-surface text-accent" : "border-line-strong bg-surface text-muted"}`}>{ph.n}</span>
              <div className={`rounded-[14px] border p-4 ${now_ ? "border-accent/50 bg-accent-soft" : "border-line"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[16px] font-semibold">{ph.name}{now_ && <span className="pill lv-CF ml-2 align-middle">You are here</span>}</h3>
                  <span className="text-[13px] text-muted">{ph.when}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Bar value={dn} max={tot} className="flex-1" />
                  <span className="num text-[12px] text-muted">{dn}/{tot}</span>
                </div>
                <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[14px] text-muted marker:text-accent">
                  {ph.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </Card>
  );
}
