// Interactive walk-throughs for the aptitude chapters (see flows-play.ts). Every number is computed from the learner's values.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { Flow, FlowTone, GridTable } from "./flows.ts";
import {
  DAYS, Family, L, MON, conText, dayName, handAngle, judge, mirrorTime, mlen, oddDays, pos, sayStmt, shift, towards, walk, type Stmt,
} from "./aptitude-logic.ts";

const mod = (a: number, n: number) => ((a % n) + n) % n;
/** A signed number with a real minus sign, and "+ 3" / "− 3" for sums. */
const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`), pm = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const pad = (m: number) => String(m).padStart(2, "0");

/* ---------- clocks: angle = |30H − 5.5M| ---------- */
function clocks(v: Record<string, number>): Flow {
  const { h, m } = v, H = h % 12, hour = 30 * H + 0.5 * m, min = 6 * m, raw = Math.abs(hour - min), ang = handAngle(h, m), t = `${h}:${pad(m)}`;
  const bars = (a: number, b: number, c: number, d: number, hot = -1, tone: FlowTone = "hot") =>
    [["hour hand", a], ["minute hand", b], ["gap", c], ["angle", d]].map(([label, value], i) => ({ label: label as string, value: value as number, ...(i === hot ? { tone } : {}) }));
  return { kind: "bars", title: `The angle between the hands at ${t}`, max: 360, format: (x) => `${Math.round(x * 2) / 2}°`, steps: [
    { note: `At ${t}, measure where each hand points in degrees from 12, going clockwise.`, bars: bars(0, 0, 0, 0) },
    { note: `The hour hand turns 30° an hour and 0.5° a minute: 30 × ${H} + 0.5 × ${m} = ${hour}°.${h === 12 ? " At 12 the hour counts as 0." : ""}`, tone: "hot", bars: bars(hour, 0, 0, 0, 0) },
    { note: `The minute hand turns 6° a minute: 6 × ${m} = ${min}°.`, tone: "hot", bars: bars(hour, min, 0, 0, 1) },
    { note: `The gap is |30H − 5.5M| = |${30 * H} − ${5.5 * m}| = ${raw}°.`, bars: bars(hour, min, raw, 0, 2) },
    ...(raw > 180 ? [{ note: `${raw}° is more than 180°, so the smaller angle is 360 − ${raw} = ${ang}°.`, tone: "warn" as const, bars: bars(hour, min, raw, ang, 3, "warn") }] : []),
    { note: `At ${t} the hands are ${ang}° apart.${ang === 0 ? " They lie on top of each other." : ang === 180 ? " They point in opposite directions." : ""}`, tone: "ok", bars: bars(hour, min, raw, ang, 3, "ok") },
  ] };
}

/* ---------- calendar: odd days, checked against the real calendar ---------- */
function calendar(v: Record<string, number>): Flow {
  const { d, m, y } = v, ml = mlen(y, m);
  if (d > ml) throw new PlayError(`${MON[m - 1]} ${y} has only ${ml} days. Pick an earlier day.`);
  const { rows, total } = oddDays(y, m, d);
  const done = y - 1, four = Math.floor(done / 400) * 400, cent = Math.floor((done % 400) / 100), rest = done % 100, leaps = Math.floor(rest / 4);
  const monDays = (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5, date = `${d} ${MON[m - 1]} ${y}`, r = mod(total, 7);
  const notes = [
    `Count the odd days (days left over after whole weeks) in the ${done} full years before ${y}. Every 400 years give 0, so the first ${four} years add nothing.`,
    ...(cent ? [`The next ${cent * 100} years give ${[0, 5, 3, 1][cent]} odd day${cent === 3 ? "" : "s"}: 100 years give 5, 200 give 3, 300 give 1.`] : []),
    `The last ${rest} years hold ${leaps} leap years, 1 odd day each plus 1 more per leap year: ${rest + leaps}, which leaves ${mod(rest + leaps, 7)} after dividing by 7.`,
    `Inside ${y}, 1 January to ${d} ${MON[m - 1]} is ${monDays} days, which leaves ${mod(monDays, 7)}.`,
    `Add them: ${total} odd days. ${total} mod 7 = ${r}, and counting from 0 = Sunday, ${r} is ${DAYS[r]}.`,
  ];
  const head = ["part", "odd days"], table = (k: number, tone: FlowTone): GridTable => ({ head, rows: rows.slice(0, k + 1), tones: { [`${k}`]: tone } });
  return { kind: "grid", title: `Which day was ${date}?`, steps: [
    ...rows.map((_, k) => ({ note: notes[k], ...(k === rows.length - 1 ? { tone: "hot" as const } : {}), tables: [table(k, "hot")] })),
    { note: `${date} falls on a ${dayName(y, m, d)}, and a real calendar agrees.`, tone: "ok", tables: [table(rows.length - 1, "ok")] },
  ] };
}

/* ---------- direction: walk on a grid, then Pythagoras ---------- */
function direction(v: Record<string, number>): Flow {
  const { a, b, c } = v, legs: [string, number][] = [["none", a], ["right", b], ["right", c]];
  const at = (k: number) => walk("north", legs.slice(0, k) as Parameters<typeof walk>[1]), end = at(3), { x, y } = end;
  const p = (k: number) => `(${sg(at(k).x)}, ${sg(at(k).y)})`, sq = x * x + y * y, dist = Number.isInteger(end.dist) ? `${end.dist}` : `√${sq} ≈ ${end.dist.toFixed(2)}`;
  const ns = y > 0 ? `${y} km north` : y < 0 ? `${-y} km south` : "no distance north or south";
  return { title: `North ${a} km, right ${b} km, right ${c} km`, steps: [
    { node: "start at (0, 0), facing north", note: "Put the start at (0, 0). East adds to x and north adds to y." },
    { node: `walk ${a} km north: ${p(1)}`, note: `Walking north adds ${a} to y.` },
    { node: `turn right, walk ${b} km east: ${p(2)}`, note: `Facing north, a right turn points east. Walking east adds ${b} to x.` },
    { node: `turn right, walk ${c} km south: ${p(3)}`, note: `Facing east, a right turn points south. Walking south takes ${c} from y, so y is ${a} − ${c} = ${sg(y)}.`, tone: "hot" },
    { node: `offset: ${x} km east, ${ns}`, note: `Read the end point ${p(3)}: ${x} km east and ${ns} of the start.` },
    ...(y ? [{ node: `√(${x}² + ${Math.abs(y)}²) = ${dist} km`, note: `The straight line back is the long side of a right triangle: √(${x * x} + ${y * y}) = ${dist} km.`, tone: "hot" as const }] : []),
    { node: `${dist} km ${towards(x, y)}, facing ${end.face}`, note: `The walker ends ${dist} km to the ${towards(x, y)} of the start, facing ${end.face}.`, tone: "ok" },
  ] };
}

/* ---------- blood relations: walk up and down a family tree ---------- */
const TREE = [["Ramesh", "Sita", "", ""], ["Mohan", "Gita", "Lata", "Ravi"], ["Asha", "Vikram", "Kabir", ""], ["Dev", "Tara", "", ""], ["Mira", "", "", ""]];
const FAM = new Family().male("Ramesh", "Mohan", "Ravi", "Vikram", "Kabir", "Dev").female("Sita", "Gita", "Lata", "Asha", "Tara", "Mira")
  .marry("Ramesh", "Sita").parent("Ramesh", "Mohan", "Lata").marry("Mohan", "Gita").marry("Lata", "Ravi")
  .parent("Mohan", "Asha", "Vikram").parent("Lata", "Kabir").parent("Asha", "Dev").parent("Vikram", "Tara").parent("Dev", "Mira");
/** Going down from an ancestor, take the branch away from Asha (her brother's line, or her aunt's). */
const DOWN: Record<string, string[]> = { Asha: ["Dev", "Mira"], Mohan: ["Vikram", "Tara"], Ramesh: ["Lata", "Kabir"] };
const cell = (name: string) => { const r = TREE.findIndex((row) => row.includes(name)); return `${r}:${TREE[r].indexOf(name)}`; };
const relTo = (a: string, b: string) => FAM.rel(a, b) ?? (() => { throw new Error(`blood play: ${a} to ${b}`); })();
function blood(v: Record<string, number>): Flow {
  const { up, down } = v;
  if (!up && !down) throw new PlayError("Move at least one generation up or down from Asha.");
  const ups = ["Asha", "Mohan", "Ramesh"].slice(0, up + 1), path = [...ups, ...DOWN[ups[up]].slice(0, down)], target = path.at(-1)!;
  const table = (k: number, last: FlowTone = "hot"): GridTable => ({ label: "Family tree, one row per generation", rows: TREE, tones: Object.fromEntries(path.slice(0, k + 1).map((p, i) => [cell(p), i === k ? last : "hot"])) });
  const move = (k: number) => {
    const [from, to] = [path[k - 1], path[k]], goingUp = k <= up;
    return goingUp ? `Up one generation: ${from}'s ${relTo(to, from)} is ${to}.`
      : `Down one generation${k === up + 1 && up ? `, on the branch away from ${path[k - 2]}` : ""}: ${from}'s ${relTo(to, from)} is ${to}.`;
  };
  return { kind: "grid", title: `${up} up and ${down} down from Asha`, steps: [
    { note: `Start at Asha. Couples sit side by side; children are in the row below their parents.`, tables: [table(0)] },
    ...path.slice(1).map((_, i) => ({ note: move(i + 1), tables: [table(i + 1)] })),
    { note: `Read the path: ${target} is Asha's ${relTo(target, "Asha")}.`, tone: "ok", tables: [table(path.length - 1, "ok")] },
    { note: `Turn it round: Asha is ${target}'s ${relTo("Asha", target)}.`, tone: "ok", tables: [table(path.length - 1, "ok")] },
  ] };
}

/* ---------- mirror clock: 11:60 − time ---------- */
function mirror(v: Record<string, number>): Flow {
  const { h, m } = v, t = `${h}:${pad(m)}`, base = h === 12 ? 23 : 11, carry = m === 0, mOut = carry ? 0 : 60 - m, hRaw = base - h + (carry ? 1 : 0), hOut = hRaw || 12;
  const got = `${hOut}:${pad(mOut)}`, want = mirrorTime(h, m);
  if (got !== want) throw new Error(`mirror play: ${t} gives ${got}, expected ${want}`);
  const rowHead = ["start", "take away", "mirror"], head = ["hours", "minutes"];
  const tbl = (rows: (string | number)[][], tones: Record<string, FlowTone> = {}): GridTable => ({ head, rowHead: rowHead.slice(0, rows.length), rows, tones });
  const start = [`${base}`, "60"], minus = [`− ${h}`, `− ${pad(m)}`];
  return { kind: "grid", title: `${t} in a mirror`, steps: [
    { note: h === 12 ? "A time in the 12 o'clock hour uses 23:60 (that is 24:00) instead of 11:60, so the hours can be taken away." : "A clock and its mirror image add up to 12:00. Write 12:00 as 11:60 so the minutes can be taken away.", tables: [tbl([start], { "0": "hot" })] },
    { note: `Take away the time on the clock, ${t}.`, tables: [tbl([start, minus], { "1": "hot" })] },
    { note: carry ? "60 − 0 = 60 minutes, a full hour: write 00 and carry 1 to the hours." : `Minutes: 60 − ${m} = ${mOut}.`, tone: carry ? "warn" : "hot", tables: [tbl([start, minus, ["", pad(mOut)]], { "2:1": carry ? "warn" : "hot" })] },
    { note: `Hours: ${base} − ${h}${carry ? " + 1" : ""} = ${hRaw}.${hRaw ? "" : " A dial has no 0, so it reads 12."}`, tone: "hot", tables: [tbl([start, minus, [`${hOut}`, pad(mOut)]], { "2:0": "hot" })] },
    { note: `The mirror shows ${want}. Check: ${t} and ${want} add up to ${h === 12 ? "24:00" : "12:00"}.`, tone: "ok", tables: [tbl([start, minus, [`${hOut}`, pad(mOut)]], { "2": "ok" })] },
  ] };
}

/* ---------- seating: n! in a row, (n − 1)! round a table ---------- */
function seating(v: Record<string, number>): Flow {
  const { n } = v, seats = Array.from({ length: n }, (_, i) => `${i + 1}`), choices = seats.map((_, i) => n - i);
  const prod = (k: number) => Array.from({ length: k }, (_, i) => k - i).join(" × ");
  const row = (k: number, tones: Record<string, FlowTone> = {}): GridTable => ({ label: "in a row: choices per seat", head: seats, rows: [choices.map((c, i) => (i < k ? c : ""))], tones });
  const ring = (k: number, tones: Record<string, FlowTone> = {}): GridTable => ({ label: "round a table: choices per seat", head: seats, rows: [choices.map((c, i) => (i === 0 && k ? "fix" : i < k ? c : ""))], tones });
  return { kind: "grid", title: `${n} people in a row and round a table`, steps: [
    { note: `${n} people and ${n} seats in a row. The first seat can take any of the ${n}.`, tables: [row(1, { "0:0": "hot" }), ring(0)] },
    { note: `Each next seat has one person fewer left to choose from: ${choices.join(", ")}.`, tables: [row(n, { "0": "hot" }), ring(0)] },
    { note: `Multiply the choices: ${n}! = ${prod(n)} = ${fact(n)} ways in a row.`, tone: "hot", tables: [row(n, { "0": "ok" }), ring(0)] },
    { note: "Round a table, moving everyone one seat along gives the same seating. So fix one person's seat first.", tone: "warn", tables: [row(n), ring(1, { "0:0": "warn" })] },
    { note: `The other ${n - 1} people fill the remaining seats: ${prod(n - 1)}.`, tables: [row(n), ring(n, { "0": "hot" })] },
    { note: `${n - 1}! = ${fact(n - 1)} ways round the table. That is ${fact(n)} / ${n}: each round seating appeared ${n} times among the row seatings.`, tone: "ok", tables: [row(n), ring(n, { "0": "ok" })] },
  ] };
}

/* ---------- Venn: fill the overlap first ---------- */
function venn(v: Record<string, number>): Flow {
  const { a, b, ab } = v;
  if (ab > Math.min(a, b)) throw new PlayError(`"Both" cannot be more than the smaller group (${Math.min(a, b)}). Lower "both" or raise the groups.`);
  const oa = a - ab, ob = b - ab, u = a + b - ab;
  const bars = (x: number, y: number, z: number, w: number, hot = -1, tone: FlowTone = "hot") =>
    [["only cricket", x], ["both", y], ["only football", z], ["at least one", w]].map(([label, value], i) => ({ label: label as string, value: value as number, ...(i === hot ? { tone } : {}) }));
  return { kind: "bars", title: `Cricket ${a}, football ${b}, both ${ab}`, max: Math.max(1, u), format: (x) => `${Math.round(x)}`, steps: [
    { note: `${a} play cricket, ${b} play football and ${ab} play both. Fill the middle region first: ${ab}.`, tone: "hot", bars: bars(0, ab, 0, 0, 1) },
    { note: `Only cricket = cricket − both = ${a} − ${ab} = ${oa}.`, bars: bars(oa, ab, 0, 0, 0) },
    { note: `Only football = football − both = ${b} − ${ab} = ${ob}.`, bars: bars(oa, ab, ob, 0, 2) },
    { note: `At least one game: ${a} + ${b} counts the ${ab} in the middle twice, so take them away once: ${a} + ${b} − ${ab} = ${u}.`, tone: "hot", bars: bars(oa, ab, ob, u, 3) },
    { note: `Check: the regions add up, ${oa} + ${ab} + ${ob} = ${u}. Exactly one game: ${oa} + ${ob} = ${oa + ob}.`, tone: "ok", bars: bars(oa, ab, ob, u, 3, "ok") },
  ] };
}

/* ---------- syllogism: test each conclusion over every picture ---------- */
const QS = ["all", "some", "no", "somenot"] as const;
function syllogism(v: Record<string, number>): Flow {
  const prem: Stmt[] = [[QS[v.s1 - 1], "pens", "books"], [QS[v.s2 - 1], "books", "bags"]];
  const cons = QS.map((q) => ({ st: [q, "pens", "bags"] as Stmt }));
  const must = judge(prem, cons).v, may = judge(prem, cons.map((c) => ({ ...c, may: true }))).v;
  const verdict = cons.map((_, i) => (must[i] ? "follows" : may[i] ? "possible" : "false"));
  const tone = (i: number): FlowTone => (must[i] ? "ok" : may[i] ? "warn" : "bad");
  const why = (i: number) => `${conText(cons[i])}: ${must[i] ? "true in every picture that fits both statements, so it follows." : may[i] ? "true in some pictures and false in others, so it does not follow. It is only a possibility." : "no picture that fits allows it, so it is false."}`;
  const table = (k: number): GridTable => ({ head: ["conclusion", "verdict"], rows: cons.map((c, i) => [sayStmt(c.st), i < k ? verdict[i] : "?"]), tones: Object.fromEntries(cons.slice(0, k).map((_, i) => [`${i}`, tone(i)])) });
  const ok = cons.filter((_, i) => must[i]).map((c) => sayStmt(c.st));
  const either = [[1, 2], [0, 3]].filter(([i, j]) => judge(prem, [cons[i], cons[j]]).verdict === "either I or II follows").map(([i, j]) => `${sayStmt(cons[i].st)} or ${sayStmt(cons[j].st).toLowerCase()}`);
  return { kind: "grid", title: `${sayStmt(prem[0])}; ${sayStmt(prem[1]).toLowerCase()}`, steps: [
    { note: `Statement 1: ${sayStmt(prem[0])}. Statement 2: ${sayStmt(prem[1])}. Test each conclusion about pens and bags against every picture that fits.`, tables: [table(0)] },
    ...cons.map((_, i) => ({ note: why(i), tone: tone(i), tables: [table(i + 1)] })),
    { note: ok.length ? `${ok.length > 1 ? "These follow" : "This follows"}: ${ok.join("; ")}.` : `No conclusion about pens and bags follows.${either.length ? ` But one of a pair must be true: ${either.join("; ")}. That is an either-or answer.` : ""}`, tone: "ok", tables: [table(4)] },
  ] };
}

/* ---------- letter series: positions, a fixed step, wrap round ---------- */
function letterSeries(v: Record<string, number>): Flow {
  const { start, step } = v;
  if (!step) throw new PlayError("A step of 0 repeats the same letter. Pick any other step.");
  const ps = [start];
  for (let i = 1; i < 6; i++) ps.push(mod(ps[i - 1] + step - 1, 26) + 1);
  const ls = ps.map(L), head = ps.map((_, i) => `${i + 1}`);
  const table = (k: number, tone: FlowTone = "hot"): GridTable => ({ head, rowHead: ["letter", "position"], rows: [ls.map((c, i) => (i <= k ? c : i === 5 ? "?" : "")), ps.map((p, i) => (i <= k ? p : ""))], tones: { [`:${k}`]: tone } });
  const say = (i: number) => {
    const raw = ps[i - 1] + step, fix = raw > 26 ? `, past Z, so take away 26: ${raw - 26}` : raw < 1 ? `, before A, so add 26: ${raw + 26}` : "";
    return `${ps[i - 1]} ${pm(step)} = ${raw}${fix}, which is ${ls[i]}.`;
  };
  return { kind: "grid", title: `Start at ${ls[0]}, step ${sg(step)}`, steps: [
    { note: `Turn letters into positions, A = 1 to Z = 26. The series starts at ${ls[0]}, position ${start}, and every term moves ${sg(step)}.`, tables: [table(0)] },
    ...[1, 2, 3, 4].map((i) => ({ note: `Term ${i + 1}: ${say(i)}`, tables: [table(i)] })),
    { note: `The missing term: ${say(5)} The series is ${ls.join(", ")}.`, tone: "ok", tables: [table(5, "ok")] },
  ] };
}

/* ---------- number series: differences, and differences of differences ---------- */
function numberSeries(v: Record<string, number>): Flow {
  const { a, d, g } = v;
  if (!d && !g) throw new PlayError("With a gap of 0 that never grows, every term is the same. Change the gap or its growth.");
  const gaps = Array.from({ length: 5 }, (_, i) => d + g * i), ts = [a];
  gaps.forEach((x, i) => ts.push(ts[i] + x));
  const head = ts.map((_, i) => `${i + 1}`);
  const table = (k: number, tone: FlowTone = "hot"): GridTable => ({ head, rowHead: ["term", "gap"], rows: [ts.map((t, i) => (i <= k ? t : i === 5 ? "?" : "")), ts.map((_, i) => (i && i <= k ? sg(gaps[i - 1]) : ""))], tones: { [`:${k}`]: tone } });
  const say = (i: number) => `${i > 1 && g ? `the gap grows by ${g} to ${sg(gaps[i - 1])}, so ` : ""}${ts[i - 1]} ${pm(gaps[i - 1])} = ${ts[i]}.`;
  return { kind: "grid", title: `Start ${a}, gap ${sg(d)}, gap grows by ${g}`, steps: [
    { note: `The series starts at ${a}. Write the gaps under the terms: the first gap is ${sg(d)}${g ? `, and each gap is ${g} more than the one before` : ", and every gap is the same"}.`, tables: [table(0)] },
    ...[1, 2, 3, 4].map((i) => ({ note: `Term ${i + 1}: ${say(i)}`, tables: [table(i)] })),
    { note: `The missing term: ${say(5)} ${g ? `The second differences are all ${g}.` : `The differences are all ${sg(d)}.`}`, tone: "ok", tables: [table(5, "ok")] },
  ] };
}

/* ---------- coding: shift each letter by k, plus g more per place ---------- */
const WORD = "PLANET";
function coding(v: Record<string, number>): Flow {
  const { k, g } = v;
  if (!k && !g) throw new PlayError("A shift of 0 leaves the word as it is. Pick a shift or a growth.");
  const by = (i: number) => k + g * i, code = shift(WORD, by);
  const letter = (c: string, i: number) => {
    const raw = pos(c) + by(i), fix = raw > 26 ? `, − 26 = ${raw - 26}` : raw < 1 ? `, + 26 = ${raw + 26}` : "";
    return { node: `${c} = ${pos(c)}, ${pm(by(i))} = ${raw}${fix}: ${code[i]}`, note: `${c} is letter ${pos(c)}. Shift it by ${sg(by(i))}${fix ? (raw > 26 ? " and wrap past Z" : " and wrap before A") : ""} to get ${code[i]}.` };
  };
  return { title: `${WORD} with a shift of ${sg(k)}${g ? `, growing by ${g}` : ""}`, steps: [
    { node: `${WORD}: shift every letter`, note: `Write each letter's position (A = 1), add the shift${g ? `, which starts at ${sg(k)} and grows by ${g} each place` : ` of ${sg(k)}`}, and wrap round the alphabet.` },
    ...[...WORD].map((c, i) => ({ ...letter(c, i), ...(i === WORD.length - 1 ? { tone: "hot" as const } : {}) })),
    { node: `${WORD} → ${code}`, note: `Put the new letters together: ${WORD} is coded as ${code}.`, tone: "ok" },
  ] };
}

export const PLAY: Record<string, PlayFlow> = {
  "play-clocks": { title: "Angle between the hands", knobs: [
    { key: "h", label: "Hour", min: 1, max: 12, value: 4 },
    { key: "m", label: "Minutes", min: 0, max: 59, value: 20, unit: " min" },
  ], make: clocks },
  "play-calendar": { title: "Day of the week by odd days", knobs: [
    { key: "d", label: "Day", min: 1, max: 31, value: 15 },
    { key: "m", label: "Month", min: 1, max: 12, value: 8 },
    { key: "y", label: "Year", min: 1600, max: 2400, value: 1947 },
  ], make: calendar },
  "play-direction": { title: "Distance and direction from the start", knobs: [
    { key: "a", label: "Walks north", min: 1, max: 15, value: 10, unit: " km" },
    { key: "b", label: "Turns right, walks", min: 1, max: 15, value: 6, unit: " km" },
    { key: "c", label: "Turns right again, walks", min: 1, max: 15, value: 2, unit: " km" },
  ], make: direction },
  "play-blood": { title: "Reading a relation off a family tree", knobs: [
    { key: "up", label: "Generations up from Asha", min: 0, max: 2, value: 2 },
    { key: "down", label: "Then generations down", min: 0, max: 2, value: 2 },
  ], make: blood },
  "play-mirror": { title: "A clock in a mirror", knobs: [
    { key: "h", label: "Hour", min: 1, max: 12, value: 7 },
    { key: "m", label: "Minutes", min: 0, max: 59, value: 25, unit: " min" },
  ], make: mirror },
  "play-seating": { title: "Arrangements in a row and round a table", knobs: [
    { key: "n", label: "People", min: 3, max: 8, value: 5 },
  ], make: seating },
  "play-venn": { title: "Two overlapping groups", knobs: [
    { key: "a", label: "Play cricket", min: 5, max: 60, value: 35 },
    { key: "b", label: "Play football", min: 5, max: 60, value: 28 },
    { key: "ab", label: "Play both", min: 0, max: 30, value: 12 },
  ], make: venn },
  "play-syllogism": { title: "Which conclusions follow", knobs: [
    { key: "s1", label: "Pens and books (1 All, 2 Some, 3 No, 4 Some not)", min: 1, max: 4, value: 2 },
    { key: "s2", label: "Books and bags (1 All, 2 Some, 3 No, 4 Some not)", min: 1, max: 4, value: 1 },
  ], make: syllogism },
  "play-letter-series": { title: "A letter series from a start and a step", knobs: [
    { key: "start", label: "Start position (A = 1)", min: 1, max: 26, value: 2 },
    { key: "step", label: "Step", min: -6, max: 8, value: 3 },
  ], make: letterSeries },
  "play-number-series": { title: "A number series from its gaps", knobs: [
    { key: "a", label: "First term", min: 1, max: 30, value: 3 },
    { key: "d", label: "First gap", min: -5, max: 10, value: 1 },
    { key: "g", label: "Gap grows by", min: 0, max: 4, value: 2 },
  ], make: numberSeries },
  "play-coding": { title: "Coding by shifting letters", knobs: [
    { key: "k", label: "Shift", min: -5, max: 8, value: 2 },
    { key: "g", label: "Extra shift per place", min: 0, max: 2, value: 0 },
  ], make: coding },
};
