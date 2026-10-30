// Pure simulators behind the "Other" labs. Every number a lab shows comes from here, never typed by hand,
// and lib/other/other.check.ts asserts them against known textbook results.

/* ---------- OS: page replacement ---------- */
export type PageAlgo = "fifo" | "lru" | "opt";
export type PageStep = { page: number; frames: (number | null)[]; hit: boolean; evicted: number | null };

export function pageReplace(refs: number[], nFrames: number, algo: PageAlgo): { steps: PageStep[]; faults: number } {
  const frames: (number | null)[] = Array(nFrames).fill(null);
  const loaded: number[] = [], lastUse = new Map<number, number>();
  const steps: PageStep[] = [];
  let faults = 0;
  refs.forEach((page, t) => {
    const hit = frames.includes(page);
    let evicted: number | null = null;
    if (!hit) {
      faults++;
      let slot = frames.indexOf(null);
      if (slot < 0) {
        let victim: number;
        if (algo === "fifo") victim = loaded.shift()!;
        else if (algo === "lru") victim = (frames as number[]).reduce((a, b) => (lastUse.get(a)! <= lastUse.get(b)! ? a : b));
        else {
          // optimal: evict the page used farthest in the future (or never again)
          const next = (p: number) => { const i = refs.indexOf(p, t + 1); return i < 0 ? Infinity : i; };
          victim = (frames as number[]).reduce((a, b) => (next(b) > next(a) ? b : a));
        }
        slot = frames.indexOf(victim);
        evicted = victim;
        if (algo !== "fifo") loaded.splice(loaded.indexOf(victim), 1);
      }
      frames[slot] = page;
      loaded.push(page);
    }
    lastUse.set(page, t);
    steps.push({ page, frames: [...frames], hit, evicted });
  });
  return { steps, faults };
}

/* ---------- OS: CPU scheduling ---------- */
export type Proc = { id: string; arrival: number; burst: number; priority: number };
export type SchedAlgo = "fcfs" | "sjf" | "srtf" | "rr" | "priority";
export type Slice = { id: string | null; start: number; end: number };
export type ProcStat = { id: string; completion: number; turnaround: number; waiting: number; response: number };

export function schedule(procs: Proc[], algo: SchedAlgo, quantum = 2): { gantt: Slice[]; stats: ProcStat[]; avgWait: number; avgTurn: number } {
  const left = new Map(procs.map((p) => [p.id, p.burst])), firstRun = new Map<string, number>(), done = new Map<string, number>();
  const raw: Slice[] = [];
  const order = [...procs].sort((a, b) => a.arrival - b.arrival);
  let t = 0;
  const push = (id: string | null, start: number, end: number) => { if (end > start) raw.push({ id, start, end }); };
  const ready = () => order.filter((p) => p.arrival <= t && left.get(p.id)! > 0);
  const run = (p: Proc, len: number) => {
    if (!firstRun.has(p.id)) firstRun.set(p.id, t);
    push(p.id, t, t + len); t += len;
    left.set(p.id, left.get(p.id)! - len);
    if (left.get(p.id) === 0) done.set(p.id, t);
  };
  const nextArrival = () => Math.min(...order.filter((p) => left.get(p.id)! > 0).map((p) => p.arrival));

  if (algo === "rr") {
    const queue: Proc[] = [], seen = new Set<string>();
    const admit = () => { for (const p of order) if (p.arrival <= t && !seen.has(p.id)) { queue.push(p); seen.add(p.id); } };
    admit();
    while (done.size < procs.length) {
      if (!queue.length) { const n = nextArrival(); push(null, t, n); t = n; admit(); continue; }
      const p = queue.shift()!;
      run(p, Math.min(quantum, left.get(p.id)!));
      admit();                                   // arrivals during the slice join before the preempted process
      if (left.get(p.id)! > 0) queue.push(p);
    }
  } else {
    while (done.size < procs.length) {
      const r = ready();
      if (!r.length) { const n = nextArrival(); push(null, t, n); t = n; continue; }
      const key = (p: Proc) => (algo === "fcfs" ? p.arrival : algo === "priority" ? p.priority : left.get(p.id)!);
      const p = r.reduce((a, b) => (key(b) < key(a) ? b : a));     // ties keep the earlier arrival
      if (algo === "srtf") {
        // run until it finishes or until the next arrival, then decide again
        const later = order.filter((q) => q.arrival > t && left.get(q.id)! > 0).map((q) => q.arrival);
        run(p, Math.min(left.get(p.id)!, later.length ? Math.min(...later) - t : Infinity));
      } else run(p, left.get(p.id)!);
    }
  }
  const gantt: Slice[] = [];
  for (const s of raw) { const prev = gantt[gantt.length - 1]; if (prev && prev.id === s.id && prev.end === s.start) prev.end = s.end; else gantt.push({ ...s }); }
  const stats = procs.map((p) => {
    const completion = done.get(p.id)!, turnaround = completion - p.arrival;
    return { id: p.id, completion, turnaround, waiting: turnaround - p.burst, response: firstRun.get(p.id)! - p.arrival };
  });
  const avg = (k: "waiting" | "turnaround") => stats.reduce((s, x) => s + x[k], 0) / stats.length;
  return { gantt, stats, avgWait: avg("waiting"), avgTurn: avg("turnaround") };
}

/* ---------- OS: Banker's safety algorithm ---------- */
export type BankerStep = { work: number[]; pick: number | null; note: string };

export function bankerSafety(avail: number[], max: number[][], alloc: number[][]) {
  const need = max.map((row, i) => row.map((m, j) => m - alloc[i][j]));
  const work = [...avail], finished = max.map(() => false), order: number[] = [];
  const steps: BankerStep[] = [{ work: [...work], pick: null, note: "Work = Available" }];
  for (let round = 0; round < max.length; round++) {
    const i = need.findIndex((n, k) => !finished[k] && n.every((v, j) => v <= work[j]));
    if (i < 0) break;
    alloc[i].forEach((a, j) => (work[j] += a));
    finished[i] = true; order.push(i);
    steps.push({ work: [...work], pick: i, note: `P${i} can finish (Need ≤ Work), then releases its allocation` });
  }
  const safe = finished.every(Boolean);
  if (!safe) steps.push({ work: [...work], pick: null, note: "No remaining process fits: unsafe state" });
  return { need, safe, order, steps };
}

/* ---------- CN: sliding window ---------- */
export type Tx = { seq: number; ok: boolean };   // ok = false: this copy was lost
export function slidingWindow(n: number, w: number, lose: number[], mode: "gbn" | "sr") {
  const lostOnce = new Set(lose), received = new Set<number>(), rounds: Tx[][] = [];
  let base = 0, sent = 0;
  while (base < n && rounds.length < 50) {
    const round: Tx[] = [];
    let expected = base;                           // GBN receiver: next in-order sequence number
    for (let s = base; s < Math.min(base + w, n); s++) {
      if (mode === "sr" && received.has(s)) continue;
      sent++;
      const ok = !lostOnce.has(s);
      lostOnce.delete(s);                          // only the first copy is lost
      round.push({ seq: s, ok });
      if (mode === "sr") { if (ok) received.add(s); }
      else if (ok && s === expected) { received.add(s); expected++; }   // GBN discards anything out of order
    }
    rounds.push(round);
    while (received.has(base)) base++;
  }
  return { rounds, sent };
}

/* ---------- CN: IPv4 subnetting ---------- */
const toInt = (ip: string) => ip.split(".").reduce((a, o) => a * 256 + Number(o), 0);
export const toIp = (n: number) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
export const validIp = (ip: string) => /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip) && ip.split(".").every((o) => +o <= 255);

export function subnet(ip: string, prefix: number) {
  const n = toInt(ip), size = 2 ** (32 - prefix);
  const network = Math.floor(n / size) * size, broadcast = network + size - 1;
  const hosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : size - 2;     // /31 point-to-point links (RFC 3021), /32 a single host
  const first = prefix >= 31 ? network : network + 1, last = prefix >= 31 ? broadcast : broadcast - 1;
  const mask = 2 ** 32 - size;
  const o1 = Math.floor(n / 2 ** 24);
  const cls = o1 < 128 ? "A" : o1 < 192 ? "B" : o1 < 224 ? "C" : o1 < 240 ? "D (multicast)" : "E (reserved)";
  const o2 = Math.floor(n / 2 ** 16) % 256;
  const isPrivate = o1 === 10 || (o1 === 172 && o2 >= 16 && o2 <= 31) || (o1 === 192 && o2 === 168);
  const bits = n.toString(2).padStart(32, "0");
  return { network: toIp(network), broadcast: toIp(broadcast), first: toIp(first), last: toIp(last), hosts, mask: toIp(mask), wildcard: toIp(size - 1), cls, isPrivate, bits, size };
}

export function splitSubnet(ip: string, prefix: number, newPrefix: number) {
  const base = toInt(subnet(ip, prefix).network), size = 2 ** (32 - newPrefix), count = 2 ** (newPrefix - prefix);
  return Array.from({ length: Math.min(count, 64) }, (_, i) => {
    const net = base + i * size;
    return { network: `${toIp(net)}/${newPrefix}`, range: newPrefix >= 31 ? `${toIp(net)} - ${toIp(net + size - 1)}` : `${toIp(net + 1)} - ${toIp(net + size - 2)}`, broadcast: toIp(net + size - 1) };
  });
}

/* ---------- DBMS: B+ tree insert ---------- */
export type BNode = { keys: number[]; children?: BNode[] };
export type BSnap = { levels: number[][][]; note: string };

function insertRec(node: BNode, key: number, maxKeys: number): { up: number; right: BNode } | null {
  if (!node.children) {
    if (node.keys.includes(key)) return null;
    node.keys.push(key); node.keys.sort((a, b) => a - b);
    if (node.keys.length <= maxKeys) return null;
    const mid = Math.ceil(node.keys.length / 2);
    const right: BNode = { keys: node.keys.slice(mid) };
    node.keys = node.keys.slice(0, mid);
    return { up: right.keys[0], right };                     // leaf split: the separator is COPIED up
  }
  let i = node.keys.findIndex((k) => key < k);
  if (i < 0) i = node.keys.length;
  const res = insertRec(node.children[i], key, maxKeys);
  if (!res) return null;
  node.keys.splice(i, 0, res.up);
  node.children.splice(i + 1, 0, res.right);
  if (node.keys.length <= maxKeys) return null;
  const mid = Math.floor(node.keys.length / 2);
  const up = node.keys[mid];
  const right: BNode = { keys: node.keys.slice(mid + 1), children: node.children.slice(mid + 1) };
  node.keys = node.keys.slice(0, mid); node.children = node.children.slice(0, mid + 1);
  return { up, right };                                       // internal split: the middle key MOVES up
}

export function levelsOf(root: BNode): number[][][] {
  const out: number[][][] = [];
  let level = [root];
  while (level.length) { out.push(level.map((n) => n.keys)); level = level.flatMap((n) => n.children ?? []); }
  return out;
}

export function bplusInsertAll(keys: number[], maxKeys = 3): { root: BNode; snaps: BSnap[] } {
  let root: BNode = { keys: [] };
  const snaps: BSnap[] = [{ levels: [[[]]], note: "Empty tree: one empty leaf" }];
  for (const k of keys) {
    const height = levelsOf(root).length;
    const res = insertRec(root, k, maxKeys);
    if (res) root = { keys: [res.up], children: [root, res.right] };
    const grew = levelsOf(root).length > height;
    snaps.push({ levels: levelsOf(root), note: `Insert ${k}${res ? `: root split, ${res.up} becomes the new root` : grew ? "" : ""}` });
  }
  return { root, snaps };
}

/* ---------- DBMS: functional dependencies ---------- */
export type FD = [string[], string[]];
export function closure(attrs: string[], fds: FD[]): string[] {
  const out = new Set(attrs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [l, r] of fds) if (l.every((a) => out.has(a)) && r.some((a) => !out.has(a))) { r.forEach((a) => out.add(a)); changed = true; }
  }
  return [...out].sort();
}

export function candidateKeys(all: string[], fds: FD[]): string[][] {
  const keys: string[][] = [];
  const n = all.length;
  const subsets = Array.from({ length: 2 ** n }, (_, m) => all.filter((_, i) => m & (1 << i))).sort((a, b) => a.length - b.length);
  for (const s of subsets) {
    if (keys.some((k) => k.every((a) => s.includes(a)))) continue;     // a superset of a key is not minimal
    if (closure(s, fds).length === n) keys.push(s);
  }
  return keys;
}

/* ---------- OOP: method dispatch ---------- */
export type Cls = { name: string; parent?: string; methods: string[] };
/** Which class's implementation runs for `ref.method()` when ref's static type is `staticType` and the object is `dynamicType`. */
export function dispatch(classes: Cls[], staticType: string, dynamicType: string, method: string, isVirtual: boolean) {
  const by = new Map(classes.map((c) => [c.name, c]));
  const find = (start: string) => { for (let c = by.get(start); c; c = c.parent ? by.get(c.parent) : undefined) if (c.methods.includes(method)) return c.name; return null; };
  return isVirtual ? find(dynamicType) : find(staticType);
}

/* ---------- Aptitude: generated practice problems ---------- */
export type AptTopic = "percent" | "profit" | "interest" | "work" | "trains" | "boats" | "pnc" | "dice" | "mixture" | "hcf";
export type AptProblem = { q: string; answer: number; unit: string; steps: string[] };

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const nCr = (n: number, k: number) => { let x = 1; for (let i = 1; i <= k; i++) x = (x * (n - k + i)) / i; return Math.round(x); };
const r2 = (x: number) => Math.round(x * 100) / 100;

export function aptitude(topic: AptTopic, seed: number): AptProblem {
  const r = rng(seed);
  switch (topic) {
    case "percent": {
      const a = pick(r, [10, 20, 25, 30, 40, 50]), b = pick(r, [10, 20, 25, 30]);
      const net = r2(a - b - (a * b) / 100);
      return { q: `A price rises by ${a}% and then falls by ${b}%. What is the net percentage change? (Use a negative number for a fall.)`, answer: net, unit: "%",
        steps: [`Successive change formula: a + b + ab/100 with a = ${a}, b = -${b}.`, `${a} - ${b} - (${a}×${b})/100 = ${net}%.`] };
    }
    case "profit": {
      const cp = pick(r, [200, 400, 500, 800, 1000]), m = pick(r, [20, 25, 40, 50]), d = pick(r, [10, 20, 25]);
      const mp = cp * (1 + m / 100), sp = mp * (1 - d / 100), pct = r2(((sp - cp) / cp) * 100);
      return { q: `An item costs ₹${cp}. The shop marks it up by ${m}% and then gives a ${d}% discount. What is the profit percentage?`, answer: pct, unit: "%",
        steps: [`Marked price = ${cp} × ${1 + m / 100} = ₹${r2(mp)}.`, `Selling price = ${r2(mp)} × ${1 - d / 100} = ₹${r2(sp)}.`, `Profit % = (${r2(sp)} - ${cp}) / ${cp} × 100 = ${pct}%.`] };
    }
    case "interest": {
      const p = pick(r, [5000, 8000, 10000, 20000]), rate = pick(r, [5, 10, 20]), t = 2;
      const si = (p * rate * t) / 100, ci = p * ((1 + rate / 100) ** t - 1), diff = r2(ci - si);
      return { q: `On ₹${p} at ${rate}% per year for ${t} years, how much more is compound interest (yearly) than simple interest?`, answer: diff, unit: "₹",
        steps: [`SI = P·R·T/100 = ${r2(si)}.`, `CI = P[(1 + R/100)^T - 1] = ${r2(ci)}.`, `Difference = ${diff}. Shortcut for 2 years: P(R/100)² = ${r2(p * (rate / 100) ** 2)}.`] };
    }
    case "work": {
      const [a, b] = pick(r, [[10, 15], [12, 24], [20, 30], [6, 12], [8, 24], [15, 30]]);
      const days = r2((a * b) / (a + b));
      return { q: `A can finish a job in ${a} days and B in ${b} days. Working together, how many days do they take?`, answer: days, unit: "days",
        steps: [`Per day A does 1/${a}, B does 1/${b} of the job.`, `Together: 1/${a} + 1/${b} = ${a + b}/${a * b} per day.`, `Days = ${a * b}/${a + b} = ${days}.`] };
    }
    case "trains": {
      const len = pick(r, [120, 150, 180, 240]), plat = pick(r, [180, 210, 300, 360]), kmh = pick(r, [36, 54, 72, 90]);
      const ms = (kmh * 5) / 18, secs = r2((len + plat) / ms);
      return { q: `A ${len} m train runs at ${kmh} km/h. How many seconds does it take to cross a ${plat} m platform?`, answer: secs, unit: "s",
        steps: [`Convert speed: ${kmh} × 5/18 = ${r2(ms)} m/s.`, `Distance = train + platform = ${len + plat} m.`, `Time = ${len + plat} / ${r2(ms)} = ${secs} s.`] };
    }
    case "boats": {
      const b = pick(r, [10, 12, 15, 18]), s = pick(r, [2, 3, 5]), d = pick(r, [30, 36, 60, 72]);
      const t = r2(d / (b - s) + d / (b + s));
      return { q: `A boat goes ${b} km/h in still water; the stream flows at ${s} km/h. How many hours for a ${d} km trip upstream and back?`, answer: t, unit: "h",
        steps: [`Upstream speed = ${b} - ${s} = ${b - s} km/h; downstream = ${b + s} km/h.`, `Time = ${d}/${b - s} + ${d}/${b + s} = ${t} h.`] };
    }
    case "pnc": {
      const men = pick(r, [5, 6, 7]), women = pick(r, [3, 4, 5]), k = pick(r, [3, 4]);
      const ans = nCr(men + women, k) - nCr(men, k);
      return { q: `From ${men} men and ${women} women, how many ${k}-person committees have at least one woman?`, answer: ans, unit: "",
        steps: [`All committees: C(${men + women}, ${k}) = ${nCr(men + women, k)}.`, `Committees with no woman: C(${men}, ${k}) = ${nCr(men, k)}.`, `At least one woman = ${nCr(men + women, k)} - ${nCr(men, k)} = ${ans}.`] };
    }
    case "dice": {
      const sum = pick(r, [5, 6, 7, 8, 9, 10]);
      let ways = 0; for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (x + y === sum) ways++;
      const g = gcd(ways, 36), p = r2(ways / 36);
      return { q: `Two fair dice are rolled. What is the probability that the sum is ${sum}? (Answer as a decimal.)`, answer: p, unit: "",
        steps: [`There are 6 × 6 = 36 equally likely outcomes.`, `Pairs that add to ${sum}: ${ways}.`, `P = ${ways}/36 = ${ways / g}/${36 / g} ≈ ${p}.`] };
    }
    case "mixture": {
      const [c1, c2, m] = pick(r, [[20, 35, 25], [30, 50, 40], [40, 60, 45], [60, 90, 70]]);
      const ratio = r2((c2 - m) / (m - c1));
      return { q: `Rice at ₹${c1}/kg is mixed with rice at ₹${c2}/kg to get ₹${m}/kg. How many kg of the cheaper rice per 1 kg of the dearer one?`, answer: ratio, unit: "kg",
        steps: [`Alligation: cheaper : dearer = (${c2} - ${m}) : (${m} - ${c1}) = ${c2 - m} : ${m - c1}.`, `Per 1 kg of dearer rice: ${c2 - m}/${m - c1} = ${ratio} kg.`] };
    }
    case "hcf": {
      const g = pick(r, [6, 8, 12, 15]), a = g * pick(r, [3, 5, 7]), b = g * pick(r, [4, 8, 9]);
      const h = gcd(a, b), l = (a * b) / h;
      return { q: `Find the LCM of ${a} and ${b}.`, answer: l, unit: "",
        steps: [`HCF by Euclid: gcd(${a}, ${b}) = ${h}.`, `LCM = a × b / HCF = ${a} × ${b} / ${h} = ${l}.`] };
    }
  }
}

/* ---------- System design: consistent hashing ---------- */
/** FNV-1a, 32 bits, plus murmur3's final mix so similar strings ("user1", "user2") land far apart.
 *  Tiny and deterministic, so the ring looks the same on every device. */
export function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
export type RingPoint = { pos: number; server: string };   // pos in [0, 1) around the ring

/** Each key belongs to the first server point clockwise from it; vnodes = points per server. */
export function hashRing(servers: string[], keys: string[], vnodes = 1) {
  const points: RingPoint[] = servers.flatMap((s) => Array.from({ length: vnodes }, (_, v) => ({ pos: fnv(`${s}-${v}`) / 2 ** 32, server: s })))
    .sort((a, b) => a.pos - b.pos);
  const keyPos: Record<string, number> = {}, owner: Record<string, string> = {};
  for (const k of keys) {
    keyPos[k] = fnv(k) / 2 ** 32;
    owner[k] = (points.find((p) => p.pos >= keyPos[k]) ?? points[0]).server;
  }
  return { points, keyPos, owner };
}
/** The naive alternative: server = hash(key) mod N. */
export const modOwner = (servers: string[], keys: string[]): Record<string, string> =>
  Object.fromEntries(keys.map((k) => [k, servers[fnv(k) % servers.length]]));

/* ---------- System design: rate limiting ---------- */
export type RateAlgo = "token" | "fixed" | "sliding";
export type RateStep = { t: number; ok: boolean; level: number };   // level: tokens left, or requests counted in the window

/** `limit` requests per `window` seconds. Token bucket: capacity `limit`, refills `limit / window` tokens a second. */
export function rateLimit(algo: RateAlgo, times: number[], limit: number, window: number): RateStep[] {
  let tokens = limit, last = 0;
  const accepted: number[] = [];
  return times.map((t) => {
    if (algo === "token") {
      tokens = Math.min(limit, tokens + (t - last) * (limit / window)); last = t;
      const ok = tokens >= 1 - 1e-9;
      if (ok) tokens -= 1;
      return { t, ok, level: Math.round(tokens * 100) / 100 };
    }
    const inWindow = algo === "fixed"
      ? accepted.filter((a) => Math.floor(a / window) === Math.floor(t / window)).length
      : accepted.filter((a) => a > t - window).length;
    const ok = inWindow < limit;
    if (ok) accepted.push(t);
    return { t, ok, level: inWindow + (ok ? 1 : 0) };
  });
}
