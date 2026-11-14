import type { Chapter, Subject } from "./types";
import { QUANT_CHAPTERS, card, dec, fact, frac, gcd, lcm, must, nCr, near, nPr, num, only, ratio, rs, sup } from "./aptitude-quant.ts";
import { LOGIC_CHAPTERS } from "./aptitude-logic.ts";

// The first quantitative chapters. Like aptitude-quant.ts, every number is computed and every method checked at import.
function numbersChapter(): Chapter {
  const factorise = (x: number) => { const out: [number, number][] = []; for (let p = 2; p * p <= x; p++) { let a = 0; while (x % p === 0) { x /= p; a++; } if (a) out.push([p, a]); } if (x > 1) out.push([x, 1]); return out; };
  const powers = (f: [number, number][]) => f.map(([p, a]) => `${p}${sup(a)}`).join(" × ");
  const divisors = (x: number) => Array.from({ length: x }, (_, i) => i + 1).filter((d) => x % d === 0);
  const DA = 12, DB = 18, fa = factorise(DA), fb = factorise(DB);
  const shared = fa.filter(([p]) => fb.some(([q]) => q === p)).map(([p, a]) => [p, Math.min(a, fb.find(([q]) => q === p)![1])] as [number, number]);
  const every = [...new Set([...fa, ...fb].map(([p]) => p))].map((p) => [p, Math.max(fa.find(([q]) => q === p)?.[1] ?? 0, fb.find(([q]) => q === p)?.[1] ?? 0)] as [number, number]);
  const spell = (f: [number, number][]) => f.flatMap(([p, a]) => Array(a).fill(p)).join(" × ");
  must(shared.reduce((m, [p, a]) => m * p ** a, 1) === gcd(DA, DB) && every.reduce((m, [p, a]) => m * p ** a, 1) === lcm(DA, DB), "numbers diagram");
  const D9 = "52?34", d9known = [...D9].filter((c) => c !== "?").reduce((s, c) => s + +c, 0);
  const d9 = only(0, 9, (d) => Number(D9.replace("?", String(d))) % 9 === 0, "numbers div9");
  const D11 = "8?3542", d11 = only(0, 9, (d) => Number(D11.replace("?", String(d))) % 11 === 0, "numbers div11");
  const odd = [...D11].filter((_, i) => i % 2 === 0), even = [...D11].filter((_, i) => i % 2 === 1);
  const oddS = odd.filter((c) => c !== "?").reduce((s, c) => s + +c, 0), evenS = even.filter((c) => c !== "?").reduce((s, c) => s + +c, 0);
  must(oddS - (d11 + evenS) === 0 && even.includes("?"), "numbers div11 by alternating sums");
  const F = 360, ff = factorise(F), fCount = ff.reduce((m, [, a]) => m * (a + 1), 1);
  must(fCount === divisors(F).length, "numbers factor count");
  const SF = 72, sf = factorise(SF), sfSum = sf.reduce((m, [p, a]) => m * (p ** (a + 1) - 1) / (p - 1), 1);
  must(sfSum === divisors(SF).reduce((a, b) => a + b), "numbers sum of factors");
  const HL = { h: 12, l: 360, one: 72 }, hlOther = (HL.h * HL.l) / HL.one;
  must(gcd(HL.one, hlOther) === HL.h && lcm(HL.one, hlOther) === HL.l, "numbers hcf-lcm");
  const BELLS = [6, 8, 12, 15], bell = BELLS.reduce(lcm), bellAt = 9 * 60 + bell;
  const clock = (m: number) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "am" : "pm"}`;
  const SR = { by: [12, 15, 20], r: 4 }, srL = SR.by.reduce(lcm), sr = srL + SR.r;
  must(Array.from({ length: sr }, (_, i) => i + 1).find((x) => x > SR.r && SR.by.every((b) => x % b === SR.r)) === sr, "numbers smallest remainder");
  const SAME = [449, 708, 1152], diffs = [SAME[1] - SAME[0], SAME[2] - SAME[1]], same = gcd(diffs[0], diffs[1]);
  must(Array.from({ length: SAME[0] }, (_, i) => i + 2).filter((d) => SAME.every((x) => x % d === SAME[0] % d)).at(-1) === same, "numbers largest same remainder");
  const R35 = { by: 35, r: 23, d: 7 }, r35 = R35.r % R35.d;
  must(Array.from({ length: 20 }, (_, k) => (R35.by * k + R35.r) % R35.d).every((x) => x === r35), "numbers remainder of a remainder");
  const SS = { d: 7 }, ssFirst = Math.ceil(10 / SS.d) * SS.d, ssLast = Math.floor(99 / SS.d) * SS.d, ssN = (ssLast - ssFirst) / SS.d + 1, ssSum = (ssN * (ssFirst + ssLast)) / 2;
  must(ssSum === Array.from({ length: 90 }, (_, i) => i + 10).filter((x) => x % SS.d === 0).reduce((a, b) => a + b), "numbers series sum");
  const UD = { b: 7, e: 95 }, udCycle: number[] = [];
  for (let x = UD.b % 10; !udCycle.includes(x); x = (x * UD.b) % 10) udCycle.push(x);
  const udPos = UD.e % udCycle.length || udCycle.length, ud = udCycle[udPos - 1];
  must(BigInt(ud) === BigInt(UD.b) ** BigInt(UD.e) % 10n, "numbers unit digit");
  const RM = { b: 2, e: 50, m: 7 }, rmK = [1, 2, 3, 4, 5, 6].find((k) => RM.b ** k % RM.m === 1)!, rmQ = Math.floor(RM.e / rmK), rmR = RM.e % rmK, rm = RM.b ** rmR % RM.m;
  must(BigInt(rm) === BigInt(RM.b) ** BigInt(RM.e) % BigInt(RM.m), "numbers remainder");
  const Z = 100, zTerms: number[] = [];
  for (let p = 5; p <= Z; p *= 5) zTerms.push(Math.floor(Z / p));
  let big = 1n; for (let i = 2n; i <= BigInt(Z); i++) big *= i;
  must(zTerms.reduce((a, b) => a + b) === /0*$/.exec(big.toString())![0].length, "numbers trailing zeros");
  return {
    id: "numbers",
    play: "play-numbers",
    anim: "apt-euclid",
    title: "Number system",
    summary: "Divisibility, factors, HCF and LCM, remainders, unit digits and series sums. Almost every question reduces to a prime factorisation or a repeating cycle, so factorise first and look for the pattern.",
    diagram: `flowchart TB
  N1["${DA} = ${spell(fa)}"] --> H["HCF: shared primes, lowest power: ${spell(shared)} = ${gcd(DA, DB)}"]:::ok
  N2["${DB} = ${spell(fb)}"] --> H
  N1 --> L["LCM: every prime, highest power: ${every.map(([p, a]) => p ** a).join(" × ")} = ${lcm(DA, DB)}"]:::hot
  N2 --> L
  H --> P["check: ${gcd(DA, DB)} × ${lcm(DA, DB)} = ${gcd(DA, DB) * lcm(DA, DB)} = ${DA} × ${DB}"]
  L --> P`,
    caption: "Factorise once and both answers fall out. Check: HCF times LCM equals the product of the two numbers.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["n = p^a × q^b × r^c has (a + 1)(b + 1)(c + 1) factors", "number of factors"],
      ["sum of factors = (p^(a+1) − 1)/(p − 1) × (q^(b+1) − 1)/(q − 1) × ...", "sum of factors"],
      ["HCF × LCM = a × b", "two numbers only"],
      ["HCF(a, b) = HCF(b, a mod b)", "Euclid: HCF of big numbers"],
      ["3 and 9: digit sum; 4: last two digits; 8: last three; 11: odd places − even places", "divisibility tests"],
      ["(a × b) mod n = ((a mod n) × (b mod n)) mod n", "remainders of products and powers"],
      ["unit digits of powers repeat every 4 (2, 3, 7, 8), every 2 (4, 9); 0, 1, 5, 6 stay", "last digit of a power"],
      ["zeros at the end of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + ...", "trailing zeros"],
      ["LCM(a, b, ...) + r", "smallest number leaving remainder r for each divisor"],
      ["HCF of the differences", "largest divisor leaving the same remainder"],
      ["1 + 2 + ... + n = n(n + 1)/2; AP sum = terms × (first + last)/2", "series sums"],
    ] },
    points: [
      "Factorise first: factor counts, HCF, LCM and perfect squares all read straight off the prime powers.",
      "HCF × LCM = product of the two numbers (for two numbers only).",
      "For a remainder of a big power, find a small power that leaves 1, then reduce the exponent.",
      "If the divisor of a remainder divides the first divisor, reduce the first remainder directly (remainder 23 mod 35 → 23 mod 7).",
      "A number and its digit sum leave the same remainder when divided by 9.",
      "Trailing zeros of n! come from the 5s, because 2s are always more plentiful.",
    ],
    cards: [
      card("div9", `What digit must replace ? in ${D9} so the number is divisible by 9?`, [
        `Digit sum = ${[...D9].filter((c) => c !== "?").join(" + ")} + ? = ${d9known} + ?.`, `The next multiple of 9 is ${d9known + d9}, so ? = **${d9}**.`]),
      card("div11", `What digit must replace ? in ${D11} so the number is divisible by 11?`, [
        `Odd places (${odd.join(", ")}) and even places (${even.join(", ")}).`, `Odd-place sum = ${oddS}, even-place sum = ? + ${evenS}.`,
        `${oddS} − (? + ${evenS}) = ${oddS - evenS} − ? must be 0 or a multiple of 11, so ? = **${d11}**.`]),
      card("factors", `How many factors does ${F} have?`, [
        `${F} = ${powers(ff)}.`, `Count = ${ff.map(([, a]) => `(${a} + 1)`).join("")} = **${fCount}**.`],
        "Add 1 to each power before multiplying: the power 0 counts too."),
      card("sum-factors", `What is the sum of all the factors of ${SF}?`, [
        `${SF} = ${powers(sf)}.`, `Sum = ${sf.map(([p, a]) => `(${Array.from({ length: a + 1 }, (_, i) => p ** i).join(" + ")})`).join("")}.`,
        `= ${sf.map(([p, a]) => (p ** (a + 1) - 1) / (p - 1)).join(" × ")} = **${sfSum}**.`]),
      card("hcf-lcm", `Two numbers have HCF ${HL.h} and LCM ${HL.l}. One is ${HL.one}. What is the other?`, [
        `Product = HCF × LCM = ${HL.h} × ${HL.l} = ${HL.h * HL.l}.`, `Other = ${HL.h * HL.l} / ${HL.one} = **${hlOther}**.`,
        `Check: HCF(${HL.one}, ${hlOther}) = ${HL.h} and LCM = ${HL.l}.`]),
      card("bells", `Four bells ring every ${BELLS.join(", ")} minutes. They ring together at 9:00 am. When do they next ring together?`, [
        `They meet after LCM(${BELLS.join(", ")}) minutes.`, `${BELLS.map((b) => `${b} = ${powers(factorise(b))}`).join(", ")}, so LCM = ${powers(factorise(bell))} = ${bell}.`,
        `${bell} minutes after 9:00 am is **${clock(bellAt)}**.`]),
      card("smallest-rem", `What is the smallest number that leaves remainder ${SR.r} when divided by ${SR.by.join(", ")}?`, [
        `LCM(${SR.by.join(", ")}) = ${srL} is divisible by all of them.`, `Add the remainder: ${srL} + ${SR.r} = **${sr}**.`]),
      card("same-rem", `What is the largest number that divides ${SAME.join(", ")} leaving the same remainder each time?`, [
        "If all three leave the same remainder, the divisor divides every difference.", `Differences: ${SAME[1]} − ${SAME[0]} = ${diffs[0]}, ${SAME[2]} − ${SAME[1]} = ${diffs[1]}.`,
        `HCF(${diffs[0]}, ${diffs[1]}) = **${same}** (remainder ${SAME[0] % same} each time).`]),
      card("rem-35", `A number leaves remainder ${R35.r} when divided by ${R35.by}. What remainder does it leave when divided by ${R35.d}?`, [
        `The number is ${R35.by}k + ${R35.r}, and ${R35.d} divides ${R35.by}.`, `So the remainder is ${R35.r} mod ${R35.d} = **${r35}**.`],
        `This only works because ${R35.d} divides ${R35.by}. For a divisor that does not divide ${R35.by} the answer is not fixed.`),
      card("series-sum", `What is the sum of all two-digit numbers divisible by ${SS.d}?`, [
        `They run ${ssFirst}, ${ssFirst + SS.d}, ..., ${ssLast}: (${ssLast} − ${ssFirst})/${SS.d} + 1 = ${ssN} terms.`, `Sum = ${ssN} × (${ssFirst} + ${ssLast})/2 = **${ssSum}**.`]),
      card("unit-digit", `What is the last digit of ${UD.b}${sup(UD.e)}?`, [
        `Powers of ${UD.b} end in ${udCycle.join(", ")} and then repeat (cycle of ${udCycle.length}).`,
        `${UD.e} = ${udCycle.length} × ${Math.floor(UD.e / udCycle.length)} + ${UD.e % udCycle.length}, so take term ${udPos} of the cycle: **${ud}**.`],
        `When the remainder is 0, use the last term of the cycle, not the 0th.`),
      card("remainder", `What is the remainder when ${RM.b}${sup(RM.e)} is divided by ${RM.m}?`, [
        `${RM.b}${sup(rmK)} = ${RM.b ** rmK} leaves remainder 1 when divided by ${RM.m}.`,
        `${RM.b}${sup(RM.e)} = (${RM.b}${sup(rmK)})${sup(rmQ)} × ${RM.b}${sup(rmR)}, so the remainder is 1 × ${RM.b ** rmR} mod ${RM.m} = **${rm}**.`]),
      card("zeros", `How many zeros does ${Z}! end with?`, [
        "Each zero needs a factor 10 = 2 × 5, and 5s are scarcer.", `${zTerms.map((_, i) => `⌊${Z}/${5 ** (i + 1)}⌋`).join(" + ")} = ${zTerms.join(" + ")} = **${zTerms.reduce((a, b) => a + b)}**.`],
        `Stopping at ⌊${Z}/5⌋ = ${zTerms[0]} misses the extra 5 in each multiple of 25.`),
    ],
  };
}

function percentChapter(): Chapter {
  const DG = { cp: 100, up: 40, off: 25 }, dgMp = DG.cp * (1 + DG.up / 100), dgSp = dgMp * (1 - DG.off / 100);
  const net = (a: number, b: number) => a + b + (a * b) / 100;
  const PO = { part: 28, whole: 80 };
  const PM = { a: 20, b: -20 }, pm = net(PM.a, PM.b);
  must(near(100 * (1 + PM.a / 100) * (1 + PM.b / 100) - 100, pm), "percent plus-minus");
  const ML = 25, ml = (ML / (100 + ML)) * 100;
  const CO = 25, co = (CO / (100 + CO)) * 100;
  must(near((1 + CO / 100) * (1 - co / 100), 1), "percent consumption keeps spending");
  const EX = { pass: 40, got: 178, short: 22 }, exMax = (EX.got + EX.short) / (EX.pass / 100);
  const EL = { win: 58, by: 1120 }, elTotal = EL.by / ((2 * EL.win - 100) / 100);
  must(near((elTotal * EL.win) / 100 - (elTotal * (100 - EL.win)) / 100, EL.by), "percent election");
  const LO = { sp: 1080, loss: 20 }, loCp = LO.sp / (1 - LO.loss / 100);
  const BG = { buy: 4, free: 1 }, bg = (BG.free / (BG.buy + BG.free)) * 100;
  const SD = [20, 10], sd = -net(-SD[0], -SD[1]);
  const MU = { up: 40, off: 15 }, mu = ((1 + MU.up / 100) * (1 - MU.off / 100) - 1) * 100;
  const SS = { sp: 9900, x: 10 }, ssC1 = SS.sp / (1 + SS.x / 100), ssC2 = SS.sp / (1 - SS.x / 100), ssLoss = ssC1 + ssC2 - 2 * SS.sp;
  must(near((ssLoss / (ssC1 + ssC2)) * 100, SS.x ** 2 / 100), "percent same SP rule");
  const FW = { g: 900 }, fw = ((1000 - FW.g) / FW.g) * 100;
  const CS = { p: 10000, r: 10 }, csTwo = net(CS.r, CS.r), csDiff = (CS.p * (csTwo - 2 * CS.r)) / 100;
  must(near(CS.p * (1 + CS.r / 100) ** 2 - CS.p - (CS.p * CS.r * 2) / 100, csDiff), "percent ci-si");
  return {
    id: "percent",
    play: "play-percent",
    lab: "apt-percent",
    title: "Percentages, profit and loss",
    summary: "Think in multipliers: a 20% rise is × 1.2, a 15% fall is × 0.85, and successive changes multiply. Profit and loss are percentages of the cost price; discount is a percentage of the marked price.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["x% of y = x × y / 100", "basic percentage"],
      ["change % = (new − old) / old × 100", "rise or fall"],
      ["a% then b%: net = a + b + ab/100", "two changes in a row (falls are negative)"],
      ["price up r%: cut use by r/(100 + r) × 100", "keeping spending the same"],
      ["A is r% more than B: B is r/(100 + r) × 100 less than A", "flipping the base"],
      ["profit % = (SP − CP) / CP × 100", "profit and loss, always on cost"],
      ["SP = CP × (100 + P%)/100; CP = SP × 100/(100 + P%)", "finding either price"],
      ["discount % = (MP − SP) / MP × 100", "discount, always on marked price"],
      ["mark up m%, discount d%: profit = m − d − md/100", "markup then discount"],
      ["same SP, x% gain on one and x% loss on the other: loss of x²/100 %", "the classic net loss"],
      ["false weight: gain % = (true − false) / false × 100", "dishonest dealer"],
    ] },
    points: [
      "Know the fractions: 1/8 = 12.5%, 1/6 = 16.67%, 1/7 ≈ 14.29%, 1/9 ≈ 11.11%, 1/11 ≈ 9.09%, 1/12 ≈ 8.33%.",
      "Successive changes a% and b%: net change = a + b + ab/100 (use negative numbers for falls).",
      "Profit % = (SP − CP) / CP × 100. Discount is on the marked price.",
      "A rise then an equal fall always ends lower: the fall applies to the bigger amount.",
      "Buy x, get y free is a discount of y/(x + y).",
      "Two years of compound interest at R% is a successive change: R + R + R²/100.",
    ],
    diagram: `flowchart TB
  CP["cost price ${rs(DG.cp)}"] -->|"mark up ${DG.up}%: × ${dec(1 + DG.up / 100)}"| MP["marked ${rs(dgMp)}"]
  MP -->|"discount ${DG.off}%: × ${dec(1 - DG.off / 100)}"| SP["sold ${rs(dgSp)}"]
  SP --> P["profit ${num(dgSp - DG.cp)}% on cost"]:::ok`,
    caption: `Markup then discount: ${dec(1 + DG.up / 100)} × ${dec(1 - DG.off / 100)} = ${dec(dgSp / DG.cp)}.`,
    cards: [
      card("pct-of", `What percent of ${PO.whole} is ${PO.part}?`, [`${PO.part} / ${PO.whole} × 100 = **${num((PO.part / PO.whole) * 100)}%**.`]),
      card("plus-minus", `A price rises ${PM.a}% and then falls ${-PM.b}%. What is the net change?`, [
        `Net = ${PM.a} − ${-PM.b} − (${PM.a} × ${-PM.b})/100 = −${num(-pm)}.`, `**A ${num(-pm)}% fall**, because the fall applies to the larger amount.`],
        "Rises and falls of the same size do not cancel."),
      card("more-less", `A's salary is ${ML}% more than B's. By what percent is B's salary less than A's?`, [
        `Take B = 100, so A = ${100 + ML}.`, `B is ${ML} less than A: ${ML} / ${100 + ML} × 100 = **${num(ml)}%**.`],
        `${ML}% is wrong: the base changes from B to A.`),
      card("consumption", `Petrol price rises ${CO}%. By how much must you cut consumption to keep spending the same?`, [
        `Spending = price × quantity. Price × ${dec(1 + CO / 100)}, so quantity × 1/${dec(1 + CO / 100)} = ${dec(1 / (1 + CO / 100))}.`,
        `Cut by **${num(co)}%**. Shortcut: r/(100 + r) × 100 = ${CO}/${100 + CO} × 100.`]),
      card("exam", `A student needs ${EX.pass}% to pass. She scored ${EX.got} marks and failed by ${EX.short}. What are the maximum marks?`, [
        `Pass mark = ${EX.got} + ${EX.short} = ${EX.got + EX.short}, which is ${EX.pass}% of the maximum.`, `Maximum = ${EX.got + EX.short} / ${dec(EX.pass / 100)} = **${num(exMax)}**.`]),
      card("election", `In a two-candidate election the winner got ${EL.win}% of the votes and won by ${num(EL.by)}. How many votes were cast?`, [
        `The loser got ${100 - EL.win}%, so the margin is ${2 * EL.win - 100}% of the votes.`, `${2 * EL.win - 100}% = ${num(EL.by)}, so total = **${num(elTotal)}**.`,
        `Check: ${num((elTotal * EL.win) / 100)} − ${num((elTotal * (100 - EL.win)) / 100)} = ${num(EL.by)}.`]),
      card("loss", `An item sold for ${rs(LO.sp)} made a ${LO.loss}% loss. What was the cost price?`, [
        `SP = ${dec(1 - LO.loss / 100)} × CP.`, `CP = ${num(LO.sp)} / ${dec(1 - LO.loss / 100)} = **${rs(loCp)}**.`],
        `Taking ${LO.loss}% of ${num(LO.sp)} and adding it (${rs(LO.sp * (1 + LO.loss / 100))}) is wrong: the percentage is of the cost price.`),
      card("buy-get", `A shop offers "buy ${BG.buy}, get ${BG.free} free". What discount is that?`, [
        `You pay for ${BG.buy} and take ${BG.buy + BG.free}, so ${BG.free} of every ${BG.buy + BG.free} is free.`, `Discount = ${BG.free}/${BG.buy + BG.free} = **${num(bg)}%**.`],
        `${num((BG.free / BG.buy) * 100)}% divides by the ${BG.buy} you pay for; the discount is on all ${BG.buy + BG.free} you take.`),
      card("successive-discount", `Discounts of ${SD[0]}% and then ${SD[1]}% are equal to what single discount?`, [
        `Net = −${SD[0]} − ${SD[1]} + (${SD[0]} × ${SD[1]})/100 = −${num(sd)}.`, `**${num(sd)}%**, not ${SD[0] + SD[1]}%.`]),
      card("markup", `A shop marks goods ${MU.up}% above cost and then gives ${MU.off}% off. What is the profit percentage?`, [
        `${dec(1 + MU.up / 100)} × ${dec(1 - MU.off / 100)} = ${dec((1 + MU.up / 100) * (1 - MU.off / 100))}.`, `Profit = **${num(mu)}%**.`]),
      card("same-sp", `Two phones are sold for ${rs(SS.sp)} each, one at a ${SS.x}% gain and one at a ${SS.x}% loss. What is the overall result?`, [
        `Costs: ${num(SS.sp)} / ${dec(1 + SS.x / 100)} = ${num(ssC1)} and ${num(SS.sp)} / ${dec(1 - SS.x / 100)} = ${num(ssC2)}.`,
        `Total cost ${num(ssC1 + ssC2)}, total sale ${num(2 * SS.sp)}.`, `**A loss of ${rs(ssLoss)}, which is ${num(SS.x ** 2 / 100)}%** (x²/100).`],
        "It is not break-even: the loss is on the dearer phone."),
      card("false-weight", `A dealer sells at cost price but uses a ${FW.g} g weight for 1 kg. What is his gain percentage?`, [
        `He gives ${FW.g} g and charges for 1000 g: gain ${1000 - FW.g} g on ${FW.g} g.`, `Gain = ${1000 - FW.g}/${FW.g} × 100 = **${num(fw)}%**.`],
        `Dividing by 1000 (${num(((1000 - FW.g) / 1000) * 100)}%) is wrong: his cost is ${FW.g} g of goods.`),
      card("ci-si", `${rs(CS.p)} is invested at ${CS.r}% for 2 years. How much more is compound interest than simple interest?`, [
        `Compound: two successive ${CS.r}% rises = ${CS.r} + ${CS.r} + ${CS.r}×${CS.r}/100 = ${num(csTwo)}%.`, `Simple: ${2 * CS.r}%.`,
        `Difference ${num(csTwo - 2 * CS.r)}% of ${num(CS.p)} = **${rs(csDiff)}**. Same as P(R/100)²; the compound interest chapter has more.`]),
    ],
  };
}

function ratioChapter(): Chapter {
  const AL = { dear: 40, mean: 32, cheap: 0 }, alW = AL.dear - AL.mean, alM = AL.mean - AL.cheap;
  const SP = { total: 2880, parts: [3, 4, 5] }, spSum = SP.parts.reduce((a, b) => a + b);
  const CR = { ab: [2, 3], bc: [4, 5] }, crRaw = [CR.ab[0] * CR.bc[0], CR.ab[1] * CR.bc[0], CR.ab[1] * CR.bc[1]], crG = gcd(gcd(crRaw[0], crRaw[1]), crRaw[2]);
  const MP = { a: 9, b: 25 }, mp = Math.sqrt(MP.a * MP.b), FP = [4, 9, 12], fp = (FP[1] * FP[2]) / FP[0];
  const CN = { ratio: [5, 6, 8], value: [1, 0.5, 0.25], total: 210 }, cnSet = CN.ratio.reduce((s, r, i) => s + r * CN.value[i], 0), cnK = CN.total / cnSet;
  const AR = { n: 5, avg: 20, after: 18 }, arOut = AR.n * AR.avg - (AR.n - 1) * AR.after;
  const RP = { n: 8, rise: 1.5, out: 62 }, rpIn = RP.out + RP.n * RP.rise;
  const WA = [[30, 72], [20, 82]], waAvg = WA.reduce((s, [n, a]) => s + n * a, 0) / WA.reduce((s, [n]) => s + n, 0);
  const RI = { dear: 54, dearKg: 25, cheap: 42, mean: 50 }, riCheapKg = (RI.dearKg * (RI.dear - RI.mean)) / (RI.mean - RI.cheap);
  must(near((riCheapKg * RI.cheap + RI.dearKg * RI.dear) / (riCheapKg + RI.dearKg), RI.mean), "ratio rice mix");
  const RE = { v: 40, out: 8, times: 2 }; let reLeft = RE.v;
  for (let i = 0; i < RE.times; i++) reLeft -= (reLeft / RE.v) * RE.out;
  must(near(reLeft, RE.v * (1 - RE.out / RE.v) ** RE.times), "ratio replacement");
  const PS = [[6000, 12], [9000, 8]], psA = PS[0][0] * PS[0][1], psB = PS[1][0] * PS[1][1];
  const PJ = { a: 40000, b: 75000, join: 4, profit: 54000 }, pjA = PJ.a * 12, pjB = PJ.b * (12 - PJ.join), pjShareB = (PJ.profit * pjB) / (pjA + pjB);
  const AG = { times: 3, later: 12 }, agS = only(1, 100, (s) => AG.times * s + AG.later === 2 * (s + AG.later), "ratio ages");
  return {
    id: "ratio",
    play: "play-ratio",
    lab: "apt-ratio",
    title: "Ratio, averages, mixtures and partnership",
    summary: "Ratios scale, averages are totals in disguise, mixtures use alligation and partnerships share profit by capital × time. Convert to totals or parts, change them, and convert back.",
    diagram: `flowchart TB
  C["cheaper: ${rs(AL.cheap)} / L (water)"] --> M["mean: ${rs(AL.mean)} / L"]
  D["dearer: ${rs(AL.dear)} / L (milk)"] --> M
  M --> R["water : milk = (${AL.dear} − ${AL.mean}) : (${AL.mean} − ${AL.cheap}) = ${alW} : ${alM} = ${ratio(alW, alM)}"]:::ok`,
    caption: "Alligation: each ingredient's share is the distance from the other ingredient to the mean.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["share = S × a/(a + b + ...)", "splitting a sum in a ratio"],
      ["a : b and b : c → make b the same in both", "combining two ratios into a : b : c"],
      ["fourth proportional of a, b, c = bc/a; mean proportional = √(ab)", "proportion questions"],
      ["average = total / count; total = average × count", "every average question"],
      ["one person replaced, average up by d: new = old + n × d", "replacement in a group"],
      ["weighted average = (n1a1 + n2a2) / (n1 + n2)", "combining two groups"],
      ["cheaper : dearer = (dearer − mean) : (mean − cheaper)", "alligation for mixtures"],
      ["x taken out of V and replaced, n times: pure left = V(1 − x/V)^n", "repeated replacement"],
      ["profit share ∝ capital × months", "partnership"],
    ] },
    points: [
      "Average questions are total questions: multiply out, change the total, divide back.",
      "Combine ratios through the common term: 2 : 3 and 4 : 5 become 8 : 12 : 15.",
      "Alligation works for anything averaged: prices, speeds, percentages, rates of interest.",
      "Repeated replacement keeps the fraction (1 − x/V) each time, so it compounds.",
      "Partnership: a working partner's salary comes out first, then the rest is split by capital × time.",
      "Direct proportion: more items, more cost. Inverse: more workers, fewer days.",
    ],
    cards: [
      card("split", `Divide ${rs(SP.total)} among A, B and C in the ratio ${SP.parts.join(" : ")}.`, [
        `${SP.parts.join(" + ")} = ${spSum} parts, so one part = ${num(SP.total / spSum)}.`, `**${SP.parts.map((p, i) => `${"ABC"[i]} ${rs((SP.total * p) / spSum)}`).join(", ")}**.`]),
      card("combine", `A : B = ${CR.ab.join(" : ")} and B : C = ${CR.bc.join(" : ")}. Find A : B : C.`, [
        `Make B the same: multiply the first by ${CR.bc[0]} and the second by ${CR.ab[1]}.`, `A : B = ${crRaw[0]} : ${crRaw[1]}, B : C = ${crRaw[1]} : ${crRaw[2]}.`,
        `**A : B : C = ${crRaw.map((x) => x / crG).join(" : ")}**.`]),
      card("proportional", `Find the mean proportional of ${MP.a} and ${MP.b}, and the fourth proportional of ${FP.join(", ")}.`, [
        `Mean proportional = √(${MP.a} × ${MP.b}) = ${mp}.`, `Fourth proportional: ${FP[0]} : ${FP[1]} = ${FP[2]} : x, so x = ${FP[1]} × ${FP[2]} / ${FP[0]} = ${fp}.`, `**${mp} and ${fp}.**`]),
      card("coins", `A bag has ₹1, 50 paise and 25 paise coins in the ratio ${CN.ratio.join(" : ")}, worth ${rs(CN.total)} in all. How many 50 paise coins are there?`, [
        `One set of ${CN.ratio.join(" + ")} coins is worth ${CN.ratio.map((r, i) => num(r * CN.value[i])).join(" + ")} = ${rs(cnSet)}.`,
        `${num(CN.total)} / ${num(cnSet)} = ${cnK} sets.`, `50 paise coins = ${CN.ratio[1]} × ${cnK} = **${CN.ratio[1] * cnK}**.`],
        "The ratio is of coin counts, not of values. Convert to value per set first."),
      card("avg-removed", `The average of ${AR.n} numbers is ${AR.avg}. After removing one, the average of the rest is ${AR.after}. Which number was removed?`, [
        `Total before = ${AR.n} × ${AR.avg} = ${AR.n * AR.avg}; after = ${AR.n - 1} × ${AR.after} = ${(AR.n - 1) * AR.after}.`, `Removed = **${arOut}**.`]),
      card("replace-person", `The average weight of ${RP.n} people rises by ${RP.rise} kg when one of them, weighing ${RP.out} kg, is replaced by a new person. How heavy is the new person?`, [
        `The total rose by ${RP.n} × ${RP.rise} = ${num(RP.n * RP.rise)} kg.`, `New person = ${RP.out} + ${num(RP.n * RP.rise)} = **${num(rpIn)} kg**.`]),
      card("weighted", `Section A has ${WA[0][0]} students averaging ${WA[0][1]}; section B has ${WA[1][0]} averaging ${WA[1][1]}. What is the overall average?`, [
        `Total = ${WA.map(([n, a]) => `${n} × ${a}`).join(" + ")} = ${WA.reduce((s, [n, a]) => s + n * a, 0)}.`, `Average = ${WA.reduce((s, [n, a]) => s + n * a, 0)} / ${WA[0][0] + WA[1][0]} = **${num(waAvg)}**.`],
        `${num((WA[0][1] + WA[1][1]) / 2)} is wrong: the bigger section pulls the average toward its own.`),
      card("milk", `Milk costs ${rs(AL.dear)} a litre. How much water per litre of milk makes the mix worth ${rs(AL.mean)} a litre?`, [
        `Alligation: water : milk = (${AL.dear} − ${AL.mean}) : (${AL.mean} − ${AL.cheap}) = ${alW} : ${alM} = ${ratio(alW, alM)}.`, `So **${num(alW / alM)} litre of water** per litre of milk.`]),
      card("rice", `How many kg of rice at ${rs(RI.cheap)}/kg must be mixed with ${RI.dearKg} kg at ${rs(RI.dear)}/kg so the mix costs ${rs(RI.mean)}/kg?`, [
        `Cheaper : dearer = (${RI.dear} − ${RI.mean}) : (${RI.mean} − ${RI.cheap}) = ${ratio(RI.dear - RI.mean, RI.mean - RI.cheap)}.`,
        `Cheaper = ${RI.dearKg} × ${frac(RI.dear - RI.mean, RI.mean - RI.cheap)} = **${num(riCheapKg)} kg**.`]),
      card("replacement", `A ${RE.v} litre can is full of milk. ${RE.out} litres are taken out and replaced with water, and this is done ${RE.times} times in all. How much milk is left?`, [
        `Each time, milk is × (1 − ${RE.out}/${RE.v}) = × ${dec(1 - RE.out / RE.v)}.`, `Milk = ${RE.v} × ${dec(1 - RE.out / RE.v)}${sup(RE.times)} = **${num(reLeft)} litres**.`],
        `${RE.v - RE.times * RE.out} litres is wrong: the second time you remove some water too.`),
      card("partnership", `A invests ${rs(PS[0][0])} for ${PS[0][1]} months, B ${rs(PS[1][0])} for ${PS[1][1]} months. How do they share the profit?`, [
        `Shares follow capital × time: ${num(PS[0][0])} × ${PS[0][1]} = ${num(psA)} and ${num(PS[1][0])} × ${PS[1][1]} = ${num(psB)}.`, `**${ratio(psA, psB)}**.`]),
      card("partner-joins", `A starts a business with ${rs(PJ.a)}. B joins ${PJ.join} months later with ${rs(PJ.b)}. The profit at the end of the year is ${rs(PJ.profit)}. What is B's share?`, [
        `A: ${num(PJ.a)} × 12 = ${num(pjA)}. B: ${num(PJ.b)} × ${12 - PJ.join} = ${num(pjB)}.`, `Ratio ${ratio(pjA, pjB)}.`,
        `B gets ${num(PJ.profit)} × ${frac(pjB, pjA + pjB)} = **${rs(pjShareB)}**.`], `B's money works only ${12 - PJ.join} months, not 12.`),
      card("ages", `A father is ${AG.times} times as old as his son. In ${AG.later} years he will be twice as old. How old is the son now?`, [
        `Let the son be s and the father ${AG.times}s.`, `${AG.times}s + ${AG.later} = 2(s + ${AG.later}), so s = **${agS}** (father ${AG.times * agS}).`, "Problems on ages has more of these."]),
    ],
  };
}

function workChapter(): Chapter {
  const together = (...days: number[]) => { const T = days.reduce(lcm); return { T, units: days.map((d) => T / d) }; };
  const TG = together(12, 18), tg = TG.T / (TG.units[0] + TG.units[1]);
  const BA = { both: 8, a: 12 }, ba = 1 / (1 / BA.both - 1 / BA.a);
  const TH = together(10, 12, 15), th = TH.T / TH.units.reduce((a, b) => a + b);
  const EF = { k: 2, both: 14 }, efTotal = (EF.k + 1) * EF.both, efA = efTotal / EF.k;
  const LV = { a: 12, b: 18, days: 4 }, LVu = together(LV.a, LV.b), lvDone = LV.days * (LVu.units[0] + LVu.units[1]), lvMore = (LVu.T - lvDone) / LVu.units[1];
  const WG = { a: 6, b: 9, pay: 1800 }, WGu = together(WG.a, WG.b), wgA = (WG.pay * WGu.units[0]) / (WGu.units[0] + WGu.units[1]);
  const MD = { m1: 12, h1: 8, d1: 10, m2: 16, h2: 5 }, md = (MD.m1 * MD.h1 * MD.d1) / (MD.m2 * MD.h2);
  const MW = { men: 3, women: 5, days: 12, m2: 6, w2: 5 }, mwTotal = MW.men * MW.days, mwAsMen = MW.m2 + (MW.w2 * MW.men) / MW.women, mw = mwTotal / mwAsMen;
  must(near(1 / (MW.m2 / (MW.men * MW.days) + MW.w2 / (MW.women * MW.days)), mw), "work men and women");
  const LK = { fill: 10, leak: 15 }, lk = 1 / (1 / LK.fill - 1 / LK.leak);
  const LF = { fill: 6, slow: 8 }, lf = 1 / (1 / LF.fill - 1 / LF.slow);
  const P3 = { a: 20, b: 30, c: 15 }, P3u = together(P3.a, P3.b, P3.c), p3Net = P3u.units[0] + P3u.units[1] - P3u.units[2], p3 = P3u.T / p3Net;
  const AT = { a: 8, b: 12 }, ATu = together(AT.a, AT.b);
  let atLeft = ATu.T, atDays = 0;
  for (let i = 0; atLeft > 0; i++) { const u = ATu.units[i % 2]; if (u >= atLeft) { atDays += atLeft / u; atLeft = 0; } else { atLeft -= u; atDays++; } }
  const atFull = Math.floor(atDays), atCycles = Math.floor(atFull / 2), atAfter = ATu.T - atCycles * (ATu.units[0] + ATu.units[1]);
  return {
    id: "work",
    play: "play-work",
    lab: "apt-work",
    title: "Time and work, pipes and cisterns",
    summary: "The LCM trick avoids fractions: take the total work as the LCM of the individual times, find each worker's units per day, then add or subtract. Pipes are workers too: a pipe that empties is a worker with a negative rate.",
    diagram: `flowchart TB
  T["total work = LCM(12, 18) = ${TG.T} units"] --> A["A: ${TG.T} / 12 = ${TG.units[0]} units a day"]
  T --> B["B: ${TG.T} / 18 = ${TG.units[1]} units a day"]
  A --> S["together: ${TG.units[0] + TG.units[1]} units a day"]:::hot
  B --> S
  S --> D["${TG.T} / ${TG.units[0] + TG.units[1]} = ${num(tg)} days"]:::ok`,
    caption: "LCM method for A (12 days) and B (18 days) working together.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["work = rate × time; rate = 1 / days", "the base relation"],
      ["together: ab / (a + b) days", "two workers"],
      ["1/T = 1/a + 1/b + 1/c", "three or more workers"],
      ["total = LCM of the days; units a day = total / days", "the LCM method"],
      ["M1 × D1 × H1 / W1 = M2 × D2 × H2 / W2", "men, days, hours and work"],
      ["efficiency ratio a : b → time ratio b : a", "\"twice as efficient\""],
      ["net rate = 1/fill − 1/empty", "pipes and leaks"],
      ["alternate days: one cycle does 1/a + 1/b", "workers taking turns"],
      ["wages ∝ work done = rate × days worked", "sharing payment"],
    ] },
    points: [
      "Take the total work as the LCM of the times: every rate becomes a whole number of units.",
      "A worker who leaves early: first find the work done together, then the rest is done by whoever stays.",
      "Twice as efficient means half the time.",
      "Pipes that empty and leaks are negative workers.",
      "Wages are shared by work done, not by days worked.",
      "Alternate days: run whole cycles first, then finish the last part one day at a time.",
    ],
    cards: [
      card("together", "A can do a job in 12 days, B in 18. How long do they take together?", [
        `Take ${TG.T} units of work: A does ${TG.units[0]} a day, B ${TG.units[1]}.`, `Together ${TG.units[0] + TG.units[1]} a day, so ${TG.T} / ${TG.units[0] + TG.units[1]} = **${num(tg)} days**.`],
        "Averaging the days (15) is wrong: rates add, days do not."),
      card("b-alone", `A and B together take ${BA.both} days; A alone takes ${BA.a}. How long does B take alone?`, [
        `B's rate = 1/${BA.both} − 1/${BA.a} = 1/${num(ba)}.`, `**${num(ba)} days**.`]),
      card("three", "A, B and C can finish a job in 10, 12 and 15 days. How long do all three take together?", [
        `Total = LCM = ${TH.T} units; rates ${TH.units.join(", ")} a day.`, `Together ${TH.units.reduce((a, b) => a + b)} a day: ${TH.T} / ${TH.units.reduce((a, b) => a + b)} = **${num(th)} days**.`]),
      card("efficiency", `A is ${EF.k} times as efficient as B. Together they finish a job in ${EF.both} days. How long would A take alone?`, [
        `Rates ${EF.k} : 1, so together ${EF.k + 1} units a day for ${EF.both} days = ${efTotal} units.`, `A alone: ${efTotal} / ${EF.k} = **${num(efA)} days**.`]),
      card("leaves", `A and B can do a job in ${LV.a} and ${LV.b} days. They work together for ${LV.days} days, then A leaves. How many more days does B need?`, [
        `Total ${LVu.T} units; A does ${LVu.units[0]}, B ${LVu.units[1]} a day.`, `In ${LV.days} days together: ${LV.days} × ${LVu.units[0] + LVu.units[1]} = ${lvDone} units, leaving ${LVu.T - lvDone}.`,
        `B alone: ${LVu.T - lvDone} / ${LVu.units[1]} = **${num(lvMore)} days**.`]),
      card("wages", `A can finish a job in ${WG.a} days and B in ${WG.b}. Working together they are paid ${rs(WG.pay)}. What is A's share?`, [
        `Rates ${WGu.units[0]} : ${WGu.units[1]} (units of ${WGu.T}). They work the same days, so pay follows rate.`,
        `A gets ${num(WG.pay)} × ${WGu.units[0]}/${WGu.units[0] + WGu.units[1]} = **${rs(wgA)}**.`], "The faster worker earns more; do not split in the ratio of days."),
      card("men-hours", `${MD.m1} men working ${MD.h1} hours a day finish a job in ${MD.d1} days. How many days would ${MD.m2} men working ${MD.h2} hours a day take?`, [
        `Man-hours needed = ${MD.m1} × ${MD.h1} × ${MD.d1} = ${MD.m1 * MD.h1 * MD.d1}.`, `Days = ${MD.m1 * MD.h1 * MD.d1} / (${MD.m2} × ${MD.h2}) = **${num(md)} days**.`]),
      card("men-women", `${MW.men} men or ${MW.women} women can do a job in ${MW.days} days. How long will ${MW.m2} men and ${MW.w2} women take?`, [
        `${MW.women} women do the work of ${MW.men} men, so the team equals ${MW.m2} + ${MW.men} = ${mwAsMen} men.`,
        `The job is ${MW.men} × ${MW.days} = ${mwTotal} man-days: ${mwTotal} / ${mwAsMen} = **${num(mw)} days**.`]),
      card("leak", `A pipe fills a tank in ${LK.fill} hours; a leak empties it in ${LK.leak}. How long does it take to fill with the leak open?`, [
        `Net rate = 1/${LK.fill} − 1/${LK.leak} = 1/${num(lk)}.`, `**${num(lk)} hours**. Pipes that empty are just negative workers.`]),
      card("leak-found", `A pipe can fill a tank in ${LF.fill} hours, but because of a leak it takes ${LF.slow}. How long would the leak take to empty a full tank?`, [
        `Leak rate = 1/${LF.fill} − 1/${LF.slow} = 1/${num(lf)}.`, `**${num(lf)} hours**.`]),
      card("pipes-three", `Pipes A and B fill a tank in ${P3.a} and ${P3.b} minutes; pipe C empties it in ${P3.c}. With all three open, how long does the tank take to fill?`, [
        `Total ${P3u.T} units: A +${P3u.units[0]}, B +${P3u.units[1]}, C −${P3u.units[2]} a minute.`, `Net ${p3Net} a minute: ${P3u.T} / ${p3Net} = **${num(p3)} minutes**.`]),
      card("alternate", `A can do a job in ${AT.a} days and B in ${AT.b}. They work on alternate days, A first. How long does the job take?`, [
        `Total ${ATu.T} units: A ${ATu.units[0]} a day, B ${ATu.units[1]}; a 2-day cycle does ${ATu.units[0] + ATu.units[1]}.`,
        `${atCycles} cycles (${2 * atCycles} days) do ${atCycles * (ATu.units[0] + ATu.units[1])}, leaving ${atAfter}.`,
        `Then A does ${Math.min(ATu.units[0], atAfter)}${atAfter > ATu.units[0] ? `, and B finishes ${atAfter - ATu.units[0]} of his ${ATu.units[1]} in ${frac(atAfter - ATu.units[0], ATu.units[1])} day` : ""}.`, `**${num(atDays)} days**.`],
        "Do not stop at whole cycles: check whether the last day is A's or B's and whether it is a full day."),
    ],
  };
}

function speedChapter(): Chapter {
  const ms = (kmh: number) => (kmh * 5) / 18;
  const DG = { l1: 150, l2: 100, v1: 54, v2: 36 }, dgT = (DG.l1 + DG.l2) / ms(DG.v1 + DG.v2);
  const CV = { kmh: 90, ms: 15 };
  const BT = { km: 21, min: 84 }, bt = BT.km / (BT.min / 60);
  const AV = { a: 60, b: 40 }, av = (2 * AV.a * AV.b) / (AV.a + AV.b);
  must(near((2 * 120) / (120 / AV.a + 120 / AV.b), av), "speed average");
  const LE = { s1: 5, late: 6, s2: 6, early: 4 }, le = ((LE.late + LE.early) / 60) / (1 / LE.s1 - 1 / LE.s2);
  const UT = { frac: [3, 4], late: 20 }, ut = UT.late / (UT.frac[1] / UT.frac[0] - 1);
  const TP = { len: 200, kmh: 72, plat: 300 };
  const TM = { len: 180, train: 60, man: 6 }, tm = TM.len / ms(TM.train - TM.man);
  const OV = { l1: 120, l2: 160, v1: 72, v2: 54 }, ov = (OV.l1 + OV.l2) / ms(OV.v1 - OV.v2);
  const ME = { d: 360, a: 50, b: 70, start: 9 }, meT = ME.d / (ME.a + ME.b);
  const CH = { thief: 8, cop: 10, late: 10 }, chHead = (CH.thief * CH.late) / 60, chT = chHead / (CH.cop - CH.thief);
  const AM = { t1: 9, t2: 16 }, amA = Math.sqrt(AM.t2), amB = Math.sqrt(AM.t1);
  { const t = AM.t1 * amA / amB; must(near((amA * t) / amB, AM.t2), "speed after meeting"); }
  const BO = { down: 18, up: 12 };
  return {
    id: "speed",
    play: "play-speed",
    lab: "apt-speed",
    title: "Time and distance, trains and relative speed",
    summary: "Distance = speed × time. Convert km/h to m/s by multiplying by 5/18. For trains, the distance to cover is the train's length plus whatever it passes; for two moving objects, use their relative speed.",
    diagram: `flowchart TB
  A["train A: ${DG.l1} m at ${DG.v1} km/h"] --> R["opposite directions: closing speed ${DG.v1} + ${DG.v2} = ${DG.v1 + DG.v2} km/h = ${num(ms(DG.v1 + DG.v2))} m/s"]:::hot
  B["train B: ${DG.l2} m at ${DG.v2} km/h"] --> R
  R --> T["time = (${DG.l1} + ${DG.l2}) m / ${num(ms(DG.v1 + DG.v2))} m/s = ${num(dgT)} s"]:::ok`,
    caption: "Relative speed: add for opposite directions, subtract for the same direction. The distance is both lengths.",
    table: { head: ["Formula", "Use it for"], rows: [
      ["distance = speed × time", "everything"],
      ["km/h × 5/18 = m/s; m/s × 18/5 = km/h", "unit changes"],
      ["average speed = total distance / total time", "any trip"],
      ["equal distances at a and b: 2ab/(a + b)", "there and back"],
      ["same direction: a − b; opposite: a + b", "relative speed"],
      ["train passing a pole or person: length / speed", "trains, point objects"],
      ["train passing a platform or bridge: (train + platform) / speed", "trains, long objects"],
      ["two trains crossing: (L1 + L2) / relative speed", "trains passing trains"],
      ["meeting time from ends of d: d/(a + b)", "head-on starts"],
      ["after meeting, times t1 and t2 to finish: a : b = √t2 : √t1", "speeds from times after meeting"],
      ["late/early at two speeds: d = s1 s2 / (s2 − s1) × time gap", "late and early questions"],
    ] },
    points: [
      "Same direction: relative speed = difference. Opposite directions: sum.",
      "Average speed over equal distances at a and b: 2ab / (a + b), not (a + b) / 2.",
      "For the same distance, time is inversely proportional to speed: 3/4 of the speed takes 4/3 of the time.",
      "A train passing a pole or a person covers only its own length; a platform or another train adds its length.",
      "Chases: the gap closes at the difference of the speeds.",
      "Boats: downstream = boat + stream, upstream = boat − stream (see Boats and streams).",
    ],
    cards: [
      card("convert", `Convert ${CV.kmh} km/h to m/s, and ${CV.ms} m/s to km/h.`, [
        `${CV.kmh} × 5/18 = ${num(ms(CV.kmh))} m/s.`, `${CV.ms} × 18/5 = ${num((CV.ms * 18) / 5)} km/h.`, `**${num(ms(CV.kmh))} m/s and ${num((CV.ms * 18) / 5)} km/h.**`]),
      card("basic", `A cyclist covers ${BT.km} km in ${Math.floor(BT.min / 60)} hour ${BT.min % 60} minutes. What is the speed in km/h?`, [
        `${Math.floor(BT.min / 60)} h ${BT.min % 60} min = ${num(BT.min / 60)} h.`, `Speed = ${BT.km} / ${num(BT.min / 60)} = **${num(bt)} km/h**.`],
        `Writing ${Math.floor(BT.min / 60)} h ${BT.min % 60} min as 1.${BT.min % 60} h is wrong: ${BT.min % 60} minutes is ${frac(BT.min % 60, 60)} of an hour.`),
      card("avg-speed", `You drive to a city at ${AV.a} km/h and back at ${AV.b} km/h. What is your average speed?`, [
        `Equal distances, so 2 × ${AV.a} × ${AV.b} / (${AV.a} + ${AV.b}) = **${num(av)} km/h**.`],
        `${(AV.a + AV.b) / 2} km/h is wrong: you spend longer at the slower speed.`),
      card("late-early", `Walking at ${LE.s1} km/h I reach the station ${LE.late} minutes late; at ${LE.s2} km/h I am ${LE.early} minutes early. How far is the station?`, [
        `The two times differ by ${LE.late} + ${LE.early} = ${LE.late + LE.early} minutes = ${frac(LE.late + LE.early, 60)} hour.`,
        `d/${LE.s1} − d/${LE.s2} = ${frac(LE.late + LE.early, 60)}, so d/${LE.s1 * LE.s2} = ${frac(LE.late + LE.early, 60)}.`, `d = **${num(le)} km**.`]),
      card("usual-time", `Walking at ${UT.frac.join("/")} of his usual speed, a man is ${UT.late} minutes late. What is his usual time?`, [
        `Speed × ${UT.frac.join("/")} means time × ${UT.frac[1]}/${UT.frac[0]}: an extra ${frac(UT.frac[1] - UT.frac[0], UT.frac[0])} of the usual time.`,
        `${frac(UT.frac[1] - UT.frac[0], UT.frac[0])} × usual = ${UT.late}, so usual = **${num(ut)} minutes**.`]),
      card("train-pole", `A ${TP.len} m train runs at ${TP.kmh} km/h. How long does it take to pass a pole, and a ${TP.plat} m platform?`, [
        `${TP.kmh} × 5/18 = ${num(ms(TP.kmh))} m/s.`, `Pole: ${TP.len} / ${num(ms(TP.kmh))} = **${num(TP.len / ms(TP.kmh))} s**.`,
        `Platform: (${TP.len} + ${TP.plat}) / ${num(ms(TP.kmh))} = **${num((TP.len + TP.plat) / ms(TP.kmh))} s**.`]),
      card("train-man", `A ${TM.len} m train at ${TM.train} km/h passes a man running at ${TM.man} km/h in the same direction. How long does it take?`, [
        `Relative speed = ${TM.train} − ${TM.man} = ${TM.train - TM.man} km/h = ${num(ms(TM.train - TM.man))} m/s.`, `Time = ${TM.len} / ${num(ms(TM.train - TM.man))} = **${num(tm)} s**.`]),
      card("two-trains", `Trains of ${DG.l1} m and ${DG.l2} m run towards each other at ${DG.v1} and ${DG.v2} km/h. How long do they take to cross?`, [
        `Relative speed = ${DG.v1 + DG.v2} km/h = ${num(ms(DG.v1 + DG.v2))} m/s; distance = ${DG.l1} + ${DG.l2} = ${DG.l1 + DG.l2} m.`, `Time = **${num(dgT)} s**.`]),
      card("overtake", `Trains of ${OV.l1} m and ${OV.l2} m run in the same direction at ${OV.v1} and ${OV.v2} km/h. How long does the faster take to pass the slower?`, [
        `Relative speed = ${OV.v1} − ${OV.v2} = ${OV.v1 - OV.v2} km/h = ${num(ms(OV.v1 - OV.v2))} m/s.`, `Distance = ${OV.l1} + ${OV.l2} = ${OV.l1 + OV.l2} m: time = **${num(ov)} s**.`]),
      card("meet", `Two cities are ${ME.d} km apart. Cars leave each city toward the other at ${ME.start} am, at ${ME.a} and ${ME.b} km/h. When and where do they meet?`, [
        `Closing speed = ${ME.a + ME.b} km/h, so they meet after ${ME.d} / ${ME.a + ME.b} = ${num(meT)} hours.`,
        `**At ${ME.start + meT === 12 ? "12 noon" : `${ME.start + meT}:00`}, ${num(ME.a * meT)} km from the first city.**`]),
      card("chase", `A thief runs at ${CH.thief} km/h. A policeman starts ${CH.late} minutes later from the same spot at ${CH.cop} km/h. How long does he take to catch the thief?`, [
        `Head start = ${CH.thief} × ${frac(CH.late, 60)} = ${frac(CH.thief * CH.late, 60)} km.`, `The gap closes at ${CH.cop} − ${CH.thief} = ${CH.cop - CH.thief} km/h.`,
        `Time = ${frac(CH.thief * CH.late, 60)} / ${CH.cop - CH.thief} = ${frac(Math.round(chT * 60), 60)} h = **${num(chT * 60)} minutes**.`]),
      card("after-meet", `Two trains start at the same time from A and B toward each other. After they meet, they take ${AM.t1} hours and ${AM.t2} hours to reach their destinations. What is the ratio of their speeds?`, [
        "Speed of first : speed of second = √(second's time after meeting) : √(first's time).", `= √${AM.t2} : √${AM.t1} = **${amA} : ${amB}**.`],
        "The square roots are swapped: the train that takes longer after meeting is the slower one."),
      card("boat", `A boat goes ${BO.down} km/h downstream and ${BO.up} km/h upstream. Find the boat's speed and the stream's speed.`, [
        `Boat = (${BO.down} + ${BO.up})/2 = **${(BO.down + BO.up) / 2} km/h**.`, `Stream = (${BO.down} − ${BO.up})/2 = **${(BO.down - BO.up) / 2} km/h**.`, "Boats and streams has more of these."]),
    ],
  };
}

function countingChapter(): Chapter {
  const perms = <T,>(xs: T[]): T[][] => (xs.length < 2 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
  const DI = { from: 9, k: 4 }, di = nPr(DI.from, DI.k);
  const LV = "LEVEL", lv = new Set(perms([...LV]).map((p) => p.join(""))).size;
  must(lv === fact(5) / (fact(2) * fact(2)), "counting LEVEL");
  const OR = "ORANGE", vow = [...OR].filter((c) => "AEIOU".includes(c)), orv = perms([...OR]).filter((p) => { const at = p.map((c, i) => ("AEIOU".includes(c) ? i : -1)).filter((i) => i >= 0); return at.at(-1)! - at[0] === vow.length - 1; }).length;
  must(orv === fact(OR.length - vow.length + 1) * fact(vow.length), "counting vowels together");
  const NT = 6, nt = perms(Array.from({ length: NT }, (_, i) => i)).filter((p) => Math.abs(p.indexOf(0) - p.indexOf(1)) > 1).length;
  must(nt === fact(NT) - 2 * fact(NT - 1), "counting never together");
  const CM = { men: 5, women: 4 }, cm = nCr(CM.women, 2) * nCr(CM.men, 1);
  const AL = { men: 6, women: 4, k: 4 }, al = nCr(AL.men + AL.women, AL.k) - nCr(AL.men, AL.k);
  const RT = 7, rt = perms(Array.from({ length: RT - 1 }, (_, i) => i + 1)).map((p) => [0, ...p]).filter((p) => { const a = p.indexOf(1), b = p.indexOf(2); return (a - b + RT) % RT === 1 || (b - a + RT) % RT === 1; }).length;
  must(rt === fact(RT - 2) * 2, "counting round table together");
  const HS = 66, hs = only(2, 100, (n) => nCr(n, 2) === HS, "counting handshakes");
  const TR = { pts: 12, line: 5 }, tr = nCr(TR.pts, 3) - nCr(TR.line, 3);
  const ev = Array.from({ length: 900 }, (_, i) => i + 100).filter((x) => x % 2 === 0 && new Set(String(x)).size === 3).length, ev0 = 9 * 8, evOther = 4 * 8 * 8;
  must(ev === ev0 + evOther, "counting even numbers");
  const SW = { n: 8, k: 3 }; let sw = 0;
  for (let a = 0; a <= SW.n; a++) for (let b = 0; a + b <= SW.n; b++) sw++;
  must(sw === nCr(SW.n + SW.k - 1, SW.k - 1), "counting sweets");
  const coins3 = Array.from({ length: 8 }, (_, i) => i).filter((i) => i > 0).length;
  const aces = frac(4 * 3, 52 * 51);
  const ex = [1, 2, 3, 4, 5, 6].reduce((a, b) => a + b) / 6;
  return {
    id: "counting",
    play: "play-counting",
    lab: "apt-counting",
    title: "Permutation and combination",
    summary: "Permutations count ordered arrangements, combinations count selections. Ask whether order matters, handle repeats and restrictions (together, never together, at least one), and multiply independent stages.",
    diagram: `flowchart TB
  subgraph Q1["does order matter?"]
    A1["yes: arrange, nPr"]:::hot
    B1["no: select, nCr"]:::ok
  end
  subgraph Q2["repeated items?"]
    A2["divide by p! for each repeat"]:::warn
  end
  subgraph Q3["seated in a circle?"]
    A3["fix one seat: (n − 1)!"]
  end
  Q1 --> Q2
  Q2 --> Q3`,
    caption: `Ask the three questions in order, then multiply the independent stages. Choosing 3 of 5 and arranging them is C(5, 3) × 3! = ${nCr(5, 3) * fact(3)} = 5P3.`,
    table: { head: ["Formula", "Use it for"], rows: [
      ["n!", "arranging n distinct items in a row"],
      ["n! / (p! q! ...)", "arrangements with repeated items"],
      ["nPr = n! / (n − r)!", "ordered choices of r from n"],
      ["nCr = n! / (r! (n − r)!); nCr = nC(n − r)", "unordered choices of r from n"],
      ["(n − 1)!; (n − 1)!/2 if flipping looks the same", "round tables; necklaces and garlands"],
      ["treat the group as one block × its own arrangements", "\"always together\""],
      ["total − together", "\"never together\""],
      ["total − (none of the kind)", "\"at least one\""],
      ["C(n + r − 1, r − 1)", "n identical items into r groups, empty allowed"],
      ["nC2 lines, nC3 triangles from n points (no three in a line)", "geometry counting"],
      ["2^n subsets; 2^n − 1 non-empty", "any number of items chosen"],
      ["nC2", "handshakes, matches in a round robin"],
    ] },
    points: [
      "And multiplies, or adds: stage 1 then stage 2 is a product; this case or that case is a sum.",
      "\"At least one\" is easier as total minus none.",
      "Restricted positions first (the last digit of an even number, a leading digit that cannot be 0), then the rest.",
      "Together: glue the group into one block, arrange the blocks, then arrange inside the block.",
      "Points on a line: subtract the triangles or lines they cannot form.",
      "Probability of draws is a count over a count: build both with nCr.",
    ],
    cards: [
      card("digits", `How many ${DI.k}-digit numbers can be made from the digits 1 to ${DI.from} with no digit repeated?`, [
        `Order matters and nothing repeats: ${DI.from}P${DI.k}.`, `${Array.from({ length: DI.k }, (_, i) => DI.from - i).join(" × ")} = **${num(di)}**.`]),
      card("level", `How many arrangements are there of the letters of ${LV}?`, [
        "5 letters with L and E each repeated twice.", `5! / (2! × 2!) = 120 / 4 = **${lv}**.`]),
      card("vowels", `In how many arrangements of ${OR} are the vowels together?`, [
        `Vowels ${vow.join(", ")} form one block; with ${[...OR].filter((c) => !vow.includes(c)).join(", ")} that is ${OR.length - vow.length + 1} units.`,
        `${OR.length - vow.length + 1}! × ${vow.length}! = ${fact(OR.length - vow.length + 1)} × ${fact(vow.length)} = **${orv}**.`], "Do not forget the arrangements inside the block."),
      card("never", `${NT} people stand in a row. In how many ways can two particular people never stand next to each other?`, [
        `All: ${NT}! = ${fact(NT)}. Together: ${NT - 1}! × 2 = ${2 * fact(NT - 1)}.`, `Never together = ${fact(NT)} − ${2 * fact(NT - 1)} = **${nt}**.`]),
      card("committee", `From ${CM.men} men and ${CM.women} women, how many 3-person committees have exactly 2 women?`, [
        `Choose 2 women and 1 man: C(${CM.women}, 2) × C(${CM.men}, 1) = ${nCr(CM.women, 2)} × ${CM.men} = **${cm}**.`]),
      card("at-least", `A team of ${AL.k} is chosen from ${AL.men} men and ${AL.women} women. How many teams have at least one woman?`, [
        `All teams: C(${AL.men + AL.women}, ${AL.k}) = ${nCr(AL.men + AL.women, AL.k)}. All-men teams: C(${AL.men}, ${AL.k}) = ${nCr(AL.men, AL.k)}.`, `At least one woman = **${al}**.`],
        `Picking 1 woman and then any ${AL.k - 1} others counts some teams more than once.`),
      card("round", `In how many ways can ${RT} people sit round a table if two of them must sit together?`, [
        `Glue the two into one unit: ${RT - 1} units round a table = (${RT - 1} − 1)! = ${fact(RT - 2)}.`, `The pair can swap: × 2 = **${rt}**.`]),
      card("handshake", `At a party everyone shakes hands with everyone else once. There are ${HS} handshakes. How many people are there?`, [
        `Handshakes = C(n, 2) = n(n − 1)/2 = ${HS}, so n(n − 1) = ${2 * HS}.`, `${hs} × ${hs - 1} = ${2 * HS}: **${hs} people**.`]),
      card("triangles", `There are ${TR.pts} points in a plane, and exactly ${TR.line} of them lie on one line. How many triangles can they form?`, [
        `Any 3 points: C(${TR.pts}, 3) = ${nCr(TR.pts, 3)}.`, `3 points on the line make no triangle: C(${TR.line}, 3) = ${nCr(TR.line, 3)}.`, `Triangles = **${tr}**.`]),
      card("even", "How many three-digit even numbers have all different digits?", [
        `Last digit 0: the first digit has 9 choices, the middle 8: ${ev0}.`, `Last digit 2, 4, 6 or 8: the first digit has 8 choices (not 0, not the last), the middle 8: 4 × 8 × 8 = ${evOther}.`,
        `Total = **${ev}**.`], "Split on whether the last digit is 0, because 0 cannot lead."),
      card("sweets", `In how many ways can ${SW.n} identical sweets be shared among ${SW.k} children if a child may get none?`, [
        `Line up ${SW.n} sweets and ${SW.k - 1} dividers: choose the divider places, C(${SW.n + SW.k - 1}, ${SW.k - 1}).`, `= **${sw}**.`]),
      card("heads", "Three coins are tossed. What is the probability of at least one head?", [
        "There are 2³ = 8 outcomes, and only TTT has no head.", `P = 1 − 1/8 = **${frac(coins3, 8)}**.`]),
      card("aces", "Two cards are drawn without replacement. What is the probability that both are aces?", [
        `4/52 × 3/51 = ${4 * 3}/${52 * 51} = **${aces}**.`, `Same as C(4, 2)/C(52, 2) = ${nCr(4, 2)}/${nCr(52, 2)}.`],
        `With replacement it would be (4/52)² = ${frac(16, 52 * 52)}; read whether cards go back.`),
      card("expected", "What is the expected value of one roll of a fair die?", [
        `(1 + 2 + 3 + 4 + 5 + 6) / 6 = **${ex}**.`, "Expected value is a long-run average; it need not be a possible outcome."]),
    ],
  };
}

export const APTITUDE: Subject = {
  id: "aptitude",
  name: "Aptitude",
  short: "Aptitude",
  blurb: "Number system, percentages and interest, ratios and mixtures, time and work, speed and distance, counting and probability, reasoning and data interpretation. Short formulas, worked examples with fresh numbers, and an unlimited practice drill.",
  parts: [["Practice", "drill"], ["Quantitative", "numbers"], ["Reasoning and data", "reasoning"]],
  chapters: [
    {
      id: "drill",
      title: "Practice drill",
      summary: "Online tests reward speed. Use the drill below: every problem is generated with its answer computed, so you can do as many as you like. Aim for under 60 seconds each before moving to mixed tests.",
      lab: "aptitude",
      cards: [
        { id: "strategy", q: "How should you attack a timed aptitude section?", a: "- First pass: answer every question you can do in under a minute; mark the rest.\n- Second pass: the marked ones, cheapest first.\n- Use the options: plug them in, eliminate by last digit or parity, estimate.\n- Never sink three minutes into one question when each is worth the same.\n- Check for negative marking before guessing." },
      ],
    },
    numbersChapter(), percentChapter(), ratioChapter(), workChapter(), speedChapter(), countingChapter(),
    {
      id: "reasoning",
      lab: "clock",
      title: "Logical reasoning",
      summary: "Series, coding, blood relations, clocks, calendars and sets. Each type has a short method; practise until spotting the type is instant.",
      points: [
        "Clock angle between the hands at h:m = |30h − 5.5m| degrees (take 360 minus it if over 180).",
        "Odd days: a normal year shifts the weekday by 1, a leap year by 2.",
        "Two sets: |A ∪ B| = |A| + |B| − |A ∩ B|.",
      ],
      diagram: `flowchart TB
  D["D (grandfather)"] --> C["C (mother)"]
  C --> A["A (brother)"]
  C --> B["B"]`,
      caption: "Draw a family tree for blood-relation questions: generations top to bottom.",
      cards: [
        { id: "series", q: "Next term: 2, 6, 12, 20, 30, ?", a: "Differences are 4, 6, 8, 10, so the next difference is 12: **42**. Equivalently, the nth term is n(n + 1)." },
        { id: "clock", q: "Angle between the hands at 3:40?", a: "|30 × 3 − 5.5 × 40| = |90 − 220| = **130°**." },
        { id: "calendar", q: "1 January 2026 is a Thursday. What day is 1 January 2027?", a: "2026 is not a leap year, so it has 1 odd day: **Friday**." },
        { id: "blood", q: "A is B's brother. C is A's mother. D is C's father. How is B related to D?", a: "C is the mother of both A and B, and D is C's father, so B is D's **grandchild** (grandson or granddaughter: B's gender is not given)." },
        { id: "sets", q: "In a class of 50, 30 like tea, 25 like coffee and 10 like both. How many like neither?", a: "At least one = 30 + 25 − 10 = 45, so neither = **5**." },
        { id: "coding", q: "If CAT is coded 3120, how is DOG coded?", a: "Each letter becomes its alphabet position: C = 3, A = 1, T = 20. So D = 4, O = 15, G = 7: **4157**." },
      ],
    },
    {
      id: "di",
      anim: "apt-di",
      title: "Data interpretation and estimation",
      summary: "DI sets give a table or chart and several questions. Read the units and the base year first, then estimate: the options are usually far enough apart.",
      diagram: `flowchart TB
  R["read title, units, base year"] --> Q["read the question: which rows, which years?"]
  Q --> A{"options far apart?"}
  A -->|"yes"| E["estimate: round to 2 significant figures"]:::ok
  A -->|"no"| X["compute exactly, only the cells you need"]:::warn
  E --> C["pick, then sanity-check size and sign"]
  X --> C`,
      caption: "Read the frame before the numbers, and estimate unless the options are close.",
      points: [
        "Percentage growth = (new − old) / old × 100.",
        "Compare fractions by cross-multiplying instead of dividing.",
        "Round to friendly numbers early, and check whether the question asks for a value, a share or a change.",
      ],
      cards: [
        { id: "growth", q: "Sales grew from 240 to 300 units. Percentage growth?", a: "(300 − 240) / 240 = 60 / 240 = **25%**.",
          trap: "Dividing by the new value (60 / 300 = 20%) gives the fall you would need to go back, not the growth." },
        { id: "fractions", q: "Which is larger: 17/23 or 19/26?", a: "Cross-multiply: 17 × 26 = 442 and 19 × 23 = 437. Since 442 > 437, **17/23** is larger." },
        { id: "share", q: "A pie chart gives Rent 30%, Food 25%, Travel 15%, Other 30% of ₹48,000. How much more is Rent than Travel?", a: "The gap is 15% of 48,000 = **₹7,200**. Work with the percentage difference first, then convert once." },
      ],
    },
  ],
};

// One chapter per topic, in study order: numbers first, then percentages and interest, ratios, work and speed, shapes,
// counting and chance; then reasoning. Every chapter must appear here exactly once.
const ORDER = [
  "drill",
  "numbers", "percent", "si", "ci", "ratio", "ages", "work", "speed", "boats", "area", "geometry", "counting", "probability",
  "clocks", "calendar", "direction", "blood", "mirror", "seating", "venn", "syllogism", "letter-series", "number-series", "coding", "reasoning",
  "di",
];
{
  const all = new Map([...APTITUDE.chapters, ...QUANT_CHAPTERS, ...LOGIC_CHAPTERS].map((c) => [c.id, c]));
  const missing = ORDER.filter((id) => !all.has(id)), extra = [...all.keys()].filter((id) => !ORDER.includes(id));
  if (missing.length || extra.length) throw new Error(`aptitude: ORDER and the chapters differ (missing ${missing}, unplaced ${extra})`);
  APTITUDE.chapters = ORDER.map((id) => all.get(id)!);
  APTITUDE.parts = [["Practice", "drill"], ["Quantitative", "numbers"], ["Logical reasoning", "clocks"], ["Data interpretation", "di"]];
}
