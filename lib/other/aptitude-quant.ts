// Aptitude chapters (see aptitude.ts for the order they appear in). Every number in a question or answer is computed in code,
// and each worked method is checked against the answer at import time, so a wrong answer throws instead of shipping.
import type { Card, Chapter } from "./types";

// ---- helpers (also used by the quantitative chapters in aptitude.ts and by oa/aptitude-quant.ts) ----
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
export const fact = (k: number): number => (k < 2 ? 1 : k * fact(k - 1));
export const nPr = (a: number, r: number) => fact(a) / fact(a - r);
export const nCr = (a: number, r: number) => Math.round(nPr(a, r) / fact(r));
/** a number as printed: at most 2 decimals, Indian grouping (1,00,000) */
export const num = (x: number) => (Math.round(x * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const rs = (x: number) => `₹${num(x)}`;
export const r2 = (x: number) => Math.round(x * 100) / 100;
/** a reduced fraction a/b ("3" when it is whole) */
export const frac = (a: number, b: number) => { const g = gcd(a, b); return b / g === 1 ? `${a / g}` : `${a / g}/${b / g}`; };
/** a ratio a : b in lowest terms */
export const ratio = (a: number, b: number) => { const g = gcd(a, b); return `${a / g} : ${b / g}`; };
/** a multiplier or small decimal printed exactly (1.331, 1.1025) */
export const dec = (x: number) => String(Math.round(x * 1e6) / 1e6);
export const sup = (k: number) => String(k).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]);
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
export function must(ok: boolean, what: string): asserts ok { if (!ok) throw new Error(`aptitude: ${what}`); }
/** the only whole number in [lo, hi] that passes `ok`; throws unless exactly one does */
export function only(lo: number, hi: number, ok: (x: number) => boolean, what: string) {
  const hits: number[] = [];
  for (let x = lo; x <= hi; x++) if (ok(x)) hits.push(x);
  must(hits.length === 1, `${what}: expected one answer, found ${hits.join(", ") || "none"}`);
  return hits[0];
}
/** a question card: the answer is a list of steps, the last one ending with the answer in bold */
export const card = (id: string, q: string, steps: string[], trap?: string, extra?: Partial<Card>): Card =>
  ({ id, q, a: steps.map((s) => `- ${s}`).join("\n"), ...(trap ? { trap } : {}), ...extra });
const PI = 22 / 7;

// ---------------------------------------------------------------- simple interest
function simpleInterest(): Chapter {
  const si = (p: number, r: number, t: number) => (p * r * t) / 100;
  const D = { p: 5000, r: 8 }, yearly = si(D.p, D.r, 1);
  const B = { p: 7500, r: 9, t: 4 };
  const M = { p: 12000, r: 7.5, m: 8 }, mSi = si(M.p, M.r, M.m / 12);
  const F = { i: 1890, r: 6, t: 3.5 }, fP = (100 * F.i) / (F.r * F.t);
  must(near(si(fP, F.r, F.t), F.i), "si find-p");
  const R = { p: 6400, a: 8000, t: 5 }, rR = (100 * (R.a - R.p)) / (R.p * R.t);
  const T = { p: 4500, i: 1215, r: 6 }, tT = (100 * T.i) / (T.p * T.r);
  must(near(si(T.p, T.r, tT), T.i), "si find-t");
  const dbl = 8, dblR = 100 / dbl;
  const two = { p: 8000, r: 6, t1: 3, t2: 5 }, a1 = two.p + si(two.p, two.r, two.t1), a2 = two.p + si(two.p, two.r, two.t2);
  const perYear = (a2 - a1) / (two.t2 - two.t1), backP = a1 - two.t1 * perYear, backR = (100 * perYear) / backP;
  must(near(backP, two.p) && near(backR, two.r), "si two-amounts");
  const nt = { years: 6, times: 4 }, ntT = nt.years * (nt.times - 1);
  must(near(si(100, 100 / nt.years, ntT), 100 * (nt.times - 1)), "si n-times");
  const rise = { from: 7, to: 9, t: 4, more: 480 }, riseP = (100 * rise.more) / ((rise.to - rise.from) * rise.t);
  must(near(si(riseP, rise.to, rise.t) - si(riseP, rise.from, rise.t), rise.more), "si rate-rise");
  const ch = { p: 20000, parts: [[6, 2], [8, 3], [10, 2]] as [number, number][] };
  const chRT = ch.parts.reduce((s, [r, t]) => s + r * t, 0), chSi = (ch.p * chRT) / 100;
  const sp = { total: 15000, lo: 8, hi: 12, i: 1560 }, spLo = (sp.total * sp.hi / 100 - sp.i) / ((sp.hi - sp.lo) / 100);
  must(near(si(spLo, sp.lo, 1) + si(sp.total - spLo, sp.hi, 1), sp.i), "si split-rates");
  const avgR = (100 * sp.i) / sp.total;
  const eq = { total: 12000, r1: 5, t1: 4, r2: 8, t2: 5 }, k1 = eq.r1 * eq.t1, k2 = eq.r2 * eq.t2;
  const eq1 = (eq.total * k2) / (k1 + k2), eq2 = eq.total - eq1;
  must(near(si(eq1, eq.r1, eq.t1), si(eq2, eq.r2, eq.t2)), "si equal-split");
  const rt = { a: 9, b: 16 }, rtR = Math.sqrt((100 * rt.a) / rt.b);
  must(near(si(rt.b, rtR, rtR), rt.a), "si r-equals-t");
  return {
    id: "si",
    play: "play-si",
    title: "Simple interest",
    summary: "Simple interest is always worked out on the original principal, so the same amount is added every year. Every question is one formula, SI = P × R × T / 100, solved for whichever of the four values is missing.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["SI = P × R × T / 100", "interest on P at R% a year for T years"],
      ["A = P + SI = P(1 + RT/100)", "amount at the end"],
      ["P = 100 × SI / (R × T)", "principal from the interest"],
      ["R = 100 × SI / (P × T)", "rate from the interest"],
      ["T = 100 × SI / (P × R)", "time from the interest"],
      ["T in years = months / 12 = days / 365", "periods shorter than a year"],
      ["yearly SI = (A2 − A1) / (T2 − T1)", "two amounts at two times"],
      ["sum becomes n times: R × T = 100(n − 1)", "doubling, tripling"],
      ["SI = P(R1T1 + R2T2 + ...) / 100", "rate changes over the years"],
      ["equal interest: parts ∝ 1 / (R × T)", "splitting a sum so interests match"],
    ] },
    points: [
      "The interest is the same every year, so amounts after 1, 2, 3 years go up in equal steps.",
      "Two amounts at two times: their difference is the interest for the gap; subtract back to get the principal.",
      "Doubling needs R × T = 100, tripling R × T = 200. At SI, 4 times takes three times as long as doubling, not twice.",
      "Changing rates: add rate × years for each period first, then use the formula once.",
      "Mixed rates on parts of a sum: alligation on the rates gives the split directly.",
      "Convert months to years before using the formula: 9 months is 3/4 of a year.",
    ],
    diagram: `flowchart TB
  P["principal ${rs(D.p)} at ${D.r}%"] --> Y1["year 1: + ${rs(yearly)}"]
  Y1 --> Y2["year 2: + ${rs(yearly)}"]
  Y2 --> Y3["year 3: + ${rs(yearly)}"]
  Y3 --> A["amount ${rs(D.p + 3 * yearly)}"]:::ok`,
    caption: `At ${D.r}% simple interest the same ${rs(yearly)} is added every year, because each year's interest is on the original ${rs(D.p)}.`,
    cards: [
      card("basic", `Find the simple interest on ${rs(B.p)} at ${B.r}% a year for ${B.t} years.`, [
        "SI = P × R × T / 100.", `SI = ${num(B.p)} × ${B.r} × ${B.t} / 100 = **${rs(si(B.p, B.r, B.t))}**.`]),
      card("months", `What is the simple interest on ${rs(M.p)} at ${M.r}% a year for ${M.m} months?`, [
        `${M.m} months = ${frac(M.m, 12)} of a year.`, `SI = ${num(M.p)} × ${M.r} × ${frac(M.m, 12)} / 100 = **${rs(mSi)}**.`],
        `Putting T = ${M.m} gives ${rs(si(M.p, M.r, M.m))}. Convert months to years first.`),
      card("find-p", `What sum earns ${rs(F.i)} simple interest in ${F.t} years at ${F.r}% a year?`, [
        "P = 100 × SI / (R × T).", `P = 100 × ${num(F.i)} / (${F.r} × ${F.t}) = ${num(100 * F.i)} / ${num(F.r * F.t)}.`,
        `P = **${rs(fP)}**. Check: ${num(fP)} × ${F.r} × ${F.t} / 100 = ${num(F.i)}.`]),
      card("find-r", `${rs(R.p)} becomes ${rs(R.a)} in ${R.t} years at simple interest. What is the rate?`, [
        `Interest = ${num(R.a)} − ${num(R.p)} = ${num(R.a - R.p)}.`, `R = 100 × ${num(R.a - R.p)} / (${num(R.p)} × ${R.t}) = **${num(rR)}% a year**.`],
        `Use the interest (${rs(R.a - R.p)}) in the formula, not the amount (${rs(R.a)}).`),
      card("find-t", `How long does ${rs(T.p)} take to earn ${rs(T.i)} at ${T.r}% simple interest?`, [
        "T = 100 × SI / (P × R).", `T = 100 × ${num(T.i)} / (${num(T.p)} × ${T.r}) = **${num(tT)} years** (${Math.floor(tT)} years ${Math.round((tT % 1) * 12)} months).`]),
      card("double", `At what rate of simple interest does a sum double in ${dbl} years?`, [
        "Doubling means the interest equals the principal: SI = P.", `P = P × R × ${dbl} / 100, so R × ${dbl} = 100.`, `R = **${num(dblR)}% a year**.`]),
      card("two-amounts", `A sum lent at simple interest amounts to ${rs(a1)} after ${two.t1} years and ${rs(a2)} after ${two.t2} years. Find the sum and the rate.`, [
        `The ${two.t2 - two.t1} years between earn ${num(a2)} − ${num(a1)} = ${num(a2 - a1)}, so ${num(perYear)} a year.`,
        `Principal = ${num(a1)} − ${two.t1} × ${num(perYear)} = ${num(backP)}.`,
        `Rate = 100 × ${num(perYear)} / ${num(backP)} = ${num(backR)}%.`, `**Sum ${rs(backP)}, rate ${num(backR)}% a year.**`]),
      card("n-times", `A sum doubles in ${nt.years} years at simple interest. In how many years will it become ${nt.times} times itself?`, [
        `Doubling means the interest after ${nt.years} years equals P.`, `Becoming ${nt.times} times needs interest of ${nt.times - 1}P.`,
        `Interest grows evenly: ${nt.times - 1} × ${nt.years} = **${ntT} years**.`],
        `Doubling twice (${nt.years * 2} years) is compound interest thinking. At SI the interest is P every ${nt.years} years.`),
      card("rate-rise", `If the rate of simple interest rises from ${rise.from}% to ${rise.to}%, a person earns ${rs(rise.more)} more in ${rise.t} years. What is the sum?`, [
        `Extra interest = P × ${rise.to - rise.from} × ${rise.t} / 100 = ${num(rise.more)}.`,
        `P = 100 × ${num(rise.more)} / ${(rise.to - rise.from) * rise.t} = **${rs(riseP)}**.`]),
      card("changing", `${rs(ch.p)} is lent at ${ch.parts[0][0]}% for the first ${ch.parts[0][1]} years, ${ch.parts[1][0]}% for the next ${ch.parts[1][1]} years and ${ch.parts[2][0]}% after that. What is the simple interest after ${ch.parts.reduce((s, [, t]) => s + t, 0)} years?`, [
        `Add rate × years: ${ch.parts.map(([r, t]) => `${r} × ${t}`).join(" + ")} = ${chRT}.`,
        `SI = ${num(ch.p)} × ${chRT} / 100 = **${rs(chSi)}**.`]),
      card("split-rates", `${rs(sp.total)} is lent, part at ${sp.lo}% and the rest at ${sp.hi}% simple interest. The total yearly interest is ${rs(sp.i)}. How much was lent at ${sp.lo}%?`, [
        `Average rate = 100 × ${num(sp.i)} / ${num(sp.total)} = ${num(avgR)}%.`,
        `Alligation: (${sp.hi} − ${num(avgR)}) : (${num(avgR)} − ${sp.lo}) = ${num(sp.hi - avgR)} : ${num(avgR - sp.lo)} = ${ratio(spLo, sp.total - spLo)}.`,
        `At ${sp.lo}%: ${num(sp.total)} × ${frac(spLo, sp.total)} = **${rs(spLo)}**. Check: ${num(si(spLo, sp.lo, 1))} + ${num(si(sp.total - spLo, sp.hi, 1))} = ${num(sp.i)}.`]),
      card("equal-split", `Split ${rs(eq.total)} into two parts so that the interest on the first at ${eq.r1}% for ${eq.t1} years equals the interest on the second at ${eq.r2}% for ${eq.t2} years.`, [
        `Rate × time: ${eq.r1} × ${eq.t1} = ${k1} and ${eq.r2} × ${eq.t2} = ${k2}.`,
        `Equal interest means the parts are in the inverse ratio: ${ratio(k2, k1)}.`,
        `Parts: **${rs(eq1)} and ${rs(eq2)}**. Check: both earn ${rs(si(eq1, eq.r1, eq.t1))}.`],
        "The bigger part goes with the smaller rate × time, not the larger."),
      card("r-equals-t", `The simple interest on a sum is ${rt.a}/${rt.b} of the sum, and the rate in % equals the time in years. Find the rate.`, [
        `SI / P = R × T / 100 = ${rt.a}/${rt.b}, and R = T.`, `R² = 100 × ${rt.a} / ${rt.b} = ${num((100 * rt.a) / rt.b)}.`,
        `R = **${num(rtR)}% a year**, for ${num(rtR)} years.`]),
    ],
  };
}

// ---------------------------------------------------------------- compound interest
function compoundInterest(): Chapter {
  const amt = (p: number, r: number, t: number) => p * (1 + r / 100) ** t;
  const D = { p: 10000, r: 10 };
  const steps = [1, 2, 3].map((t) => amt(D.p, D.r, t)), dSi = D.p * (1 + (3 * D.r) / 100);
  const B = { p: 8000, r: 10, t: 3 }, bA = amt(B.p, B.r, B.t);
  let loop = B.p; for (let y = 0; y < B.t; y++) loop += (loop * B.r) / 100;
  must(near(loop, bA), "ci basic year by year");
  const third = amt(B.p, B.r, 3) - amt(B.p, B.r, 2);
  const H = { p: 16000, r: 10 }, hA = amt(H.p, H.r / 2, 2), hY = amt(H.p, H.r, 1);
  const Q = { p: 40000, r: 8, months: 6 }, qN = Q.months / 3, qA = amt(Q.p, Q.r / 4, qN);
  const FP = { a: 9261, r: 5, t: 3 }, fpP = FP.a / (1 + FP.r / 100) ** FP.t;
  must(near(fpP, 8000) && FP.a === 21 ** 3 && near(1 + FP.r / 100, 21 / 20), "ci find-p");
  const FR = { p: 6250, a: 7840, t: 2 }, frR = (Math.sqrt(FR.a / FR.p) - 1) * 100;
  must(near(amt(FR.p, frR, FR.t), FR.a), "ci find-r");
  const D2 = { diff: 45, r: 5 }, d2P = D2.diff / (D2.r / 100) ** 2;
  must(near(amt(d2P, D2.r, 2) - d2P - (d2P * D2.r * 2) / 100, D2.diff), "ci diff2");
  const D3 = { p: 10000, r: 10 }, d3 = D3.p * (D3.r / 100) ** 2 * (3 + D3.r / 100);
  must(near(amt(D3.p, D3.r, 3) - D3.p - (D3.p * D3.r * 3) / 100, d3), "ci diff3");
  const TA = { p: 10000, r: 15 }, ta2 = amt(TA.p, TA.r, 2), ta3 = amt(TA.p, TA.r, 3);
  const taR = ((ta3 - ta2) / ta2) * 100, taP = ta2 / (1 + taR / 100) ** 2;
  must(near(taR, TA.r) && near(taP, TA.p), "ci two-amounts");
  const DB = { years: 4, times: 8 }, dbK = Math.log2(DB.times), dbT = DB.years * dbK;
  const V = { p: 25000, rates: [4, 5, 6] }, vA = V.rates.reduce((a, r) => a * (1 + r / 100), V.p);
  const PO = { p: 50000, r: 4, t: 2 }, poA = amt(PO.p, PO.r, PO.t);
  const DE = { p: 250000, r: 20, t: 3 }, deA = DE.p * (1 - DE.r / 100) ** DE.t;
  const IN = { p: 2100, r: 10 }, inX = IN.p / (1 / (1 + IN.r / 100) + 1 / (1 + IN.r / 100) ** 2);
  must(near(amt(amt(IN.p, IN.r, 1) - inX, IN.r, 1), inX), "ci instalments clear the loan");
  return {
    id: "ci",
    play: "play-ci",
    title: "Compound interest",
    summary: "Compound interest adds each period's interest to the principal, so the next period earns interest on interest. Think in multipliers: 10% a year for 3 years is × 1.1³. Population growth and depreciation are the same formula, with a minus sign for a fall.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["A = P(1 + R/100)^n", "amount, compounded yearly"],
      ["CI = A − P", "the interest itself"],
      ["A = P(1 + R/200)^(2n)", "compounded half-yearly: half the rate, twice the periods"],
      ["A = P(1 + R/400)^(4n)", "compounded quarterly"],
      ["CI − SI = P(R/100)²", "difference over 2 years"],
      ["CI − SI = P(R/100)²(3 + R/100)", "difference over 3 years"],
      ["A = P(1 + R1/100)(1 + R2/100)...", "a different rate each year"],
      ["R = (A2 − A1) / A1 × 100", "amounts in two consecutive years"],
      ["P(1 + R/100)^n", "population growth"],
      ["P(1 − R/100)^n", "depreciation of a machine or car"],
      ["x times in n years → x^k times in kn years", "repeated doubling or tripling"],
    ] },
    points: [
      "Learn the multipliers: 1.1² = 1.21, 1.1³ = 1.331, 1.05² = 1.1025, 1.05³ = 1.157625, 1.2² = 1.44.",
      "Year 1 compound interest equals year 1 simple interest. The gap starts in year 2.",
      "Two years at R% is R + R + R²/100 percent in total: 10% twice is 21%.",
      "Each year's interest is the previous year's interest × (1 + R/100), so yearly interest grows in a geometric series.",
      "Half-yearly at R% beats yearly at R%, because interest joins the principal sooner.",
      "Equal instalments: discount each instalment back to today and add; the total equals the loan.",
    ],
    diagram: `flowchart TB
  P["${rs(D.p)} at ${D.r}%"] -->|"+ ${num(D.p * D.r / 100)}"| A1["${rs(steps[0])}"]
  A1 -->|"+ ${num(steps[1] - steps[0])}"| A2["${rs(steps[1])}"]
  A2 -->|"+ ${num(steps[2] - steps[1])}"| A3["${rs(steps[2])}"]:::ok
  A3 --> G["${rs(steps[2] - dSi)} more than simple interest (${rs(dSi)})"]:::hot`,
    caption: `Each year's ${D.r}% is taken on the new, larger amount. That interest on interest is the whole gap between compound and simple interest.`,
    cards: [
      card("basic", `Find the compound interest on ${rs(B.p)} at ${B.r}% a year for ${B.t} years, compounded yearly.`, [
        `A = ${num(B.p)} × ${dec(1 + B.r / 100)}${sup(B.t)} = ${num(B.p)} × ${dec((1 + B.r / 100) ** B.t)}.`,
        `A = ${num(bA)}.`, `CI = ${num(bA)} − ${num(B.p)} = **${rs(bA - B.p)}**.`],
        `Simple interest would be ${rs((B.p * B.r * B.t) / 100)}. Do not stop at P × R × T.`),
      card("third-year", `On ${rs(B.p)} at ${B.r}% compound interest, how much interest is earned in the third year alone?`, [
        `Amount after 2 years = ${num(amt(B.p, B.r, 2))}.`, `Third year's interest = ${B.r}% of ${num(amt(B.p, B.r, 2))} = **${rs(third)}**.`]),
      card("half-yearly", `Find the compound interest on ${rs(H.p)} for 1 year at ${H.r}% a year, compounded half-yearly.`, [
        `Half-yearly: rate ${H.r / 2}% per half-year, 2 periods.`, `A = ${num(H.p)} × ${dec(1 + H.r / 200)}² = ${num(hA)}.`,
        `CI = **${rs(hA - H.p)}**, against ${rs(hY - H.p)} compounded yearly.`],
        "Half-yearly does not mean half the interest: the rate halves but the number of periods doubles."),
      card("quarterly", `Find the compound interest on ${rs(Q.p)} for ${Q.months} months at ${Q.r}% a year, compounded quarterly.`, [
        `Quarterly: ${Q.r / 4}% per quarter; ${Q.months} months = ${qN} quarters.`, `A = ${num(Q.p)} × ${dec(1 + Q.r / 400)}${sup(qN)} = ${num(qA)}.`,
        `CI = **${rs(qA - Q.p)}**.`]),
      card("find-p", `What sum amounts to ${rs(FP.a)} in ${FP.t} years at ${FP.r}% compound interest?`, [
        `P = A / ${dec(1 + FP.r / 100)}³ = ${num(FP.a)} / ${dec((1 + FP.r / 100) ** FP.t)}.`, `Faster: ${FP.a} = 21³ and ${dec(1 + FP.r / 100)} = 21/20, so P = 20³ = **${rs(fpP)}**.`]),
      card("find-r", `${rs(FR.p)} becomes ${rs(FR.a)} in ${FR.t} years at compound interest. Find the rate.`, [
        `(1 + R/100)² = ${num(FR.a)} / ${num(FR.p)} = ${dec(FR.a / FR.p)}.`, `1 + R/100 = √${dec(FR.a / FR.p)} = ${dec(1 + frR / 100)}.`,
        `R = **${num(frR)}% a year**.`]),
      card("diff2", `The difference between compound and simple interest on a sum for 2 years at ${D2.r}% is ${rs(D2.diff)}. Find the sum.`, [
        "CI − SI for 2 years = P(R/100)².", `${num(D2.diff)} = P × (${D2.r}/100)² = P / ${num(1 / (D2.r / 100) ** 2)}.`,
        `P = **${rs(d2P)}**.`]),
      card("diff3", `Find the difference between compound and simple interest on ${rs(D3.p)} for 3 years at ${D3.r}%.`, [
        "CI − SI for 3 years = P(R/100)²(3 + R/100).", `= ${num(D3.p)} × ${dec((D3.r / 100) ** 2)} × ${dec(3 + D3.r / 100)} = **${rs(d3)}**.`,
        `Check: CI = ${num(amt(D3.p, D3.r, 3) - D3.p)}, SI = ${num((D3.p * D3.r * 3) / 100)}.`]),
      card("two-amounts", `A sum at compound interest amounts to ${rs(ta2)} in 2 years and ${rs(ta3)} in 3 years. Find the rate and the sum.`, [
        `The third year's interest is ${num(ta3)} − ${num(ta2)} = ${num(ta3 - ta2)}, earned on ${num(ta2)}.`,
        `R = ${num(ta3 - ta2)} / ${num(ta2)} × 100 = ${num(taR)}%.`, `P = ${num(ta2)} / ${dec((1 + taR / 100) ** 2)} = ${num(taP)}.`,
        `**Rate ${num(taR)}%, sum ${rs(taP)}.**`]),
      card("doubling", `A sum doubles in ${DB.years} years at compound interest. In how many years does it become ${DB.times} times itself?`, [
        `${DB.times} = 2${sup(dbK)}, so it must double ${dbK} times.`, `${dbK} × ${DB.years} = **${dbT} years**.`],
        `Multiplying ${DB.times} × ${DB.years} = ${DB.times * DB.years} years is wrong: at compound interest the doubling repeats every ${DB.years} years.`),
      card("varying", `${rs(V.p)} is invested at ${V.rates.join("%, ")}% compound interest in the first, second and third years. Find the amount and the interest.`, [
        `A = ${num(V.p)} × ${V.rates.map((r) => dec(1 + r / 100)).join(" × ")}.`,
        `Step by step: ${V.rates.map((_, i) => num(V.rates.slice(0, i + 1).reduce((a, r) => a * (1 + r / 100), V.p))).join(", then ")}.`,
        `**Amount ${rs(vA)}, interest ${rs(vA - V.p)}.**`]),
      card("population", `A town has ${num(PO.p)} people and grows by ${PO.r}% a year. What will the population be after ${PO.t} years?`, [
        `Population = ${num(PO.p)} × ${dec(1 + PO.r / 100)}${sup(PO.t)} = ${num(PO.p)} × ${dec((1 + PO.r / 100) ** PO.t)}.`,
        `= **${num(poA)}**.`]),
      card("depreciation", `A machine bought for ${rs(DE.p)} loses ${DE.r}% of its value every year. What is it worth after ${DE.t} years?`, [
        `Each year the value is × ${1 - DE.r / 100}.`, `${num(DE.p)} × ${dec(1 - DE.r / 100)}${sup(DE.t)} = ${num(DE.p)} × ${dec((1 - DE.r / 100) ** DE.t)}.`,
        `Value = **${rs(deA)}**.`],
        `Taking ${DE.r * DE.t}% off once (${rs(DE.p * (1 - (DE.r * DE.t) / 100))}) is wrong: each year's fall is on the lower value.`),
      card("instalments", `A loan of ${rs(IN.p)} at ${IN.r}% compound interest is repaid in two equal yearly instalments. Find each instalment.`, [
        `Bring each instalment back to today: x / ${dec(1 + IN.r / 100)} + x / ${dec(1 + IN.r / 100)}² must equal the loan.`,
        `Over a common denominator: x × (${dec(1 + IN.r / 100)} + 1) / ${dec((1 + IN.r / 100) ** 2)} = ${num(IN.p)}, so x = ${num(IN.p)} × ${dec((1 + IN.r / 100) ** 2)} / ${dec(2 + IN.r / 100)}.`,
        `x = **${rs(inX)}**. Check: after year 1 the debt is ${num(amt(IN.p, IN.r, 1))} − ${num(inX)} = ${num(amt(IN.p, IN.r, 1) - inX)}, which grows to ${num(inX)}.`]),
    ],
  };
}

// ---------------------------------------------------------------- ages
function ages(): Chapter {
  const N = { son: 15, father: 45 };
  const at = (d: number) => `son ${N.son + d}, father ${N.father + d}`;
  const sd = { sum: 50, diff: 6 }, sdB = only(1, 100, (b) => 2 * b + sd.diff === sd.sum, "ages sum-diff");
  const rs1 = { a: 5, b: 7, later: 8, sum: 64 }, rs1x = only(1, 50, (x) => (rs1.a + rs1.b) * x + 2 * rs1.later === rs1.sum, "ages ratio-sum");
  const rn = { a: 4, b: 5, later: 6, c: 5, d: 6 }, rnx = only(1, 50, (x) => rn.d * (rn.a * x + rn.later) === rn.c * (rn.b * x + rn.later), "ages ratio-now");
  const ag = { ago: 8, then: 4, now: 2 }, agM = only(ag.ago + 1, 100, (m) => ag.now * m - ag.ago === ag.then * (m - ag.ago), "ages ago-times");
  const bi = { gap: 32, times: 3, later: 5 }, biS = only(1, 100, (s) => s + bi.gap === bi.times * s, "ages birth");
  const th = { more: 3, total: 38 }, thC = only(1, 100, (c) => 2 * c + th.more + 2 * c + c === th.total, "ages three");
  const wh = { f: 36, s: 12 }, whT = only(1, 100, (t) => wh.f + t === 2 * (wh.s + t), "ages when twice"), whAgo = only(1, 11, (t) => wh.f - t === 5 * (wh.s - t), "ages when 5 times");
  const dr = { a: 3, b: 5, diff: 12, later: 6 }, drx = dr.diff / (dr.b - dr.a), drA = dr.a * drx + dr.later, drB = dr.b * drx + dr.later, drg = gcd(drA, drB);
  const pr = { prod: 221, diff: 4 }, prX = only(1, 100, (x) => x * (x + pr.diff) === pr.prod, "ages product");
  const ct = { n: 30, avg: 15, rise: 1 }, ctT = (ct.n + 1) * (ct.avg + ct.rise) - ct.n * ct.avg;
  const bb = { n: 4, avg: 20, ago: 3, baby: 1 }, bbNow = bb.n * (bb.avg + bb.ago), bbAvg = (bbNow + bb.baby) / (bb.n + 1);
  must(near((bb.n + 1) * bbAvg - bbNow, bb.baby), "ages baby");
  const sh = { ago: 6, a: 6, b: 5, later: 4, c: 11, d: 10 };
  const shx = only(1, 30, (x) => sh.d * (sh.a * x + sh.ago + sh.later) === sh.c * (sh.b * x + sh.ago + sh.later), "ages ratio-shift");
  const shA = sh.a * shx + sh.ago, shB = sh.b * shx + sh.ago;
  const dg: [number, number][] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) { const m = 10 * a + b, d = 10 * b + a; if (m - d === 27 && m - 5 === 4 * (d - 5)) dg.push([m, d]); }
  must(dg.length === 1, "ages digits: exactly one pair");
  const [dgM, dgD] = dg[0];
  return {
    id: "ages",
    play: "play-ages",
    title: "Problems on ages",
    summary: "Age problems are short linear equations. Pick one unknown (usually the younger person's present age or the ratio multiplier), write every other age in terms of it, and remember that the gap between two people's ages never changes.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["n years ago: x − n; n years later: x + n", "shifting one age in time"],
      ["ages in ratio a : b now: ax and bx", "ratio questions"],
      ["age gap = A − B, the same at every time", "checking and shortcuts"],
      ["(ax + n) / (bx + n) = c / d", "ratio after n years"],
      ["parent's age at child's birth = parent now − child now", "birth questions"],
      ["group total rises by (number of people) each year", "family or class totals"],
      ["new member's age = new total − old total", "average changes when someone joins"],
      ["x(x + d) = product", "product of ages with a known gap"],
    ] },
    points: [
      "Choose the unknown that keeps everything whole: the younger present age, or the multiplier x in a ratio.",
      "Shift every person by the same number of years: a common slip is adding years to only one of them.",
      "The gap is fixed, so the ratio of two ages moves toward 1 : 1 as time passes.",
      "Use the options: plug each into the first condition, then confirm with the second.",
      "A group of n people gets n years older in total every year.",
      "Reversed digits: 10a + b and 10b + a always differ by 9(a − b).",
    ],
    diagram: `flowchart TB
  A["5 years ago: ${at(-5)}"] --> B["now: ${at(0)}"]
  B --> C["in 10 years: ${at(10)}"]
  C --> G["gap is ${N.father - N.son} years every time"]:::hot`,
    caption: `Both ages move by the same amount, so the gap stays ${N.father - N.son} years while the ratio drifts from ${(N.father - 5) / (N.son - 5)} : 1 to ${N.father / N.son} : 1 to ${frac(N.father + 10, N.son + 10).replace("/", " : ")}.`,
    cards: [
      card("sum-diff", `The ages of two sisters add up to ${sd.sum}, and the elder is ${sd.diff} years older. How old is the younger?`, [
        `Let the younger be x; the elder is x + ${sd.diff}.`, `2x + ${sd.diff} = ${sd.sum}, so x = **${sdB}** (elder ${sdB + sd.diff}).`]),
      card("ratio-sum", `Anil's and Bina's ages are in the ratio ${rs1.a} : ${rs1.b}. In ${rs1.later} years their ages will add up to ${rs1.sum}. Find their present ages.`, [
        `Ages ${rs1.a}x and ${rs1.b}x. In ${rs1.later} years the total is ${rs1.a + rs1.b}x + ${2 * rs1.later} = ${rs1.sum}.`,
        `x = ${rs1x}: **Anil ${rs1.a * rs1x}, Bina ${rs1.b * rs1x}**.`], `Both people age, so add ${rs1.later} twice (${2 * rs1.later}), not once.`),
      card("ratio-now", `The ages of two friends are in the ratio ${rn.a} : ${rn.b}. After ${rn.later} years the ratio will be ${rn.c} : ${rn.d}. Find their present ages.`, [
        `(${rn.a}x + ${rn.later}) / (${rn.b}x + ${rn.later}) = ${rn.c}/${rn.d}.`,
        `${rn.d}(${rn.a}x + ${rn.later}) = ${rn.c}(${rn.b}x + ${rn.later}) gives x = ${rnx}.`, `Ages: **${rn.a * rnx} and ${rn.b * rnx}**.`]),
      card("ago-times", `${ag.ago} years ago Ravi was ${ag.then} times as old as Meena. Now he is twice as old. How old are they?`, [
        `Let Meena be m now; Ravi is 2m.`, `2m − ${ag.ago} = ${ag.then}(m − ${ag.ago}), so ${ag.then * ag.ago - ag.ago} = ${ag.then - 2}m.`,
        `m = ${agM}: **Meena ${agM}, Ravi ${2 * agM}**.`]),
      card("birth", `A father was ${bi.gap} when his son was born. Now he is ${bi.times} times his son's age. How old will the father be in ${bi.later} years?`, [
        `Father = son + ${bi.gap}, and father = ${bi.times} × son.`, `${bi.times}s = s + ${bi.gap}, so s = ${biS}; father = ${bi.times * biS}.`,
        `In ${bi.later} years: **${bi.times * biS + bi.later}**.`]),
      card("three", `A is ${th.more} years older than B, and B is twice as old as C. Their ages add up to ${th.total}. How old is B?`, [
        `Let C = c, so B = 2c and A = 2c + ${th.more}.`, `5c + ${th.more} = ${th.total}, so c = ${thC}.`,
        `**B = ${2 * thC}** (A ${2 * thC + th.more}, C ${thC}).`]),
      card("when", `A father is ${wh.f} and his son ${wh.s}. After how many years will the father be twice as old? How many years ago was he 5 times as old?`, [
        `Twice: ${wh.f} + t = 2(${wh.s} + t), so t = ${whT}.`, `5 times: ${wh.f} − t = 5(${wh.s} − t), so 4t = ${5 * wh.s - wh.f}, t = ${whAgo}.`,
        `**In ${whT} years; ${whAgo} years ago.**`]),
      card("diff-ratio", `Two ages are in the ratio ${dr.a} : ${dr.b} and differ by ${dr.diff} years. What will the ratio be in ${dr.later} years?`, [
        `${dr.b - dr.a}x = ${dr.diff}, so x = ${drx}: ages ${dr.a * drx} and ${dr.b * drx}.`, `In ${dr.later} years: ${drA} and ${drB}.`,
        `Ratio **${drA / drg} : ${drB / drg}**.`]),
      card("product", `Two cousins are ${pr.diff} years apart, and the product of their ages is ${pr.prod}. How old are they?`, [
        `x(x + ${pr.diff}) = ${pr.prod}.`, `Try numbers near √${pr.prod} ≈ ${num(Math.sqrt(pr.prod))}: ${prX} × ${prX + pr.diff} = ${pr.prod}.`,
        `**${prX} and ${prX + pr.diff}**.`]),
      card("class-teacher", `The average age of ${ct.n} students is ${ct.avg}. When the teacher is included the average rises by ${ct.rise}. How old is the teacher?`, [
        `Total with teacher = ${ct.n + 1} × ${ct.avg + ct.rise} = ${(ct.n + 1) * (ct.avg + ct.rise)}.`, `Students' total = ${ct.n} × ${ct.avg} = ${ct.n * ct.avg}.`,
        `Teacher = **${ctT}**. Shortcut: ${ct.avg} + ${ct.n + 1} × ${ct.rise}.`]),
      card("baby", `${bb.ago} years ago the average age of a family of ${bb.n} was ${bb.avg}. A baby has since been born, and the average age of the ${bb.n + 1} today is ${num(bbAvg)}. How old is the baby?`, [
        `The ${bb.n} have each aged ${bb.ago}: total now = ${bb.n} × (${bb.avg} + ${bb.ago}) = ${bbNow}.`,
        `Total of ${bb.n + 1} today = ${bb.n + 1} × ${num(bbAvg)} = ${num((bb.n + 1) * bbAvg)}.`, `Baby = **${bb.baby} year**.`],
        `Forgetting that the family aged ${bb.ago} years gives a negative baby.`),
      card("ratio-shift", `${sh.ago} years ago two brothers' ages were in the ratio ${sh.a} : ${sh.b}. In ${sh.later} years the ratio will be ${sh.c} : ${sh.d}. How old is the elder now?`, [
        `${sh.ago} years ago: ${sh.a}x and ${sh.b}x. In ${sh.later} years: ${sh.a}x + ${sh.ago + sh.later} and ${sh.b}x + ${sh.ago + sh.later}.`,
        `${sh.d}(${sh.a}x + ${sh.ago + sh.later}) = ${sh.c}(${sh.b}x + ${sh.ago + sh.later}) gives x = ${shx}.`,
        `Now: ${shA} and ${shB}. **The elder is ${shA}.**`], `The gap between the two times is ${sh.ago + sh.later} years, not ${sh.later}.`),
      card("digits", "A mother's age with its digits reversed is her daughter's age. The mother is 27 years older, and 5 years ago she was 4 times as old as her daughter. How old are they?", [
        "Ages 10a + b and 10b + a differ by 9(a − b) = 27, so a − b = 3.",
        "Try pairs 41/14, 52/25, 63/36, ... against the second condition.", `${dgM} − 5 = ${dgM - 5} and 4 × (${dgD} − 5) = ${4 * (dgD - 5)}.`,
        `**Mother ${dgM}, daughter ${dgD}.**`]),
    ],
  };
}

// ---------------------------------------------------------------- boats and streams
function boats(): Chapter {
  const DG = { b: 10, s: 2 };
  const B1 = { b: 12, s: 3, d: 45 };
  const B2 = { dd: 30, dt: 2, ud: 24, ut: 3 }, b2D = B2.dd / B2.dt, b2U = B2.ud / B2.ut;
  const B3 = { b: 9, s: 3, d: 24 }, b3T = B3.d / (B3.b + B3.s) + B3.d / (B3.b - B3.s);
  const B4 = { b: 8, s: 2, t: 8 }, b4d = B4.t / (1 / (B4.b + B4.s) + 1 / (B4.b - B4.s));
  must(near(b4d / (B4.b + B4.s) + b4d / (B4.b - B4.s), B4.t), "boats dist-from-time");
  const B5 = { b: 15, s: 5 }, b5avg = (B5.b ** 2 - B5.s ** 2) / B5.b, b5d = 30;
  must(near((2 * b5d) / (b5d / (B5.b + B5.s) + b5d / (B5.b - B5.s)), b5avg), "boats avg-speed");
  const B6 = { k: 2, b: 18 }, b6s = (B6.b * (B6.k - 1)) / (B6.k + 1);
  must(near((B6.b + b6s) / (B6.b - b6s), B6.k), "boats k-times");
  const B7 = { b: 10, s: 2, t: 1 }; // log and boat leave together; boat turns after t hours
  const b7pos = (B7.b + B7.s) * B7.t, b7log = B7.s * B7.t, b7meet = (b7pos - b7log) / (B7.b - B7.s + B7.s), b7where = B7.s * (B7.t + b7meet);
  must(near(b7meet, B7.t), "boats log: same time back as out");
  const B8 = { b: 15, d: 20, extra: 1 }, b8s = only(1, 14, (s) => near(B8.d / (B8.b - s) - B8.d / (B8.b + s), B8.extra), "boats stream from times");
  const B9 = { d: 60, dt: 5, ut: 10 }, b9D = B9.d / B9.dt, b9U = B9.d / B9.ut, b9b = (b9D + b9U) / 2, b9s = (b9D - b9U) / 2, b9t = B9.d / (b9b + 2 * b9s);
  const B10 = { gap: 90, b1: 20, b2: 16, s: 4 }, b10t = B10.gap / ((B10.b1 + B10.s) + (B10.b2 - B10.s));
  const B11 = { d: 48, total: 14, down: 4, up: 3 }, b11k = (B11.d / B11.down + B11.d / B11.up) / B11.total;
  const b11D = B11.down * b11k, b11U = B11.up * b11k;
  must(near(B11.d / b11D + B11.d / b11U, B11.total), "boats ratio round trip");
  const B12 = { pct: 60, b: 16 }, b12D = B12.b / ((1 + B12.pct / 100) / 2), b12U = (b12D * B12.pct) / 100;
  must(near((b12D + b12U) / 2, B12.b), "boats percent");
  return {
    id: "boats",
    play: "play-boats",
    title: "Boats and streams",
    summary: "The stream helps on the way down and holds you back on the way up. Downstream speed = boat + stream and upstream speed = boat − stream; every question is these two lines plus distance = speed × time.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["D = b + s", "downstream speed (b = boat in still water, s = stream)"],
      ["U = b − s", "upstream speed"],
      ["b = (D + U) / 2", "boat speed from the two speeds"],
      ["s = (D − U) / 2", "stream speed from the two speeds"],
      ["T = d/(b + s) + d/(b − s)", "time for a round trip"],
      ["average speed = (b² − s²) / b", "round trip over equal distances"],
      ["d = T(b² − s²) / (2b)", "distance from a round-trip time"],
      ["upstream takes k times as long: b : s = (k + 1) : (k − 1)", "time ratios"],
    ] },
    points: [
      "Find D and U first; the boat speed is their average and the stream speed is half their difference.",
      "\"Still water\" means the boat's own speed. A raft or log moves at the stream's speed.",
      "For the same distance, times are inversely proportional to speeds.",
      "With any current, the round-trip average is below the still-water speed.",
      "Two boats on the same river: the stream adds to one and takes from the other, so it cancels in their closing speed.",
      "Convert minutes to hours before mixing them with km/h.",
    ],
    diagram: `flowchart TB
  B["boat in still water: ${DG.b} km/h"] --> D["downstream: ${DG.b} + ${DG.s} = ${DG.b + DG.s} km/h"]:::ok
  S["stream: ${DG.s} km/h"] --> D
  B --> U["upstream: ${DG.b} − ${DG.s} = ${DG.b - DG.s} km/h"]:::warn
  S --> U`,
    caption: `The same ${DG.s} km/h stream is added going down and subtracted going up. Average the two speeds to get the boat back: (${DG.b + DG.s} + ${DG.b - DG.s}) / 2 = ${DG.b}.`,
    cards: [
      card("basic", `A boat moves at ${B1.b} km/h in still water and the stream flows at ${B1.s} km/h. How long does it take to go ${B1.d} km downstream?`, [
        `Downstream speed = ${B1.b} + ${B1.s} = ${B1.b + B1.s} km/h.`, `Time = ${B1.d} / ${B1.b + B1.s} = **${num(B1.d / (B1.b + B1.s))} hours**.`]),
      card("find-bs", `A boat goes ${B2.dd} km downstream in ${B2.dt} hours and ${B2.ud} km upstream in ${B2.ut} hours. Find the boat's speed in still water and the stream's speed.`, [
        `D = ${B2.dd} / ${B2.dt} = ${b2D} km/h, U = ${B2.ud} / ${B2.ut} = ${b2U} km/h.`, `b = (${b2D} + ${b2U}) / 2 = ${num((b2D + b2U) / 2)}, s = (${b2D} − ${b2U}) / 2 = ${num((b2D - b2U) / 2)}.`,
        `**Boat ${num((b2D + b2U) / 2)} km/h, stream ${num((b2D - b2U) / 2)} km/h.**`]),
      card("round-trip", `A boat goes ${B3.b} km/h in still water on a river flowing at ${B3.s} km/h. How long does a ${B3.d} km trip there and back take?`, [
        `Down at ${B3.b + B3.s} km/h: ${num(B3.d / (B3.b + B3.s))} h. Up at ${B3.b - B3.s} km/h: ${num(B3.d / (B3.b - B3.s))} h.`, `Total = **${num(b3T)} hours**.`],
        `Using the still-water speed both ways gives ${num((2 * B3.d) / B3.b)} h. The slow leg costs more than the fast leg saves.`),
      card("dist-from-time", `A man rows at ${B4.b} km/h in still water. The river flows at ${B4.s} km/h, and a trip to a village and back takes ${B4.t} hours. How far is the village?`, [
        `d/${B4.b + B4.s} + d/${B4.b - B4.s} = ${B4.t}.`, `d × ${frac(2 * B4.b, (B4.b + B4.s) * (B4.b - B4.s))} = ${B4.t}.`, `d = **${num(b4d)} km**.`]),
      card("avg-speed", `A boat goes ${B5.b} km/h in still water; the stream flows at ${B5.s} km/h. What is its average speed for a trip there and back?`, [
        `Average = (b² − s²) / b = (${B5.b ** 2} − ${B5.s ** 2}) / ${B5.b}.`, `= **${frac(B5.b ** 2 - B5.s ** 2, B5.b)} km/h** (about ${num(b5avg)}).`],
        `${B5.b} km/h is wrong: the boat spends longer on the slow upstream leg.`),
      card("k-times", `Rowing upstream takes ${B6.k} times as long as rowing the same distance downstream. The boat's speed in still water is ${B6.b} km/h. What is the stream's speed?`, [
        `Speeds are inverse to times: D : U = ${B6.k} : 1.`, `b : s = (${B6.k} + 1) : (${B6.k} − 1) = ${B6.k + 1} : ${B6.k - 1}.`,
        `s = ${B6.b} × ${B6.k - 1} / ${B6.k + 1} = **${num(b6s)} km/h**.`]),
      card("log", `A boat and a floating log leave a jetty together, going downstream. The boat's still-water speed is ${B7.b} km/h and the stream flows at ${B7.s} km/h. After ${B7.t} hour the boat turns back. When and where does it meet the log?`, [
        `After ${B7.t} h the boat is ${b7pos} km down, the log ${b7log} km.`, `Coming back the gap of ${b7pos - b7log} km closes at (${B7.b} − ${B7.s}) + ${B7.s} = ${B7.b} km/h: ${num(b7meet)} h.`,
        `**${num(b7meet)} hour after turning, ${num(b7where)} km below the jetty.**`, "Shortcut: relative to the water, the boat moves at its own speed both ways, so it takes as long to come back as it went."]),
      card("stream-from-times", `A boat goes ${B8.b} km/h in still water. It takes ${B8.extra} hour longer to go ${B8.d} km upstream than ${B8.d} km downstream. Find the stream's speed.`, [
        `${B8.d}/(${B8.b} − s) − ${B8.d}/(${B8.b} + s) = ${B8.extra}.`, `Simplify: ${2 * B8.d}s = ${B8.b ** 2} − s².`,
        `Try s = ${b8s}: ${B8.d}/${B8.b - b8s} − ${B8.d}/${B8.b + b8s} = ${num(B8.d / (B8.b - b8s))} − ${num(B8.d / (B8.b + b8s))} = ${B8.extra}. **${b8s} km/h**.`]),
      card("stream-doubles", `A boat takes ${B9.dt} hours to go ${B9.d} km downstream and ${B9.ut} hours to come back. If the stream's speed doubled, how long would the downstream trip take?`, [
        `D = ${b9D}, U = ${b9U}, so b = ${b9b} and s = ${b9s}.`, `New downstream speed = ${b9b} + ${2 * b9s} = ${b9b + 2 * b9s} km/h.`,
        `Time = ${B9.d} / ${b9b + 2 * b9s} = **${num(b9t)} hours**.`]),
      card("two-boats", `Two jetties are ${B10.gap} km apart on a river flowing at ${B10.s} km/h. A boat of still-water speed ${B10.b1} km/h leaves the upper jetty and one of ${B10.b2} km/h leaves the lower jetty at the same time, heading toward each other. When do they meet?`, [
        `Speeds: ${B10.b1} + ${B10.s} = ${B10.b1 + B10.s} down and ${B10.b2} − ${B10.s} = ${B10.b2 - B10.s} up.`,
        `Closing speed = ${B10.b1 + B10.s + B10.b2 - B10.s} km/h, the same as ${B10.b1} + ${B10.b2}: the stream cancels.`, `Time = ${B10.gap} / ${B10.b1 + B10.b2} = **${num(b10t)} hours**.`]),
      card("ratio-trip", `A man rows to a place ${B11.d} km away and back in ${B11.total} hours. He can row ${B11.down} km downstream in the same time as ${B11.up} km upstream. Find the stream's speed.`, [
        `D : U = ${B11.down} : ${B11.up}; write D = ${B11.down}k and U = ${B11.up}k.`, `${B11.d}/${B11.down}k + ${B11.d}/${B11.up}k = ${B11.total}, so ${B11.d / B11.down + B11.d / B11.up}/k = ${B11.total} and k = ${num(b11k)}.`,
        `D = ${num(b11D)}, U = ${num(b11U)}: stream = (${num(b11D)} − ${num(b11U)}) / 2 = **${num((b11D - b11U) / 2)} km/h** (boat ${num((b11D + b11U) / 2)} km/h).`]),
      card("percent", `A boat's upstream speed is ${B12.pct}% of its downstream speed, and its speed in still water is ${B12.b} km/h. Find the stream's speed.`, [
        `U = ${B12.pct / 100}D, and b = (D + U)/2 = ${(1 + B12.pct / 100) / 2}D = ${B12.b}.`, `D = ${num(b12D)}, U = ${num(b12U)}.`,
        `Stream = (${num(b12D)} − ${num(b12U)}) / 2 = **${num((b12D - b12U) / 2)} km/h**.`]),
    ],
  };
}

// ---------------------------------------------------------------- area and mensuration
function area(): Chapter {
  const CY = { r: 7, h: 10 }, cyEnds = 2 * PI * CY.r ** 2, cySide = 2 * PI * CY.r * CY.h;
  const RE = { l: 24, b: 18, rate: 15 };
  const PA = { l: 30, b: 20, w: 2.5 }, paA = (PA.l + 2 * PA.w) * (PA.b + 2 * PA.w) - PA.l * PA.b;
  const HE = [13, 14, 15], heS = HE.reduce((a, b) => a + b) / 2, heA = Math.sqrt(heS * HE.reduce((p, x) => p * (heS - x), 1));
  must(Number.isInteger(heA), "area heron whole");
  const WH = { r: 35, km: 1.1 }, whC = 2 * PI * WH.r, whN = (WH.km * 100000) / whC;
  must(near(whN, Math.round(whN)), "area wheel whole revolutions");
  const SE = { r: 14, deg: 45 }, seA = (SE.deg / 360) * PI * SE.r ** 2, seL = (SE.deg / 360) * 2 * PI * SE.r;
  const RH = { d1: 16, d2: 30 }, rhSide = Math.hypot(RH.d1 / 2, RH.d2 / 2);
  const SQ = { pct: 20 }, sqUp = ((1 + SQ.pct / 100) ** 2 - 1) * 100;
  const CU = { l: 6, b: 4, h: 2.5 }, cuV = CU.l * CU.b * CU.h;
  const CB = { tsa: 486 }, cbA = Math.sqrt(CB.tsa / 6);
  const CL = { r: 7, h: 20 }, clV = PI * CL.r ** 2 * CL.h;
  const CO = { r: 6, h: 8 }, coL = Math.hypot(CO.r, CO.h);
  const SP = { R: 9, r: 6 }, spH = ((4 / 3) * SP.R ** 3) / SP.r ** 2;
  must(near((4 / 3) * Math.PI * SP.R ** 3, Math.PI * SP.r ** 2 * spH), "area recast volume kept");
  const SC = { rk: 0.5, hk: 2 }, scV = SC.rk ** 2 * SC.hk;
  return {
    id: "area",
    play: "play-area",
    title: "Area and mensuration",
    summary: "Mensuration is formula recall plus careful units. Learn the 2D areas and perimeters and the 3D volumes and surface areas below, and watch what a question changes: a 10% rise in every length is a 21% rise in area and a 33.1% rise in volume.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["A = l × b, P = 2(l + b); diagonal √(l² + b²)", "rectangle"],
      ["A = a², P = 4a, diagonal = a√2", "square"],
      ["A = ½ × base × height; Heron: √(s(s − a)(s − b)(s − c)), s = half the perimeter", "triangle"],
      ["A = (√3/4)a²", "equilateral triangle"],
      ["A = πr², C = 2πr; sector = (θ/360)πr², arc = (θ/360)2πr", "circle and sector"],
      ["parallelogram b × h; trapezium ½(a + b)h; rhombus ½ d1 d2", "other four-sided shapes"],
      ["V = lbh, TSA = 2(lb + bh + hl), diagonal √(l² + b² + h²)", "cuboid"],
      ["V = a³, TSA = 6a², diagonal a√3", "cube"],
      ["V = πr²h, CSA = 2πrh, TSA = 2πr(r + h)", "cylinder"],
      ["V = ⅓πr²h, CSA = πrl, l = √(r² + h²)", "cone"],
      ["V = (4/3)πr³, SA = 4πr²; hemisphere V = (2/3)πr³, TSA = 3πr²", "sphere and hemisphere"],
      ["1 m³ = 1000 litres; 1 hectare = 10,000 m²", "units"],
    ] },
    points: [
      "Use π = 22/7 when the radius is a multiple of 7: the numbers cancel cleanly.",
      "Scaling every length by k scales area by k² and volume by k³.",
      "A path of width w outside an l × b plot: (l + 2w)(b + 2w) − lb. Inside: lb − (l − 2w)(b − 2w).",
      "Melting and recasting keeps the volume: number of pieces = big volume / small volume.",
      "Distance covered by a wheel = revolutions × circumference (2πr).",
      "Convert units first: 1 m² = 10,000 cm², 1 m³ = 10,00,000 cm³.",
    ],
    diagram: `flowchart TB
  C["cylinder r = ${CY.r}, h = ${CY.h}"] --> T["two circles: 2 × πr² = ${num(cyEnds)}"]
  C --> S["curved sheet: 2πr × h = ${num(cySide)}"]
  T --> A["total surface area = ${num(cyEnds + cySide)} cm²"]:::ok
  S --> A`,
    caption: "Unroll a cylinder: two circles plus a rectangle whose length is the circumference. Every surface area formula is a net like this.",
    cards: [
      card("rect", `A rectangular plot is ${RE.l} m by ${RE.b} m. Find its area, and the cost of fencing it at ${rs(RE.rate)} a metre.`, [
        `Area = ${RE.l} × ${RE.b} = ${RE.l * RE.b} m².`, `Perimeter = 2(${RE.l} + ${RE.b}) = ${2 * (RE.l + RE.b)} m.`,
        `Fencing = ${2 * (RE.l + RE.b)} × ${RE.rate} = **${rs(2 * (RE.l + RE.b) * RE.rate)}** (area **${RE.l * RE.b} m²**).`], "Fencing goes round the edge: use the perimeter, not the area."),
      card("path", `A ${PA.l} m by ${PA.b} m garden has a path ${PA.w} m wide all round it, outside. Find the area of the path.`, [
        `Outer rectangle: ${PA.l + 2 * PA.w} × ${PA.b + 2 * PA.w} = ${(PA.l + 2 * PA.w) * (PA.b + 2 * PA.w)} m².`, `Garden: ${PA.l} × ${PA.b} = ${PA.l * PA.b} m².`,
        `Path = **${num(paA)} m²**.`], `The width adds on both sides: the outer length is ${PA.l} + 2 × ${PA.w}, not ${PA.l} + ${PA.w}.`),
      card("heron", `Find the area of a triangle with sides ${HE.join(", ")} cm.`, [
        `s = (${HE.join(" + ")}) / 2 = ${heS}.`, `Area = √(${heS} × ${HE.map((x) => heS - x).join(" × ")}) = √${heA ** 2}.`, `Area = **${heA} cm²**.`]),
      card("wheel", `A wheel has radius ${WH.r} cm. How many turns does it make to cover ${WH.km} km?`, [
        `Circumference = 2 × 22/7 × ${WH.r} = ${num(whC)} cm.`, `${WH.km} km = ${num(WH.km * 100000)} cm.`, `Turns = ${num(WH.km * 100000)} / ${num(whC)} = **${num(whN)}**.`],
        "Change kilometres to centimetres before dividing."),
      card("sector", `Find the area and arc length of a sector of radius ${SE.r} cm with angle ${SE.deg}°.`, [
        `Area = (${SE.deg}/360) × 22/7 × ${SE.r}² = ${num(seA)} cm².`, `Arc = (${SE.deg}/360) × 2 × 22/7 × ${SE.r} = ${num(seL)} cm.`,
        `**Area ${num(seA)} cm², arc ${num(seL)} cm.**`]),
      card("rhombus", `A rhombus has diagonals ${RH.d1} cm and ${RH.d2} cm. Find its area and perimeter.`, [
        `Area = ½ × ${RH.d1} × ${RH.d2} = ${(RH.d1 * RH.d2) / 2} cm².`, `The diagonals bisect at right angles: side = √(${RH.d1 / 2}² + ${RH.d2 / 2}²) = ${rhSide}.`,
        `**Area ${(RH.d1 * RH.d2) / 2} cm², perimeter ${4 * rhSide} cm.**`]),
      card("scale", `Each side of a square grows by ${SQ.pct}%. By what percentage does its area grow?`, [
        `Area × ${1 + SQ.pct / 100}² = × ${num((1 + SQ.pct / 100) ** 2)}.`, `Increase = **${num(sqUp)}%**. Or ${SQ.pct} + ${SQ.pct} + ${SQ.pct}×${SQ.pct}/100.`],
        `${SQ.pct}% is wrong: area depends on the side twice.`),
      card("tank", `A tank is ${CU.l} m long, ${CU.b} m wide and ${CU.h} m deep. How many litres does it hold?`, [
        `Volume = ${CU.l} × ${CU.b} × ${CU.h} = ${cuV} m³.`, `1 m³ = 1000 litres, so **${num(cuV * 1000)} litres**.`]),
      card("cube", `A cube has a total surface area of ${CB.tsa} cm². Find its volume.`, [
        `6a² = ${CB.tsa}, so a² = ${CB.tsa / 6} and a = ${cbA}.`, `Volume = ${cbA}³ = **${cbA ** 3} cm³**.`]),
      card("cylinder", `Find the volume of a cylinder of radius ${CL.r} cm and height ${CL.h} cm.`, [
        `V = πr²h = 22/7 × ${CL.r}² × ${CL.h}.`, `V = **${num(clV)} cm³**.`]),
      card("cone", `A cone has radius ${CO.r} cm and height ${CO.h} cm. Find its slant height, curved surface area and volume.`, [
        `l = √(${CO.r}² + ${CO.h}²) = ${coL} cm.`, `CSA = πrl = ${CO.r * coL}π ≈ ${num(PI * CO.r * coL)} cm².`,
        `V = ⅓πr²h = ${(CO.r ** 2 * CO.h) / 3}π ≈ ${num((PI * CO.r ** 2 * CO.h) / 3)} cm³.`, `**l = ${coL} cm, CSA = ${CO.r * coL}π cm², V = ${(CO.r ** 2 * CO.h) / 3}π cm³.**`],
        "Curved surface uses the slant height l, the volume uses the vertical height h."),
      card("recast", `A metal sphere of radius ${SP.R} cm is melted and recast into a cylinder of radius ${SP.r} cm. How tall is the cylinder?`, [
        "Volume is kept: (4/3)πR³ = πr²h, and π cancels.", `(4/3) × ${SP.R ** 3} = ${SP.r ** 2}h, so ${num((4 / 3) * SP.R ** 3)} = ${SP.r ** 2}h.`, `h = **${num(spH)} cm**.`]),
      card("cyl-scale", "A cylinder's radius is halved and its height doubled. What happens to its volume?", [
        `V ∝ r²h: (${SC.rk})² × ${SC.hk} = ${scV}.`, `The volume is halved: **a ${num((1 - scV) * 100)}% fall**.`],
        "Radius counts twice in r²h, so halving it cannot be undone by doubling the height."),
    ],
  };
}

// ---------------------------------------------------------------- geometry
function geometry(): Chapter {
  const T1 = [48, 67], t1 = 180 - T1[0] - T1[1];
  const T2 = [2, 3, 4], t2k = 180 / T2.reduce((a, b) => a + b);
  const PG = { each: 156 }, pgN = 360 / (180 - PG.each);
  must(near((pgN - 2) * 180 / pgN, PG.each), "geometry polygon");
  const DI = 12, diN = (DI * (DI - 3)) / 2;
  must(diN === nCr(DI, 2) - DI, "geometry diagonals");
  const LA = { len: 25, h: 24, slip: 4 }, laFoot = Math.sqrt(LA.len ** 2 - LA.h ** 2), laFoot2 = Math.sqrt(LA.len ** 2 - (LA.h - LA.slip) ** 2);
  const SI = { a1: 81, a2: 144, side: 12 }, siK = Math.sqrt(SI.a2 / SI.a1), siSide = SI.side * siK;
  const CE = 110;
  const TG = { d: 13, r: 5 }, tgL = Math.sqrt(TG.d ** 2 - TG.r ** 2);
  const TI = { a: 7, b: 11 }, tiList = Array.from({ length: 40 }, (_, c) => c).filter((c) => c > 0 && c < TI.a + TI.b && TI.a < c + TI.b && TI.b < c + TI.a);
  const CD = { p: [-2, 3], q: [4, -5] }, cdD = Math.hypot(CD.q[0] - CD.p[0], CD.q[1] - CD.p[1]);
  const CA = [[1, 1], [5, 1], [3, 7]], caA = Math.abs(CA[0][0] * (CA[1][1] - CA[2][1]) + CA[1][0] * (CA[2][1] - CA[0][1]) + CA[2][0] * (CA[0][1] - CA[1][1])) / 2;
  must(near(caA, 0.5 * (CA[1][0] - CA[0][0]) * (CA[2][1] - CA[0][1])), "geometry coordinate area matches base × height");
  const EQ = 12, eqH = (Math.sqrt(3) / 2) * EQ, eqA = (Math.sqrt(3) / 4) * EQ ** 2;
  const CY = 3, cyC = 180 / (CY + 1);
  const AB = { ab: 6, ac: 9, bc: 10 }, abBD = (AB.bc * AB.ab) / (AB.ab + AB.ac);
  return {
    id: "geometry",
    play: "play-geometry",
    title: "Geometry",
    summary: "Placement geometry tests a small set of facts: angle sums, Pythagoras, similar triangles, circle properties and coordinate formulas. Draw the figure, mark what is given, and look for a right angle or a pair of similar triangles.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["straight line 180°, round a point 360°; vertically opposite angles equal", "angles at a point"],
      ["triangle sum 180°; exterior angle = sum of the two opposite interior angles", "triangles"],
      ["interior sum = (n − 2) × 180°; regular exterior angle = 360°/n", "polygons"],
      ["diagonals = n(n − 3)/2", "counting diagonals"],
      ["a² + b² = c²; triples 3-4-5, 5-12-13, 8-15-17, 7-24-25", "right triangles"],
      ["sides in ratio k → areas in ratio k²", "similar triangles"],
      ["angle at centre = 2 × angle at circumference; angle in a semicircle = 90°", "circles"],
      ["tangent ⟂ radius; tangent length = √(d² − r²)", "tangents from a point"],
      ["cyclic quadrilateral: opposite angles add to 180°", "four points on a circle"],
      ["|a − b| < c < a + b", "which third sides are possible"],
      ["distance √((x2 − x1)² + (y2 − y1)²); midpoint ((x1 + x2)/2, (y1 + y2)/2)", "coordinates"],
      ["triangle area = ½|x1(y2 − y3) + x2(y3 − y1) + x3(y1 − y2)|", "area from three points"],
    ] },
    points: [
      "Look for hidden right angles: a diameter, a tangent meeting a radius, the diagonals of a rhombus.",
      "Spot Pythagorean triples and their multiples (6-8-10, 9-12-15, 10-24-26) instead of taking square roots.",
      "30-60-90 sides are 1 : √3 : 2; 45-45-90 sides are 1 : 1 : √2.",
      "Parallel lines: alternate angles are equal, co-interior angles add to 180°.",
      "The angle bisector from A splits BC in the ratio AB : AC.",
      "Equilateral triangle of side a: height (√3/2)a, area (√3/4)a².",
    ],
    diagram: `flowchart TB
  N["polygon with n sides"] --> T["from one corner: n − 2 triangles"]
  T --> S["interior sum = (n − 2) × 180°"]:::ok
  S --> H["hexagon: 4 × 180° = 720°, each ${720 / 6}°"]:::hot`,
    caption: "Diagonals from one corner cut a polygon into n − 2 triangles, which is where the angle-sum formula comes from.",
    cards: [
      card("third-angle", `Two angles of a triangle are ${T1[0]}° and ${T1[1]}°. Find the third angle and the exterior angle next to it.`, [
        `Third = 180 − ${T1[0]} − ${T1[1]} = ${t1}°.`, `Exterior angle = 180 − ${t1} = ${180 - t1}°, which also equals ${T1[0]} + ${T1[1]}.`, `**${t1}° and ${180 - t1}°.**`]),
      card("ratio-angles", `The angles of a triangle are in the ratio ${T2.join(" : ")}. Find them.`, [
        `${T2.join(" + ")} = ${T2.reduce((a, b) => a + b)} parts make 180°, so one part = ${t2k}°.`, `**${T2.map((x) => `${x * t2k}°`).join(", ")}**.`]),
      card("polygon", `Each interior angle of a regular polygon is ${PG.each}°. How many sides does it have?`, [
        `Each exterior angle = 180 − ${PG.each} = ${180 - PG.each}°.`, `Exterior angles add to 360°: n = 360 / ${180 - PG.each} = **${pgN}**.`],
        "Work with the exterior angle; solving (n − 2)180/n directly is slower."),
      card("diagonals", `How many diagonals does a ${DI}-sided polygon have?`, [
        `n(n − 3)/2 = ${DI} × ${DI - 3} / 2 = **${diN}**.`, `Check: ${nCr(DI, 2)} pairs of corners minus ${DI} sides.`]),
      card("ladder", `A ${LA.len} m ladder reaches a window ${LA.h} m up a wall. The top then slides down ${LA.slip} m. How far does the foot move out?`, [
        `Foot before: √(${LA.len}² − ${LA.h}²) = ${laFoot} m.`, `Top now at ${LA.h - LA.slip} m: foot = √(${LA.len}² − ${LA.h - LA.slip}²) = ${laFoot2} m.`,
        `The foot moves **${laFoot2 - laFoot} m**.`], `It is not ${LA.slip} m: the ladder's length is fixed, not the sum of the two moves.`),
      card("similar", `Two similar triangles have areas ${SI.a1} cm² and ${SI.a2} cm². A side of the smaller one is ${SI.side} cm. Find the matching side of the larger.`, [
        `Area ratio ${SI.a1} : ${SI.a2}, so side ratio √${SI.a1} : √${SI.a2} = ${Math.sqrt(SI.a1)} : ${Math.sqrt(SI.a2)}.`, `Side = ${SI.side} × ${Math.sqrt(SI.a2)}/${Math.sqrt(SI.a1)} = **${num(siSide)} cm**.`],
        "Sides scale with the square root of the area ratio, not the ratio itself."),
      card("centre-angle", `An arc subtends ${CE}° at the centre of a circle. What angle does it subtend at a point on the rest of the circle?`, [
        "The angle at the centre is twice the angle at the circumference.", `**${CE / 2}°**.`]),
      card("tangent", `A point is ${TG.d} cm from the centre of a circle of radius ${TG.r} cm. How long is the tangent from the point?`, [
        "The tangent meets the radius at 90°.", `Tangent = √(${TG.d}² − ${TG.r}²) = √${TG.d ** 2 - TG.r ** 2} = **${tgL} cm**.`]),
      card("third-side", `Two sides of a triangle are ${TI.a} cm and ${TI.b} cm. How many whole-number lengths can the third side have?`, [
        `${TI.b} − ${TI.a} < c < ${TI.b} + ${TI.a}, so ${TI.b - TI.a} < c < ${TI.a + TI.b}.`, `c = ${tiList[0]}, ..., ${tiList.at(-1)}: **${tiList.length} lengths**.`],
        `Both ends are excluded: c = ${TI.b - TI.a} or ${TI.a + TI.b} gives a flat line.`),
      card("distance", `Find the distance between (${CD.p.join(", ")}) and (${CD.q.join(", ")}), and their midpoint.`, [
        `Distance = √((${CD.q[0]} − (${CD.p[0]}))² + (${CD.q[1]} − ${CD.p[1]})²) = √(${(CD.q[0] - CD.p[0]) ** 2} + ${(CD.q[1] - CD.p[1]) ** 2}) = ${cdD}.`,
        `Midpoint = (${(CD.p[0] + CD.q[0]) / 2}, ${(CD.p[1] + CD.q[1]) / 2}).`, `**Distance ${cdD}, midpoint (${(CD.p[0] + CD.q[0]) / 2}, ${(CD.p[1] + CD.q[1]) / 2}).**`]),
      card("coord-area", `Find the area of the triangle with corners (${CA.map((p) => p.join(", ")).join("), (")}).`, [
        `½|${CA[0][0]}(${CA[1][1]} − ${CA[2][1]}) + ${CA[1][0]}(${CA[2][1]} − ${CA[0][1]}) + ${CA[2][0]}(${CA[0][1]} − ${CA[1][1]})|.`,
        `= ½|${CA[0][0] * (CA[1][1] - CA[2][1])} + ${CA[1][0] * (CA[2][1] - CA[0][1])} + ${CA[2][0] * (CA[0][1] - CA[1][1])}| = **${caA} square units**.`,
        `Check: base ${CA[1][0] - CA[0][0]} on y = ${CA[0][1]}, height ${CA[2][1] - CA[0][1]}, so ½ × ${CA[1][0] - CA[0][0]} × ${CA[2][1] - CA[0][1]} = ${caA}.`]),
      card("equilateral", `An equilateral triangle has side ${EQ} cm. Find its height and area.`, [
        `Height = (√3/2) × ${EQ} = ${EQ / 2}√3 ≈ ${num(eqH)} cm.`, `Area = (√3/4) × ${EQ}² = ${EQ ** 2 / 4}√3 ≈ ${num(eqA)} cm².`,
        `**Height ${EQ / 2}√3 cm, area ${EQ ** 2 / 4}√3 cm².**`]),
      card("cyclic", `ABCD is a cyclic quadrilateral and ∠A = ${CY} × ∠C. Find ∠A.`, [
        "Opposite angles of a cyclic quadrilateral add to 180°.", `∠C + ${CY}∠C = 180, so ∠C = ${cyC}°.`, `**∠A = ${CY * cyC}°**.`]),
      card("bisector", `In triangle ABC, AB = ${AB.ab}, AC = ${AB.ac} and BC = ${AB.bc}. The bisector of angle A meets BC at D. Find BD.`, [
        `The bisector splits BC in the ratio AB : AC = ${AB.ab} : ${AB.ac}.`, `BD = ${AB.bc} × ${AB.ab} / ${AB.ab + AB.ac} = **${num(abBD)}**.`]),
    ],
  };
}

// ---------------------------------------------------------------- probability
function probability(): Chapter {
  const D6 = [1, 2, 3, 4, 5, 6];
  const pairs = D6.flatMap((a) => D6.map((b) => [a, b]));
  const count = <T,>(xs: T[], ok: (x: T) => boolean) => xs.filter(ok).length;
  const coins = (k: number) => Array.from({ length: 2 ** k }, (_, i) => i.toString(2).padStart(k, "0").split("").map((c) => (c === "1" ? "H" : "T")));
  const c2 = coins(2), c2one = count(c2, (o) => o.filter((x) => x === "H").length === 1);
  const dieOr = count(D6, (x) => x % 3 === 0 || x % 2 === 0);
  const OD = { a: 3, b: 5 };
  const s9 = count(pairs, ([a, b]) => a + b === 9), dbl = count(pairs, ([a, b]) => a === b);
  const deck = ["S", "H", "D", "C"].flatMap((s) => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map((r) => ({ s, r, red: s === "H" || s === "D" })));
  const redFace = count(deck, (c) => c.red && "JQK".includes(c.r) && c.r.length === 1);
  const qOrBlack = count(deck, (c) => c.r === "Q" || !c.red);
  must(qOrBlack === 4 + 26 - 2, "probability queen or black");
  const BAG = { red: 4, green: 5, blue: 6 }, bagN = BAG.red + BAG.green + BAG.blue;
  const c4 = coins(4), c4tail = count(c4, (o) => o.includes("T"));
  const c5 = coins(5), c5three = count(c5, (o) => o.filter((x) => x === "H").length === 3);
  must(c5three === nCr(5, 3), "probability exactly-k");
  const HIT = { a: [1, 3], b: [1, 4] };
  const pa = HIT.a[0] / HIT.a[1], pb = HIT.b[0] / HIT.b[1], hit = 1 - (1 - pa) * (1 - pb), one = pa * (1 - pb) + (1 - pa) * pb;
  must(near(hit, 1 / 2) && near(one, 5 / 12), "probability target");
  const CM = { men: 4, women: 3, k: 3 }, cmAll = nCr(CM.men + CM.women, CM.k), cmNone = nCr(CM.men, CM.k);
  const leap = count(D6.concat(7).map((s) => [s % 7, (s + 1) % 7]), ([a, b]) => a === 0 || b === 0);
  const s8 = pairs.filter(([a, b]) => a + b === 8), s8three = count(s8, ([a, b]) => a === 3 || b === 3);
  const SUMS = Array.from({ length: 11 }, (_, i) => i + 2).map((s) => [s, count(pairs, ([a, b]) => a + b === s)]);
  must(SUMS.every(([s, w]) => w === 6 - Math.abs(s - 7)), "probability dice sums formula");
  const tree = { r: 3, b: 2 }, tN = tree.r + tree.b;
  return {
    id: "probability",
    play: "play-probability",
    title: "Probability",
    summary: "Probability = favourable outcomes / total equally likely outcomes. List the outcomes for small cases (coins, dice), count with combinations for draws from a bag or a deck, and use 1 − P(none) whenever a question says \"at least one\".",
    table: { head: ["Formula", "Use it for"], rows: [
      ["P(E) = favourable / total", "any equally likely setup"],
      ["P(not E) = 1 − P(E)", "complements and \"at least one\""],
      ["P(A or B) = P(A) + P(B) − P(A and B)", "overlapping events (king or heart)"],
      ["P(A and B) = P(A) × P(B)", "independent events: separate coins, dice, people"],
      ["C(r, k) / C(n, k)", "k balls of one colour from a bag, without replacement"],
      ["odds in favour a : b → P = a/(a + b)", "odds questions"],
      ["n coins: 2^n outcomes; exactly k heads: C(n, k)/2^n", "coins"],
      ["two dice: 36 outcomes; sum s has 6 − |s − 7| ways", "dice sums"],
      ["52 cards: 4 suits of 13; 26 red; 12 face cards (J, Q, K)", "cards"],
      ["P(A given B) = P(A and B) / P(B)", "\"given that\" questions"],
    ] },
    points: [
      "Write the size of the outcome space first: 2^n for coins, 6^n for dice, C(52, k) for k cards.",
      "\"At least one\" is almost always 1 − P(none).",
      "\"Or\" adds and subtracts the overlap; \"and\" multiplies only when the events are independent.",
      "Read whether draws are with or without replacement: it changes the second fraction.",
      "Face cards are J, Q and K (12 in all); aces are not face cards.",
      "A probability is between 0 and 1. If yours is not, recheck the count.",
    ],
    diagram: `flowchart TB
  S["bag: ${tree.r} red, ${tree.b} blue, draw 2"] --> R1["first red: ${tree.r}/${tN}"]
  S --> B1["first blue: ${tree.b}/${tN}"]
  R1 --> RR["then red: ${tree.r - 1}/${tN - 1}, so RR = ${frac(tree.r * (tree.r - 1), tN * (tN - 1))}"]:::ok
  B1 --> BB["then blue: ${tree.b - 1}/${tN - 1}, so BB = ${frac(tree.b * (tree.b - 1), tN * (tN - 1))}"]:::warn
  RR --> SAME["same colour = ${frac(tree.r * (tree.r - 1) + tree.b * (tree.b - 1), tN * (tN - 1))}"]:::hot
  BB --> SAME`,
    caption: "Multiply along a branch, add across branches. The second draw has one ball fewer, so its fractions change.",
    cards: [
      card("one-head", "Two coins are tossed. What is the probability of exactly one head?", [
        `Outcomes: ${c2.map((o) => o.join("")).join(", ")} (${c2.length}).`, `Exactly one head: ${c2one} of them.`, `P = **${frac(c2one, c2.length)}**.`],
        "HT and TH are different outcomes; counting HH, HT, TT as three equally likely cases gives 1/3."),
      card("die-or", "A die is rolled. What is the probability of a multiple of 3 or an even number?", [
        `Multiples of 3: 3, 6. Even: 2, 4, 6. Together: ${D6.filter((x) => x % 3 === 0 || x % 2 === 0).join(", ")}.`, `P = ${dieOr}/6 = **${frac(dieOr, 6)}**.`],
        "6 is in both lists; count it once."),
      card("odds", `The odds in favour of an event are ${OD.a} : ${OD.b}. What is its probability?`, [
        `${OD.a} favourable for every ${OD.b} unfavourable: ${OD.a + OD.b} in all.`, `P = **${frac(OD.a, OD.a + OD.b)}**.`],
        `${OD.a}/${OD.b} is the odds, not the probability.`),
      card("two-dice", "Two dice are rolled. What is the probability that the sum is 9? That they show the same number?", [
        "There are 6 × 6 = 36 outcomes.", `Sum 9: ${pairs.filter(([x, y]) => x + y === 9).map(([x, y]) => `(${x},${y})`).join(", ")}: ${s9} ways, P = ${frac(s9, 36)}.`, `Doubles: ${dbl} ways, P = ${frac(dbl, 36)}.`,
        `**${frac(s9, 36)} and ${frac(dbl, 36)}.**`], undefined,
        { table: { head: ["Sum", "Ways out of 36"], rows: SUMS.map(([s, w]) => [String(s), String(w)]) } }),
      card("red-face", "One card is drawn from a pack of 52. What is the probability it is a red face card?", [
        "Face cards are J, Q, K; red suits are hearts and diamonds.", `${redFace} red face cards: P = ${redFace}/52 = **${frac(redFace, 52)}**.`]),
      card("queen-black", "One card is drawn from 52. What is the probability it is a queen or a black card?", [
        "P(queen) + P(black) − P(black queen).", `= 4/52 + 26/52 − 2/52 = ${qOrBlack}/52 = **${frac(qOrBlack, 52)}**.`],
        "The two black queens are in both groups. Subtract them once."),
      card("bag-one", `A bag has ${BAG.red} red, ${BAG.green} green and ${BAG.blue} blue balls. One is drawn. What is the probability it is not green?`, [
        `Not green = ${BAG.red} + ${BAG.blue} = ${BAG.red + BAG.blue} of ${bagN}.`, `P = **${frac(BAG.red + BAG.blue, bagN)}**.`]),
      card("bag-two", `From the same bag (${BAG.red} red, ${BAG.green} green, ${BAG.blue} blue), two balls are drawn together. What is the probability both are blue?`, [
        `Ways to pick 2 blue: C(${BAG.blue}, 2) = ${nCr(BAG.blue, 2)}. Ways to pick any 2: C(${bagN}, 2) = ${nCr(bagN, 2)}.`,
        `P = ${nCr(BAG.blue, 2)}/${nCr(bagN, 2)} = **${frac(nCr(BAG.blue, 2), nCr(bagN, 2))}**.`, `Same as ${BAG.blue}/${bagN} × ${BAG.blue - 1}/${bagN - 1}.`],
        `(${BAG.blue}/${bagN})² assumes the first ball goes back. Drawn together means without replacement.`),
      card("at-least-one", "Four coins are tossed. What is the probability of at least one tail?", [
        "The only outcome with no tail is HHHH: 1 of 16.", `P = 1 − 1/16 = **${frac(c4tail, c4.length)}**.`]),
      card("exactly-k", "Five coins are tossed. What is the probability of exactly three heads?", [
        `Choose which 3 coins are heads: C(5, 3) = ${c5three}.`, `P = ${c5three}/${c5.length} = **${frac(c5three, c5.length)}**.`]),
      card("target", `A hits a target with probability ${HIT.a.join("/")} and B with probability ${HIT.b.join("/")}, independently. They fire once each. What is the probability the target is hit? Hit exactly once?`, [
        `Missed by both: ${frac(HIT.a[1] - HIT.a[0], HIT.a[1])} × ${frac(HIT.b[1] - HIT.b[0], HIT.b[1])} = ${frac((HIT.a[1] - HIT.a[0]) * (HIT.b[1] - HIT.b[0]), HIT.a[1] * HIT.b[1])}, so hit = ${frac(Math.round(hit * 12), 12)}.`,
        `Exactly once: ${HIT.a.join("/")} × ${frac(HIT.b[1] - HIT.b[0], HIT.b[1])} + ${frac(HIT.a[1] - HIT.a[0], HIT.a[1])} × ${HIT.b.join("/")} = ${frac(Math.round(one * 12), 12)}.`,
        `**${frac(Math.round(hit * 12), 12)} and ${frac(Math.round(one * 12), 12)}.**`], `Adding ${HIT.a.join("/")} + ${HIT.b.join("/")} counts the case where both hit twice.`),
      card("committee", `${CM.k} people are chosen at random from ${CM.men} men and ${CM.women} women. What is the probability at least one woman is chosen?`, [
        `All choices: C(${CM.men + CM.women}, ${CM.k}) = ${cmAll}. No woman: C(${CM.men}, ${CM.k}) = ${cmNone}.`, `P = 1 − ${cmNone}/${cmAll} = **${frac(cmAll - cmNone, cmAll)}**.`]),
      card("leap", "What is the probability that a leap year has 53 Sundays?", [
        "366 days = 52 weeks + 2 days, and the 52 weeks give 52 Sundays.",
        "The 2 extra days are one of 7 pairs: Sun-Mon, Mon-Tue, ..., Sat-Sun.", `${leap} of the 7 pairs contain a Sunday: P = **${frac(leap, 7)}**.`],
        "A normal year has 1 extra day, so its answer is 1/7."),
      card("given", "Two dice are rolled and the sum is 8. What is the probability that one die shows a 3?", [
        `Sum 8: ${s8.map(([a, b]) => `(${a},${b})`).join(", ")}: ${s8.length} outcomes.`, `With a 3: ${s8three} of them.`, `P = **${frac(s8three, s8.length)}**.`],
        "\"Given\" shrinks the outcome space to the 5 cases with sum 8, not 36."),
    ],
  };
}

export const QUANT_CHAPTERS: Chapter[] = [simpleInterest(), compoundInterest(), ages(), boats(), area(), geometry(), probability()];
