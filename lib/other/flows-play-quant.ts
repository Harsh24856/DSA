// Interactive walk-throughs for the aptitude chapters (see flows-play.ts). Every number is computed from the learner's values.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { Bar, Flow, FlowTone, GridTable } from "./flows.ts";

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** "7/2" style fraction in lowest terms, or a whole number. */
const frac = (n: number, d: number) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
/** at most 2 decimals, Indian grouping (1,20,000) */
const n2 = (x: number) => (Math.round(x * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const inr = (x: number) => `₹${n2(x)}`;
const n4 = (x: number) => (Math.round(x * 1e4) / 1e4).toLocaleString("en-IN", { maximumFractionDigits: 4 });
const signed = (x: number) => (x < 0 ? `−${n2(-x)}` : `+${n2(x)}`);
const sup = (k: number) => String(k).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]);
const fact = (k: number): number => (k < 2 ? 1 : k * fact(k - 1));

/** A and B working together: the LCM of their days is the whole job in units, so every number stays whole. */
function workTogether(v: Record<string, number>): Flow {
  const a = v.a, b = v.b;
  if (a === b) throw new PlayError("Pick two different numbers of days, so the two rates differ.");
  const L = (a * b) / gcd(a, b), ra = L / a, rb = L / b, together = frac(L, ra + rb);
  const day = (k: number) => Math.min(L, k * (ra + rb));
  const days = Math.ceil(L / (ra + rb));
  return { kind: "bars", title: `A alone: ${a} days, B alone: ${b} days`, max: L, format: (x) => `${Math.round(x * 100) / 100}`, steps: [
    { note: `Call the whole job ${L} units: the LCM of ${a} and ${b}, so both daily rates are whole numbers.`, bars: [{ label: "A in a day", value: 0 }, { label: "B in a day", value: 0 }, { label: "done so far", value: 0 }] },
    { note: `A does ${L} / ${a} = ${ra} units a day.`, tone: "hot", bars: [{ label: "A in a day", value: ra, tone: "hot" }, { label: "B in a day", value: 0 }, { label: "done so far", value: 0 }] },
    { note: `B does ${L} / ${b} = ${rb} units a day.`, tone: "hot", bars: [{ label: "A in a day", value: ra }, { label: "B in a day", value: rb, tone: "hot" }, { label: "done so far", value: 0 }] },
    { note: `Together they do ${ra} + ${rb} = ${ra + rb} units a day.`, bars: [{ label: "A in a day", value: ra }, { label: "B in a day", value: rb }, { label: "done so far", value: day(1) }] },
    ...(days > 2 ? [{ note: `After 2 days: ${day(2)} of ${L} units.`, bars: [{ label: "A in a day", value: ra }, { label: "B in a day", value: rb }, { label: "done so far", value: day(2) }] }] : []),
    { note: `Days together = ${L} / ${ra + rb} = ${together}. Faster than either alone, as it must be.`, tone: "ok" as const, bars: [{ label: "A in a day", value: ra }, { label: "B in a day", value: rb }, { label: "done so far", value: L, tone: "ok" as const }] },
  ] };
}

/** HCF and LCM from a table of prime powers: lowest power of each prime for the HCF, highest for the LCM. */
function hcfLcm(v: Record<string, number>): Flow {
  const { a, b } = v;
  if (a === b) throw new PlayError("Pick two different numbers; the HCF and LCM of a number with itself is just the number.");
  const powers = (n: number) => { const m = new Map<number, number>(); for (let p = 2; n > 1; p++) while (n % p === 0) { m.set(p, (m.get(p) ?? 0) + 1); n /= p; } return m; };
  const fa = powers(a), fb = powers(b), primes = [...new Set([...fa.keys(), ...fb.keys()])].sort((x, y) => x - y);
  const ea = primes.map((p) => fa.get(p) ?? 0), eb = primes.map((p) => fb.get(p) ?? 0);
  const lo = primes.map((_, i) => Math.min(ea[i], eb[i])), hi = primes.map((_, i) => Math.max(ea[i], eb[i]));
  const value = (e: number[]) => primes.reduce((s, p, i) => s * p ** e[i], 1);
  const spell = (e: number[]) => primes.map((p, i) => (e[i] ? (e[i] > 1 ? `${p}${sup(e[i])}` : `${p}`) : "")).filter(Boolean).join(" × ") || "1";
  const cells = (e: number[]) => primes.map((p, i) => `${p}${sup(e[i])}`), blank = primes.map(() => "");
  const h = value(lo), l = value(hi);
  const table = (rows: string[][], tones?: Record<string, FlowTone>): GridTable => ({ label: "powers of each prime", head: primes.map(String), rowHead: [String(a), String(b), "HCF", "LCM"], rows, tones });
  return { kind: "grid", title: `HCF and LCM of ${a} and ${b}`, steps: [
    { note: `Factorise ${a} into primes: ${a} = ${spell(ea)}. A prime it lacks gets power 0.`, tables: [table([cells(ea), blank, blank, blank], { "0": "hot" })] },
    { note: `Factorise ${b} the same way: ${b} = ${spell(eb)}.`, tables: [table([cells(ea), cells(eb), blank, blank], { "1": "hot" })] },
    { note: h === 1 ? `For the HCF take each prime at its lowest power. No prime is in both, so the HCF is 1.` : `For the HCF take each prime at its lowest power: ${spell(lo)} = ${h}.`, tone: "hot", tables: [table([cells(ea), cells(eb), cells(lo), blank], { "2": "hot" })] },
    { note: `For the LCM take each prime at its highest power: ${spell(hi)} = ${l}.`, tone: "hot", tables: [table([cells(ea), cells(eb), cells(lo), cells(hi)], { "2": "ok", "3": "hot" })] },
    { note: `HCF is ${h} and LCM is ${l}. Check: ${h} × ${l} = ${h * l}, which is ${a} × ${b}.`, tone: "ok", tables: [table([cells(ea), cells(eb), cells(lo), cells(hi)], { "2": "ok", "3": "ok" })] },
  ] };
}

/** Mark up on the cost price, then a discount on the marked price; profit is always measured on the cost. */
function markupDiscount(v: Record<string, number>): Flow {
  const { cp, m, d } = v;
  const mp = (cp * (100 + m)) / 100, sp = (mp * (100 - d)) / 100;
  if (!Number.isInteger(sp)) throw new PlayError("The selling price comes out in paise. Move the cost or the discount by a step.");
  const gain = sp - cp, pct = (gain / cp) * 100, label = gain < 0 ? "loss" : "profit";
  const bars = (c: number, mk: number, s: number, g: number, tone?: Record<number, FlowTone>): Bar[] =>
    [["cost", c], ["marked", mk], ["selling", s], [label, g]].map(([lb, val], i) => ({ label: lb as string, value: val as number, tone: tone?.[i] }));
  return { kind: "bars", title: `Cost ${inr(cp)}, marked up ${m}%, then ${d}% off`, max: Math.max(mp, cp), format: (x) => inr(Math.round(x)), steps: [
    { note: `The shop buys the item for ${inr(cp)}. Every profit or loss percent is measured on this cost price.`, bars: bars(cp, 0, 0, 0, { 0: "hot" }) },
    { note: `It marks the price up ${m}%: ${inr(cp)} × ${100 + m}/100 = ${inr(mp)}.`, tone: "hot", bars: bars(cp, mp, 0, 0, { 1: "hot" }) },
    { note: `The ${d}% discount is on the marked price, not the cost: ${inr(mp)} × ${100 - d}/100 = ${inr(sp)}.`, tone: "warn", bars: bars(cp, mp, sp, 0, { 2: "warn" }) },
    { note: gain === 0 ? `Selling price equals cost, so there is no profit and no loss.` : `${label === "loss" ? "Loss" : "Profit"} = ${inr(sp)} − ${inr(cp)} = ${inr(Math.abs(gain))}.`, tone: gain < 0 ? "bad" : undefined, bars: bars(cp, mp, sp, Math.abs(gain), { 3: gain < 0 ? "bad" : "hot" }) },
    { note: `${label === "loss" ? "Loss" : "Profit"} percent = ${n2(Math.abs(gain))} / ${n2(cp)} × 100 = ${n2(Math.abs(pct))}%. The shortcut ${m} − ${d} − ${m} × ${d}/100 gives ${signed(m - d - (m * d) / 100)}% too.`, tone: "ok", bars: bars(cp, mp, sp, Math.abs(gain), { 3: gain < 0 ? "bad" : "ok" }) },
  ] };
}

/** Simple interest: the same interest on the original principal every year. */
function simpleInterest(v: Record<string, number>): Flow {
  const { p, r, t } = v, yearly = (p * r) / 100, si = yearly * t, years = Array.from({ length: t }, (_, i) => i + 1);
  const bars = (shown: number, tone?: FlowTone): Bar[] => [{ label: "principal", value: p }, ...years.map((y) => ({ label: `year ${y}`, value: y <= shown ? p + y * yearly : 0, tone: y === shown ? tone : undefined }))];
  return { kind: "bars", title: `${inr(p)} at ${r}% simple interest for ${t} years`, max: p + si, format: (x) => inr(Math.round(x)), steps: [
    { note: `Start with the principal, ${inr(p)}. Simple interest is always worked out on this amount.`, bars: bars(0) },
    ...years.map((y) => ({ note: y === 1 ? `Year 1 adds ${r}% of ${inr(p)} = ${inr(yearly)}, so the amount is ${inr(p + yearly)}.` : `Year ${y} adds the same ${inr(yearly)} again, since the interest never earns interest. Amount: ${inr(p + y * yearly)}.`, tone: "hot" as const, bars: bars(y, "hot") })),
    { note: `SI = P × R × T / 100 = ${n2(p)} × ${r} × ${t} / 100 = ${inr(si)}, so the amount is ${inr(p + si)}.`, tone: "ok" as const, bars: bars(t, "ok") },
  ] };
}

/** Compound against simple interest year by year: CI earns interest on last year's interest. */
function compoundInterest(v: Record<string, number>): Flow {
  const { p, r, n } = v;
  const ci = (k: number) => (p * (100 + r) ** k) / 100 ** k;
  for (let k = 1; k <= n; k++) if (!Number.isInteger(ci(k))) throw new PlayError("The amount comes out in paise. Try a rate of 10% or 20%, or a principal that is a multiple of 8,000.");
  const si = (k: number) => p + (k * p * r) / 100;
  const bars = (k: number, tone?: FlowTone): Bar[] => [{ label: "with SI", value: si(k) }, { label: "with CI", value: ci(k), tone }, { label: "CI − SI", value: ci(k) - si(k), tone }];
  const diff = ci(n) - si(n), q = r / 100;
  const check = n === 2 ? `P(R/100)² = ${n2(p)} × ${q}² = ${inr(p * q * q)}` : `P(R/100)²(3 + R/100) = ${n2(p)} × ${q}² × ${3 + q} = ${inr(p * q * q * (3 + q))}`;
  return { kind: "bars", title: `${inr(p)} at ${r}% a year for ${n} years`, max: ci(n), format: (x) => inr(Math.round(x)), steps: [
    { note: `Both start at ${inr(p)}. Simple interest adds ${r}% of ${inr(p)} = ${inr((p * r) / 100)} every year.`, bars: bars(0) },
    ...Array.from({ length: n }, (_, i) => i + 1).map((k) => ({ note: k === 1 ? `Year 1: both earn ${inr((p * r) / 100)}. With one year there is no interest on interest yet.` : `Year ${k}: CI earns ${r}% of ${inr(ci(k - 1))} = ${inr(ci(k) - ci(k - 1))}, while SI earns ${inr((p * r) / 100)} again. The gap is ${inr(ci(k) - si(k))}.`, tone: "hot" as const, bars: bars(k, "hot") })),
    { note: `After ${n} years CI gives ${inr(ci(n))} and SI gives ${inr(si(n))}, so CI is ahead by ${inr(diff)}. Shortcut: ${check}.`, tone: "ok" as const, bars: bars(n, "ok") },
  ] };
}

/** Partnership: profit is shared in the ratio of capital × months. */
function partnership(v: Record<string, number>): Flow {
  const { a, b, k } = v, profit = 54000, ma = 12, mb = 12 - k, xa = a * ma, xb = b * mb, g = gcd(xa, xb), pa = xa / g, pb = xb / g;
  const raw = (profit * pa) / (pa + pb), exact = Number.isInteger(raw), sa = Math.round(raw * 100) / 100, sb = profit - sa;
  const table = (cols: number, tones?: Record<string, FlowTone>): GridTable => {
    const row = (cap: number, mo: number, x: number, part: number, share: number) => [n2(cap), mo, n2(x), part, n2(share)].map((c, i) => (i < cols ? c : ""));
    return { head: ["capital ₹", "months", "product", "parts", "share ₹"], rowHead: ["A", "B"], rows: [row(a, ma, xa, pa, sa), row(b, mb, xb, pb, sb)], tones };
  };
  return { kind: "grid", title: `A puts in ${inr(a)}, B puts in ${inr(b)}${k ? ` after ${k} ${k === 1 ? "month" : "months"}` : ""}`, steps: [
    { note: k === 0 ? `A invests ${inr(a)} and B invests ${inr(b)}, both for all 12 months.` : `A invests ${inr(a)} for all 12 months. B joins after ${k} ${k === 1 ? "month" : "months"}, so B's money works for ${mb} ${mb === 1 ? "month" : "months"}.`, tables: [table(2, { ":1": "hot" })] },
    { note: `Profit is shared by capital × months: A has ${n2(a)} × 12 = ${n2(xa)} and B has ${n2(b)} × ${mb} = ${n2(xb)}.`, tone: "hot", tables: [table(3, { ":2": "hot" })] },
    { note: `Divide both by ${n2(g)}: the profit ratio A : B is ${pa} : ${pb}, so the profit splits into ${pa + pb} parts.`, tone: "hot", tables: [table(4, { ":3": "hot" })] },
    { note: `The year's profit is ${inr(profit)}. A gets ${pa}/${pa + pb} of it${exact ? "" : ", to the nearest paisa"}: ${inr(sa)}.`, tables: [table(5, { "0:4": "hot" })] },
    { note: `B gets the other ${pb}/${pa + pb}: ${inr(sb)}. Check: ${inr(sa)} + ${inr(sb)} = ${inr(profit)}.`, tone: "ok", tables: [table(5, { ":4": "ok" })] },
  ] };
}

/** Ages: write both ages from today's ratio as ax and bx, shift both by n years, solve for x. */
function ages(v: Record<string, number>): Flow {
  const { f, s, n } = v;
  if (f - s < 15) throw new PlayError("Make the parent at least 15 years older than the child.");
  const g0 = gcd(f, s), a = f / g0, b = s / g0, g1 = gcd(f + n, s + n), c = (f + n) / g1, d = (s + n) / g1;
  const tx = (k: number) => (k === 1 ? "x" : `${k}x`), times = (k: number, e: string) => (k === 1 ? e : `${k}(${e})`);
  const lhs = d * a - c * b, rhs = c * n - d * n, x = rhs / lhs;
  const table = (now: string[], later: string[], tones?: Record<string, FlowTone>): GridTable => ({ head: ["now", `in ${n} years`], rowHead: ["parent", "child", "gap"], rows: now.map((v0, i) => [v0, later[i]]), tones });
  const nowX = [tx(a), tx(b), tx(a - b)], laterX = [`${tx(a)} + ${n}`, `${tx(b)} + ${n}`, tx(a - b)], none = ["", "", ""];
  return { kind: "grid", title: `Ratio ${a} : ${b} now, ${c} : ${d} in ${n} years`, steps: [
    { note: `The ages are in the ratio ${a} : ${b} now, so write them as ${tx(a)} and ${tx(b)}. The gap is ${tx(a - b)}.`, tables: [table(nowX, none, { ":0": "hot" })] },
    { note: `In ${n} years both are ${n} years older: ${tx(a)} + ${n} and ${tx(b)} + ${n}. The gap stays ${tx(a - b)}.`, tables: [table(nowX, laterX, { ":1": "hot" })] },
    { note: `Then the ratio is ${c} : ${d}, so ${times(d, `${tx(a)} + ${n}`)} = ${times(c, `${tx(b)} + ${n}`)}.`, tone: "hot", tables: [table(nowX, laterX, { "0:1": "hot", "1:1": "hot" })] },
    { note: `Expand: ${tx(d * a)} + ${d * n} = ${tx(c * b)} + ${c * n}, so ${lhs === 1 ? `x = ${x}` : `${tx(lhs)} = ${rhs} and x = ${x}`}.`, tone: "hot", tables: [table(nowX, laterX, { "0:1": "hot", "1:1": "hot" })] },
    { note: `Parent ${f}, child ${s}. Check: in ${n} years ${f + n} : ${s + n} = ${c} : ${d}, and the gap is ${f - s} both times.`, tone: "ok", tables: [table([f, s, f - s].map(String), [f + n, s + n, f - s].map(String), { "2": "ok" })] },
  ] };
}

/** Two trains crossing: the distance is both lengths, the speed is the relative speed. */
function trains(v: Record<string, number>): Flow {
  const { l1, v1, v2 } = v, l2 = 100, m1 = (v1 * 5) / 18, m2 = (v2 * 5) / 18, dist = l1 + l2, close = m1 + m2, gain = Math.abs(m1 - m2);
  const fast = m1 >= m2 ? 0 : 1;
  return { kind: "lanes", title: `Train A: ${l1} m at ${v1} km/h, train B: ${l2} m at ${v2} km/h`, lanes: ["train A", "train B"], steps: [
    { from: 0, to: 0, label: `${l1} m at ${v1} km/h`, note: `Train A is ${l1} m long at ${v1} km/h. Times 5/18 turns that into ${n2(m1)} m/s.` },
    { from: 1, to: 1, label: `${l2} m at ${v2} km/h`, note: `Train B is ${l2} m long at ${v2} km/h, which is ${n2(m2)} m/s.` },
    { from: 0, to: 1, label: `closing at ${n2(close)} m/s`, tone: "hot", note: `Heading towards each other, the gap closes at ${n2(m1)} + ${n2(m2)} = ${n2(close)} m/s: add the speeds.` },
    { from: 1, to: 0, label: `cover ${dist} m`, note: `From the fronts meeting to the tails parting, they cover both lengths: ${l1} + ${l2} = ${dist} m.` },
    { from: 0, to: 1, label: `cross in ${n2(dist / close)} s`, tone: "ok", note: `Time to cross = ${dist} / ${n2(close)} = ${n2(dist / close)} seconds.` },
    ...(gain === 0
      ? [{ from: 0, to: 0, label: "same way: never passes", tone: "warn" as const, note: "Going the same way at the same speed, the gap never closes, so neither train passes the other." }]
      : [
        { from: fast, to: 1 - fast, label: `same way: ${n2(gain)} m/s`, tone: "warn" as const, note: `Going the same way, subtract the speeds: the faster train gains only ${n2(Math.max(m1, m2))} − ${n2(Math.min(m1, m2))} = ${n2(gain)} m/s.` },
        { from: fast, to: 1 - fast, label: `overtake in ${n2(dist / gain)} s`, tone: "ok" as const, note: `Overtaking covers the same ${dist} m, so it takes ${dist} / ${n2(gain)} = ${n2(dist / gain)} seconds.` },
      ]),
  ] };
}

/** Boats and streams: downstream b + s, upstream b − s, then distance / speed each way. */
function boats(v: Record<string, number>): Flow {
  const { b, s, d } = v;
  if (s >= b) throw new PlayError("The boat could never go upstream. Make the boat faster than the stream.");
  const D = b + s, U = b - s, td = d / D, tu = d / U;
  return { kind: "lanes", title: `Boat ${b} km/h, stream ${s} km/h, ${d} km each way`, lanes: ["upstream town", "downstream town"], steps: [
    { from: 0, to: 0, label: `boat: ${b} km/h`, note: `In still water the boat goes ${b} km/h. That is its own speed, b.` },
    { from: 0, to: 0, label: `stream: ${s} km/h`, note: `The river flows at ${s} km/h towards the downstream town. A floating log would move at this speed.` },
    { from: 0, to: 1, label: `down: ${b} + ${s} = ${D} km/h`, tone: "hot", note: `Going downstream the stream helps: ${b} + ${s} = ${D} km/h.` },
    { from: 1, to: 1, label: `${d} km in ${n2(td)} h`, note: `Time downstream = ${d} / ${D} = ${n2(td)} hours.` },
    { from: 1, to: 0, label: `up: ${b} − ${s} = ${U} km/h`, tone: "warn", note: `Coming back upstream the stream holds it back: ${b} − ${s} = ${U} km/h.` },
    { from: 0, to: 0, label: `${d} km in ${n2(tu)} h`, note: `Time upstream = ${d} / ${U} = ${n2(tu)} hours, longer than going down.` },
    { from: 0, to: 0, label: `round trip ${n2(td + tu)} h`, tone: "ok", note: `The round trip takes ${n2(td)} + ${n2(tu)} = ${n2(td + tu)} hours. Check: (${D} + ${U}) / 2 = ${b} is the boat, and (${D} − ${U}) / 2 = ${s} is the stream.` },
  ] };
}

/** A rectangle whose every side changes by p%: lengths and perimeter scale by (1 + p/100), the area by its square. */
function rectangle(v: Record<string, number>): Flow {
  const { l, b, p } = v;
  if (p === 0) throw new PlayError("Move the change off 0% so the sides actually change.");
  const k = (100 + p) / 100, l2 = l * k, b2 = b * k, per = 2 * (l + b), area = l * b, areaPct = 2 * p + (p * p) / 100;
  const before = [l, b, per, area].map(n2), after = [l2, b2, 2 * (l2 + b2), l2 * b2].map(n4), change = [p, p, p, areaPct].map((x) => `${signed(x)}%`);
  /** the first `shown` rows get their after and change columns */
  const table = (shown: number, tones?: Record<string, FlowTone>): GridTable => ({ head: ["before", "after", "change"], rowHead: ["length", "breadth", "perimeter", "area"],
    rows: before.map((x, i) => (i < shown ? [x, after[i], change[i]] : [x, "", ""])), tones });
  const up = p > 0 ? "up" : "down", pp = p < 0 ? `(−${-p})` : `${p}`;
  return { kind: "grid", title: `A ${l} m by ${b} m rectangle, every side ${up} ${Math.abs(p)}%`, steps: [
    { note: `Perimeter = 2(${l} + ${b}) = ${per} m and area = ${l} × ${b} = ${area} m².`, tables: [table(0, { ":0": "hot" })] },
    { note: `Every side goes ${up} ${Math.abs(p)}%, so each is multiplied by ${n2(k)}: ${n2(l2)} m and ${n2(b2)} m.`, tone: "hot", tables: [table(2, { "0:1": "hot", "1:1": "hot" })] },
    { note: `The perimeter is a length too, so it also changes by ${signed(p)}%: 2(${n2(l2)} + ${n2(b2)}) = ${after[2]} m.`, tables: [table(3, { "2": "hot" })] },
    { note: `Area multiplies two lengths, so it is multiplied by ${n2(k)} × ${n2(k)} = ${n4(k * k)}: ${n2(l2)} × ${n2(b2)} = ${after[3]} m².`, tone: "hot", tables: [table(4, { "3": "hot" })] },
    { note: `Area change = 2 × ${pp} + ${pp} × ${pp} / 100 = ${signed(areaPct)}%, whatever the starting sides were.`, tone: "ok", tables: [table(4, { "3:2": "ok", "2:2": "ok" })] },
  ] };
}

/** A triangle from two angles: the third from the 180° sum, outside angles, and what the largest angle says. */
function triangle(v: Record<string, number>): Flow {
  const { A, B } = v, C = 180 - A - B;
  if (C <= 0) throw new PlayError("Angles A and B must add up to less than 180°. Make one of them smaller.");
  const ang = [A, B, C], out = ang.map((x) => 180 - x), deg = (x: number) => `${x}°`, names = ["A", "B", "C"];
  const big = Math.max(...ang), at = names.filter((_, i) => ang[i] === big);
  const kind = big === 90 ? "right" : big > 90 ? "obtuse" : "acute";
  const equal = new Set(ang).size === 2 ? " Two angles are equal, so the sides opposite them are equal: it is isosceles." : "";
  const table = (inside: string[], outside: string[], tones?: Record<string, FlowTone>): GridTable => ({ head: names, rowHead: ["inside", "outside"], rows: [inside, outside], tones });
  const ins = ang.map(deg), outs = out.map(deg), none = ["", "", ""];
  const last = kind === "right"
    ? `${at[0]} = 90°, so it is a right triangle. The side opposite ${at[0]} is the hypotenuse, and Pythagoras holds: the squares of the other two sides add to its square.`
    : at.length === 3 ? "All three angles are 60°, so the triangle is acute and equilateral: all three sides are equal."
    : `The largest angle${at.length > 1 ? "s are" : " is"} ${at.join(" and ")} = ${big}°, ${kind === "obtuse" ? "over" : "under"} 90°, so the triangle is ${kind}. The longest side is opposite ${at.length > 1 ? "those angles" : at[0]}.`;
  return { kind: "grid", title: `A triangle with A = ${A}° and B = ${B}°`, steps: [
    { note: `Two angles are given: A = ${A}° and B = ${B}°. The third, C, is unknown.`, tables: [table([deg(A), deg(B), "?"], none)] },
    { note: `The angles of a triangle add to 180°, so C = 180 − ${A} − ${B} = ${C}°.`, tone: "hot", tables: [table(ins, none, { "0:2": "hot" })] },
    { note: `The outside angle at A is 180 − ${A} = ${out[0]}°, the same as the two far angles B + C = ${B} + ${C}.`, tone: "hot", tables: [table(ins, [outs[0], "", ""], { "1:0": "hot", "0:1": "hot", "0:2": "hot" })] },
    { note: `Likewise the outside angles at B and C are ${out[1]}° and ${out[2]}°. All three outside angles add to 360°.`, tables: [table(ins, outs, { "1": "hot" })] },
    { note: last + equal, tone: "ok", tables: [table(ins, outs, Object.fromEntries(at.map((n) => [`0:${names.indexOf(n)}`, "ok" as const])))] },
  ] };
}

/** Arrangements of a word with repeated letters: n! over the factorial of each repeat count. */
function arrangements(v: Record<string, number>): Flow {
  const counts = [["A", v.a], ["B", v.b], ["C", v.c]].filter(([, c]) => (c as number) > 0) as [string, number][];
  const n = counts.reduce((s, [, c]) => s + c, 0), total = fact(n);
  const word = counts.flatMap(([ch, c]) => Array.from({ length: c }, (_, i) => ({ ch, i: i + 1, c })));
  const subs = "₀₁₂₃₄₅₆₇₈₉", rep1 = counts.find(([, c]) => c > 1)?.[0];
  const letters = (plainUpTo: number) => [word.map((w) => (counts.findIndex(([ch]) => ch === w.ch) < plainUpTo || w.c === 1 ? w.ch : `${w.ch}${subs[w.i]}`))];
  const cols = (ch: string) => Object.fromEntries(word.map((w, i) => [w.ch === ch ? `:${i}` : "", "hot" as const]).filter(([k]) => k));
  const head = ["all", ...counts.map(([ch]) => `${ch}'s`), "ways"];
  let left = total;
  const after: number[] = counts.map(([, c]) => (left /= fact(c)));
  const calc = (first: string, done: number, tones?: Record<string, FlowTone>): GridTable => ({ head, rows: [[first, ...counts.map(([, c], i) => (i < done ? `÷ ${c}!` : "")), done === counts.length ? String(left) : ""]], tones });
  const spell = counts.map(([ch, c]) => `${c} ${ch}${c > 1 ? "'s" : ""}`).join(", ");
  return { kind: "grid", title: `Arranging ${word.map((w) => w.ch).join("")}`, steps: [
    { note: `The word ${word.map((w) => w.ch).join("")} has ${n} letters: ${spell}.`, tables: [{ label: "letters", rows: letters(counts.length) }, calc(`${n}!`, 0)] },
    { note: `Pretend every letter is different${rep1 ? `, with tags like ${rep1}₁ and ${rep1}₂` : ", as they already are here"}. Then there are ${n}! = ${total} orders.`, tone: "hot", tables: [{ label: "letters", rows: letters(0) }, calc(String(total), 0)] },
    ...counts.map(([ch, c], i) => ({
      note: c === 1 ? `There is only one ${ch}, so it causes no repeats: divide by 1! = 1.` : `Swapping the ${c} ${ch}'s among themselves gives the same word, ${c}! = ${fact(c)} ways, so divide: ${i === 0 ? total : after[i - 1]} / ${fact(c)} = ${after[i]}.`,
      tone: c > 1 ? ("hot" as const) : undefined,
      tables: [{ label: "letters", rows: letters(i + 1), tones: cols(ch) }, calc(String(total), i + 1)],
    })),
    { note: `Arrangements = ${n}! / (${counts.map(([, c]) => `${c}!`).join(" × ")}) = ${total} / ${counts.reduce((s, [, c]) => s * fact(c), 1)} = ${left}.`, tone: "ok" as const, tables: [{ label: "letters", rows: letters(counts.length) }, calc(String(total), counts.length, { [`0:${counts.length + 1}`]: "ok" })] },
  ] };
}

/** Two dice: the 6 × 6 grid of sums, the cells that hit the target, favourable over 36. */
function dice(v: Record<string, number>): Flow {
  const { s } = v, faces = [1, 2, 3, 4, 5, 6];
  const hits = faces.flatMap((r) => faces.filter((c) => r + c === s).map((c) => [r, c]));
  const k = hits.length, tones = (t: FlowTone) => Object.fromEntries(hits.map(([r, c]) => [`${r - 1}:${c - 1}`, t]));
  const table = (tn?: Record<string, FlowTone>): GridTable => ({ label: "first die down, second across", head: faces.map(String), rowHead: faces.map(String), rows: faces.map((r) => faces.map((c) => r + c)), tones: tn });
  return { kind: "grid", title: `Two dice: chance of a sum of ${s}`, steps: [
    { note: "Two dice give 6 × 6 = 36 equally likely outcomes. Each cell shows the sum of one outcome.", tables: [table()] },
    { note: `Mark every cell where the sum is ${s}. They lie on one diagonal, and the diagonal through 7 is the longest.`, tone: "hot", tables: [table(tones("hot"))] },
    { note: `Count them: ${hits.map(([r, c]) => `(${r}, ${c})`).join(", ")}. That is ${k} ${k === 1 ? "way" : "ways"}, and 6 − |${s} − 7| = ${6 - Math.abs(s - 7)} agrees.`, tone: "hot", tables: [table(tones("hot"))] },
    { note: `P(sum is ${s}) = favourable / total = ${k}/36${frac(k, 36) === `${k}/36` ? "" : ` = ${frac(k, 36)}`}.`, tone: "ok", tables: [table(tones("ok"))] },
    { note: `So P(sum is not ${s}) = 1 − ${frac(k, 36)} = ${frac(36 - k, 36)}: the other ${36 - k} cells.`, tables: [table(Object.fromEntries(faces.flatMap((r) => faces.filter((c) => r + c !== s).map((c) => [`${r - 1}:${c - 1}`, "warn" as const]))))] },
  ] };
}

export const PLAY: Record<string, PlayFlow> = {
  "play-work": { title: "A and B together", knobs: [
    { key: "a", label: "A alone takes", min: 2, max: 30, value: 12, unit: " days" },
    { key: "b", label: "B alone takes", min: 2, max: 30, value: 18, unit: " days" },
  ], make: workTogether },
  "play-numbers": { title: "HCF and LCM by prime factors", knobs: [
    { key: "a", label: "First number", min: 2, max: 200, value: 84 },
    { key: "b", label: "Second number", min: 2, max: 200, value: 120 },
  ], make: hcfLcm },
  "play-percent": { title: "Markup, then a discount", knobs: [
    { key: "cp", label: "Cost price", min: 100, max: 5000, step: 100, value: 800, unit: " rupees" },
    { key: "m", label: "Marked up by", min: 5, max: 100, step: 5, value: 40, unit: "%" },
    { key: "d", label: "Discount", min: 5, max: 60, step: 5, value: 25, unit: "%" },
  ], make: markupDiscount },
  "play-si": { title: "Simple interest year by year", knobs: [
    { key: "p", label: "Principal", min: 1000, max: 20000, step: 500, value: 5000, unit: " rupees" },
    { key: "r", label: "Rate", min: 1, max: 15, value: 8, unit: "% a year" },
    { key: "t", label: "Time", min: 2, max: 6, value: 4, unit: " years" },
  ], make: simpleInterest },
  "play-ci": { title: "Compound against simple interest", knobs: [
    { key: "p", label: "Principal", min: 1000, max: 20000, step: 1000, value: 10000, unit: " rupees" },
    { key: "r", label: "Rate", min: 5, max: 20, step: 5, value: 10, unit: "% a year" },
    { key: "n", label: "Time", min: 2, max: 3, value: 3, unit: " years" },
  ], make: compoundInterest },
  "play-ratio": { title: "Sharing a profit of ₹54,000", knobs: [
    { key: "a", label: "A invests", min: 10000, max: 100000, step: 5000, value: 40000, unit: " rupees" },
    { key: "b", label: "B invests", min: 10000, max: 100000, step: 5000, value: 75000, unit: " rupees" },
    { key: "k", label: "B joins after", min: 0, max: 11, value: 4, unit: " months" },
  ], make: partnership },
  "play-ages": { title: "Ages from two ratios", knobs: [
    { key: "f", label: "Parent's age now", min: 25, max: 80, value: 40, unit: " years" },
    { key: "s", label: "Child's age now", min: 1, max: 40, value: 10, unit: " years" },
    { key: "n", label: "Years later", min: 1, max: 20, value: 5, unit: " years" },
  ], make: ages },
  "play-speed": { title: "Two trains crossing", knobs: [
    { key: "l1", label: "Train A's length", min: 50, max: 400, step: 10, value: 150, unit: " m" },
    { key: "v1", label: "Train A's speed", min: 18, max: 144, step: 18, value: 54, unit: " km/h" },
    { key: "v2", label: "Train B's speed", min: 18, max: 144, step: 18, value: 36, unit: " km/h" },
  ], make: trains },
  "play-boats": { title: "Downstream and back", knobs: [
    { key: "b", label: "Boat in still water", min: 4, max: 30, value: 12, unit: " km/h" },
    { key: "s", label: "Stream", min: 1, max: 10, value: 3, unit: " km/h" },
    { key: "d", label: "Distance each way", min: 6, max: 96, step: 6, value: 36, unit: " km" },
  ], make: boats },
  "play-area": { title: "A rectangle that grows or shrinks", knobs: [
    { key: "l", label: "Length", min: 2, max: 50, value: 20, unit: " m" },
    { key: "b", label: "Breadth", min: 2, max: 50, value: 15, unit: " m" },
    { key: "p", label: "Every side changes by", min: -50, max: 100, step: 5, value: 10, unit: "%" },
  ], make: rectangle },
  "play-geometry": { title: "The angles of a triangle", knobs: [
    { key: "A", label: "Angle A", min: 10, max: 150, step: 5, value: 50, unit: "°" },
    { key: "B", label: "Angle B", min: 10, max: 150, step: 5, value: 60, unit: "°" },
  ], make: triangle },
  "play-counting": { title: "Arranging letters with repeats", knobs: [
    { key: "a", label: "Number of A's", min: 1, max: 3, value: 3 },
    { key: "b", label: "Number of B's", min: 1, max: 3, value: 2 },
    { key: "c", label: "Number of C's", min: 0, max: 2, value: 1 },
  ], make: arrangements },
  "play-probability": { title: "Two dice and a target sum", knobs: [
    { key: "s", label: "Target sum", min: 2, max: 12, value: 7 },
  ], make: dice },
};
