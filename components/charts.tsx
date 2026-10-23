"use client";
// Charts. Colors come only from CSS tokens so every palette and mode works.
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { addDays, parse, ymd } from "@/lib/logic";

const tipBox = "rounded-[10px] border border-line bg-surface px-3 py-2 text-[12px] shadow-card";

function Tip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className={tipBox}>
      {label != null && <div className="mb-1 font-medium">{label}</div>}
      {payload.filter((p) => p.value != null).map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
          {p.name}: <span className="num font-semibold text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- this week ---------- */
export function WeekBars({ data }: { data: { day: string; solved: number; today: boolean }[] }) {
  return (
    <div className="h-40" role="img" aria-label={"Solved per day this week: " + data.map((d) => `${d.day} ${d.solved}`).join(", ")}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<Tip />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="solved" name="Solved" radius={[6, 6, 2, 2]} animationDuration={700} animationEasing="ease-out">
            {data.map((d) => <Cell key={d.day} fill={d.today ? "var(--accent)" : "var(--heat-2)"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- activity heatmap (last 26 weeks) ---------- */
export function Heatmap({ days, now }: { days: Map<string, number>; now: Date }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<{ key: string; n: number } | null>(null);
  const weeks = useMemo(() => {
    const end = addDays(now, 6 - ((now.getDay() + 6) % 7)); // Sunday of this week
    const start = addDays(end, -26 * 7 + 1);
    const cols: { key: string; n: number; future: boolean }[][] = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const idx = Math.floor((d.getTime() - start.getTime()) / (7 * 864e5));
      (cols[idx] ||= []).push({ key: ymd(d), n: days.get(ymd(d)) || 0, future: d > now });
    }
    return cols;
  }, [days, now]);
  const lvl = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4);
  const active = [...days.values()].length;

  return (
    <div>
      <div className="overflow-x-auto pb-1" onMouseLeave={() => setHover(null)}>
        <div className="flex min-w-[300px] gap-[2px] sm:gap-[3px]" role="img" aria-label={`Activity over the last 26 weeks: ${active} active days.`}>
          {weeks.map((col, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-[2px] sm:gap-[3px]">
              {col.map((cell, r) => (
                <motion.div key={cell.key} onMouseEnter={() => setHover(cell)}
                  initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: cell.future ? 0.25 : 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: reduce ? 0 : c * 0.012 + r * 0.01 }}
                  className="aspect-square w-full max-w-[22px] rounded-[3px] ring-1 ring-inset ring-line/40" style={{ background: `var(--heat-${lvl(cell.n)})` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <span aria-live="polite" className="num">
          {hover ? `${parse(hover.key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${hover.n} solved` : "Hover a day to see its count"}
        </span>
        <span className="flex items-center gap-1" aria-hidden>Less {[0, 1, 2, 3, 4].map((l) => <i key={l} className="size-3 rounded-[3px]" style={{ background: `var(--heat-${l})` }} />)} More</span>
      </div>
    </div>
  );
}

/* ---------- pace: cumulative solved vs needed ---------- */
export function PaceChart({ rows }: { rows: { label: string; solved: number | null; target: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Cumulative problems solved compared with the pace needed to finish by placements">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="paceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={36} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<Tip />} cursor={{ stroke: "var(--line-strong)" }} />
          <Line dataKey="target" name="Needed" stroke="var(--muted)" strokeDasharray="5 5" dot={false} strokeWidth={1.5} animationDuration={900} />
          <Area dataKey="solved" name="Solved" stroke="var(--accent)" strokeWidth={2.5} fill="url(#paceFill)" dot={false} connectNulls={false} animationDuration={1100} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- donut with legend ---------- */
export function Donut({ data, center }: { data: { name: string; value: number; color: string }[]; center: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0);
  const shown = total ? data : [{ name: "None yet", value: 1, color: "var(--surface-2)" }];
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-40 shrink-0" role="img" aria-label={data.map((d) => `${d.name} ${d.value}`).join(", ")}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={data.filter((d) => d.value).length > 1 ? 2 : 0} stroke="none"
              cornerRadius={4} animationDuration={900} onMouseEnter={(_, i) => setHi(i)} onMouseLeave={() => setHi(null)}>
              {shown.map((d, i) => <Cell key={d.name} fill={d.color} opacity={hi == null || hi === i ? 1 : 0.35} style={{ transition: "opacity .2s" }} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="num text-[26px] font-semibold leading-none">{hi != null && total ? data[hi].value : total}</div>
            <div className="mt-1 text-[12px] text-muted">{hi != null && total ? data[hi].name : center}</div>
          </div>
        </div>
      </div>
      <ul className="flex min-w-[140px] flex-1 flex-col gap-2.5">
        {data.map((d, i) => (
          <li key={d.name} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} className="flex items-center gap-2.5 text-[14px]">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} aria-hidden />
            <span className="flex-1 text-muted">{d.name}</span>
            <span className="num font-semibold">{d.value}</span>
            <span className="num w-10 text-right text-[12px] text-muted">{total ? Math.round((100 * d.value) / total) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- topic coverage ---------- */
export function TopicBars({ rows }: { rows: { tag: string; total: number; done: number }[] }) {
  const reduce = useReducedMotion();
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
      {rows.map((r, i) => (
        <li key={r.tag} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[14px]">{r.tag}</span>
          <span className="num text-[12px] text-muted">{r.done}/{r.total}</span>
          <div className="relative col-span-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="absolute inset-y-0 left-0 origin-left rounded-full" style={{ width: `${(100 * r.total) / max}%`, background: "var(--heat-1)" }}
              initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }} />
            <motion.div className="absolute inset-y-0 left-0 origin-left rounded-full bg-accent" style={{ width: `${(100 * r.done) / max}%` }}
              initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 + i * 0.04, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
