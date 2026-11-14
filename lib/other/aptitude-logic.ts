// Aptitude chapters (see aptitude.ts for the order they appear in). Every number in a question or answer is computed in code,
// and every logic answer is worked out by code too (clock formulas, real calendars, coordinates, a family graph, brute force
// over seatings and over Venn models). A check that fails throws at import time, so a wrong answer can never ship.
import type { Chapter } from "./types";

/* ---------- shared helpers ---------- */
const fail = (m: string): never => { throw new Error(`aptitude-logic: ${m}`); };
const ok = (c: boolean, m: string) => { if (!c) fail(m); };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
/** p/q as a mixed number: "21 9/11", "9/11" or "21". */
export const mixed = (p: number, q: number) => {
  const g = gcd(p, q); p /= g; q /= g;
  const w = Math.trunc(p / q), r = Math.abs(p - w * q);
  return r === 0 ? `${w}` : w === 0 ? `${p < 0 ? "-" : ""}${r}/${q}` : `${w} ${r}/${q}`;
};
const steps = (...l: string[]) => l.map((s) => `- ${s}`).join("\n");
const list = (a: (string | number)[], and = "and") => (a.length < 2 ? `${a.join("")}` : `${a.slice(0, -1).join(", ")} ${and} ${a.at(-1)}`);
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** A signed number with a real minus sign, and a point. */
const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`), pt = (x: number, y: number) => `(${sg(x)}, ${sg(y)})`;

/* ---------- clocks ---------- */
/** The smaller angle between the hands at h:m (m may be fractional). */
export const handAngle = (h: number, m: number) => { const r = Math.abs(30 * (h % 12) - 5.5 * m); return r > 180 ? 360 - r : r; };
/** Minutes past h (as numerators over 11) when the hands are `deg` degrees apart, between h and h + 1. */
export const handTimes = (h: number, deg: number) => [...new Set([deg, 360 - deg].flatMap((d) => [60 * h - 2 * d, 60 * h + 2 * d]))].filter((p) => p >= 0 && p < 660).sort((a, b) => a - b);
/** Clock time from minutes after midnight, 12-hour style. */
export const clock12 = (t: number) => { t = mod(t, 1440); const h = Math.floor(t / 60) % 12 || 12, m = t % 60; return `${h}:${String(m).padStart(2, "0")} ${t < 720 ? "AM" : "PM"}`; };
/** Mirror image of a clock (mirror beside it): (11:60 − time), worked in minutes on a 12-hour dial. */
export const mirrorTime = (h: number, m: number) => { const t = mod(720 - ((h % 12) * 60 + m), 720); return `${Math.floor(t / 60) || 12}:${String(t % 60).padStart(2, "0")}`; };
const perDay = (deg: number) => { let n = 0; for (let k = 0; k < 2000; k++) for (const target of new Set([deg, mod(360 - deg, 360)])) { const t = (target + 360 * k) / 5.5; if (t < 1440) n++; } return n; };
{
  // a mirror beside the dial sends a hand at angle a (from 12, clockwise) to 360 − a: check the formula against that
  for (let t = 0; t < 720; t++) {
    const [h, m] = [Math.floor(t / 60), t % 60], [H, M] = mirrorTime(h, m).split(":").map(Number);
    ok(mod(360 - 6 * m, 360) === mod(6 * M, 360) && mod(360 - (30 * h + 0.5 * m), 360) === mod(30 * (H % 12) + 0.5 * M, 360), `mirror ${h}:${m}`);
  }
  for (const d of [0, 90, 180]) {
    const ts = Array.from({ length: 12 }, (_, h) => handTimes(h, d).map((p) => [h, p] as const)).flat();
    ok(ts.every(([h, p]) => Math.abs(handAngle(h, p / 11) - d) < 1e-9) && new Set(ts.map(([h, p]) => 60 * h + p / 11)).size === ts.length, `hand times ${d}`);
    ok(ts.length === perDay(d) / 2, `hand count ${d}`);
  }
}
const [TOGETHER, RIGHT, OPPOSITE] = [perDay(0), perDay(90), perDay(180)];
ok(TOGETHER === 22 && RIGHT === 44 && OPPOSITE === 22, "hands per day");

const ck = {
  a: [4, 20] as const, b: [10, 10] as const, mv: [3, 10, 50] as const, co: 4, op: 2, rt: 5,
  gain: { g: 4, set: 8 * 60, shows: 16 * 60 }, lose: 8, meet: 64, mir: [3, 40] as const, mir12: [12, 15] as const,
};
const ckBRaw = Math.abs(30 * ck.b[0] - 5.5 * ck.b[1]);
const ckGainTrue = ((ck.gain.shows - ck.gain.set) * 60) / (60 + ck.gain.g);
ok(Number.isInteger(ckGainTrue), "gain card");
const ckMeetGain = [1440 * (720 - 11 * ck.meet), 11 * ck.meet] as const;
ok(ckMeetGain[0] > 0, "fast clock");
const opTimes = handTimes(ck.op, 180), rtTimes = handTimes(ck.rt, 90);
ok(opTimes.length === 1 && rtTimes.length === 2, "clock card times");

const CLOCKS: Chapter = {
  id: "clocks",
  title: "Clocks",
  play: "play-clocks",
  summary: "Clock questions test how two hands move at different speeds. The minute hand turns 6° a minute and the hour hand 0.5°, so the minute hand gains 5.5° every minute: every angle and every 'when' question comes from that one number.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["minute hand = 6° per minute", "where the minute hand points (from 12)"],
    ["hour hand = 30° per hour + 0.5° per minute", "where the hour hand points (it moves between the numbers)"],
    ["angle = |30H − 5.5M|", "angle at H:M; if it is over 180°, use 360° minus it"],
    ["M = 60H / 11", "hands together between H and H + 1"],
    ["M = (60H ± 180) / 11", "hands at right angles between H and H + 1"],
    ["M = (60H ± 360) / 11", "hands opposite (180°) between H and H + 1"],
    [`hands meet every 720/11 = ${mixed(720, 11)} min`, "checking whether a clock runs fast or slow"],
    [`${TOGETHER} together, ${RIGHT} right angles, ${OPPOSITE} opposite`, "counts in one full day of 24 hours"],
    ["true time = clock minutes × 60 / (60 + g)", "a clock that gains g minutes every hour (use 60 − g if it loses)"],
    ["mirror time = 11:60 − time", "a clock seen in a mirror (use 23:60 − time for 12:xx)"],
  ] },
  points: [
    "Every 'when' question is: degrees the minute hand must gain ÷ 5.5. Multiply by 2/11 instead of dividing by 5.5.",
    `Hands meet every ${mixed(720, 11)} minutes, not every 60, because the hour hand runs ahead.`,
    "In 12 hours the hands are together 11 times, opposite 11 times and at right angles 22 times. Double for a day.",
    "If |30H − 5.5M| comes out over 180°, the question wants the smaller angle: take 360° minus it.",
    "A clock that loses or gains shows the right time again only after it is out by a full 12 hours (720 minutes).",
    "Fast or slow clock: compare clock minutes with true minutes as a ratio, then scale.",
  ],
  diagram: `flowchart TB
  M["minute hand: 6° a minute"]:::hot --> G["minute hand gains 5.5° a minute"]
  H["hour hand: 0.5° a minute"] --> G
  G --> A["angle at H:M = abs of 30H − 5.5M"]
  A --> X["4:20 → abs of 120 − 110 = 10°"]:::ok
  G --> W["when? gap to close ÷ 5.5"]
  W --> Y["together after 4: 120 ÷ 5.5 = 21 9/11 min"]:::ok`,
  caption: "Both hands start from 12. At H o'clock the hour hand is 30H degrees ahead, and the minute hand closes that gap at 5.5° a minute.",
  cards: [
    { id: "angle", q: `What is the angle between the hands at ${ck.a[0]}:${ck.a[1]}?`,
      a: steps(`Hour hand: 30 × ${ck.a[0]} + 0.5 × ${ck.a[1]} = ${30 * ck.a[0] + 0.5 * ck.a[1]}°.`, `Minute hand: 6 × ${ck.a[1]} = ${6 * ck.a[1]}°.`, `Or in one go: |30 × ${ck.a[0]} − 5.5 × ${ck.a[1]}| = **${handAngle(...ck.a)}°**.`),
      trap: `Saying ${Math.abs(30 * ck.a[0] - 6 * ck.a[1])}° forgets that the hour hand has moved past ${ck.a[0]} by ${0.5 * ck.a[1]}°.` },
    { id: "reflex", q: `What is the angle between the hands at ${ck.b[0]}:${ck.b[1]}?`,
      a: steps(`|30 × ${ck.b[0]} − 5.5 × ${ck.b[1]}| = |${30 * ck.b[0]} − ${5.5 * ck.b[1]}| = ${ckBRaw}°.`, `That is over 180°, so the smaller angle is 360 − ${ckBRaw} = **${handAngle(...ck.b)}°**.`),
      trap: `${ckBRaw}° is the reflex angle. Unless the question says reflex, give the smaller one.` },
    { id: "move", q: `Through how many degrees do the hour hand and the minute hand turn between ${ck.mv[0]}:${ck.mv[1]} and ${ck.mv[0]}:${ck.mv[2]}?`,
      a: steps(`That is ${ck.mv[2] - ck.mv[1]} minutes.`, `Hour hand: ${ck.mv[2] - ck.mv[1]} × 0.5 = **${(ck.mv[2] - ck.mv[1]) * 0.5}°**.`, `Minute hand: ${ck.mv[2] - ck.mv[1]} × 6 = **${(ck.mv[2] - ck.mv[1]) * 6}°**.`) },
    { id: "together", q: `At what time between ${ck.co} and ${ck.co + 1} o'clock are the hands together?`,
      a: steps(`At ${ck.co}:00 the hour hand is ${30 * ck.co}° ahead.`, `The minute hand gains 5.5° a minute, so it needs ${30 * ck.co} ÷ 5.5 = ${60 * ck.co}/11 minutes.`, `Answer: **${mixed(60 * ck.co, 11)} minutes past ${ck.co}**.`),
      trap: `${5 * ck.co} minutes past is wrong: by then the hour hand has moved on by ${2.5 * ck.co}°.` },
    { id: "opposite", q: `At what time between ${ck.op} and ${ck.op + 1} o'clock are the hands exactly opposite each other?`,
      a: steps(`At ${ck.op}:00 the minute hand is ${30 * ck.op}° behind. To be opposite it must end up 180° ahead.`, `Gap to gain: ${30 * ck.op} + 180 = ${30 * ck.op + 180}°.`, `Time: ${30 * ck.op + 180} × 2/11 = ${opTimes[0]}/11 minutes.`, `Answer: **${mixed(opTimes[0], 11)} minutes past ${ck.op}**.`) },
    { id: "right", q: `At what times between ${ck.rt} and ${ck.rt + 1} o'clock are the hands at right angles?`,
      a: steps(`At ${ck.rt}:00 the gap is ${30 * ck.rt}°. Right angles happen when the gap is 90° (minute hand still behind) and again when the minute hand is 90° ahead.`,
        `Gain ${30 * ck.rt} − 90 = ${30 * ck.rt - 90}°: ${30 * ck.rt - 90} × 2/11 = ${mixed(rtTimes[0], 11)} min.`,
        `Gain ${30 * ck.rt} + 90 = ${30 * ck.rt + 90}°: ${30 * ck.rt + 90} × 2/11 = ${mixed(rtTimes[1], 11)} min.`,
        `Answer: **${mixed(rtTimes[0], 11)} and ${mixed(rtTimes[1], 11)} minutes past ${ck.rt}**.`),
      trap: "Most hours have two right-angle times. Giving only one loses the mark." },
    { id: "per-day", q: "How many times in a day are the hands together, at right angles, and opposite?",
      a: steps("The minute hand laps the hour hand once every 720/11 minutes, which is 11 times in 12 hours.", `Together: 11 in 12 hours, so **${TOGETHER}** a day.`, `Opposite: also 11 in 12 hours, so **${OPPOSITE}** a day.`, `Right angles: twice per lap, so 22 in 12 hours and **${RIGHT}** a day.`),
      trap: "24 is the tempting answer for 'together'. Between 11 and 1 the hands meet only once, at 12." },
    { id: "gap", q: "A correct clock's hands are together at 12:00. After how many minutes are they together again?",
      a: steps("The minute hand must gain a full 360° on the hour hand.", `360 ÷ 5.5 = 720/11 = **${mixed(720, 11)} minutes**.`) },
    { id: "gain", q: `A clock gains ${ck.gain.g} minutes every hour. It is set right at ${clock12(ck.gain.set)}. What is the true time when it shows ${clock12(ck.gain.shows)}?`,
      a: steps(`The clock moves ${60 + ck.gain.g} minutes for every 60 true minutes.`, `It has shown ${ck.gain.shows - ck.gain.set} minutes pass.`, `True minutes = ${ck.gain.shows - ck.gain.set} × 60 / ${60 + ck.gain.g} = ${ckGainTrue}.`, `True time: **${clock12(ck.gain.set + ckGainTrue)}**.`),
      trap: `Subtracting ${ck.gain.g} minutes for each clock hour (${clock12(ck.gain.shows - ck.gain.g * (ck.gain.shows - ck.gain.set) / 60)}) uses clock hours where true hours are needed.` },
    { id: "right-again", q: `A clock loses ${ck.lose} minutes a day. It is set right now. After how many days will it next show the correct time?`,
      a: steps("A 12-hour dial shows the right time again once it is behind by exactly 12 hours.", "12 hours = 720 minutes.", `720 ÷ ${ck.lose} = **${720 / ck.lose} days**.`) },
    { id: "meet", q: `The hands of a faulty clock meet every ${ck.meet} minutes of true time. How many minutes a day does it gain or lose?`,
      a: steps(`In a correct clock they meet every ${mixed(720, 11)} minutes. Meeting sooner means this clock runs fast: it gains.`,
        `In ${ck.meet} true minutes it shows 720/11 minutes.`, `In 1440 true minutes it shows 1440 × (720/11) ÷ ${ck.meet} minutes.`,
        `Gain = 1440 × (720/11 − ${ck.meet}) ÷ ${ck.meet} = **${mixed(...ckMeetGain)} minutes a day**.`),
      trap: "Meeting more often looks like 'slow' at first sight. Faster hands lap sooner, so the clock is fast." },
    { id: "mirror", q: `A clock seen in a mirror shows ${ck.mir[0]}:${ck.mir[1]}. What is the real time? What does the mirror show at ${ck.mir12[0]}:${ck.mir12[1]}?`,
      a: steps(`Subtract from 11:60: 11:60 − ${ck.mir[0]}:${ck.mir[1]} = **${mirrorTime(...ck.mir)}**. The rule works both ways.`,
        `${ck.mir12[0]}:${ck.mir12[1]} is past 11:60, so subtract from 23:60: 23:60 − ${ck.mir12[0]}:${ck.mir12[1]} = **${mirrorTime(...ck.mir12)}**.`) },
  ],
};

/* ---------- calendar ---------- */
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
export const dow = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
export const dayName = (y: number, m: number, d: number) => DAYS[dow(y, m, d)];
export const mlen = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const ord = (n: number) => `${n}${[11, 12, 13].includes(n % 100) ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const dmy = (y: number, m: number, d: number) => `${d} ${MON[m - 1]} ${y}`;
/** The odd-days method, step by step, checked against the real calendar. */
export function oddDays(y: number, m: number, d: number): { rows: string[][]; total: number } {
  const done = y - 1, four = Math.floor(done / 400) * 400, cent = Math.floor((done % 400) / 100), rest = done % 100, leaps = Math.floor(rest / 4);
  const centOdd = [0, 5, 3, 1][cent], restOdd = mod(rest + leaps, 7);
  const mons = Array.from({ length: m - 1 }, (_, i) => mlen(y, i + 1)), monDays = mons.reduce((a, b) => a + b, 0) + d, monOdd = mod(monDays, 7);
  const total = centOdd + restOdd + monOdd;
  ok(mod(total, 7) === dow(y, m, d), `odd days ${y}-${m}-${d}`);
  const rows = [
    [`first ${four} years`, "0 (every 400 years is 0)"],
    ...(cent ? [[`next ${cent * 100} years`, `${centOdd}`]] : []),
    [`next ${rest} years (${leaps} leap)`, `${rest} + ${leaps} = ${rest + leaps}, so ${restOdd}`],
    [m > 1 ? `1 January to ${d} ${MON[m - 1]}` : `${d} days of January`, `${monDays} days, so ${monOdd}`],
    ["total", `${total}, so ${mod(total, 7)}: ${DAYS[mod(total, 7)]}`],
  ];
  return { rows, total };
}
/** Odd days in n complete years starting after a 400-year block. */
export const centuryOdd = (n: number) => { let days = 0; for (let y = 2001; y <= 2000 + n; y++) days += isLeap(y) ? 366 : 365; return mod(days, 7); };
export const sameCalendar = (y: number) => { for (let z = y + 1; ; z++) if (dow(z, 1, 1) === dow(y, 1, 1) && isLeap(z) === isLeap(y)) return z; };
const cal = {
  leapYears: [1900, 2000, 2024, 2100, 2400], after: [3, 100] as const, rel: 4,
  walk: [2025, 3, 10, 10, 25] as const, next: [2025, 8, 15] as const, cross: [2023, 3, 1] as const,
  od: [1950, 1, 26] as const, od2: [2047, 8, 15] as const, rep: 2026, repLeap: 2024, y53: 2027,
  month: { len: 31, first: 3 },
};
ok(dayName(...cal.od) === "Thursday", "known date");
const relToday = mod(cal.rel + 2, 7), relTarget = mod(relToday + 1 + 3, 7);
const walkParts = (() => {
  const [y, m1, d1, m2, d2] = cal.walk, parts: [string, number][] = [[`${MON[m1 - 1]} (after the ${ord(d1)})`, mlen(y, m1) - d1]];
  for (let m = m1 + 1; m < m2; m++) parts.push([MON[m - 1], mlen(y, m)]);
  parts.push([`${MON[m2 - 1]} (up to the ${ord(d2)})`, d2]);
  const n = parts.reduce((a, [, x]) => a + x, 0);
  ok(mod(dow(y, m1, d1) + n, 7) === dow(y, m2, d2), "walk");
  return { parts, n };
})();
const repRows = (y: number, to: number) => { const rows: string[][] = []; let run = 0; for (let z = y; z < to; z++) { run += isLeap(z) ? 2 : 1; rows.push([`${z}`, isLeap(z) ? "2 (leap)" : "1", `${run}`]); } ok(run % 7 === 0, "repeat"); return rows; };
const count53 = (y: number) => { const c = Array(7).fill(0), d0 = dow(y, 1, 1); for (let i = 0; i < (isLeap(y) ? 366 : 365); i++) c[mod(d0 + i, 7)]++; return [0, 1, 2, 3, 4, 5, 6].map((i) => mod(d0 + i, 7)).filter((i) => c[i] === 53).map((i) => DAYS[i]); };
const centEnds = [100, 200, 300, 400].map((n) => DAYS[dow(2000 + n, 12, 31)]);
ok(centEnds.join() === [5, 3, 1, 0].map((o) => DAYS[mod(dow(2000, 12, 31) + o, 7)]).join() && dow(2000, 12, 31) === 0, "century ends");
const never = DAYS.filter((d) => !centEnds.includes(d));
const monthFive = Array.from({ length: cal.month.len - 28 }, (_, i) => DAYS[mod(cal.month.first + i, 7)]);
const lastFri = Array.from({ length: cal.month.len }, (_, i) => i + 1).filter((d) => mod(cal.month.first + d - 1, 7) === 5).at(-1)!;
const nextShift = mod(dow(cal.next[0] + 1, cal.next[1], cal.next[2]) - dow(...cal.next), 7), crossShift = mod(dow(cal.cross[0] + 1, cal.cross[1], cal.cross[2]) - dow(...cal.cross), 7);
ok(nextShift === 1 && crossShift === 2, "year shifts");
const od1 = oddDays(...cal.od), od2 = oddDays(...cal.od2);
const repY = sameCalendar(cal.rep), repL = sameCalendar(cal.repLeap);

const CALENDAR: Chapter = {
  id: "calendar",
  title: "Calendar",
  play: "play-calendar",
  summary: "Calendar questions ask for the day of the week of some date. Only the remainder of the days after dividing by 7 matters: these are the odd days, and adding them up moves the weekday forward.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["odd days = number of days mod 7", "how far the weekday moves"],
    ["normal year = 365 days = 1 odd day", "same date next year moves 1 day on"],
    ["leap year = 366 days = 2 odd days", "same date moves 2 days if 29 February falls in between"],
    ["leap if divisible by 4; a century year only if divisible by 400", "1900 and 2100 are not leap, 2000 is"],
    [`100 years = ${centuryOdd(100)}, 200 = ${centuryOdd(200)}, 300 = ${centuryOdd(300)}, 400 = ${centuryOdd(400)} odd days`, "skipping whole centuries"],
    ["31-day month = 3, 30-day month = 2, February = 0 or 1", "adding up months inside a year"],
    ["0 Sunday, 1 Monday, 2 Tuesday, ..., 6 Saturday", "turning the total into a day"],
    [`last day of a century: only ${list(centEnds.slice().sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)), "or")}`, "'which day can a century never end on'"],
    ["a calendar repeats when the odd days add to a multiple of 7 and the leap status matches", "years with the same calendar"],
  ] },
  points: [
    "Work with remainders all the way: 100 days later is 100 mod 7 = 2 days later.",
    "Same date one year later: +1 day, or +2 if 29 February sits between the two dates.",
    "For any date, add odd days for complete centuries, then complete years, then months, then days.",
    "A normal year that starts on a day ends on the same day, so that day occurs 53 times. A leap year adds the next day too.",
    "A leap year's calendar usually repeats after 28 years. A normal year's repeats after 6 or 11 years.",
    "'The day after tomorrow' and 'the day before yesterday' are just +2 and −2 from today.",
  ],
  diagram: `flowchart TB
  D["date: 26 January 1950"] --> C["1600 years: 0 odd days"]
  D --> E["300 more years: 1"]
  C --> Y["49 years with 12 leap: 61, so 5"]
  E --> Y
  Y --> M["26 days of January: 5"]
  M --> T["0 + 1 + 5 + 5 = 11, so 4"]
  T --> R["4 = Thursday"]:::ok`,
  caption: "The odd-days method: count complete centuries, then complete years, then months and days, and keep only the remainder after 7.",
  cards: [
    { id: "odd-year", q: "How many odd days are in a normal year and in a leap year?",
      a: steps(`365 = 7 × ${Math.floor(365 / 7)} + ${365 % 7}, so a normal year has **${365 % 7} odd day**.`, `366 = 7 × ${Math.floor(366 / 7)} + ${366 % 7}, so a leap year has **${366 % 7} odd days**.`) },
    { id: "leap", q: `Which of these are leap years: ${list(cal.leapYears)}?`,
      a: steps("Divisible by 4 is leap, except century years, which must be divisible by 400.", ...cal.leapYears.map((y) => `${y}: ${isLeap(y) ? "leap" : "not leap"}${y % 100 === 0 ? (isLeap(y) ? " (divisible by 400)" : " (century, not divisible by 400)") : ""}.`),
        `Answer: **${list(cal.leapYears.filter(isLeap))}**.`),
      trap: "1900 and 2100 divide by 4 but are not leap years." },
    { id: "after", q: `Today is ${DAYS[cal.after[0]]}. What day will it be after ${cal.after[1]} days?`,
      a: steps(`${cal.after[1]} = 7 × ${Math.floor(cal.after[1] / 7)} + ${cal.after[1] % 7}. Whole weeks change nothing.`, `${DAYS[cal.after[0]]} + ${cal.after[1] % 7} = **${DAYS[mod(cal.after[0] + cal.after[1], 7)]}**.`) },
    { id: "relative", q: `The day before yesterday was ${DAYS[cal.rel]}. What day will it be three days after tomorrow?`,
      a: steps(`Today = ${DAYS[cal.rel]} + 2 = ${DAYS[relToday]}.`, `Tomorrow = ${DAYS[mod(relToday + 1, 7)]}, and three days after that is today + 4.`, `Answer: **${DAYS[relTarget]}**.`) },
    { id: "same-year", q: `${dmy(cal.walk[0], cal.walk[1], cal.walk[2])} is a ${dayName(cal.walk[0], cal.walk[1], cal.walk[2])}. What day is ${dmy(cal.walk[0], cal.walk[3], cal.walk[4])}?`,
      a: steps(...walkParts.parts.map(([n, x]) => `${n}: ${x} days, odd ${x % 7}.`), `Total ${walkParts.n} days, and ${walkParts.n} mod 7 = ${walkParts.n % 7}.`,
        `${dayName(cal.walk[0], cal.walk[1], cal.walk[2])} + ${walkParts.n % 7} = **${dayName(cal.walk[0], cal.walk[3], cal.walk[4])}**.`) },
    { id: "next-year", q: `${dmy(...cal.next)} was a ${dayName(...cal.next)}. What day is ${dmy(cal.next[0] + 1, cal.next[1], cal.next[2])}? And if ${dmy(...cal.cross)} was a ${dayName(...cal.cross)}, what day was ${dmy(cal.cross[0] + 1, cal.cross[1], cal.cross[2])}?`,
      a: steps(`No 29 February between the first pair, so move 1 day: **${dayName(cal.next[0] + 1, cal.next[1], cal.next[2])}**.`, `29 February ${cal.cross[0] + 1} falls between the second pair, so move 2 days: **${dayName(cal.cross[0] + 1, cal.cross[1], cal.cross[2])}**.`),
      trap: `What matters is whether 29 February lies between the two dates, not whether the starting year is a leap year. ${cal.cross[0] + 1} is leap, and its 1 March is the date that moves by 2.` },
    { id: "century", q: "How many odd days are in 100, 200, 300 and 400 years?",
      a: steps("100 years have 24 leap years (the century year is not one): 100 + 24 = 124 odd days, and 124 mod 7 = 5.", `200 years: 2 × 5 = 10, so ${centuryOdd(200)}. 300 years: 15, so ${centuryOdd(300)}.`, "400 years: 4 × 5 + 1 (the 400th year is leap) = 21, so 0.",
        `Answer: **${centuryOdd(100)}, ${centuryOdd(200)}, ${centuryOdd(300)} and ${centuryOdd(400)}**.`) },
    { id: "century-end", q: "On which days of the week can the last day of a century never fall?",
      a: steps(`The last day of 100, 200, 300 and 400 years falls ${[5, 3, 1, 0].join(", ")} odd days after a Sunday base.`, `That gives ${list(centEnds)}.`, `So it can never be **${list(never, "or")}**.`) },
    { id: "odd-method", q: `What day of the week was ${dmy(...cal.od)}?`, table: { head: ["Part", "Odd days"], rows: od1.rows },
      a: steps(`Count complete years: ${cal.od[0] - 1}. Split them into 1600, then 300, then ${(cal.od[0] - 1) % 100}.`, "Add the odd days of each part, then the days of this year so far.",
        `Total ${od1.total}, and ${od1.total} mod 7 = ${mod(od1.total, 7)}: **${dayName(...cal.od)}**.`),
      trap: `Count the complete years before the date (${cal.od[0] - 1}), not ${cal.od[0]}.` },
    { id: "odd-method-2", q: `What day of the week will ${dmy(...cal.od2)} be?`, table: { head: ["Part", "Odd days"], rows: od2.rows },
      a: steps(`Complete years: ${cal.od2[0] - 1} = 2000 + ${cal.od2[0] - 1 - 2000}. 2000 years are 5 blocks of 400, so 0 odd days.`, ...od2.rows.slice(1, -1).map(([p, o]) => `${p}: ${o}.`),
        `Total ${od2.total}, so ${mod(od2.total, 7)}: **${dayName(...cal.od2)}**.`) },
    { id: "repeat", q: `Which is the next year with exactly the same calendar as ${cal.rep}?`, table: { head: ["Year", "Odd days", "Running total"], rows: repRows(cal.rep, repY) },
      a: steps(`${cal.rep} is not a leap year, so we need a later normal year that starts on the same day.`, "Add each year's odd days until the running total is a multiple of 7.",
        `The total reaches ${repRows(cal.rep, repY).at(-1)![2]} at the end of ${repY - 1}, and ${repY} is not leap: **${repY}**.`),
      trap: "Stopping at the first multiple of 7 is not enough if that year's leap status differs." },
    { id: "repeat-leap", q: `Which is the next year with the same calendar as ${cal.repLeap}?`,
      a: steps(`${cal.repLeap} is a leap year, so the next match must also be leap and start on the same day.`, "Leap years come every 4 years and each 4-year block has 5 odd days. 5 × 7 = 35, so 7 blocks = 28 years bring the total to a multiple of 7.",
        `Answer: **${repL}** (no century year in between).`) },
    { id: "fifty-three", q: `${cal.y53} starts on a ${dayName(cal.y53, 1, 1)}. Which day occurs 53 times in ${cal.y53}? Which days occur 53 times in ${cal.y53 + 1}, a leap year?`,
      a: steps("A year is 52 full weeks plus its odd days, and the odd days are the first days of the year.", `${cal.y53}: 1 odd day, so **${list(count53(cal.y53))}**.`, `${cal.y53 + 1} starts on ${dayName(cal.y53 + 1, 1, 1)} and has 2 odd days: **${list(count53(cal.y53 + 1))}**.`) },
    { id: "month", q: `A month of ${cal.month.len} days starts on a ${DAYS[cal.month.first]}. Which days occur five times, and what is the date of the last Friday?`,
      a: steps(`${cal.month.len} = 28 + ${cal.month.len - 28}: four full weeks plus ${cal.month.len - 28} extra days, which are the first ${cal.month.len - 28} days of the month.`, `Five times: **${list(monthFive)}**.`,
        `Fridays fall on ${Array.from({ length: cal.month.len }, (_, i) => i + 1).filter((d) => mod(cal.month.first + d - 1, 7) === 5).join(", ")}, so the last is the **${ord(lastFri)}**.`) },
  ],
};

/* ---------- direction sense ---------- */
// Bearings in degrees clockwise from north. x grows to the east, y to the north.
export const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
export const bearing = (name: string) => COMPASS.indexOf(name) * 45;
export const named = (deg: number) => COMPASS[mod(deg, 360) / 45];
const TURN = { none: 0, right: 90, left: -90, back: 180 } as const;
type Leg = [turn: keyof typeof TURN, km: number];
/** Walk legs from (0, 0): each leg turns first, then walks. Returns the end point and the final facing. */
export function walk(face: string, legs: Leg[]) {
  let f = bearing(face), x = 0, y = 0;
  for (const [t, km] of legs) { f = mod(f + TURN[t], 360); x += Math.round(Math.sin((f * Math.PI) / 180)) * km; y += Math.round(Math.cos((f * Math.PI) / 180)) * km; }
  return { x, y, face: named(f), dist: Math.hypot(x, y) };
}
/** Direction of a point from the origin, exam style: "north-east" means some east and some north. */
export const towards = (x: number, y: number) => [y > 0 ? "north" : y < 0 ? "south" : "", x > 0 ? "east" : x < 0 ? "west" : ""].filter(Boolean).join("-");
const legText = (face: string, legs: Leg[]) => legs.map(([t, km], i) => (i === 0 ? `walks ${km} km ${face}` : `turns ${t} and walks ${km} km`)).join(", then ");
const parts = (x: number, y: number) => [x && `${Math.abs(x)} km ${x > 0 ? "east" : "west"}`, y && `${Math.abs(y)} km ${y > 0 ? "north" : "south"}`].filter(Boolean).join(" and ");
const shadowFacing = (time: "morning" | "evening", side: "right" | "left" | "behind" | "front") => named((time === "morning" ? 270 : 90) - { right: 90, left: -90, behind: 180, front: 0 }[side]);

const dr = {
  turns: ["right", "right", "left"] as const,
  deg: { from: "south-west", cw: 135, acw: 270 },
  p1: ["north", [["none", 6], ["right", 8]]] as [string, Leg[]],
  p2: ["east", [["none", 10], ["left", 5], ["left", 10]]] as [string, Leg[]],
  p3: ["east", [["none", 5], ["left", 8], ["right", 4], ["left", 4]]] as [string, Leg[]],
  p4: ["west", [["none", 15], ["left", 5], ["left", 3]]] as [string, Leg[]],
  a: ["north", [["none", 5], ["right", 12]]] as [string, Leg[]], b: ["south", [["none", 3], ["left", 6]]] as [string, Leg[]],
  rot: ["north-east", "west", "south"] as const,
};
const drTurn = dr.turns.reduce((f, t) => mod(f + TURN[t], 360), 0);
const drDeg = named(bearing(dr.deg.from) + dr.deg.cw - dr.deg.acw);
const [w1, w2, w3, w4] = [dr.p1, dr.p2, dr.p3, dr.p4].map(([f, l]) => walk(f, l));
const [wa, wb] = [walk(...dr.a), walk(...dr.b)];
const ab = { x: wb.x - wa.x, y: wb.y - wa.y };
const rel = { P: [0, 4], Q: [0, 0], R: [6, 0], S: [6, -4] };
const ps = { x: rel.P[0] - rel.S[0], y: rel.P[1] - rel.S[1] };
const rotBy = bearing(dr.rot[1]) - bearing(dr.rot[0]), rotTo = named(bearing(dr.rot[2]) + rotBy);
const faceB = shadowFacing("morning", "right"), faceA = named(bearing(faceB) + 180);
ok([w1, w2, w3, w4, { dist: Math.hypot(ab.x, ab.y) }, { dist: Math.hypot(ps.x, ps.y) }].every((w) => Number.isInteger(w.dist)), "direction distances");
ok(named(drTurn) === "east" && w2.x === 0 && w3.x === 9 && w3.y === 12 && shadowFacing("morning", "right") === "south" && shadowFacing("evening", "behind") === "west", "direction answers");

const DIRECTION: Chapter = {
  id: "direction",
  title: "Direction sense",
  play: "play-direction",
  summary: "Direction questions describe a walk with turns and ask where the person ends up, which way they face, or where a shadow falls. Put the start at (0, 0), keep east as +x and north as +y, and every question becomes adding numbers.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["right turn = 90° clockwise, left turn = 90° anticlockwise", "the new facing after a turn"],
    ["N, NE, E, SE, S, SW, W, NW are 45° apart, clockwise", "turns given in degrees"],
    ["facing d: right = d + 90°, left = d − 90°, behind = d + 180°", "where a shadow or a person is, relative to someone"],
    ["east = +x, west = −x, north = +y, south = −y", "adding up a path leg by leg"],
    ["distance = √(x² + y²)", "shortest distance from the start"],
    ["3-4-5, 5-12-13, 6-8-10, 8-15-17, 9-12-15", "right triangles that make the square root exact"],
    ["morning: sun in the east, shadow to the west", "shadow questions before noon"],
    ["evening: sun in the west, shadow to the east", "shadow questions after noon"],
    ["if one direction is renamed, all turn by the same angle", "'if north becomes west' questions"],
  ] },
  points: [
    "Draw the path on rough paper with the start as a dot. Mark north at the top every time.",
    "Only the totals matter: add all east-west legs into x and all north-south legs into y.",
    "Opposite legs cancel. 10 km east and later 10 km west leaves x = 0.",
    "'Towards the north-east' in an answer means some north and some east, not exactly 45°.",
    "For shadows, first fix where the shadow points (west in the morning, east in the evening), then work back to the facing.",
    "Clockwise adds degrees, anticlockwise subtracts. Reduce the total mod 360.",
  ],
  diagram: `flowchart TB
  S["start (0, 0), facing east"] --> A["walk 5 km east: (5, 0)"]
  A --> B["left, 8 km north: (5, 8)"]
  B --> C["right, 4 km east: (9, 8)"]
  C --> D["left, 4 km north: (9, 12)"]
  D --> R["distance √(81 + 144) = 15 km, north-east"]:::ok`,
  caption: "Turn a walk into coordinates: each leg adds to x (east) or y (north), and the distance is the hypotenuse.",
  cards: [
    { id: "turns", q: `A girl faces north. She turns ${list([...dr.turns])}, one after another. Which way does she face now?`,
      a: steps(...dr.turns.map((t, i) => `Turn ${t}: ${named(dr.turns.slice(0, i + 1).reduce((f, u) => mod(f + TURN[u], 360), 0))}.`), `Answer: **${named(drTurn)}**.`),
      trap: "Two rights make an about-turn. Count them as +90 each; do not guess." },
    { id: "degrees", q: `A man faces ${dr.deg.from}. He turns ${dr.deg.cw}° clockwise and then ${dr.deg.acw}° anticlockwise. Which way does he face now?`,
      a: steps(`${dr.deg.from} is ${bearing(dr.deg.from)}° from north.`, `${bearing(dr.deg.from)} + ${dr.deg.cw} − ${dr.deg.acw} = ${bearing(dr.deg.from) + dr.deg.cw - dr.deg.acw}°.`, `That is **${drDeg}**.`),
      trap: "Anticlockwise turns subtract. Adding both turns gives the wrong direction." },
    { id: "path", q: `Ravi ${legText(...dr.p1)}. How far is he from the start, and in which direction?`,
      a: steps(`End point: ${parts(w1.x, w1.y)}.`, `Distance = √(${w1.x}² + ${w1.y}²) = **${w1.dist} km**.`, `Direction: **${towards(w1.x, w1.y)}** of the start.`) },
    { id: "back", q: `Meera ${legText(...dr.p2)}. How far is she from the start, in which direction, and which way is she facing?`,
      a: steps(`East and west legs cancel: 10 − 10 = 0.`, `She ends ${parts(w2.x, w2.y)} of the start: **${w2.dist} km ${towards(w2.x, w2.y)}**.`, `Facing: east, then left is north, then left again is **${w2.face}**.`) },
    { id: "zigzag", q: `Arjun ${legText(...dr.p3)}. How far is he from the start, and in which direction?`,
      a: steps("Facing east, left is north; then right is east again; then left is north.", `x = ${dr.p3[1].filter((_, i) => i % 2 === 0).map(([, k]) => k).join(" + ")} = ${w3.x}, y = ${dr.p3[1].filter((_, i) => i % 2 === 1).map(([, k]) => k).join(" + ")} = ${w3.y}.`,
        `Distance = √(${w3.x}² + ${w3.y}²) = **${w3.dist} km**, towards the **${towards(w3.x, w3.y)}**.`) },
    { id: "west", q: `Starting at her gate, Sana ${legText(...dr.p4)}. How far is she from her gate, and in which direction?`,
      a: steps("Facing west, a left turn points south, and another left turn points east.", `x = −${dr.p4[1][0][1]} + ${dr.p4[1][2][1]} = ${sg(w4.x)}, y = ${sg(w4.y)}.`, `Distance = √(${Math.abs(w4.x)}² + ${Math.abs(w4.y)}²) = **${w4.dist} km**, towards the **${towards(w4.x, w4.y)}**.`),
      trap: "Facing west, left is south, not north. Turn your own body in your head." },
    { id: "two", q: `From the same point, A ${legText(...dr.a)}. B ${legText(...dr.b)}. How far apart are they, and in which direction is B from A?`,
      a: steps(`A ends at ${pt(wa.x, wa.y)}: ${parts(wa.x, wa.y)}.`, `B faces south, turns left to face east: B ends at ${pt(wb.x, wb.y)}.`, `B − A = ${pt(ab.x, ab.y)}.`,
        `Distance = √(${Math.abs(ab.x)}² + ${Math.abs(ab.y)}²) = **${Math.hypot(ab.x, ab.y)} km**, and B is **${towards(ab.x, ab.y)}** of A.`) },
    { id: "towns", q: `Town P is ${rel.P[1]} km north of Q. R is ${rel.R[0]} km east of Q. S is ${-rel.S[1]} km south of R. How far is P from S, and in which direction?`,
      a: steps("Put Q at (0, 0).", `P = ${pt(rel.P[0], rel.P[1])}, R = ${pt(rel.R[0], rel.R[1])}, S = ${pt(rel.S[0], rel.S[1])}.`, `P − S = ${pt(ps.x, ps.y)}.`, `Distance = **${Math.hypot(ps.x, ps.y)} km**, and P is **${towards(ps.x, ps.y)}** of S.`) },
    { id: "shadow", q: "One morning, Kabir stands still and his shadow falls exactly to his right. Which way is he facing?",
      a: steps("In the morning the sun is in the east, so shadows fall to the west.", "His right is west.", `Facing d has right = d + 90°. d + 90° = west (270°), so d = 180°: **${shadowFacing("morning", "right")}**.`) },
    { id: "evening", q: "One evening, Tara walks and her shadow falls straight behind her. Which way is she walking?",
      a: steps("In the evening the sun is in the west, so shadows fall to the east.", "Behind her is east.", `So she walks towards the sun: **${shadowFacing("evening", "behind")}**.`),
      trap: "Morning and evening flip the answer. Underline the time of day first." },
    { id: "facing-pair", q: "One morning, A and B stand facing each other. A's shadow falls exactly to B's right. Which way is A facing?",
      a: steps("Morning shadows point west, so B's right is west.", `Right of B = west means B faces ${faceB}.`, `They face each other, so A faces **${faceA}**.`) },
    { id: "rename", q: `In a puzzle, ${dr.rot[0]} is called ${dr.rot[1]}, and every other direction is renamed the same way. What is ${dr.rot[2]} called?`,
      a: steps(`${dr.rot[0]} (${bearing(dr.rot[0])}°) became ${dr.rot[1]} (${bearing(dr.rot[1])}°): every direction turns by ${mod(rotBy, 360)}° clockwise.`, `${dr.rot[2]}: ${bearing(dr.rot[2])} + ${mod(rotBy, 360)} = ${bearing(dr.rot[2]) + mod(rotBy, 360)}, which is ${mod(bearing(dr.rot[2]) + rotBy, 360)}°.`, `Answer: **${rotTo}**.`) },
  ],
};

/* ---------- blood relations ---------- */
type Sex = "m" | "f";
/** A small family graph. Siblings share a group, and parents belong to the group, so a parent added later counts for all of them. */
export class Family {
  sex = new Map<string, Sex | undefined>(); grp = new Map<string, string>(); par = new Map<string, Set<string>>(); sp = new Map<string, string>();
  add(...ps: string[]) { for (const p of ps) if (!this.grp.has(p)) { this.grp.set(p, p); this.par.set(p, new Set()); this.sex.set(p, undefined); } return this; }
  male(...ps: string[]) { for (const p of ps) this.add(p).sex.set(p, "m"); return this; }
  female(...ps: string[]) { for (const p of ps) this.add(p).sex.set(p, "f"); return this; }
  parent(p: string, ...kids: string[]) { this.add(p, ...kids); for (const k of kids) this.par.get(this.grp.get(k)!)!.add(p); return this; }
  sibling(a: string, b: string) {
    this.add(a, b); const [ga, gb] = [this.grp.get(a)!, this.grp.get(b)!];
    if (ga !== gb) { for (const [p, g] of this.grp) if (g === gb) this.grp.set(p, ga); for (const x of this.par.get(gb)!) this.par.get(ga)!.add(x); }
    return this;
  }
  marry(a: string, b: string) { this.add(a, b); this.sp.set(a, b); this.sp.set(b, a); return this; }
  /** A parent's spouse counts as a parent too, as tests assume. */
  parents(a: string) { const ps = [...this.par.get(this.grp.get(a)!)!]; return [...new Set([...ps, ...ps.map((p) => this.sp.get(p)).filter((x): x is string => !!x)])]; }
  /** What a is to b, or null when the facts do not fix it. */
  rel(a: string, b: string): string | null {
    const s = this.sex.get(a), w = (m: string, f: string) => (s === "m" ? m : s === "f" ? f : `${m} or ${f}`);
    const P = (x: string) => this.parents(x), sib = (x: string, y: string) => x !== y && (this.grp.get(x) === this.grp.get(y) || P(x).some((p) => P(y).includes(p)));
    const sa = this.sp.get(a), sb = this.sp.get(b), sibOrInLaw = (x: string, p: string) => sib(x, p) || (!!this.sp.get(x) && sib(this.sp.get(x)!, p));
    if (sa === b) return w("husband", "wife");
    if (P(b).includes(a)) return w("father", "mother");
    if (P(a).includes(b)) return w("son", "daughter");
    if (sib(a, b)) return w("brother", "sister");
    if (P(b).some((p) => P(p).includes(a))) return w("grandfather", "grandmother");
    if (P(a).some((p) => P(p).includes(b))) return w("grandson", "granddaughter");
    if (P(b).some((p) => sibOrInLaw(a, p))) return w("uncle", "aunt");
    if (P(a).some((p) => sibOrInLaw(b, p))) return w("nephew", "niece");
    if (P(a).some((p) => P(b).some((q) => sib(p, q)))) return "cousin";
    if (sb && P(sb).includes(a)) return w("father-in-law", "mother-in-law");
    if (sa && P(sa).includes(b)) return w("son-in-law", "daughter-in-law");
    if ((sb && sib(a, sb)) || (sa && sib(sa, b))) return w("brother-in-law", "sister-in-law");
    return null;
  }
}
const relOf = (f: Family, a: string, b: string, want: string) => { const r = f.rel(a, b); ok(r === want, `blood: ${a} to ${b} is ${r}, expected ${want}`); return r!; };
/** Coded relations: "P # Q" means P is the father of Q, and so on. */
export const CODES: Record<string, string> = { "#": "father", "@": "wife", "$": "brother", "%": "daughter" };
export function decode(expr: string) {
  const t = expr.split(" "), f = new Family();
  for (let i = 1; i < t.length; i += 2) {
    const [a, op, b] = [t[i - 1], t[i], t[i + 1]];
    ({ father: () => f.male(a).parent(a, b), wife: () => f.female(a).male(b).marry(a, b), brother: () => f.male(a).sibling(a, b), daughter: () => f.female(a).parent(b, a) } as Record<string, () => Family>)[CODES[op]]();
  }
  return f;
}
const codeSteps = (expr: string) => { const t = expr.split(" "); return Array.from({ length: (t.length - 1) / 2 }, (_, k) => `${t[2 * k]} ${t[2 * k + 1]} ${t[2 * k + 2]}: ${t[2 * k]} is the ${CODES[t[2 * k + 1]]} of ${t[2 * k + 2]}.`); };

const bf = {
  uncle: new Family().male("Kiran", "Arjun").female("Meena").parent("Meena", "Kiran").sibling("Meena", "Arjun"),
  grand: new Family().male("Suresh").female("Lata", "Neha").parent("Suresh", "Neha").parent("Lata", "Suresh"),
  inlaw: new Family().male("Rohan", "Mohan").female("Priya").marry("Rohan", "Priya").parent("Mohan", "Priya"),
  bil: new Family().male("Anil", "Dev").female("Kavya").marry("Anil", "Kavya").sibling("Kavya", "Dev"),
  open: new Family().male("A", "C").female("B").sibling("A", "B").sibling("B", "C").parent("C", "D"),
  sister: new Family().male("Grandfather", "Father", "Vikram").female("She").parent("Grandfather", "Father").parent("Father", "Vikram", "She"),
  son: new Family().female("Rina", "Mother").male("He").parent("Mother", "Rina").parent("Rina", "He"),
  cousin: new Family().male("Grandfather", "Father", "Uncle", "Sameer", "Boy").parent("Grandfather", "Father", "Uncle").parent("Father", "Sameer").parent("Uncle", "Boy"),
  six: new Family().male("P", "Q", "T").female("R", "S", "U").parent("P", "Q").marry("Q", "R").parent("Q", "S", "T").parent("R", "S", "T").marry("P", "U").parent("U", "Q"),
};
const code1 = "K % L @ M $ N", code2 = "A % B # C @ D";
const grandOpts = ["R # S # T", "R $ S # T", "R # S $ T", "R # S @ T"].map((e) => [e, decode(e).rel("R", "T")] as const);
ok(grandOpts.filter(([, r]) => r === "grandfather").length === 1, "one grandfather option");
const males = [...bf.six.sex].filter(([, s]) => s === "m").map(([p]) => p);

const BLOOD: Chapter = {
  id: "blood",
  title: "Blood relations",
  play: "play-blood",
  summary: "Blood relation questions chain several facts and ask how two people are related. Draw a small family tree as you read: one row per generation, a line for each marriage, and a sign for every known gender.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["father's or mother's brother", "uncle (mother's brother: maternal uncle)"],
    ["father's or mother's sister", "aunt"],
    ["brother's or sister's son / daughter", "nephew / niece"],
    ["uncle's or aunt's child", "cousin"],
    ["parent's parent / child's child", "grandparent / grandchild"],
    ["husband's or wife's father / mother", "father-in-law / mother-in-law"],
    ["son's wife / daughter's husband", "daughter-in-law / son-in-law"],
    ["spouse's brother, or sister's husband", "brother-in-law"],
    ["'only son of my father' said by a man", "the speaker himself"],
    ["'only daughter of my mother' said by a woman", "the speaker herself"],
  ] },
  points: [
    "Mark gender as soon as it is given: a square or + for male, a circle or − for female. Many answers depend on it.",
    "If a person's gender is never stated, the answer has two words: 'nephew or niece', 'brother or sister'.",
    "'Only son' or 'only daughter' is a hint that the speaker may be that person.",
    "For 'pointing to a photo', start from the speaker's side of the sentence ('my ...') and work outwards.",
    "In coded relations, decode one symbol at a time, left to right, and draw as you go.",
    "Read the question direction carefully: 'How is A related to B' asks what A is to B.",
  ],
  diagram: `flowchart TB
  G["grandfather"] --> F["father"]
  G --> U["uncle"]
  F --- M["mother"]
  F --> Me["me"]:::hot
  F --> Sis["sister"]
  U --> C["cousin"]
  Sis --> N["nephew or niece"]`,
  caption: "One generation per row, arrows from parent to child, a plain line for a marriage. Every relation name is a path on this tree.",
  cards: [
    { id: "uncle", q: "Kiran is the son of Meena. Meena is the sister of Arjun. How is Arjun related to Kiran?",
      a: steps("Meena is Kiran's mother.", "Arjun is Meena's brother, so he is the brother of Kiran's mother.", `Answer: **${relOf(bf.uncle, "Arjun", "Kiran", "uncle")}** (maternal uncle).`) },
    { id: "grand", q: "Neha's father is Suresh. Suresh's mother is Lata. How is Lata related to Neha?",
      a: steps("Lata is the mother of Neha's father.", `Answer: **${relOf(bf.grand, "Lata", "Neha", "grandmother")}**.`) },
    { id: "son-in-law", q: "Rohan is married to Priya. Priya's father is Mohan. How is Rohan related to Mohan?",
      a: steps("Rohan is the husband of Mohan's daughter.", `Answer: **${relOf(bf.inlaw, "Rohan", "Mohan", "son-in-law")}**.`) },
    { id: "brother-in-law", q: "Anil's wife is Kavya. Dev is Kavya's brother. How is Dev related to Anil?",
      a: steps("Dev is the brother of Anil's wife.", `Answer: **${relOf(bf.bil, "Dev", "Anil", "brother-in-law")}**. Anil is also Dev's ${relOf(bf.bil, "Anil", "Dev", "brother-in-law")}.`) },
    { id: "gender", q: "A is the brother of B. B is the sister of C. C is the father of D. How is A related to D, and how is D related to A?",
      a: steps("A, B and C are siblings. C is D's father.", `A is the brother of D's father: **${relOf(bf.open, "A", "D", "uncle")}**.`, `D's gender is never given, so D is A's **${relOf(bf.open, "D", "A", "nephew or niece")}**.`),
      trap: "Writing 'nephew' assumes D is male. Nothing in the question says so." },
    { id: "photo-sister", q: "Pointing to a girl in a photo, Vikram says, \"She is the daughter of my paternal grandfather's only son.\" How is the girl related to Vikram?",
      a: steps("Vikram's paternal grandfather's only son is Vikram's father.", "The girl is the daughter of Vikram's father.", `Answer: **${relOf(bf.sister, "She", "Vikram", "sister")}**.`) },
    { id: "photo-self", q: "Pointing to a boy, Rina says, \"His mother is the only daughter of my mother.\" How is the boy related to Rina?",
      a: steps("Rina is a daughter of her mother. If her mother has only one daughter, it is Rina herself.", "So the boy's mother is Rina.", `Answer: **${relOf(bf.son, "He", "Rina", "son")}**.`),
      trap: "'Sister's son, so nephew' is the classic wrong answer. The speaker is the only daughter." },
    { id: "photo-cousin", q: "Pointing to a boy, Sameer says, \"He is the son of my father's only brother.\" How is the boy related to Sameer?",
      a: steps("Sameer's father's only brother is Sameer's uncle.", "The uncle's son is Sameer's first cousin.", `Answer: **${relOf(bf.cousin, "Boy", "Sameer", "cousin")}**.`) },
    { id: "code-1", q: `P # Q means P is the father of Q, P @ Q means P is the wife of Q, P $ Q means P is the brother of Q, and P % Q means P is the daughter of Q. In ${code1}, how is K related to N?`,
      a: steps(...codeSteps(code1), "So K is the daughter of M, and N is M's sibling. N's gender is not given.", `K is N's **${relOf(decode(code1), "K", "N", "niece")}**.`) },
    { id: "code-2", q: `Using the same codes (# father, @ wife, $ brother, % daughter), how is A related to D in ${code2}?`,
      a: steps(...codeSteps(code2), "A and C are both children of B, so they are sisters. D is C's husband.", `A is the sister of D's wife: **${relOf(decode(code2), "A", "D", "sister-in-law")}**.`) },
    { id: "code-which", q: `With the same codes, which expression means R is the grandfather of T: ${list(grandOpts.map(([e]) => e), "or")}?`,
      a: steps(...grandOpts.map(([e, r]) => `${e}: R is T's ${r}.`), `Answer: **${grandOpts.find(([, r]) => r === "grandfather")![0]}**.`),
      trap: "Check every option fully. One symbol in the middle changes a generation." },
    { id: "family", q: "A family has six members P, Q, R, S, T and U. Q is the son of P. R is Q's wife. S and T are the children of Q and R. S is a girl, and T is her brother. U is P's wife. How is U related to T, what is R to P, and how many males are in the family?",
      diagram: `flowchart TB
  P["P (male)"] --- U["U (female)"]
  P --> Q["Q (male)"]
  Q --- R["R (female)"]
  Q --> S["S (girl)"]
  Q --> T["T (boy)"]`,
      a: steps("U is the wife of P, so she is Q's mother and T's father's mother.", `U is T's **${relOf(bf.six, "U", "T", "grandmother")}**.`, `R is the wife of P's son: **${relOf(bf.six, "R", "P", "daughter-in-law")}**.`, `Males: ${list(males)}, so **${males.length}**.`) },
  ],
};

/* ---------- water and mirror images ---------- */
// Capital letters in the plain block style tests use. A mirror stands beside the text; water lies below it.
export const MIRROR_SAME = "AHIMOTUVWXY", WATER_SAME = "BCDEHIKOX";
const HALF_TURN: Record<string, string> = { H: "H", I: "I", N: "N", O: "O", S: "S", X: "X", Z: "Z", M: "W", W: "M" };
const BOTH = [...MIRROR_SAME].filter((c) => WATER_SAME.includes(c)).join("");
ok(BOTH === "HIOX" && BOTH.split("").every((c) => HALF_TURN[c] === c), "mirror sets");
const MIRROR_LOW: Record<string, string> = { b: "d", d: "b", p: "q", q: "p" }, WATER_LOW: Record<string, string> = { b: "p", p: "b", d: "q", q: "d" };
const MIRROR_DIGITS = "018", WATER_DIGITS = "0138";
const rev = (s: string) => [...s].reverse().join("");
export const mirrorSame = (w: string, set = MIRROR_SAME) => [...w].every((c) => set.includes(c)) && rev(w) === w;
export const waterSame = (w: string, set = WATER_SAME) => [...w].every((c) => set.includes(c));
const halfTurn = (w: string) => [...rev(w)].map((c) => HALF_TURN[c] ?? "?").join("");
const one = <T>(xs: T[], f: (x: T) => boolean, what: string) => { const r = xs.filter(f); ok(r.length === 1, `${what}: ${r.length} fit`); return r[0]; };
const mi = {
  word: "MATHEMATICS", water: "DECIMAL", mWords: ["NOON", "BOB", "TOOT", "DAD"], wWords: ["BOX", "MOM", "TOY", "WAX"],
  low: "bqdp", mNums: ["1801", "6996", "8118", "2552"], wNums: ["3083", "3553", "6119", "2002"], clk: [7, 25] as const, clk12: [12, 40] as const,
  turn: ["MOW", "MOM", "TOT", "BIB"],
};
const miCount = [...mi.word].filter((c) => MIRROR_SAME.includes(c));
const miWater = [...new Set([...mi.water].filter((c) => WATER_SAME.includes(c)))];
const clockSame = Array.from({ length: 720 }, (_, t) => t).filter((t) => mirrorTime(Math.floor(t / 60), t % 60) === `${Math.floor(t / 60) || 12}:${String(t % 60).padStart(2, "0")}`);
ok(clockSame.length === 2, "mirror clock fixed points");
const letterTable = { head: ["Image", "Capital letters that look the same"], rows: [
  ["mirror (left and right swap)", [...MIRROR_SAME].join(" ")], ["water (top and bottom swap)", [...WATER_SAME].join(" ")], ["both", [...BOTH].join(" ")],
  ["half turn (mirror, then water)", Object.keys(HALF_TURN).filter((c) => HALF_TURN[c] === c).join(" ") + " (and M, W swap)"],
] };

const MIRROR: Chapter = {
  id: "mirror",
  title: "Water and mirror images",
  play: "play-mirror",
  summary: "These questions ask what a letter, word, number or clock looks like in a mirror beside it or in water below it. A mirror swaps left and right; water swaps top and bottom. Knowing which letters stay the same answers most questions without drawing.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["mirror: reverse the order, flip each letter left to right", "words and numbers in a mirror on the right"],
    ["water: keep the order, flip each letter top to bottom", "words and numbers reflected in water"],
    [`same in a mirror: ${[...MIRROR_SAME].join(" ")}`, "symmetric about a vertical line"],
    [`same in water: ${[...WATER_SAME].join(" ")}`, "symmetric about a horizontal line"],
    [`same in both: ${[...BOTH].join(" ")}`, "letters that never change"],
    ["mirror pairs: b and d, p and q", "small letters in a mirror"],
    ["water pairs: b and p, d and q", "small letters in water"],
    [`digits: mirror ${[...MIRROR_DIGITS].join(", ")}; water ${[...WATER_DIGITS].join(", ")}`, "numbers that read the same"],
    ["mirror time = 11:60 − time", "clocks in a mirror (23:60 − time for 12:xx)"],
    ["mirror + water = half turn", "a figure seen in both"],
  ] },
  points: [
    "A word looks the same in a mirror only if it is a palindrome made of mirror-symmetric letters (TOOT, WOW).",
    "A word looks the same in water if every letter is water-symmetric. The order does not change (BOX, CHECK).",
    "Learn the two short lists: mirror A H I M O T U V W X Y, water B C D E H I K O X.",
    "Count options by checking letters against the list, not by imagining the whole image.",
    "Mirror on the left or on the right gives the same image. Water and a mirror above give the same image.",
    "A clock seen in a mirror and the real time always add up to 12:00 (11:60).",
  ],
  diagram: `flowchart TB
  O["original: AB on the page"] --> M["mirror beside it: order reverses, each letter flips left to right"]
  O --> W["water below it: order stays, each letter flips upside down"]
  M --> H["mirror then water = half turn"]:::hot
  W --> H`,
  caption: "A mirror and water flip along different lines. Doing both is the same as turning the page upside down.",
  cards: [
    { id: "mirror-letters", q: "Which capital letters look exactly the same in a mirror held beside them?", table: letterTable,
      a: steps("A letter stays the same in a mirror if its left half matches its right half (a vertical line of symmetry).", `Answer: **${[...MIRROR_SAME].join(", ")}**.`),
      trap: "B, C, D, E and K are symmetric top to bottom, not left to right. They change in a mirror." },
    { id: "water-letters", q: "Which capital letters look exactly the same in water?",
      a: steps("Water flips top and bottom, so the letter needs a horizontal line of symmetry.", `Answer: **${[...WATER_SAME].join(", ")}**.`) },
    { id: "both", q: "Which capital letters look the same in both a mirror and water?",
      a: steps("Take the letters that are on both lists.", `Answer: **${[...BOTH].join(", ")}**.`) },
    { id: "count", q: `How many of the ${mi.word.length} letters of ${mi.word} look the same in a mirror?`,
      a: steps(`Check each letter against ${[...MIRROR_SAME].join(" ")}.`, `Same: ${miCount.join(" ")}. Changed: ${[...mi.word].filter((c) => !MIRROR_SAME.includes(c)).join(" ")}.`, `Answer: **${miCount.length}**.`) },
    { id: "water-word", q: `Which letters of ${mi.water} look the same in water?`,
      a: steps(`Check each letter against ${[...WATER_SAME].join(" ")}.`, `Answer: **${miWater.join(", ")}**. ${[...mi.water].filter((c) => !WATER_SAME.includes(c)).join(", ")} change.`) },
    { id: "mirror-word", q: `Which word looks exactly the same in a mirror: ${list(mi.mWords, "or")}?`,
      a: steps("It must use only mirror-symmetric letters and read the same backwards.", ...mi.mWords.map((w) => `${w}: ${[...w].every((c) => MIRROR_SAME.includes(c)) ? (rev(w) === w ? "fits" : "letters fit but it is not a palindrome") : `${[...w].filter((c) => !MIRROR_SAME.includes(c))[0]} changes`}.`),
        `Answer: **${one(mi.mWords, (w) => mirrorSame(w), "mirror word")}**.`),
      trap: "NOON reads the same backwards, but N flips in a mirror." },
    { id: "water-word-2", q: `Which word looks exactly the same in water: ${list(mi.wWords, "or")}?`,
      a: steps("Order stays the same in water, so only the letters matter.", ...mi.wWords.map((w) => `${w}: ${waterSame(w) ? "every letter fits" : `${list([...new Set([...w].filter((c) => !WATER_SAME.includes(c)))])} ${new Set([...w].filter((c) => !WATER_SAME.includes(c))).size > 1 ? "change" : "changes"}`}.`),
        `Answer: **${one(mi.wWords, (w) => waterSame(w), "water word")}**.`) },
    { id: "small", q: `The small letters ${mi.low} are written on a card. What does a mirror beside the card show, read left to right? What does their water image show?`,
      a: steps(`Mirror: reverse the order (${rev(mi.low)}) and swap b with d and p with q: **${[...rev(mi.low)].map((c) => MIRROR_LOW[c]).join("")}**.`, `Water: keep the order and swap b with p and d with q: **${[...mi.low].map((c) => WATER_LOW[c]).join("")}**.`) },
    { id: "numbers", q: `In plain block digits (a 1 is a single straight stroke), which number looks the same in a mirror: ${list(mi.mNums, "or")}? Which looks the same in water: ${list(mi.wNums, "or")}?`,
      a: steps(`Mirror-symmetric digits: ${[...MIRROR_DIGITS].join(", ")}. The number must also read the same backwards.`, `Mirror: **${one(mi.mNums, (n) => mirrorSame(n, MIRROR_DIGITS), "mirror number")}**.`,
        `Water-symmetric digits: ${[...WATER_DIGITS].join(", ")}, order unchanged.`, `Water: **${one(mi.wNums, (n) => waterSame(n, WATER_DIGITS), "water number")}**.`) },
    { id: "clock", q: `A clock shows ${mi.clk[0]}:${mi.clk[1]}. What time does its mirror image show? What about at ${mi.clk12[0]}:${mi.clk12[1]}?`,
      a: steps(`11:60 − ${mi.clk[0]}:${mi.clk[1]} = **${mirrorTime(...mi.clk)}**.`, `For 12:xx use 23:60: 23:60 − ${mi.clk12[0]}:${mi.clk12[1]} = **${mirrorTime(...mi.clk12)}**.`),
      trap: "Borrow 60 minutes, not 100: 11:60 means 12:00." },
    { id: "clock-same", q: "At which times does a clock look the same in a mirror as it really is?",
      a: steps("The mirror time equals the real time only if time + time = 12:00 on the dial.", "So time = 0:00 or 6:00, when both hands lie on the vertical line.", `Answer: **${list(clockSame.map((t) => `${Math.floor(t / 60) || 12}:00`))}**.`) },
    { id: "half-turn", q: `Which word looks the same when the card is turned upside down (a half turn): ${list(mi.turn, "or")}?`,
      a: steps("A half turn reverses the order and turns each letter. H, I, N, O, S, X, Z stay; M and W swap.", ...mi.turn.map((w) => `${w}: ${halfTurn(w).includes("?") ? `${[...w].find((c) => !HALF_TURN[c])} is not a letter upside down` : `turns into ${halfTurn(w)}`}.`),
        `Answer: **${one(mi.turn, (w) => halfTurn(w) === w, "half-turn word")}**.`) },
  ],
};

/* ---------- seating arrangement ---------- */
function* perms<T>(a: T[]): Generator<T[]> {
  if (a.length <= 1) { yield a.slice(); return; }
  for (let i = 0; i < a.length; i++) for (const p of perms([...a.slice(0, i), ...a.slice(i + 1)])) yield [a[i], ...p];
}
type Seats = Record<string, number>;
type Clue = [text: string, test: (s: Seats) => boolean];
/** A layout: how many seats, which way "left" runs for each person, and whether rotations count as the same arrangement. */
type Layout = { n: number; ring: boolean; left: (who: string) => number };
const WORDS = ["zero", "one", "two", "three", "four", "five"], NTH = ["", "immediate", "second", "third", "fourth"];
const nth = (k: number) => NTH[k];
/** Clue builders for one layout. In a ring, seats are numbered clockwise; in a row, from the left end of the row as drawn. */
export const clues = (L: Layout) => {
  const at = (s: Seats, who: string, k: number) => (L.ring ? mod(s[who] + k * L.left(who), L.n) : s[who] + k * L.left(who));
  return {
    left: (a: string, b: string, k = 1): Clue => [`${a} sits ${k === 1 ? "to the immediate left" : `${nth(k)} to the left`} of ${b}.`, (s) => s[a] === at(s, b, k)],
    right: (a: string, b: string, k = 1): Clue => [`${a} sits ${k === 1 ? "to the immediate right" : `${nth(k)} to the right`} of ${b}.`, (s) => s[a] === at(s, b, -k)],
    opp: (a: string, b: string): Clue => [`${a} sits opposite ${b}.`, (s) => s[a] === mod(s[b] + L.n / 2, L.n)],
    near: (a: string, b: string) => (s: Seats) => (L.ring ? [1, L.n - 1].includes(mod(s[a] - s[b], L.n)) : Math.abs(s[a] - s[b]) === 1),
    between: (a: string, b: string, c: string): Clue => [`${a} sits between ${b} and ${c}.`, (s) => clues(L).near(a, b)(s) && clues(L).near(a, c)(s)],
    notNext: (a: string, b: string): Clue => [`${a} is not a neighbour of ${b}.`, (s) => !clues(L).near(a, b)(s)],
    end: (a: string): Clue => [`${a} sits at one end of the row.`, (s) => s[a] === 0 || s[a] === L.n - 1],
    seat: (a: string, i: number, text: string): Clue => [text, (s) => s[a] === i],
    gap: (a: string, b: string, k: number): Clue => [`Exactly ${WORDS[k]} people sit between ${a} and ${b}.`, (s) => Math.abs(s[a] - s[b]) === k + 1],
  };
};
/** Every arrangement that fits all the clues (a ring keeps the first person in seat 0, so rotations are not counted twice). */
function arrangements(names: string, L: Layout, cl: Clue[]) {
  const ns = [...names], out: string[][] = [];
  const rest = L.ring ? ns.slice(1) : ns;
  for (const p of perms(rest)) {
    const order = L.ring ? [ns[0], ...p] : p, s: Seats = Object.fromEntries(order.map((x, i) => [x, i]));
    if (cl.every(([, t]) => t(s))) out.push(order);
  }
  return out;
}
/** The one arrangement that fits; throws if there are none or several. */
export function unique(id: string, names: string, L: Layout, cl: Clue[]) {
  const a = arrangements(names, L, cl);
  ok(a.length === 1, `seating ${id}: ${a.length} arrangements fit`);
  const order = a[0], s: Seats = Object.fromEntries(order.map((x, i) => [x, i]));
  return { order, s, who: (i: number) => order[L.ring ? mod(i, L.n) : i] };
}
const row = (n: number): Layout => ({ n, ring: false, left: () => -1 });
export const ring = (n: number, out = ""): Layout => ({ n, ring: true, left: (w) => (out.includes(w) ? -1 : 1) });
const ringTable = (order: string[], out = "") => ({ head: ["Seat, going clockwise", "Person"], rows: order.map((p, i) => [`${i + 1}`, out ? `${p} (faces ${out.includes(p) ? "out" : "the centre"})` : p]) });

const rk = { left: 14, right: 19, n: 40, a: 10, b: 15, swapA: 8, swapB: 13, after: 18 };
const rkB = rk.n - rk.b + 1, rkSwapTotal = rk.after + rk.swapB - 1;
// one row of 5 facing north: left end is seat 0
const L1 = row(5), c1 = clues(L1);
const p1: Clue[] = [c1.seat("C", 2, "C sits in the middle of the row."), c1.seat("B", 4, "B sits at the right end."), c1.left("A", "C"), c1.notNext("D", "C")];
const s1 = unique("row5", "ABCDE", L1, p1);
const L2 = row(6), c2 = clues(L2);
const p2: Clue[] = [c2.seat("T", 0, "T sits at the left end."), c2.end("S"), c2.left("R", "Q"), c2.gap("P", "Q", 2)];
const s2 = unique("row6", "PQRSTU", L2, p2);
// two rows of 3: row 1 faces south (its left is the east end), row 2 faces north (its left is the west end); seats numbered from the west
const s3 = (() => {
  const fits: [string[], string[]][] = [];
  for (const r1 of perms([..."ABC"])) for (const r2 of perms([..."PQR"])) {
    const a = Object.fromEntries(r1.map((x, i) => [x, i])), b = Object.fromEntries(r2.map((x, i) => [x, i]));
    if (a.B === a.A + 1 && a.C !== 1 && b.Q === a.B && b.R === b.P - 1) fits.push([r1, r2]);
  }
  ok(fits.length === 1, `seating rows: ${fits.length}`);
  return fits[0];
})();
const L4 = ring(6), c4 = clues(L4);
const p4: Clue[] = [c4.left("B", "A", 3), c4.right("E", "B"), c4.between("C", "A", "E"), c4.notNext("D", "B")];
const s4 = unique("ring6", "ABCDEF", L4, p4);
const L5 = ring(8), c5 = clues(L5);
const p5: Clue[] = [c5.opp("T", "P"), c5.left("R", "P", 2), c5.right("Q", "V"), c5.between("S", "P", "V"), c5.left("U", "P")];
const s5 = unique("ring8", "PQRSTUVW", L5, p5);
const L6 = ring(5, "ABCDE"), c6 = clues(L6);
const p6: Clue[] = [c6.right("D", "A"), c6.left("C", "A"), c6.notNext("B", "C")];
const s6 = unique("ring-out", "ABCDE", L6, p6);
const OUT7 = "BDF", L7 = ring(6, OUT7), c7 = clues(L7);
const p7: Clue[] = [c7.opp("B", "A"), c7.left("D", "A"), c7.right("E", "D"), c7.right("C", "B", 2)];
const s7 = unique("ring-mixed", "ABCDEF", L7, p7);
const ask = (u: { s: Seats; who: (i: number) => string }, L: Layout, who: string, k: number) => u.who(u.s[who] + k * L.left(who));

const SEATING: Chapter = {
  id: "seating",
  title: "Seating arrangement",
  play: "play-seating",
  summary: "Seating puzzles give five or six clues about who sits where and ask about the one arrangement that fits. Fix the most certain clue first (an end, the middle, someone opposite), then place people relative to it, and test the remaining cases.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["row facing north: their left is your left", "a single row; draw it left to right"],
    ["row facing south: their left is your right", "the second row when two rows face each other"],
    ["facing the centre: left = clockwise, right = anticlockwise", "round or square tables, everyone facing in"],
    ["facing outward: left = anticlockwise, right = clockwise", "everyone facing away from the centre"],
    ["opposite in a ring of n = n/2 seats away", "even rings only"],
    ["total = position from left + position from right − 1", "ranking in a row"],
    ["people between = |p − q| − 1", "how many sit between two positions"],
    ["(n − 1)! arrangements of n people in a ring", "why we fix one person first"],
  ] },
  points: [
    "Place the person with the most clues first, at the top of your ring or the left of your row.",
    "Facing the centre: picture yourself at the bottom of the circle looking up. Your left hand points clockwise.",
    "Write each case on a separate small drawing. Most clues leave two cases; one later clue kills one of them.",
    "'Second to the left' means skip one seat. 'Immediate' means the next seat.",
    "'Between' in a ring means a neighbour of both, unless the question says 'exactly between'.",
    "For mixed facing, mark each person's facing with an arrow before using left or right.",
  ],
  diagram: `flowchart TB
  subgraph F["facing the centre"]
    A1["A"] -->|"A's left"| B1["next seat clockwise"]
  end
  subgraph O["facing outward"]
    A2["A"] -->|"A's left"| B2["next seat anticlockwise"]
  end
  F --> R["row facing north: left is the reader's left"]:::ok
  O --> R2["row facing south: left is the reader's right"]:::warn`,
  caption: "Which way 'left' runs depends on which way the person faces. Fix that first, then every clue is a step of known size.",
  cards: [
    { id: "rank", q: `In a row of students, Isha is ${ord(rk.left)} from the left and ${ord(rk.right)} from the right. How many students are in the row?`,
      a: steps("Isha is counted from both ends, so count her once.", `${rk.left} + ${rk.right} − 1 = **${rk.left + rk.right - 1}**.`),
      trap: `${rk.left + rk.right} counts Isha twice.` },
    { id: "between-count", q: `In a row of ${rk.n}, A is ${ord(rk.a)} from the left and B is ${ord(rk.b)} from the right. How many people sit between them?`,
      a: steps(`B from the left: ${rk.n} − ${rk.b} + 1 = ${rkB}.`, `Between positions ${rk.a} and ${rkB}: ${rkB} − ${rk.a} − 1 = **${rkB - rk.a - 1}**.`) },
    { id: "swap", q: `In a row, A is ${ord(rk.swapA)} from the left and B is ${ord(rk.swapB)} from the right. They swap places, and A is now ${ord(rk.after)} from the left. How many are in the row?`,
      a: steps(`After the swap A stands in B's old place, so B's old place is ${ord(rk.after)} from the left and ${ord(rk.swapB)} from the right.`, `Total = ${rk.after} + ${rk.swapB} − 1 = **${rkSwapTotal}**.`),
      trap: `A's first position (${ord(rk.swapA)}) is not needed. Only the place that is known from both ends matters.` },
    { id: "row5", q: `Five friends A, B, C, D and E sit in a row facing north. ${p1.map(([t]) => t).join(" ")} Who sits second from the right end, and who sits between A and E?`,
      table: { head: ["Seat from the left", "1", "2", "3", "4", "5"], rows: [["Person", ...s1.order]] },
      a: steps("C takes seat 3 and B seat 5. A is just left of C: seat 2.", "Seats 1 and 4 remain for D and E. Seat 4 touches C, so D takes seat 1 and E seat 4.", `Second from the right: **${s1.who(3)}**. Between A and E: **${s1.who(2)}**.`) },
    { id: "row6", q: `Six people P, Q, R, S, T and U sit in a row facing north. ${p2.map(([t]) => t).join(" ")} Who sits exactly between P and R, and how many people sit to the right of U?`,
      table: { head: ["Seat from the left", "1", "2", "3", "4", "5", "6"], rows: [["Person", ...s2.order]] },
      a: steps("T is in seat 1, so S, at an end, is in seat 6.", "R and Q sit side by side with R on the left. Exactly two people between P and Q means their seats differ by 3.",
        "If Q is in seat 5, R is in 4 and P in 2. If Q were in 4 or 3, P would need seat 1 or 6, which are taken.", `So U takes seat 3. Between P and R: **${s2.who((s2.s.P + s2.s.R) / 2)}**. To the right of U: **${L2.n - 1 - s2.s.U}**.`) },
    { id: "rows", q: "A, B and C sit in row 1 facing south. P, Q and R sit in row 2 facing north, so each person faces one person of the other row. B sits to the immediate left of A. C does not sit in the middle. Q faces B. R sits to the immediate left of P. Who faces A, and who sits to the immediate right of A?",
      table: { head: ["", "West", "Middle", "East"], rows: [["Row 1 (facing south)", ...s3[0]], ["Row 2 (facing north)", ...s3[1]]] },
      a: steps("Row 1 faces south, so their left is the east side. B is just east of A.", "C is at an end, so the row (west to east) is either A, B, C or C, A, B.",
        "Row 2 faces north, so R is just west of P: the pair R, P takes two neighbouring seats, leaving Q at an end.", "Q faces B, so B is at an end too: the row is C, A, B and Q is in the east seat. R and P take west and middle.",
        `Facing A: **${s3[1][s3[0].indexOf("A")]}**. A's right is the west side: **${s3[0][s3[0].indexOf("A") - 1]}**.`),
      trap: "In row 1 the people face you as you draw it from the north, so their left is on the east side. Flip left and right for that row." },
    { id: "ring6", q: `Six friends A, B, C, D, E and F sit around a round table facing the centre. ${p4.map(([t]) => t).join(" ")} Who sits to the immediate left of F, and who sits opposite C?`,
      table: ringTable(s4.order),
      a: steps("Put A in seat 1. Facing the centre, left is clockwise: third to the left of A is seat 4, which is B (opposite A).", "E is to B's immediate right, one seat anticlockwise: seat 3.", "C is a neighbour of both A and E: seat 2.",
        "D and F take seats 5 and 6. Seat 5 touches B, so D is in seat 6 and F in seat 5.", `Left of F (clockwise): **${ask(s4, L4, "F", 1)}**. Opposite C: **${s4.who(s4.s.C + 3)}**.`) },
    { id: "ring8", q: `Eight people P, Q, R, S, T, U, V and W sit around a round table facing the centre. ${p5.map(([t]) => t).join(" ")} Who sits third to the right of W, and who sits opposite U?`,
      table: ringTable(s5.order),
      a: steps("Put P in seat 1. T is opposite: seat 5. R is second to the left (clockwise): seat 3.", "S sits between P and V, so S is a neighbour of P: seat 2 or seat 8. Seat 2 would put V in seat 3, which R holds. So S is in seat 8 and V in seat 7.",
        "Q is just to the right of V, one seat anticlockwise: seat 6.", "U is to P's immediate left, one seat clockwise: seat 2. W takes the last free seat, 4.",
        `Third to the right of W: **${ask(s5, L5, "W", -3)}**. Opposite U: **${s5.who(s5.s.U + 4)}**.`) },
    { id: "outward", q: `Five people A, B, C, D and E sit around a round table facing outward. ${p6.map(([t]) => t).join(" ")} Who sits second to the right of D, and who sits to the immediate left of E?`,
      table: ringTable(s6.order, "ABCDE"),
      a: steps("Facing outward, right is clockwise and left is anticlockwise.", "Put A in seat 1: D is in seat 2 and C in seat 5.", "B is not next to C, so B takes seat 3 and E seat 4.",
        `Second to the right of D: **${ask(s6, L6, "D", -2)}**. Immediate left of E: **${ask(s6, L6, "E", 1)}**.`),
      trap: "Using the facing-the-centre rule here swaps every answer. Check the facing before each step." },
    { id: "mixed", q: `Six people sit around a table. A, C and E face the centre; B, D and F face outward. ${p7.map(([t]) => t).join(" ")} Who sits to the immediate left of F, and who sits to the immediate right of C?`,
      table: ringTable(s7.order, OUT7),
      a: steps("Put A in seat 1, facing in, so A's left is clockwise: D is in seat 2. B is opposite A: seat 4.", "D faces out, so D's right is clockwise: E is in seat 3.", "B faces out, so second to B's right is two seats clockwise: C is in seat 6. F takes seat 5.",
        `F faces out, so F's left is anticlockwise: **${ask(s7, L7, "F", 1)}**. C faces in, so C's right is anticlockwise: **${ask(s7, L7, "C", -1)}**.`) },
    { id: "why-fix", q: "Why do we fix one person's seat before trying cases in a circular arrangement?",
      a: steps("Turning the whole table does not change who sits next to whom, so every arrangement appears n times if no one is fixed.", "Fixing one person removes the copies: n people give (n − 1)! different arrangements.",
        `For 6 people that is **${[1, 2, 3, 4, 5].reduce((a, b) => a * b, 1)}** arrangements to test, not ${[1, 2, 3, 4, 5, 6].reduce((a, b) => a * b, 1)}.`) },
  ],
};
ok(arrangements("ABCDEF", ring(6), []).length === 120, "ring count");

/* ---------- Venn diagrams and dot fixing ---------- */
const vn = { n: 60, a: 35, b: 28, ab: 12, t: { n: 100, U: 45, C: 40, K: 35, UC: 15, CK: 12, UK: 10, UCK: 5 }, tea: 70, coffee: 60, pass: { e: 65, m: 55, both: 20, ok: 300 }, chess: { n: 50, a: 30, b: 25 } };
const v3 = (() => {
  const { U, C, K, UC, CK, UK, UCK, n } = vn.t;
  const r = { onlyU: U - UC - UK + UCK, onlyC: C - UC - CK + UCK, onlyK: K - CK - UK + UCK, UC: UC - UCK, CK: CK - UCK, UK: UK - UCK, all: UCK };
  const any = Object.values(r).reduce((a, b) => a + b, 0), two = r.UC + r.CK + r.UK, oneOnly = r.onlyU + r.onlyC + r.onlyK;
  ok(any === U + C + K - UC - CK - UK + UCK && two === UC + CK + UK - 3 * UCK && Object.values(r).every((x) => x >= 0), "three sets");
  return { r, any, none: n - any, two, oneOnly };
})();
const passFailAny = 100 - vn.pass.e + (100 - vn.pass.m) - vn.pass.both, passBoth = 100 - passFailAny, passTotal = (vn.pass.ok * 100) / passBoth;
ok(Number.isInteger(passTotal), "pass total");
type Pair = "in" | "apart" | "overlap";
/** The picture for three classes from how each pair relates ("in" means the first class lies inside the second). */
const picture = (ab: Pair, bc: Pair, ac: Pair, [a, b, c]: string[]) => {
  const ins = [[ab, a, b], [bc, b, c], [ac, a, c]].filter(([r]) => r === "in"), apart = [ab, bc, ac].filter((r) => r === "apart").length, over = [ab, bc, ac].filter((r) => r === "overlap").length;
  if (ins.length === 3) return "three circles, one inside another inside the third";
  if (ins.length === 2 && apart === 1) return "two separate circles inside a third";
  if (ins.length === 2 && over === 1) return "two overlapping circles inside a third";
  if (ins.length === 1 && over === 2) return "one circle inside a second, and a third overlapping both";
  if (ins.length === 1 && apart === 2) return "one circle inside another, and a separate third";
  if (over === 3) return "three overlapping circles";
  if (apart === 3) return "three separate circles";
  return fail(`picture ${a} ${b} ${c}`);
};
const classes: [string[], Pair, Pair, Pair][] = [
  [["dogs", "cats", "animals"], "apart", "in", "in"],
  [["Kolkata", "West Bengal", "India"], "in", "in", "in"],
  [["teachers", "graduates", "men"], "overlap", "overlap", "overlap"],
  [["mothers", "women", "doctors"], "in", "overlap", "overlap"],
  [["iron", "metals", "wood"], "in", "apart", "apart"],
];
const pics = classes.map(([names, ab, bc, ac]) => [names, picture(ab, bc, ac, names)] as const);
ok(pics[0][1] === "two separate circles inside a third" && pics[3][1] === "one circle inside a second, and a third overlapping both", "pictures");
// dot fixing: each figure is the list of regions it has (C circle, S square, T triangle)
const FIGS: [string, string[]][] = [["P", ["C", "S", "T", "CS", "ST"]], ["Q", ["C", "S", "T", "CS", "CST", "CT"]], ["R", ["C", "S", "T", "CST", "ST", "CT"]], ["S", ["C", "S", "T", "CT", "ST"]]];
const needDots = ["CS", "CST"];
const dotFig = one(FIGS, ([, rs]) => needDots.every((d) => rs.includes(d)), "dot figure")[0];
const regionName = (r: string) => (r.length === 1 ? `${{ C: "circle", S: "square", T: "triangle" }[r]} only` : r.length === 3 ? "all three" : `${[...r].map((x) => ({ C: "circle", S: "square", T: "triangle" })[x]).join(" and ")} only`);

const VENN: Chapter = {
  id: "venn",
  title: "Venn diagrams and dot fixing",
  play: "play-venn",
  summary: "Venn questions count people in overlapping groups, pick the picture that shows how classes relate, or find a figure with the same regions. Always fill the innermost region first and work outwards, subtracting what is already counted.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["n(A ∪ B) = n(A) + n(B) − n(A ∩ B)", "two groups, at least one"],
    ["only A = n(A) − n(A ∩ B)", "one group but not the other"],
    ["neither = total − n(A ∪ B)", "people in no group"],
    ["n(A ∪ B ∪ C) = A + B + C − AB − BC − CA + ABC", "three groups, at least one"],
    ["exactly two = AB + BC + CA − 3 × ABC", "three groups, exactly two"],
    ["exactly one = at least one − exactly two − ABC", "three groups, exactly one"],
    ["least overlap = A + B − total (if positive), most = smaller of A and B", "range questions"],
    ["three circles make 7 regions (8 with the outside)", "counting regions in dot fixing"],
  ] },
  points: [
    "Fill the centre (all three) first, then each pair minus the centre, then each 'only' region.",
    "A pair count such as 'tea and coffee' usually includes those who like all three. Subtract the centre once.",
    "Percent questions: work in percent, and convert to people only at the end.",
    "Picture questions: decide each pair (inside, apart, overlapping) and the picture follows.",
    "Dot fixing: write the regions each dot sits in, as sets of shapes, then look for a figure that has all of them.",
  ],
  diagram: `flowchart TB
  C["centre: all three = 5"]:::hot --> P["each pair only = pair − 5"]
  P --> O["each 'only' = total of that group − its pairs + 5"]
  O --> N["none = total − every region"]:::ok`,
  caption: "Work from the inside out. Each region is counted once, so the regions add up to the people in at least one group.",
  cards: [
    { id: "two-sets", q: `In a class of ${vn.n}, ${vn.a} play cricket, ${vn.b} play football and ${vn.ab} play both. How many play neither?`,
      a: steps(`At least one = ${vn.a} + ${vn.b} − ${vn.ab} = ${vn.a + vn.b - vn.ab}.`, `Neither = ${vn.n} − ${vn.a + vn.b - vn.ab} = **${vn.n - vn.a - vn.b + vn.ab}**.`),
      trap: `${vn.n} − ${vn.a} − ${vn.b} goes below zero: the ${vn.ab} who play both were counted twice. Add them back once.` },
    { id: "only", q: `In the same class, how many play only cricket, and how many play exactly one game?`,
      a: steps(`Only cricket = ${vn.a} − ${vn.ab} = **${vn.a - vn.ab}**.`, `Only football = ${vn.b} − ${vn.ab} = ${vn.b - vn.ab}.`, `Exactly one = ${vn.a - vn.ab} + ${vn.b - vn.ab} = **${vn.a + vn.b - 2 * vn.ab}**.`) },
    { id: "three", q: `In a survey of ${vn.t.n} shoppers, ${vn.t.U} pay by UPI, ${vn.t.C} by card and ${vn.t.K} by cash. ${vn.t.UC} use UPI and card, ${vn.t.CK} use card and cash, ${vn.t.UK} use UPI and cash, and ${vn.t.UCK} use all three. How many use none of them?`,
      table: { head: ["Region", "Shoppers"], rows: [["all three", `${v3.r.all}`], ["UPI and card only", `${vn.t.UC} − ${vn.t.UCK} = ${v3.r.UC}`], ["card and cash only", `${vn.t.CK} − ${vn.t.UCK} = ${v3.r.CK}`], ["UPI and cash only", `${vn.t.UK} − ${vn.t.UCK} = ${v3.r.UK}`],
        ["UPI only", `${vn.t.U} − ${v3.r.UC} − ${v3.r.UK} − ${v3.r.all} = ${v3.r.onlyU}`], ["card only", `${vn.t.C} − ${v3.r.UC} − ${v3.r.CK} − ${v3.r.all} = ${v3.r.onlyC}`], ["cash only", `${vn.t.K} − ${v3.r.CK} − ${v3.r.UK} − ${v3.r.all} = ${v3.r.onlyK}`], ["at least one", `${v3.any}`]] },
      a: steps(`At least one = ${vn.t.U} + ${vn.t.C} + ${vn.t.K} − ${vn.t.UC} − ${vn.t.CK} − ${vn.t.UK} + ${vn.t.UCK} = ${v3.any}.`, "The table fills each region from the centre out; the regions add up to the same total.", `None = ${vn.t.n} − ${v3.any} = **${v3.none}**.`) },
    { id: "exactly", q: "In the same survey, how many shoppers use exactly two methods, and how many use exactly one?",
      a: steps(`Exactly two = ${vn.t.UC} + ${vn.t.CK} + ${vn.t.UK} − 3 × ${vn.t.UCK} = **${v3.two}**.`, `Exactly one = ${v3.any} − ${v3.two} − ${vn.t.UCK} = **${v3.oneOnly}**.`),
      trap: "Subtract the centre three times for 'exactly two': it sits inside all three pair counts." },
    { id: "range", q: `In an office, ${vn.tea}% like tea and ${vn.coffee}% like coffee. What are the least and the most possible percentages that like both?`,
      a: steps(`Least: if everyone likes at least one, the overlap is ${vn.tea} + ${vn.coffee} − 100 = **${vn.tea + vn.coffee - 100}%**.`, `Most: the overlap cannot exceed the smaller group, so **${Math.min(vn.tea, vn.coffee)}%** (all coffee drinkers also like tea).`) },
    { id: "neither-range", q: `In a club of ${vn.chess.n}, ${vn.chess.a} play chess and ${vn.chess.b} play carrom. What are the most and the fewest members who play neither?`,
      a: steps(`Most play neither when the groups overlap as much as possible: all carrom players also play chess. Then ${vn.chess.a} play something and **${vn.chess.n - Math.max(vn.chess.a, vn.chess.b)}** play neither.`,
        `Fewest play neither when the groups overlap as little as possible: ${vn.chess.a} + ${vn.chess.b} = ${vn.chess.a + vn.chess.b}, which is at least ${vn.chess.n}, so **${Math.max(0, vn.chess.n - vn.chess.a - vn.chess.b)}**.`) },
    { id: "pass", q: `In an exam, ${vn.pass.e}% passed English, ${vn.pass.m}% passed Maths and ${vn.pass.both}% failed both. If ${vn.pass.ok} students passed both, how many took the exam?`,
      a: steps(`Failed English = ${100 - vn.pass.e}%, failed Maths = ${100 - vn.pass.m}%.`, `Failed at least one = ${100 - vn.pass.e} + ${100 - vn.pass.m} − ${vn.pass.both} = ${passFailAny}%.`, `Passed both = ${passBoth}%, and ${passBoth}% is ${vn.pass.ok} students.`, `Total = ${vn.pass.ok} × 100 / ${passBoth} = **${passTotal}**.`) },
    { id: "pictures", q: `Which picture shows each group: (1) ${pics[0][0].join(", ")}; (2) ${pics[1][0].join(", ")}; (3) ${pics[2][0].join(", ")}?`,
      a: steps(`(1) Dogs and cats are both animals, and no dog is a cat: **${pics[0][1]}**.`, `(2) Kolkata is in West Bengal, which is in India: **${pics[1][1]}**.`, `(3) Some teachers are graduates, some are men, and some graduates are men: **${pics[2][1]}**.`) },
    { id: "pictures-2", q: `Which picture shows each group: (1) ${pics[3][0].join(", ")}; (2) ${pics[4][0].join(", ")}?`,
      a: steps(`(1) Every mother is a woman. Some women are doctors, and some mothers are doctors: **${pics[3][1]}**.`, `(2) Iron is a metal, and wood is neither: **${pics[4][1]}**.`),
      trap: "Doctors overlap women; they are not inside. Some doctors are men." },
    { id: "regions", q: "Three circles are drawn so that each pair overlaps and all three share a middle part. How many separate regions are inside the circles?",
      a: steps("Each region is a choice of which circles it is in: in or out of each of 3 circles gives 2 × 2 × 2 = 8 choices.", "One choice is 'in none', which is outside the circles.", `Inside: **${2 ** 3 - 1}** regions.`) },
    { id: "dot", q: "In a figure with a circle (C), a square (S) and a triangle (T), one dot sits inside the circle and the square but outside the triangle, and another sits inside all three. Which figure in the table lets you place both dots the same way?",
      table: { head: ["Figure", "Regions it has"], rows: FIGS.map(([f, rs]) => [f, rs.map(regionName).join(", ")]) },
      a: steps(`The dots need the regions ${needDots.map(regionName).join(" and ")}.`, ...FIGS.map(([f, rs]) => `${f}: ${needDots.every((d) => rs.includes(d)) ? "has both" : `missing ${needDots.filter((d) => !rs.includes(d)).map(regionName).join(" and ")}`}.`), `Answer: **${dotFig}**.`),
      trap: "A region inside the circle and square that also lies in the triangle does not count as 'outside the triangle'." },
  ],
};

/* ---------- syllogism ---------- */
type Q = "all" | "some" | "no" | "somenot";
export type Stmt = [q: Q, a: string, b: string];
export const sayStmt = ([q, a, b]: Stmt) => ({ all: `All ${a} are ${b}`, some: `Some ${a} are ${b}`, no: `No ${a} are ${b}`, somenot: `Some ${a} are not ${b}` })[q];
/** Every Venn model of the sets (which regions are non-empty), with every named set non-empty. */
function models(sets: string[]) {
  const k = sets.length, R = 2 ** k - 1, out: number[][] = [];
  for (let m = 1; m < 2 ** R; m++) {
    const regions = Array.from({ length: R }, (_, i) => i + 1).filter((r) => m & (1 << (r - 1)));
    if (sets.every((_, i) => regions.some((r) => r & (1 << i)))) out.push(regions);
  }
  return out;
}
const holds = (st: Stmt, sets: string[], rs: number[]) => {
  const [q, a, b] = st, A = 1 << sets.indexOf(a), B = 1 << sets.indexOf(b);
  ok(sets.includes(a) && sets.includes(b), `syllogism set ${a} ${b}`);
  return { all: !rs.some((r) => r & A && !(r & B)), some: rs.some((r) => r & A && r & B), no: !rs.some((r) => r & A && r & B), somenot: rs.some((r) => r & A && !(r & B)) }[q];
};
export type Con = { st: Stmt; may?: boolean };       // may: "... is a possibility"
/** Verdict for each conclusion given the premises, worked out over every model. */
export function judge(prem: Stmt[], cons: Con[]) {
  const sets = [...new Set([...prem, ...cons.map((c) => c.st)].flatMap(([, a, b]) => [a, b]))];
  const ms = models(sets).filter((rs) => prem.every((p) => holds(p, sets, rs)));
  ok(ms.length > 0, "premises are consistent");
  const v = cons.map((c) => (c.may ? ms.some((rs) => holds(c.st, sets, rs)) : ms.every((rs) => holds(c.st, sets, rs))));
  const either = !cons.some((c) => c.may) && !v[0] && !v[1] && ms.every((rs) => holds(cons[0].st, sets, rs) || holds(cons[1].st, sets, rs));
  const verdict = either ? "either I or II follows" : v[0] && v[1] ? "both follow" : v[0] ? "only I follows" : v[1] ? "only II follows" : "neither follows";
  return { v, verdict };
}
export const conText = (c: Con) => (c.may ? `${{ all: "All", some: "Some", no: "No", somenot: "Some" }[c.st[0]]} ${c.st[1]} ${c.st[0] === "somenot" ? "not " : ""}being ${c.st[2]} is a possibility` : sayStmt(c.st));
type Syl = { id: string; prem: Stmt[]; premText?: string[]; cons: Con[]; want: string; why: string[]; trap?: string };
const SYL: Syl[] = [
  { id: "all-all", prem: [["all", "dogs", "animals"], ["all", "animals", "living things"]], cons: [{ st: ["all", "dogs", "living things"] }, { st: ["some", "living things", "dogs"] }], want: "both follow",
    why: ["The dogs circle sits inside animals, which sits inside living things.", "I: dogs are inside living things, so it follows.", "II: some living things (the dogs) are dogs, so it follows too. 'All A are B' always gives 'Some B are A'."] },
  { id: "all-some", prem: [["all", "roses", "flowers"], ["some", "flowers", "red things"]], cons: [{ st: ["some", "roses", "red things"] }, { st: ["all", "red things", "flowers"] }], want: "neither follows",
    why: ["Roses are inside flowers, and red things overlap flowers.", "The red part of flowers can miss the roses completely, so I does not follow.", "Red things can stick out of flowers, so II does not follow."],
    trap: "'Some roses are red' feels true in real life. Syllogisms test only what the statements force." },
  { id: "some-all", prem: [["some", "cups", "plates"], ["all", "plates", "bowls"]], cons: [{ st: ["some", "cups", "bowls"] }, { st: ["some", "bowls", "cups"] }], want: "both follow",
    why: ["Some cups are plates, and every plate is a bowl.", "So those cups are bowls: I follows.", "'Some A are B' turns round to 'Some B are A', so II follows as well."] },
  { id: "all-no", prem: [["all", "pilots", "trained people"], ["no", "trained people", "careless people"]], cons: [{ st: ["no", "pilots", "careless people"] }, { st: ["somenot", "careless people", "pilots"] }], want: "both follow",
    why: ["Pilots sit inside trained people, and trained people are apart from careless people.", "So pilots are apart from careless people: I follows.", "Careless people exist and none of them is a pilot, so some careless people are not pilots: II follows."] },
  { id: "some-no", prem: [["some", "boys", "tall people"], ["no", "tall people", "weak people"]], cons: [{ st: ["somenot", "boys", "weak people"] }, { st: ["no", "boys", "weak people"] }], want: "only I follows",
    why: ["The tall boys cannot be weak, so some boys are not weak: I follows.", "The other boys may still be weak, so II does not follow."] },
  { id: "no-some", prem: [["no", "cats", "dogs"], ["some", "dogs", "pets"]], cons: [{ st: ["somenot", "pets", "cats"] }, { st: ["somenot", "cats", "pets"] }], want: "only I follows",
    why: ["The pets that are dogs cannot be cats, so some pets are not cats: I follows.", "Every cat may still be a pet, so II does not follow."],
    trap: "The order matters with 'some not'. 'Some pets are not cats' follows; the reverse does not." },
  { id: "some-some", prem: [["some", "pens", "books"], ["some", "books", "bags"]], cons: [{ st: ["some", "pens", "bags"] }, { st: ["no", "pens", "bags"] }], want: "either I or II follows",
    why: ["Two 'some' statements link nothing: pens and bags may or may not meet.", "So neither follows alone.", "But I and II are about the same pair, and exactly one of them must be true: either I or II."] },
  { id: "some-not", prem: [["all", "singers", "artists"], ["somenot", "artists", "dancers"]], cons: [{ st: ["somenot", "singers", "dancers"] }, { st: ["all", "singers", "dancers"] }], want: "either I or II follows",
    why: ["The artists who are not dancers may or may not be singers, so neither I nor II is forced.", "I and II contradict each other: one of them is always true. So the answer is either I or II."] },
  { id: "possible", prem: [["some", "apples", "mangoes"], ["all", "mangoes", "fruits"]], cons: [{ st: ["all", "apples", "fruits"], may: true }, { st: ["no", "apples", "fruits"], may: true }], want: "only I follows",
    why: ["A possibility is fine if at least one drawing allows it.", "I: draw apples fully inside fruits. Nothing forbids it, so I is a possibility.", "II: the apples that are mangoes are fruits, so 'no apple is a fruit' is never possible."] },
  { id: "possible-2", prem: [["all", "pens", "tools"], ["no", "tools", "toys"]], cons: [{ st: ["some", "toys", "pens"], may: true }, { st: ["all", "tools", "pens"], may: true }], want: "only II follows",
    why: ["Pens are inside tools, and tools never meet toys.", "I: a toy that is a pen would be a tool, which is forbidden. Not possible.", "II: the pens circle can grow to fill tools. Possible."],
    trap: "A possibility still has to respect every 'no' and 'all' in the premises." },
  { id: "three", prem: [["all", "wheels", "rings"], ["some", "rings", "coins"], ["no", "coins", "notes"]], cons: [{ st: ["somenot", "rings", "notes"] }, { st: ["some", "wheels", "coins"] }], want: "only I follows",
    why: ["The rings that are coins are not notes, so some rings are not notes: I follows.", "The coins can meet the rings outside the wheels, so II does not follow."] },
  { id: "only-few", prem: [["some", "singers", "actors"], ["somenot", "singers", "actors"], ["all", "actors", "dancers"]], premText: ["Only a few singers are actors", "All actors are dancers"],
    cons: [{ st: ["all", "singers", "actors"], may: true }, { st: ["some", "singers", "dancers"] }], want: "only II follows",
    why: ["'Only a few singers are actors' means some are and some are not.", "So 'all singers are actors' is ruled out: I is not even a possibility.", "The singers who are actors are dancers, so II follows."],
    trap: "'Only a few' is two statements in one. The second half kills the possibility." },
];
const roman = ["I", "II"];
const sylCards = SYL.map((x) => {
  const { v, verdict } = judge(x.prem, x.cons);
  ok(verdict === x.want, `syllogism ${x.id}: got ${verdict}`);
  const prem = x.premText ?? x.prem.map(sayStmt);
  return { id: x.id, q: `Statements: ${prem.map((p) => `${p}.`).join(" ")} Conclusions: ${x.cons.map((c, i) => `${roman[i]}. ${conText(c)}.`).join(" ")}`,
    a: steps(...x.why, `Verdict: I ${v[0] ? (x.cons[0].may ? "is possible" : "follows") : (x.cons[0].may ? "is not possible" : "does not follow")}, II ${v[1] ? (x.cons[1].may ? "is possible" : "follows") : (x.cons[1].may ? "is not possible" : "does not follow")}. Answer: **${verdict}**.`),
    ...(x.trap ? { trap: x.trap } : {}) };
});

const SYLLOGISM: Chapter = {
  id: "syllogism",
  title: "Syllogism",
  play: "play-syllogism",
  summary: "A syllogism gives two or three statements and asks which conclusions must follow. Draw the smallest Venn picture the statements allow, then try to break each conclusion with another picture: if you cannot, it follows.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["All A are B: A inside B", "draw A completely inside B"],
    ["Some A are B: A and B overlap", "at least one shared member"],
    ["No A are B: A and B apart", "circles that never touch"],
    ["Some A are not B: part of A outside B", "at least one A outside B"],
    ["All A are B gives Some A are B and Some B are A", "conversions that always follow"],
    ["Some + Some, or All + Some (in the wrong order): no conclusion", "spotting 'neither follows' fast"],
    ["Some + All (A–B, then B inside C) gives Some A are C", "the chain that does work"],
    ["Some A are B and No A are B: one is always true", "'either I or II' pairs (also All and Some not)"],
    ["possibility: true in at least one drawing that fits", "'... is a possibility' conclusions"],
  ] },
  points: [
    "Use only the statements. Real-world facts do not count.",
    "A conclusion follows only if no drawing that fits the statements breaks it.",
    "Either-or needs three things: neither follows alone, both are about the same two groups, and together they cover every case (Some / No, or All / Some not).",
    "A possibility is false only if every drawing forbids it, usually because of a 'No' or an 'All'.",
    "'Only a few A are B' means some A are B and some A are not B.",
    "With three statements, chain them two at a time from the shared middle term.",
  ],
  diagram: `flowchart TB
  S["statements"] --> D["draw the smallest picture that fits"]
  D --> T["try to break each conclusion with another picture"]
  T --> F["never breaks: follows"]:::ok
  T --> P["true in some pictures: only a possibility"]:::warn
  T --> N["true in none: false"]:::bad`,
  caption: "The Venn method: a conclusion follows only if every picture that fits the statements also fits the conclusion.",
  cards: sylCards,
};

/* ---------- letter series ---------- */
/** Letter at position n (1 = A), wrapping round after Z; and a letter's position. */
export const L = (n: number) => String.fromCharCode(65 + mod(n - 1, 26));
export const pos = (c: string) => c.toUpperCase().charCodeAt(0) - 64;
const diffs = (a: number[]) => a.slice(1).map((x, i) => x - a[i]);
const signed = (a: number[]) => a.map((d) => (d > 0 ? `+${d}` : sg(d))).join(", ");
/** Index of the one term that breaks the rule, checked against the series the rule generates. */
const wrongAt = (shown: (number | string)[], right: (number | string)[]) => { const bad = shown.map((x, i) => (x === right[i] ? -1 : i)).filter((i) => i >= 0); ok(bad.length === 1, "one wrong term"); return bad[0]; };
const ls = {
  from: 18, right: [12, 7] as const, mid: ["F", "P"] as const,
  step: Array.from({ length: 5 }, (_, i) => L(2 + 3 * i)),
  grow: (() => { const a = [26]; for (let i = 0; i < 4; i++) a.push(a[i] - (2 + i)); return a.map(L); })(),
  alt: Array.from({ length: 7 }, (_, i) => (i % 2 ? L(26 - (i - 1)) : L(1 + i))),
  pairs: Array.from({ length: 4 }, (_, i) => L(1 + i) + L(26 - i)),
  groups: Array.from({ length: 4 }, (_, k) => [0, 2, 4].map((j) => L(2 + 6 * k + j)).join("")),
  miss: Array.from({ length: 5 }, (_, i) => L(3 + 3 * i)),
  wrong: Array.from({ length: 5 }, (_, i) => L(4 + 3 * i)),
  rising: (() => { const g: string[] = []; let p = 1; for (let k = 2; k <= 5; k++) { g.push(Array.from({ length: k }, (_, j) => L(p + j)).join("")); p += k + 1; } return g; })(),
  fill: { pat: "abc", times: 4, blanks: [2, 6, 10] }, rev: [15, 8] as const, word: "PLANET",
};
const lsWrongShown = ls.wrong.map((x, i) => (i === 3 ? L(pos(x) + 1) : x)), lsWrongI = wrongAt(lsWrongShown, ls.wrong);
const lsFill = ls.fill.pat.repeat(ls.fill.times), lsFillShown = [...lsFill].map((c, i) => (ls.fill.blanks.includes(i) ? "_" : c)).join(" ");
const REV = Array.from({ length: 26 }, (_, i) => L(26 - i)), revFrom = REV[26 - ls.rev[0]], revAns = REV[26 - ls.rev[0] - ls.rev[1]];
ok(revFrom === L(ls.rev[0]) && revAns === L(ls.rev[0] + ls.rev[1]), "reverse alphabet");
const sortedWord = [...ls.word].sort().join(""), stay = [...ls.word].filter((c, i) => sortedWord[i] === c);

const LETTER_SERIES: Chapter = {
  id: "letter-series",
  title: "Letter series",
  play: "play-letter-series",
  summary: "Letter series hide a number pattern. Turn every letter into its position (A = 1 to Z = 26), find the rule in the numbers, then turn the answer back into a letter.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["A = 1, B = 2, ..., Z = 26", "turning letters into numbers"],
    ["E = 5, J = 10, O = 15, T = 20, Y = 25 (EJOTY)", "finding any position quickly"],
    ["reverse position = 27 − position", "counting from Z, and the opposite letter"],
    ["opposite pairs: A-Z, B-Y, C-X, ..., M-N (positions add to 27)", "pair series such as AZ, BY"],
    ["k-th to the right of position p = p + k; to the left = p − k", "'which letter is ... to the right of ...'"],
    ["past Z, subtract 26 (wrap round)", "series that run off the end"],
    ["middle of p and q = (p + q) / 2", "letter midway between two letters"],
  ] },
  points: [
    "Write the positions above the letters before looking for a pattern.",
    "Check the gaps first: equal gaps, growing gaps, or two series taking turns.",
    "Groups of letters (BDF, HJL): find the rule inside a group and the jump between groups separately.",
    "Opposite letters always add to 27, so Z, Y, X pairs with A, B, C.",
    "For a wrong term, find the rule from most of the terms, then check each one.",
    "In repeating-pattern blanks, find the shortest block that repeats and fill from it.",
  ],
  diagram: `flowchart TB
  S["B, E, H, K, ?"] --> N["positions: 2, 5, 8, 11"]
  N --> D["gaps: +3, +3, +3"]
  D --> X["next: 11 + 3 = 14"]
  X --> A["14 = N"]:::ok`,
  caption: "Letters to numbers, find the gap, numbers back to a letter.",
  cards: [
    { id: "positions", q: `Which is the ${ord(ls.from)} letter from the left of the English alphabet, and which is the ${ord(ls.from)} from the right?`,
      table: { head: ["Letter", "E", "J", "O", "T", "Y"], rows: [["Position", "5", "10", "15", "20", "25"], ["From Z", ...[5, 10, 15, 20, 25].map((p) => `${27 - p}`)]] },
      a: steps(`From the left: position ${ls.from} = T − ${20 - ls.from} = **${L(ls.from)}**.`, `From the right: position 27 − ${ls.from} = ${27 - ls.from} = **${L(27 - ls.from)}**.`) },
    { id: "right-of", q: `Which letter is ${ord(ls.right[1])} to the right of the ${ord(ls.right[0])} letter from the left?`,
      a: steps(`The ${ord(ls.right[0])} letter is ${L(ls.right[0])}.`, `${ls.right[0]} + ${ls.right[1]} = ${ls.right[0] + ls.right[1]}: **${L(ls.right[0] + ls.right[1])}**.`) },
    { id: "middle", q: `Which letter is exactly midway between ${ls.mid[0]} and ${ls.mid[1]}?`,
      a: steps(`${ls.mid[0]} = ${pos(ls.mid[0])}, ${ls.mid[1]} = ${pos(ls.mid[1])}.`, `(${pos(ls.mid[0])} + ${pos(ls.mid[1])}) / 2 = ${(pos(ls.mid[0]) + pos(ls.mid[1])) / 2}: **${L((pos(ls.mid[0]) + pos(ls.mid[1])) / 2)}**.`) },
    { id: "step", q: `What comes next: ${ls.step.slice(0, 4).join(", ")}, ?`,
      a: steps(`Positions: ${ls.step.slice(0, 4).map(pos).join(", ")}.`, `Gaps: ${signed(diffs(ls.step.slice(0, 4).map(pos)))}.`, `Next: ${pos(ls.step[3])} + 3 = ${pos(ls.step[4])}: **${ls.step[4]}**.`) },
    { id: "grow", q: `What comes next: ${ls.grow.slice(0, 4).join(", ")}, ?`,
      a: steps(`Positions: ${ls.grow.slice(0, 4).map(pos).join(", ")}.`, `Gaps: ${signed(diffs(ls.grow.slice(0, 4).map(pos)))}: each gap is one bigger.`, `Next gap −5: ${pos(ls.grow[3])} − 5 = ${pos(ls.grow[4])}: **${ls.grow[4]}**.`) },
    { id: "alternate", q: `What comes next: ${ls.alt.slice(0, 6).join(", ")}, ?`,
      a: steps(`Odd places: ${ls.alt.filter((_, i) => i % 2 === 0).slice(0, 3).join(", ")} (+2 each).`, `Even places: ${ls.alt.filter((_, i) => i % 2).join(", ")} (−2 each).`, `The 7th term is in the odd series: **${ls.alt[6]}**.`),
      trap: "Reading it as one series gives wild gaps. When the gaps jump around, split odd and even places." },
    { id: "pairs", q: `What comes next: ${ls.pairs.slice(0, 3).join(", ")}, ?`,
      a: steps("First letters go A, B, C. Second letters go Z, Y, X.", "Each pair is a letter and its opposite: positions add to 27.", `Next: **${ls.pairs[3]}**.`) },
    { id: "groups", q: `What comes next: ${ls.groups.slice(0, 3).join(", ")}, ?`,
      a: steps("Inside each group the letters step by 2.", `Groups start at ${ls.groups.slice(0, 3).map((g) => `${g[0]} (${pos(g[0])})`).join(", ")}: +6 each time.`, `Next group starts at ${pos(ls.groups[3][0])}: **${ls.groups[3]}**.`) },
    { id: "missing", q: `Find the missing letter: ${ls.miss.map((x, i) => (i === 2 ? "?" : x)).join(", ")}.`,
      a: steps(`Positions: ${ls.miss.map((x, i) => (i === 2 ? "?" : pos(x))).join(", ")}.`, "The known gaps are 3, so the rule is +3.", `${pos(ls.miss[1])} + 3 = ${pos(ls.miss[2])}: **${ls.miss[2]}**.`) },
    { id: "wrong", q: `Which letter is wrong in the series ${lsWrongShown.join(", ")}?`,
      a: steps(`Positions: ${lsWrongShown.map(pos).join(", ")}.`, "Most gaps are +3, so the rule is +3.", `After ${lsWrongShown[2]} (${pos(lsWrongShown[2])}) should come ${pos(ls.wrong[3])} = ${ls.wrong[3]}, and ${ls.wrong[3]} + 3 = ${lsWrongShown[4]} confirms it.`, `Wrong: **${lsWrongShown[lsWrongI]}** (should be ${ls.wrong[lsWrongI]}).`) },
    { id: "rising", q: `What comes next: ${ls.rising.slice(0, 3).join(", ")}, ?`,
      a: steps("Each group is one letter longer: 2, 3, 4 letters.", "Between groups one letter is skipped: C after AB, G after DEF, L after HIJK.", `Next: 5 letters starting after L: **${ls.rising[3]}**.`) },
    { id: "fill", q: `Fill the blanks in order: ${lsFillShown}`,
      a: steps(`The block ${ls.fill.pat} repeats: ${lsFill.match(new RegExp(ls.fill.pat, "g"))!.join(" | ")}.`, `The blanks are places ${ls.fill.blanks.map((b) => b + 1).join(", ")}: **${ls.fill.blanks.map((b) => lsFill[b]).join("")}**.`) },
    { id: "reverse", q: `The alphabet is written in reverse order (Z first). Which letter is ${ord(ls.rev[1])} to the left of the ${ord(ls.rev[0])} letter from the right?`,
      a: steps(`Reversed, the right end is A, so the ${ord(ls.rev[0])} from the right is the ${ord(ls.rev[0])} letter of the normal alphabet: ${revFrom}.`, `Moving left in the reversed list goes towards Z, so add: ${ls.rev[0]} + ${ls.rev[1]} = ${ls.rev[0] + ls.rev[1]}.`, `Answer: **${revAns}**.`),
      trap: "Moving left in the reversed alphabet means later letters. Subtracting gives the wrong side." },
    { id: "word", q: `If the letters of ${ls.word} are arranged in alphabetical order, how many letters stay in the same place?`,
      a: steps(`Alphabetical order: ${sortedWord}.`, `Compare place by place: ${[...ls.word].map((c, i) => `${c}/${sortedWord[i]}`).join(", ")}.`, `Same place: ${stay.join(", ")}: **${stay.length}**.`) },
  ],
};
ok(ls.step[4] === "N" && ls.grow[4] === "L" && ls.alt[6] === "G" && ls.pairs[3] === "DW" && ls.groups[3] === "TVX" && ls.rising[3] === "MNOPQ", "letter series");

/* ---------- number series ---------- */
const PRIMES = Array.from({ length: 30 }, (_, i) => i + 2).filter((n) => Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d));
const series = (n: number, f: (i: number, prev: number[]) => number) => { const a: number[] = []; for (let i = 0; i < n; i++) a.push(f(i, a)); return a; };
const ns = {
  ap: series(5, (i) => 7 + 4 * i),
  d2: series(6, (i, a) => (i ? a[i - 1] + (2 * i - 1) : 3)),
  sq: series(6, (i) => (i + 1) ** 2 + 1),
  cube: series(5, (i) => (i + 1) ** 3 - 1),
  psq: PRIMES.slice(0, 6).map((p) => p * p),
  dbl: series(5, (i, a) => (i ? 2 * a[i - 1] + 1 : 3)),
  fact: series(6, (i, a) => (i ? a[i - 1] * i : 1)),
  mix: series(6, (i, a) => (i ? a[i - 1] * i + i : 5)),
  alt: series(7, (i) => (i % 2 ? 10 * ((i + 1) / 2) : 2 * (i / 2 + 1))),
  fib: series(6, (i, a) => (i < 2 ? [3, 4][i] : a[i - 1] + a[i - 2])),
  pow: series(6, (i, a) => (i ? a[i - 1] + 2 ** (i - 1) : 2)),
  miss: series(5, (i, a) => (i ? a[i - 1] + 3 + 2 * i : 6)),
  wrong: series(6, (i) => (i + 1) * (i + 2)),
  wrong2: series(6, (i, a) => (i ? a[i - 1] * (1 + 0.5 * i) : 4)),
};
const nsW1 = ns.wrong.map((x, i) => (i === 4 ? x + 1 : x)), nsW1i = wrongAt(nsW1, ns.wrong);
const nsW2 = ns.wrong2.map((x, i) => (i === 3 ? x + 2 : x)), nsW2i = wrongAt(nsW2, ns.wrong2);
ok(ns.mix[5] === 925 && ns.psq[5] === 169 && ns.fact[5] === 120 && ns.wrong2.every(Number.isInteger), "number series");
const show = (a: number[], k = a.length - 1) => `${a.slice(0, k).join(", ")}, ?`;

const NUMBER_SERIES: Chapter = {
  id: "number-series",
  title: "Number series",
  play: "play-number-series",
  summary: "Number series ask for the next, missing or wrong term. Try the cheap checks in a fixed order: differences, second differences, ratios, squares and cubes, then two series taking turns. One of them nearly always fits within a minute.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["equal differences: next = last + d", "arithmetic series"],
    ["differences grow by a fixed step: look at second differences", "3, 4, 7, 12, 19 (gaps 1, 3, 5, 7)"],
    ["equal ratios: next = last × r", "geometric series"],
    ["n², n³, n² ± 1, n³ ± 1", "terms close to squares or cubes"],
    [`primes: ${PRIMES.slice(0, 10).join(", ")}`, "series of primes, or squares of primes"],
    ["× a + b each step (×2 + 1, ×3 − 2)", "terms that roughly double or triple"],
    ["× 1 + 1, × 2 + 2, × 3 + 3, ...", "terms that explode quickly"],
    ["each term = sum of the two before", "Fibonacci-style series"],
    ["odd places and even places as two series", "terms that go up and down"],
  ] },
  points: [
    "Write the differences under the series every time. Most series give up there.",
    "If differences grow fast, try ratios; if ratios are close to whole numbers, try × a + b.",
    "Terms near 1, 4, 9, 16, 25 or 1, 8, 27, 64 point to squares or cubes.",
    "Up-and-down terms usually mean two series taking turns.",
    "For a wrong term, find the rule from the terms that agree, then generate the series and compare.",
    "Check your answer by extending the rule one more step: it should still fit.",
  ],
  diagram: `flowchart TB
  subgraph R1["step 1"]
    Q1["differences equal?"] --> A1["add the difference"]:::ok
  end
  subgraph R2["step 2"]
    Q2["second differences equal?"] --> A2["build the next difference"]:::ok
  end
  subgraph R3["step 3"]
    Q3["ratios equal or × a + b?"] --> A3["multiply, then add"]:::ok
  end
  subgraph R4["step 4"]
    Q4["near squares or cubes?"] --> A4["n² ± k or n³ ± k"]:::ok
  end
  subgraph R5["step 5"]
    Q5["goes up and down?"] --> A5["split odd and even places"]:::ok
  end
  R1 --> R2 --> R3 --> R4 --> R5`,
  caption: "Try the checks in this order. Each is quick, and the first one that fits is almost always the rule.",
  cards: [
    { id: "ap", q: `What comes next: ${show(ns.ap)}`, a: steps(`Differences: ${signed(diffs(ns.ap.slice(0, 4)))}.`, `Next: ${ns.ap[3]} + 4 = **${ns.ap[4]}**.`) },
    { id: "second", q: `What comes next: ${show(ns.d2)}`,
      a: steps(`Differences: ${signed(diffs(ns.d2.slice(0, 5)))}.`, "These grow by 2, so the next difference is 9.", `Next: ${ns.d2[4]} + 9 = **${ns.d2[5]}**.`) },
    { id: "squares", q: `What comes next: ${show(ns.sq)}`,
      a: steps(`Each term is one more than a square: ${ns.sq.slice(0, 5).map((x) => `${Math.sqrt(x - 1)}² + 1`).join(", ")}.`, `Next: 6² + 1 = **${ns.sq[5]}**.`) },
    { id: "cubes", q: `What comes next: ${show(ns.cube)}`,
      a: steps(`Each term is one less than a cube: ${ns.cube.slice(0, 4).map((x) => `${Math.round(Math.cbrt(x + 1))}³ − 1`).join(", ")}.`, `Next: 5³ − 1 = **${ns.cube[4]}**.`) },
    { id: "primes", q: `What comes next: ${show(ns.psq)}`,
      a: steps(`The terms are squares of ${PRIMES.slice(0, 5).join(", ")}: the primes.`, `The next prime is ${PRIMES[5]}, so ${PRIMES[5]}² = **${ns.psq[5]}**.`),
      trap: `36 (6²) or 144 (12²) skip the rule: 6 and 12 are not primes.` },
    { id: "double", q: `What comes next: ${show(ns.dbl)}`,
      a: steps(`Each term is twice the one before, plus 1: ${ns.dbl.slice(0, 4).map((x, i) => (i ? `${ns.dbl[i - 1]} × 2 + 1 = ${x}` : "")).filter(Boolean).join(", ")}.`, `Next: ${ns.dbl[3]} × 2 + 1 = **${ns.dbl[4]}**.`) },
    { id: "factorial", q: `What comes next: ${show(ns.fact)}`,
      a: steps("Multiply by 1, 2, 3, 4 in turn.", `Next: ${ns.fact[4]} × 5 = **${ns.fact[5]}**.`) },
    { id: "mixed", q: `What comes next: ${show(ns.mix)}`,
      a: steps(`Ratios are near 1, 2, 3, 4, so try × k + k: ${ns.mix.slice(1, 5).map((x, i) => `${ns.mix[i]} × ${i + 1} + ${i + 1} = ${x}`).join(", ")}.`, `Next: ${ns.mix[4]} × 5 + 5 = **${ns.mix[5]}**.`) },
    { id: "alternate", q: `What comes next: ${show(ns.alt)}`,
      a: steps(`Odd places: ${ns.alt.filter((_, i) => i % 2 === 0).slice(0, 3).join(", ")} (+2).`, `Even places: ${ns.alt.filter((_, i) => i % 2).join(", ")} (+10).`, `The 7th term is in the odd series: **${ns.alt[6]}**.`),
      trap: "The differences jump up and down. That is the sign of two series, not one." },
    { id: "fibonacci", q: `What comes next: ${show(ns.fib)}`,
      a: steps(`Each term is the sum of the two before: ${ns.fib.slice(2, 5).map((x, i) => `${ns.fib[i]} + ${ns.fib[i + 1]} = ${x}`).join(", ")}.`, `Next: ${ns.fib[3]} + ${ns.fib[4]} = **${ns.fib[5]}**.`) },
    { id: "doubling-gaps", q: `What comes next: ${show(ns.pow)}`,
      a: steps(`Differences: ${signed(diffs(ns.pow.slice(0, 5)))}. They double.`, `Next difference 16: ${ns.pow[4]} + 16 = **${ns.pow[5]}**.`) },
    { id: "missing", q: `Find the missing term: ${ns.miss.map((x, i) => (i === 2 ? "?" : x)).join(", ")}.`,
      a: steps(`Known gaps: ${ns.miss[1] - ns.miss[0]} at the start and ${ns.miss[4] - ns.miss[3]} at the end.`, "Odd gaps that grow by 2 fit: 5, 7, 9, 11.", `Missing: ${ns.miss[1]} + 7 = **${ns.miss[2]}**. Check: ${ns.miss[2]} + 9 = ${ns.miss[3]}.`) },
    { id: "wrong", q: `Which term is wrong: ${nsW1.join(", ")}?`,
      a: steps(`The terms fit n(n + 1): ${ns.wrong.map((x, i) => `${i + 1} × ${i + 2} = ${x}`).join(", ")}.`, `The ${ord(nsW1i + 1)} term should be ${ns.wrong[nsW1i]}.`, `Wrong: **${nsW1[nsW1i]}**.`) },
    { id: "wrong-ratio", q: `Which term is wrong: ${nsW2.join(", ")}?`,
      a: steps("Ratios between neighbours look like 1.5, 2, 2.5, ...: the multiplier grows by 0.5.", `Correct series: ${ns.wrong2.join(", ")}.`, `Wrong: **${nsW2[nsW2i]}** (should be ${ns.wrong2[nsW2i]}).`),
      trap: "When one term is wrong, two ratios look broken: the one into it and the one out of it. Fix the term, not two ratios." },
  ],
};

/* ---------- coding-decoding ---------- */
/** Shift every letter by k (or by k[i] at place i), wrapping round. */
export const shift = (w: string, k: number | ((i: number) => number)) => [...w].map((c, i) => L(pos(c) + (typeof k === "number" ? k : k(i)))).join("");
/** A ↔ Z, B ↔ Y, ...: each letter becomes its opposite. */
export const opposite = (w: string) => [...w].map((c) => L(27 - pos(c))).join("");
const VOWELS = "AEIOU";
const cd = {
  plus: ["MANGO", "APPLE", 2] as const, minus: ["TABLE", "CHAIR", -1] as const, opp: ["GOLD", "SILVER"] as const, inc: ["CODE", "WORD"] as const,
  revShift: ["PLANT", "CLOUD"] as const, sum: ["DOG", "CAT", "COW"] as const, fromEnd: "FACE",
  names: ["sky", "sea", "water", "air", "cloud"], vowel: "MOBILE", decodeK: 3, secret: "SHIP",
  digits: { R: 6, O: 8, S: 2, E: 1, C: 7, H: 3, A: 4, I: 5, P: 9 } as Record<string, number>, given: ["ROSE", "CHAIR", "PREACH"], target: "SEARCH",
};
const sum = (w: string) => [...w].reduce((a, c) => a + pos(c), 0);
const vowelCode = (w: string) => [...w].map((c) => L(pos(c) + (VOWELS.includes(c) ? 1 : -1))).join("");
const subst = (w: string) => cd.names[(cd.names.indexOf(w) + 1) % cd.names.length];
// sentence coding: each word has one code; sentences show their codes in sorted order, so position gives nothing away
const WORD_CODE: Record<string, string> = { eat: "la", fresh: "pi", food: "mo", is: "ru", good: "ta", people: "ne", tea: "so" };
const SENT = ["eat fresh food", "fresh food is good", "good people eat", "fresh tea"];
const coded = SENT.map((s) => s.split(" ").map((w) => WORD_CODE[w]).sort());
/** The code of a word, deduced only from the coded sentences: codes in every sentence that has the word, and in none that lacks it. */
export const deduce = (sent: string[], codes: string[][], word: string) => {
  const has = sent.map((s) => s.split(" ").includes(word));
  const c = codes.filter((_, i) => has[i]).reduce((a, b) => a.filter((x) => b.includes(x))).filter((x) => !codes.some((cs, i) => !has[i] && cs.includes(x)));
  ok(c.length === 1, `deduce ${word}: ${c}`);
  return c[0];
};
const dedFood = deduce(SENT, coded, "food"), dedPeople = deduce(SENT, coded, "people"), dedSo = Object.keys(WORD_CODE).filter((w) => SENT.some((s) => s.split(" ").includes(w))).find((w) => deduce(SENT, coded, w) === "so")!;
ok(dedFood === WORD_CODE.food && dedPeople === WORD_CODE.people && dedSo === "tea", "sentence codes");
// digit coding: rebuild the letter to digit map from the examples only, check it agrees with itself, then code the target
const learned = (() => {
  const m: Record<string, string> = {};
  for (const w of cd.given) { const code = [...w].map((c) => cd.digits[c]).join(""); [...w].forEach((c, i) => { ok(!m[c] || m[c] === code[i], "digit code"); m[c] = code[i]; }); }
  ok([...cd.target].every((c) => m[c]), "target letters all seen");
  return m;
})();
const digitCode = (w: string) => [...w].map((c) => learned[c]).join("");

const CODING: Chapter = {
  id: "coding",
  title: "Coding-decoding",
  play: "play-coding",
  summary: "A word is turned into a code by a hidden rule, and you apply the same rule to another word. Write the positions of the letters of the word and its code one above the other: the gap between them shows the rule.",
  table: { head: ["Formula", "Use it for"], rows: [
    ["code = letter + k (wrap past Z)", "fixed shift: MANGO → OCPIQ is +2"],
    ["code = letter + 1, + 2, + 3, ...", "shifts that grow with the place"],
    ["opposite letter: 27 − position", "A ↔ Z, B ↔ Y coding"],
    ["reverse the word, then shift", "codes that read backwards"],
    ["sum of positions", "number codes such as DOG = 26"],
    ["position from the end = 27 − position", "codes with A = 26, Z = 1"],
    ["same word in two coded sentences = the common code", "sentence coding"],
    ["'X is called Y': answer with the new name", "substitution questions"],
  ] },
  points: [
    "Write word and code in two rows of positions; the differences show the rule at once.",
    "If the differences are 27 − 2p for each letter, it is opposite-letter coding.",
    "If the first code letter matches the last word letter, the word was reversed first.",
    "Sentence coding: compare two sentences that share exactly one word; the shared code is that word.",
    "Substitution: find the real answer first, then give the name it is 'called'.",
    "Vowel and consonant rules: mark the vowels before you start.",
  ],
  diagram: `flowchart TB
  W["MANGO: 13, 1, 14, 7, 15"] --> K["code OCPIQ: 15, 3, 16, 9, 17"]
  K --> R["every letter +2"]:::hot
  R --> A["APPLE +2 = CRRNG"]:::ok`,
  caption: "Line up positions of the word and its code. A constant gap means a fixed shift; a growing gap means the shift depends on the place.",
  cards: [
    { id: "shift", q: `If ${cd.plus[0]} is coded as ${shift(cd.plus[0], cd.plus[2])}, how is ${cd.plus[1]} coded?`,
      a: steps(`${cd.plus[0]}: ${[...cd.plus[0]].map(pos).join(", ")}. Code: ${[...shift(cd.plus[0], cd.plus[2])].map(pos).join(", ")}.`, `Every letter moves +${cd.plus[2]}.`, `${cd.plus[1]} +${cd.plus[2]} = **${shift(cd.plus[1], cd.plus[2])}**.`) },
    { id: "back", q: `If ${cd.minus[0]} is written as ${shift(cd.minus[0], cd.minus[2])}, how is ${cd.minus[1]} written?`,
      a: steps("Each letter moves one back, and A wraps round to Z.", `${cd.minus[1]} −1 = **${shift(cd.minus[1], cd.minus[2])}**.`), trap: "A − 1 is Z, not a blank." },
    { id: "opposite", q: `If ${cd.opp[0]} is coded as ${opposite(cd.opp[0])}, how is ${cd.opp[1]} coded?`,
      a: steps(`${[...cd.opp[0]].map((c) => `${c} (${pos(c)}) → ${L(27 - pos(c))} (${27 - pos(c)})`).join(", ")}: positions add to 27.`, `So each letter becomes its opposite: **${opposite(cd.opp[1])}**.`) },
    { id: "growing", q: `If ${cd.inc[0]} is coded as ${shift(cd.inc[0], (i) => i + 1)}, how is ${cd.inc[1]} coded?`,
      a: steps(`Gaps: ${[...cd.inc[0]].map((c, i) => `${c} → ${shift(cd.inc[0], (j) => j + 1)[i]} (+${i + 1})`).join(", ")}.`, "The shift grows with the place: +1, +2, +3, +4.", `${cd.inc[1]}: **${shift(cd.inc[1], (i) => i + 1)}**.`) },
    { id: "reverse", q: `If ${cd.revShift[0]} is coded as ${shift(rev(cd.revShift[0]), 1)}, how is ${cd.revShift[1]} coded?`,
      a: steps(`The code starts with ${shift(rev(cd.revShift[0]), 1)[0]}, one after ${cd.revShift[0].at(-1)}, the last letter: the word is reversed (${rev(cd.revShift[0])}) and then shifted +1.`, `${cd.revShift[1]} reversed is ${rev(cd.revShift[1])}; +1 gives **${shift(rev(cd.revShift[1]), 1)}**.`) },
    { id: "sum", q: `If ${cd.sum[0]} = ${sum(cd.sum[0])} and ${cd.sum[1]} = ${sum(cd.sum[1])}, what is ${cd.sum[2]}?`,
      a: steps(`${cd.sum[0]}: ${[...cd.sum[0]].map(pos).join(" + ")} = ${sum(cd.sum[0])}. The code is the sum of positions.`, `${cd.sum[2]}: ${[...cd.sum[2]].map(pos).join(" + ")} = **${sum(cd.sum[2])}**.`) },
    { id: "from-end", q: `In a code each letter is replaced by its position counted from Z (A = 26, Z = 1). How is ${cd.fromEnd} written?`,
      a: steps(`Position from Z = 27 − position: ${[...cd.fromEnd].map((c) => `${c} → ${27 - pos(c)}`).join(", ")}.`, `Code: **${[...cd.fromEnd].map((c) => 27 - pos(c)).join("")}**.`) },
    { id: "called", q: `If ${cd.names.map((n, i) => `${n} is called ${cd.names[(i + 1) % cd.names.length]}`).join(", ")}, then where do fish swim?`,
      a: steps("Fish really swim in water.", `Water is called ${subst("water")}.`, `Answer: **${subst("water")}**.`),
      trap: "Answering 'water' ignores the code. Answering 'sea' renames the wrong word." },
    { id: "sentences", q: `In a code, ${SENT.map((s, i) => `"${s}" is written as "${coded[i].join(" ")}"`).join("; ")}. What are the codes for "food" and "people"?`,
      a: steps(`"food" is in sentences 1 and 2: common codes ${coded[0].filter((c) => coded[1].includes(c)).join(", ")}. One of them is "fresh", which also sits in sentence 4 with code ${WORD_CODE.fresh}.`, `So food = **${dedFood}**.`,
        `"people" is only in sentence 3 (${coded[2].join(", ")}). Remove "good" (${WORD_CODE.good}, also in sentence 2) and "eat" (${WORD_CODE.eat}, also in sentence 1): people = **${dedPeople}**.`) },
    { id: "sentences-2", q: "In the same code, which word is written as \"so\", and how would \"good tea\" be written?",
      a: steps(`"so" appears only in sentence 4 ("fresh tea"), and "fresh" is ${WORD_CODE.fresh}.`, `So "so" means **${dedSo}**.`, `"good" is ${WORD_CODE.good}, so "good tea" is **${[WORD_CODE.good, WORD_CODE.tea].join(" ")}** (in either order).`) },
    { id: "vowels", q: `In a code, each vowel is replaced by the next letter and each consonant by the letter before it. How is ${cd.vowel} written?`,
      a: steps(`Vowels in ${cd.vowel}: ${[...cd.vowel].filter((c) => VOWELS.includes(c)).join(", ")}.`, `${[...cd.vowel].map((c) => `${c} → ${vowelCode(c)}`).join(", ")}.`, `Code: **${vowelCode(cd.vowel)}**.`) },
    { id: "decode", q: `In a code CAT is written ${shift("CAT", cd.decodeK)}. Decode ${shift(cd.secret, cd.decodeK)}.`,
      a: steps(`CAT → ${shift("CAT", cd.decodeK)} is +${cd.decodeK}, so decoding is −${cd.decodeK}.`, `${shift(cd.secret, cd.decodeK)} −${cd.decodeK} = **${cd.secret}**.`) },
    { id: "digits", q: `If ${cd.given.map((w) => `${w} is coded ${[...w].map((c) => cd.digits[c]).join("")}`).join(", ")}, what is the code for ${cd.target}?`,
      a: steps("Each letter has its own digit. Read them off the examples, letter by letter.", `${[...cd.target].map((c) => `${c} = ${learned[c]}`).join(", ")}.`, `${cd.target} = **${digitCode(cd.target)}**.`),
      trap: "Check a letter that appears in two examples (R, A, C, H): it must get the same digit both times." },
  ],
};
ok(shift("MANGO", 2) === "OCPIQ" && opposite("GOLD") === "TLOW" && vowelCode("MOBILE") === "LPAJKF" && digitCode("SEARCH") === "214673", "coding");

export const LOGIC_CHAPTERS: Chapter[] = [CLOCKS, CALENDAR, DIRECTION, BLOOD, MIRROR, SEATING, VENN, SYLLOGISM, LETTER_SERIES, NUMBER_SERIES, CODING];
