// Interactive walk-throughs for OS, DBMS and CN chapters (see flows-play.ts). Each one simulates the real mechanism on the
// learner's numbers: fork counts, a race between two threads, recovery from a log, a precedence graph, longest prefix match.
// Chapters that already have a lab (scheduling, Banker's, paging, disk, normalization, B+ tree, subnetting, TCP) are left out.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { BarStep, ChainStep, Flow, FlowTone, GridStep, GridTable } from "./flows.ts";
import type { Subject } from "./types.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");
const pct = (x: number) => `${n1(x * 100)}%`;
const plural = (k: number, w: string) => `${n0(k)} ${w}${k === 1 ? "" : "s"}`;
const big = (x: number) => (x >= 1e15 ? `${x.toExponential(1).replace("e+", " x 10^")}` : x >= 1e12 ? `${n1(x / 1e12)} trillion` : x >= 1e9 ? `${n1(x / 1e9)} billion` : x >= 1e6 ? `${n1(x / 1e6)} million` : n0(x));
const dur = (s: number) => (s < 1 ? `${n0(s * 1000)} ms` : s < 120 ? `${n1(s)} seconds` : s < 7200 ? `${n1(s / 60)} minutes` : s < 172_800 ? `${n1(s / 3600)} hours` : s < 63_115_200 ? `${n1(s / 86_400)} days` : `${big(s / 31_557_600)} years`);

/* =============================== OS =============================== */

/* ---------- fork() in a loop ---------- */
function forks(v: Record<string, number>): Flow {
  const n = v.n, head = ["after fork", "processes", "new ones", "x printed"], rows: string[][] = [];
  const steps: GridStep[] = [{ note: `for (i = 0; i < ${n}; i++) { fork(); printf("x"); }. Every process that reaches fork() splits in two, and both copies carry on with the loop.`, tables: [{ label: "the loop", head, rows: [["start", "1", "-", "0"]] }] }];
  for (let i = 1; i <= n; i++) {
    rows.push([String(i), n0(2 ** i), n0(2 ** (i - 1)), n0(2 ** i)]);
    steps.push({ note: `Fork ${i}: all ${n0(2 ** (i - 1))} processes call fork(), so there are now ${n0(2 ** i)}. Each prints one x.`, tone: "hot", tables: [{ label: "the loop", head, rows: [["start", "1", "-", "0"], ...rows], tones: { [String(i)]: "hot" } }] });
  }
  steps.push({ note: `In all ${n0(2 ** n)} processes (the parent and ${n0(2 ** n - 1)} children) and ${n0(2 ** (n + 1) - 2)} x's: 2 + 4 + ... + ${n0(2 ** n)}. Doubling per fork is why a fork bomb fills the process table in seconds.`, tone: "ok", tables: [{ label: "the loop", head, rows: [["start", "1", "-", "0"], ...rows] }] });
  return { kind: "grid", title: `${n} fork() calls in a loop`, steps };
}

/* ---------- process states over time ---------- */
const IO_MS = 5;
function states(v: Record<string, number>): Flow {
  const W = v.work, Q = v.slice, B = v.io;
  const time: Record<string, number> = { running: 0, ready: 0, waiting: 0 }, steps: GridStep[] = [];
  const tab = (hot: string): GridTable => ({ label: "time in each state (ms)", head: ["state", "ms"], rows: Object.entries(time).map(([s, ms]) => [s, String(ms)]), tones: { [String(Object.keys(time).indexOf(hot))]: "hot" } });
  steps.push({ note: `Process P needs ${W} ms of CPU. The scheduler gives ${Q} ms slices, and another process Q is always ready, so P waits a slice whenever it is preempted.${B ? ` P asks for I/O after every ${B} ms of CPU; each I/O takes ${IO_MS} ms.` : " P does no I/O."}`, tables: [tab("ready")] });
  let left = W, sinceIo = 0, t = 0;
  while (left > 0 && steps.length < 40) {
    const run = Math.min(Q, left, B ? B - sinceIo : Infinity);
    t += run; left -= run; sinceIo += run; time.running += run;
    if (left === 0) { steps.push({ note: `t = ${t}: P runs ${run} ms and finishes its work. Running to terminated.`, tone: "ok", tables: [tab("running")] }); break; }
    if (B && sinceIo === B) {
      steps.push({ note: `t = ${t}: after ${run} ms P asks for I/O. Running to waiting: it gives up the CPU by itself.`, tone: "warn", tables: [tab("running")] });
      t += IO_MS; time.waiting += IO_MS; sinceIo = 0;
      steps.push({ note: `t = ${t}: the I/O finishes and an interrupt moves P from waiting to ready.`, tables: [tab("waiting")] });
    } else steps.push({ note: `t = ${t}: the ${Q} ms slice runs out. The timer interrupt moves P from running to ready.`, tone: "hot", tables: [tab("running")] });
    t += Q; time.ready += Q;
    steps.push({ note: `t = ${t}: Q ran its ${Q} ms slice; P is dispatched again, ready to running.`, tables: [tab("ready")] });
  }
  const total = time.running + time.ready + time.waiting;
  steps.push({ note: `P took ${total} ms to do ${W} ms of work: ${pct(time.running / total)} running, ${pct(time.ready / total)} ready, ${pct(time.waiting / total)} waiting. Shorter slices mean more switches; longer ones make others wait.`, tone: "ok", tables: [tab("running")] });
  return { kind: "grid", title: `${W} ms of work, ${Q} ms slices${B ? `, I/O every ${B} ms` : ""}`, steps };
}

/* ---------- a race on count++ ---------- */
type Op = "lock" | "load" | "add" | "store" | "unlock";
function race(v: Record<string, number>): Flow {
  const k = v.k, slice = v.slice, locked = v.lock === 1;
  const prog: Op[] = Array.from({ length: k }, () => (locked ? ["lock", "load", "add", "store", "unlock"] : ["load", "add", "store"]) as Op[]).flat();
  const th = [{ name: "A", pc: 0, reg: 0, done: 0 }, { name: "B", pc: 0, reg: 0, done: 0 }];
  let count = 0, owner = -1, turn = 0;
  const tabs = (hot: number): GridTable[] => [
    { label: "threads", head: ["", "A", "B"], rows: [["register", th[0].reg, th[1].reg], ["increments", th[0].done, th[1].done]], tones: { [`0:${hot + 1}`]: "hot" } },
    { label: "shared count", rows: [[count]] },
  ];
  const steps: GridStep[] = [{ note: `Threads A and B each run count++ ${k} time${k > 1 ? "s" : ""}. count++ is three instructions: load count into a register, add 1, store it back.${locked ? " Each increment holds a mutex." : " There is no lock."} The scheduler switches thread after every ${slice} instruction${slice > 1 ? "s" : ""}.`, tables: tabs(-1) }];
  let blockedNote = "";
  for (let guard = 0; (th[0].pc < prog.length || th[1].pc < prog.length) && guard < 400; guard++) {
    const me = th[turn];
    if (me.pc >= prog.length) { turn = 1 - turn; continue; }
    const did: string[] = [];
    for (let s = 0; s < slice && me.pc < prog.length; s++) {
      const op = prog[me.pc];
      if (op === "lock") { if (owner !== -1 && owner !== turn) { did.push("blocked"); break; } owner = turn; did.push("takes the lock"); }
      if (op === "load") { me.reg = count; did.push(`loads count (${count}) into its register`); }
      if (op === "add") { me.reg += 1; did.push(`adds 1, so its register holds ${me.reg}`); }
      if (op === "store") { count = me.reg; me.done++; did.push(`stores ${count} back into count`); }
      if (op === "unlock") { owner = -1; did.push("releases the lock"); }
      me.pc++;
    }
    if (did.length === 1 && did[0] === "blocked") { blockedNote = `${me.name} finds the lock taken and waits. `; turn = 1 - turn; continue; }
    const shown = did.filter((d) => d !== "blocked");
    const lost = th[0].done + th[1].done > count;
    steps.push({ note: `${blockedNote}${me.name} ${shown.join(", ")}${did.includes("blocked") ? ", then finds the lock taken and waits" : ""}.`, tone: lost && did.some((d) => d.startsWith("stores")) ? "bad" : "hot", tables: tabs(turn) });
    blockedNote = "";
    turn = 1 - turn;
  }
  const want = 2 * k, ok = count === want;
  steps.push({ note: ok ? `count is ${count}, as expected: ${locked ? "the mutex makes load, add and store one indivisible step" : `with ${slice}-instruction slices each increment happened to finish before a switch`}.` : `count is ${count}, not ${want}: ${want - count} update${want - count > 1 ? "s were" : " was"} lost. Both threads loaded the same value, so one store overwrote the other. A mutex or an atomic increment fixes it.`, tone: ok ? "ok" : "bad", tables: tabs(-1) });
  return { kind: "grid", title: `Two threads, ${k} increments each, ${locked ? "with" : "no"} mutex`, steps };
}

/* ---------- logical to physical address ---------- */
const ADDR_BITS = 14, FRAMES = 32;
const frameOf = (p: number) => (p * 5 + 3) % FRAMES;
function translate(v: Record<string, number>): Flow {
  const b = v.bits, a = v.addr, size = 2 ** b, page = a >> b, off = a & (size - 1), f = frameOf(page), phys = f * size + off;
  const bin = a.toString(2).padStart(ADDR_BITS, "0");
  const steps: ChainStep[] = [
    { node: `logical address ${n0(a)}`, note: `A 16 KB address space uses ${ADDR_BITS}-bit addresses. Pages are ${n0(size)} bytes, so the low ${b} bits are the offset and the high ${ADDR_BITS - b} bits are the page number.` },
    { node: `${bin.slice(0, ADDR_BITS - b)} | ${bin.slice(ADDR_BITS - b)}`, note: `In binary, ${n0(a)} is ${bin}: page bits on the left, offset bits on the right.`, tone: "hot" },
    { node: `page ${page}, offset ${n0(off)}`, note: `Page = ${n0(a)} / ${n0(size)} = ${page}, offset = ${n0(a)} mod ${n0(size)} = ${n0(off)}. Dividing by a power of two is just a bit shift.` },
    { node: `page table: page ${page} to frame ${f}`, note: `The page table (or the TLB, if this page was used recently) says page ${page} lives in physical frame ${f}.`, tone: "hot" },
    { node: `physical address ${n0(phys)}`, note: `Physical = frame x page size + offset = ${f} x ${n0(size)} + ${n0(off)} = ${n0(phys)}. The offset never changes; only the page number is replaced.`, tone: "ok" },
  ];
  return { title: `Translating ${n0(a)} with ${n0(size)}-byte pages`, steps };
}

/* ---------- producer and consumer on a bounded buffer ---------- */
const TICKS = 6;
function bounded(v: Record<string, number>): Flow {
  const size = v.size, p = v.prod, c = v.cons, head = ["tick", "put", "taken", "in buffer", "producer"], rows: string[][] = [];
  let buf = 0, pending = 0, blockedTicks = 0, idleTicks = 0;
  const steps: GridStep[] = [{ note: `A pipe holds at most ${size} item${size > 1 ? "s" : ""}. Each tick the producer makes ${p} and the consumer takes up to ${c}. A full buffer blocks the producer; an empty one blocks the consumer.`, tables: [{ label: "the buffer", head, rows: [] }] }];
  for (let t = 1; t <= TICKS; t++) {
    pending += p;
    const put = Math.min(pending, size - buf); buf += put; pending -= put;
    const take = Math.min(c, buf); buf -= take;
    const blocked = pending > 0;
    if (blocked) blockedTicks++;
    if (take < c) idleTicks++;
    rows.push([String(t), String(put), String(take), String(buf), blocked ? "blocked" : "ok"]);
    steps.push({ note: `Tick ${t}: the producer puts ${put}${blocked ? ` and blocks with ${pending} still in hand, because the buffer is full` : ""}; the consumer takes ${take}${take < c ? `, then waits on an empty buffer` : ""}. ${buf} left inside.`, tone: blocked ? "bad" : take < c ? "warn" : "ok", tables: [{ label: "the buffer", head, rows: [...rows], tones: { [`${t - 1}:4`]: blocked ? "bad" : "ok" } }] });
  }
  steps.push({ note: p > c ? `The producer is faster, so the buffer fills and the producer spends ${blockedTicks} of ${TICKS} ticks blocked: the buffer only absorbs short bursts. Blocking keeps memory bounded.` : p < c ? `The consumer is faster, so it waits on an empty buffer in ${idleTicks} of ${TICKS} ticks; the producer never blocks.` : `Both run at the same rate, so the buffer level stays steady and nobody waits for long.`, tone: "ok", tables: [{ label: "the buffer", head, rows }] });
  return { kind: "grid", title: `Buffer of ${size}: producer ${p}, consumer ${c} per tick`, steps };
}

/* =============================== DBMS =============================== */

/* ---------- why a DBMS: one fact stored once ---------- */
function redundancy(v: Record<string, number>): Flow {
  const cust = v.customers * 1000, orders = v.orders, copies = cust * orders;
  const bars = (a: number, b: number, tone?: FlowTone) => [{ label: "flat file", value: a, tone }, { label: "database", value: b, tone: b ? "ok" as const : undefined }];
  return { kind: "bars", title: `${n0(cust)} customers with ${orders} orders each`, max: copies, format: big, steps: [
    { note: `A flat order file stores the customer's address on every order line. A database keeps one customers table and refers to it by key.`, bars: bars(0, 0) },
    { note: `Flat file: ${n0(cust)} customers x ${orders} orders = ${big(copies)} copies of addresses.`, tone: "warn", bars: bars(copies, 0, "warn") },
    { note: `Database: ${big(cust)} addresses, one per customer, ${orders} times fewer.`, tone: "ok", bars: bars(copies, cust, "warn") },
    { note: `When one customer moves, the flat file must rewrite ${orders} lines; miss one, or crash halfway, and the file disagrees with itself. The database updates one row inside a transaction.`, tone: "bad", bars: bars(copies, cust, "bad") },
  ] };
}

/* ---------- superkeys from a candidate key ---------- */
function superkeys(v: Record<string, number>): Flow {
  const n = v.n, k = v.k;
  if (k > n) throw new PlayError(`A key of ${k} attributes cannot fit in a relation with ${n}. Make the key smaller or add attributes.`);
  const attrs = "ABCDEFGH".slice(0, n).split(""), key = attrs.slice(0, k), rest = attrs.slice(k), count = 2 ** (n - k);
  const ex = [key, [...key, ...rest.slice(0, 1)], [...key, ...rest]].filter((s, i, all) => all.findIndex((x) => x.join("") === s.join("")) === i);
  const steps: ChainStep[] = [
    { node: `R(${attrs.join(", ")})`, note: `R has ${n} attributes, and {${key.join(", ")}} is its only candidate key: it identifies every row, and no smaller set does.` },
    { node: `candidate key {${key.join(", ")}}`, note: "A candidate key is a minimal superkey: remove any attribute and it stops being unique.", tone: "hot" },
    { node: `add any of ${rest.length ? rest.join(", ") : "nothing"}`, note: rest.length ? `Adding more attributes keeps it unique, so {${key.join(", ")}} plus any subset of the other ${rest.length} (${rest.join(", ")}) is a superkey.` : "Every attribute is already in the key, so the key is the only superkey.", },
    { node: `2^${n - k} = ${n0(count)} superkeys`, note: `Each of the ${n - k} other attributes is either in or out: 2^${n - k} = ${n0(count)} superkeys, for example ${ex.map((s) => `{${s.join(", ")}}`).join(", ")}.`, tone: "ok" },
    { node: "pick one as primary key", note: "Exactly one candidate key becomes the primary key; the others are alternate keys, usually enforced with UNIQUE.", },
  ];
  return { title: `${n} attributes, a ${k}-attribute key: ${n0(count)} superkeys`, steps };
}

/* ---------- ER relationship to tables ---------- */
const CARD = ["1:1", "1:N", "M:N"];
function erTables(v: Record<string, number>): Flow {
  const t = v.type - 1, students = v.students * 100, per = v.per, head = ["table", "columns", "rows"];
  const clubs = Math.max(1, Math.round(students / 20)), card = CARD[t];
  const base: string[][] = [["Student", "id, name", n0(students)], ["Club", "id, title", n0(clubs)]];
  const final: string[][] = t === 0 ? [["Student", "id, name, club_id UNIQUE", n0(students)], ["Club", "id, title", n0(clubs)]]
    : t === 1 ? [["Student", "id, name, club_id", n0(students)], ["Club", "id, title", n0(clubs)]]
    : [...base, ["Membership", "student_id, club_id", n0(students * per)]];
  const tabs = (rows: string[][], hot?: number): GridTable[] => [{ label: `Student ${card} Club`, head, rows, tones: hot === undefined ? {} : { [String(hot)]: "hot" } }];
  const steps: GridStep[] = [
    { note: `${n0(students)} students and ${n0(clubs)} clubs. The relationship is ${card}: ${t === 0 ? "each student leads at most one club and each club has one leader" : t === 1 ? "each student belongs to one club, a club has many students" : `a student joins many clubs (${per} on average), a club has many students`}.`, tables: tabs([]) },
    { note: "Each entity set becomes a table with its own primary key.", tables: tabs(base) },
    t === 2
      ? { note: `M:N cannot be a column on either side, so it becomes its own table holding both keys; its primary key is the pair. ${n0(students)} x ${per} = ${n0(students * per)} rows.`, tone: "hot", tables: tabs(final, 2) }
      : { note: t === 0 ? "1:1 puts a foreign key on either side, with UNIQUE so no club is linked twice." : "1:N puts the foreign key on the many side: each Student row stores its club_id.", tone: "hot", tables: tabs(final, 0) },
    { note: `${final.length} tables in all. ${t === 2 ? "Putting club ids in a Student column would need a list in one cell, breaking first normal form." : "No extra table is needed, since each student points at no more than one club."}`, tone: "ok", tables: tabs(final) },
  ];
  return { kind: "grid", title: `Mapping ${t === 2 ? "an" : "a"} ${card} relationship`, steps };
}

/* ---------- recovery from the log ---------- */
const LOG: [tx: string, what: string][] = [["T1", "start"], ["T1", "write A"], ["T2", "start"], ["T2", "write B"], ["T1", "commit"], ["T3", "start"], ["T3", "write C"], ["T2", "write D"], ["T2", "commit"], ["T3", "write E"], ["T3", "commit"]];
function recovery(v: Record<string, number>): Flow {
  const c = v.crash, cp = v.checkpoint;
  if (cp >= c) throw new PlayError(`The checkpoint after record ${cp} would come after the crash at record ${c}. Move the checkpoint earlier.`);
  const seen = LOG.slice(0, c), head = ["#", "tx", "record"];
  const rows = seen.flatMap(([tx, w], i) => (cp > 0 && i === cp ? [["-", "-", "checkpoint"], [String(i + 1), tx, w]] : [[String(i + 1), tx, w]]));
  if (cp > 0 && cp === seen.length) rows.push(["-", "-", "checkpoint"]);
  const commitAt = (tx: string) => seen.findIndex(([t, w]) => t === tx && w === "commit");
  const txs = [...new Set(seen.map(([t]) => t))];
  const fate = Object.fromEntries(txs.map((tx) => { const at = commitAt(tx); return [tx, at < 0 ? "undo" : cp > 0 && at < cp ? "nothing" : "redo"]; })) as Record<string, string>;
  const toneOf = (tx: string): FlowTone => (fate[tx] === "undo" ? "bad" : fate[tx] === "redo" ? "ok" : "warn");
  const tones = (upTo: string[]) => Object.fromEntries(rows.map((r, i) => [String(i), r[1]]).filter(([, tx]) => upTo.includes(tx)).map(([i, tx]) => [i, toneOf(tx)]));
  const steps: GridStep[] = [{ note: `The database crashes after log record ${c}.${cp ? ` A checkpoint after record ${cp} flushed every change made before it to disk.` : " There was no checkpoint, so recovery reads the whole log."}`, tone: "bad", tables: [{ label: "write-ahead log", head, rows }] }];
  const done: string[] = [];
  for (const tx of txs) {
    done.push(tx);
    const at = commitAt(tx);
    steps.push({ note: fate[tx] === "undo" ? `${tx} has no commit record: it never finished, so its writes are undone using the old values in the log. Atomicity: all or nothing.` : fate[tx] === "redo" ? `${tx} committed at record ${at + 1}${cp ? ", after the checkpoint" : ""}. Its changes may not have reached disk, so they are redone from the log. Durability.` : `${tx} committed at record ${at + 1}, before the checkpoint, so its changes are already on disk. Nothing to do.`,
      tone: toneOf(tx), tables: [{ label: "write-ahead log", head, rows, tones: tones(done) }] });
  }
  const list = (f: string) => txs.filter((t) => fate[t] === f).join(", ") || "none";
  steps.push({ note: `Redo: ${list("redo")}. Undo: ${list("undo")}. Skip: ${list("nothing")}. Because every change was logged before it was written, the database restarts in a consistent state.`, tone: "ok", tables: [{ label: "write-ahead log", head, rows, tones: tones(txs) }] });
  return { kind: "grid", title: `Crash after record ${c}${cp ? `, checkpoint after ${cp}` : ""}`, steps };
}

/* ---------- conflict serializability ---------- */
type SOp = { tx: "T1" | "T2"; op: "R" | "W"; item: string };
function serial(v: Record<string, number>): Flow {
  const at = v.at, both = v.both === 1;
  const t1: SOp[] = [{ tx: "T1", op: "R", item: "A" }, { tx: "T1", op: "W", item: "A" }, { tx: "T1", op: "R", item: "B" }, { tx: "T1", op: "W", item: "B" }];
  const t2: SOp[] = both ? [{ tx: "T2", op: "R", item: "A" }, { tx: "T2", op: "W", item: "A" }, { tx: "T2", op: "R", item: "B" }, { tx: "T2", op: "W", item: "B" }] : [{ tx: "T2", op: "R", item: "A" }, { tx: "T2", op: "W", item: "A" }];
  const sched = [...t1.slice(0, at), ...t2, ...t1.slice(at)];
  const rows = sched.map((o, i) => [String(i + 1), o.tx === "T1" ? `${o.op}(${o.item})` : "", o.tx === "T2" ? `${o.op}(${o.item})` : ""]), head = ["#", "T1", "T2"];
  const edges = new Map<string, string>();
  sched.forEach((a, i) => sched.slice(i + 1).forEach((b) => { if (a.tx !== b.tx && a.item === b.item && (a.op === "W" || b.op === "W")) { const key = `${a.tx}>${b.tx}`; if (!edges.has(key)) edges.set(key, `${a.op}(${a.item}) before ${b.op}(${b.item})`); } }));
  const cycle = edges.has("T1>T2") && edges.has("T2>T1");
  const steps: GridStep[] = [{ note: `T2 runs after T1's first ${at} operation${at === 1 ? "" : "s"}. Two operations conflict when they come from different transactions, touch the same item, and at least one writes.`, tables: [{ label: "schedule", head, rows }] }];
  for (const [e, why] of edges) {
    const [a, b] = e.split(">");
    steps.push({ note: `Conflict: ${a}'s ${why.split(" before ")[0]} comes before ${b}'s ${why.split(" before ")[1]}, so any equivalent serial order must put ${a} before ${b}. Edge ${a} to ${b}.`, tone: "hot", tables: [{ label: "schedule", head, rows }, { label: "precedence graph", rows: [...edges.keys()].slice(0, [...edges.keys()].indexOf(e) + 1).map((k) => [k.replace(">", " to ")]) }] });
  }
  const graph = { label: "precedence graph", rows: edges.size ? [...edges.keys()].map((k) => [k.replace(">", " to ")]) : [["no edges"]] };
  steps.push(cycle
    ? { note: "The graph has a cycle: T1 must come before T2 and T2 before T1. No serial order matches, so the schedule is not conflict serializable. Two-phase locking would have prevented it.", tone: "bad", tables: [{ label: "schedule", head, rows }, graph] }
    : { note: `No cycle, so the schedule is conflict serializable, equivalent to ${edges.has("T2>T1") ? "T2 then T1" : "T1 then T2"} run one after the other.`, tone: "ok", tables: [{ label: "schedule", head, rows }, graph] });
  return { kind: "grid", title: `T2 after ${at} of T1's steps${both ? "" : ", T2 touches only A"}`, steps };
}

/* ---------- replication lag ---------- */
function lagPlay(v: Record<string, number>): Flow {
  const lag = v.lag, d = v.after, R = v.replicas, head = ["replica", "has it at", `read at ${d} ms`];
  const at = Array.from({ length: R }, (_, i) => Math.round((lag * (i + 1)) / R));
  const rows = at.map((a, i) => [`R${i + 1}`, `${a} ms`, a <= d ? "fresh" : "stale"]), stale = at.filter((a) => a > d).length;
  const tones = Object.fromEntries(rows.map((r, i) => [`${i}:2`, (r[2] === "fresh" ? "ok" : "bad") as FlowTone]));
  const steps: GridStep[] = [
    { note: `A user changes their name. The primary commits it at 0 ms and ships the change to ${R} replica${R > 1 ? "s" : ""} asynchronously; the slowest is ${lag} ms behind.`, tables: [{ label: "replicas", head, rows: rows.map((r) => [r[0], r[1], ""]) }] },
    { note: `${d} ms later the user reloads the page, and the read goes to whichever replica the load balancer picks.`, tone: "hot", tables: [{ label: "replicas", head, rows: rows.map((r) => [r[0], r[1], ""]) }] },
    { note: stale ? `${stale} of ${R} replicas have not applied the change yet, so ${pct(stale / R)} of reads show the old name: the user thinks the save failed.` : `Every replica has applied the change by ${d} ms, so every read is fresh.`, tone: stale ? "bad" : "ok", tables: [{ label: "replicas", head, rows, tones }] },
    { note: stale ? `Fix it with read-your-writes: send this user's reads to the primary for a while after a write (here at least ${lag} ms), or remember the write's log position and only read from replicas that have caught up.` : "Replicas spread read load, and here the lag is short enough not to show. Under heavy load lag grows, so monitor it.", tone: "ok", tables: [{ label: "replicas", head, rows, tones }] },
  ];
  return { kind: "grid", title: `${R} replicas, up to ${lag} ms behind, read after ${d} ms`, steps };
}

/* =============================== CN =============================== */

/* ---------- encapsulation overhead ---------- */
const TCP_H = 20, IP_H = 20, ETH_H = 18;
function encap(v: Record<string, number>): Flow {
  const P = v.payload, mtu = v.mtu, mss = mtu - TCP_H - IP_H, segs = Math.ceil(P / mss), hdr = segs * (TCP_H + IP_H + ETH_H), total = P + hdr;
  const bars = (a: number, b: number, tone?: FlowTone) => [{ label: "your data", value: a }, { label: "headers", value: b, tone }];
  return { kind: "bars", title: `${n0(P)} bytes over a ${n0(mtu)}-byte MTU`, max: total, format: (x) => `${n0(x)} B`, steps: [
    { note: `An app sends ${n0(P)} bytes. Each layer wraps the data in its own header on the way down.`, bars: bars(P, 0) },
    { note: `An IP packet may be at most ${n0(mtu)} bytes (the MTU). Minus ${IP_H} bytes of IP header and ${TCP_H} of TCP header leaves ${n0(mss)} bytes of data per segment.`, tone: "hot", bars: bars(P, 0) },
    { note: `${n0(P)} / ${n0(mss)} rounds up to ${plural(segs, "segment")}, each with TCP, IP and Ethernet headers: ${TCP_H} + ${IP_H} + ${ETH_H} = ${TCP_H + IP_H + ETH_H} bytes.`, tone: "hot", bars: bars(P, hdr, "warn") },
    { note: `${n0(total)} bytes go on the wire: ${pct(P / total)} is your data. ${mtu > 1500 ? "Jumbo frames cut header overhead inside data centres." : "Small packets pay the most overhead, which is why protocols batch."}`, tone: "ok", bars: bars(P, hdr, "warn") },
  ] };
}

/* ---------- DNS caching and TTL ---------- */
const WINDOW = 600;
function dnsTtl(v: Record<string, number>): Flow {
  const ttl = v.ttl, every = v.every;
  let expires = -1, hits = 0, misses = 0, firstExpiry = -1;
  for (let t = 0; t < WINDOW; t += every) { if (t >= expires) { misses++; if (expires >= 0 && firstExpiry < 0) firstExpiry = t; expires = t + ttl; } else hits++; }
  const total = hits + misses, untilExpiry = Math.max(0, Math.ceil(ttl / every) - 1);
  const bars = (h: number, m: number) => [{ label: "lookups", value: total }, { label: "cache hits", value: h, tone: h ? "ok" as const : undefined }, { label: "full lookups", value: m, tone: m ? "warn" as const : undefined }];
  return { kind: "bars", title: `TTL ${ttl} s, a lookup every ${every} s`, max: total, format: (x) => n0(x), steps: [
    { note: `Over ${WINDOW / 60} minutes the resolver is asked for the same name every ${every} seconds: ${total} lookups. Each answer may be cached for its TTL of ${ttl} seconds.`, bars: bars(0, 0) },
    { note: "The first lookup finds nothing cached, so the resolver walks root, TLD and authoritative servers: a full lookup.", tone: "warn", bars: bars(0, 1) },
    { note: untilExpiry ? `The next ${untilExpiry} lookup${untilExpiry > 1 ? "s" : ""} arrive within the TTL and are answered from cache in microseconds.` : `The TTL is shorter than the gap between lookups, so the cached answer has expired every time.`, tone: untilExpiry ? "ok" : "bad", bars: bars(Math.min(hits, untilExpiry), 1) },
    { note: `In all ${hits} cache hits and ${misses} full lookups${firstExpiry > 0 ? `; the first expiry hit at ${firstExpiry} s` : ""}. Hit rate ${pct(hits / total)}.`, tone: hits / total > 0.5 ? "ok" : "warn", bars: bars(hits, misses) },
    { note: `A long TTL saves lookups but a changed IP takes up to ${ttl} seconds to reach everyone, so teams lower the TTL before a planned move.`, tone: "hot", bars: bars(hits, misses) },
  ] };
}

/* ---------- HTTP versions and round trips ---------- */
function httpRtts(v: Record<string, number>): Flow {
  const N = v.n, rtt = v.rtt, P = v.conns, setup = 2;                     // TCP + TLS 1.3: two round trips
  const html = (setup + 1) * rtt;
  const h10 = html + Math.ceil(N / P) * (setup + 1) * rtt, h11 = html + (P > 1 ? setup * rtt : 0) + Math.ceil(N / P) * rtt, h2 = html + rtt;
  const bars = (a: number, b: number, c: number) => [{ label: "HTTP/1.0", value: a, tone: a ? "bad" as const : undefined }, { label: "HTTP/1.1", value: b, tone: b ? "warn" as const : undefined }, { label: "HTTP/2", value: c, tone: c ? "ok" as const : undefined }];
  return { kind: "bars", title: `${N} resources, ${rtt} ms round trip, ${P} connection${P > 1 ? "s" : ""}`, max: h10, format: (x) => `${n0(x)} ms`, steps: [
    { note: `A page needs its HTML plus ${N} images, scripts and styles. One round trip is ${rtt} ms; opening a connection costs ${setup} (TCP, then TLS 1.3), and each request one more. Bandwidth and server time are left out.`, bars: bars(0, 0, 0) },
    { note: `HTML first: ${setup + 1} round trips, ${n0(html)} ms, in every version.`, bars: bars(html, html, html) },
    { note: `HTTP/1.0 opens a new connection per resource, ${P} at a time: ${Math.ceil(N / P)} rounds of ${setup + 1} round trips, ${n0(h10)} ms in all.`, tone: "bad", bars: bars(h10, html, html) },
    { note: `HTTP/1.1 keeps ${P} connections open and reuses them: ${Math.ceil(N / P)} rounds of one round trip${P > 1 ? `, plus ${setup} to open the extra connections` : ""}: ${n0(h11)} ms.`, tone: "warn", bars: bars(h10, h11, html) },
    { note: `HTTP/2 sends all ${N} requests at once on the one open connection: one more round trip, ${n0(h2)} ms, ${n1(h10 / h2)} times faster than HTTP/1.0 here.`, tone: "ok", bars: bars(h10, h11, h2) },
  ] };
}

/* ---------- where the time goes when you type a URL ---------- */
const SERVER_MS = 50;
function pageLoad(v: Record<string, number>): Flow {
  const rtt = v.rtt, kb = v.kb, mbps = v.mbps, dl = (kb * 8) / mbps;      // KB x 8 / Mbps = ms
  const phases: [string, number][] = [["DNS", rtt], ["TCP", rtt], ["TLS", rtt], ["first byte", rtt + SERVER_MS], ["download", dl]];
  const total = phases.reduce((s, [, ms]) => s + ms, 0), top = phases.reduce((a, b) => (b[1] > a[1] ? b : a));
  const steps: BarStep[] = [{ note: `Fetching a ${n0(kb)} KB page over a ${rtt} ms round trip and a ${mbps} Mbps link, with nothing cached.`, bars: phases.map(([l]) => ({ label: l, value: 0 })) }];
  const why: Record<string, string> = { DNS: `The resolver looks up the name: about one round trip, ${rtt} ms.`, TCP: `The TCP handshake: one round trip, ${rtt} ms.`, TLS: `The TLS 1.3 handshake agrees keys: one more round trip, ${rtt} ms.`, "first byte": `The request goes out and the first byte comes back: one round trip plus ${SERVER_MS} ms of server work, ${rtt + SERVER_MS} ms.`, download: `${n0(kb)} KB x 8 bits / ${mbps} Mbps = ${n0(dl)} ms to download the rest.` };
  phases.forEach(([l], i) => steps.push({ note: why[l], tone: "hot", bars: phases.map(([nm, ms], j) => ({ label: nm, value: j <= i ? ms : 0, tone: j === i ? "hot" as const : undefined })) }));
  steps.push({ note: `${n0(total)} ms in all; the biggest part is ${top[0]} at ${pct(top[1] / total)}. ${top[0] === "download" ? "A smaller page or a faster link helps most." : "Round trips dominate, so a CDN close to the user, connection reuse and DNS caching help most."}`, tone: "ok", bars: phases.map(([nm, ms]) => ({ label: nm, value: ms, tone: nm === top[0] ? "warn" as const : undefined })) });
  return { kind: "bars", title: `${n0(kb)} KB at ${rtt} ms and ${mbps} Mbps: ${n0(total)} ms`, format: (x) => `${n0(x)} ms`, steps };
}

/* ---------- longest prefix match ---------- */
const ROUTES: [prefix: string, len: number, hop: string][] = [["0.0.0.0", 0, "ISP"], ["10.0.0.0", 8, "core"], ["10.1.0.0", 16, "campus"], ["10.1.2.0", 24, "lab"], ["10.1.2.128", 25, "servers"]];
const ip = (s: string) => s.split(".").reduce((a, o) => a * 256 + Number(o), 0);
const matches = (dst: number, prefix: string, len: number) => len === 0 || Math.floor(dst / 2 ** (32 - len)) === Math.floor(ip(prefix) / 2 ** (32 - len));
function lpm(v: Record<string, number>): Flow {
  const dstS = `10.${v.b}.${v.c}.${v.d}`, dst = ip(dstS), head = ["route", "next hop", "match?"];
  const res = ROUTES.map(([p, len]) => matches(dst, p, len)), best = res.lastIndexOf(true);
  const rows = (k: number) => ROUTES.map(([p, len, hop], i) => [`${p}/${len}`, hop, i < k ? (res[i] ? "yes" : "no") : ""]);
  const steps: GridStep[] = [{ note: `A router gets a packet for ${dstS}. It compares the destination with every route's first n bits, where n is the prefix length.`, tables: [{ label: `to ${dstS}`, head, rows: rows(0) }] }];
  ROUTES.forEach(([p, len], i) => steps.push({ note: len === 0 ? "/0 compares no bits, so the default route matches everything." : `${p}/${len}: the first ${len} bits of ${dstS} ${res[i] ? "equal" : "differ from"} those of ${p}${res[i] ? ", a match" : ""}.`, tone: res[i] ? "ok" : "warn", tables: [{ label: `to ${dstS}`, head, rows: rows(i + 1), tones: { [`${i}:2`]: res[i] ? "ok" : "warn" } }] }));
  steps.push({ note: `${res.filter(Boolean).length} routes match; the longest, /${ROUTES[best][1]}, is the most specific, so the packet goes to ${ROUTES[best][2]}.`, tone: "ok", tables: [{ label: `to ${dstS}`, head, rows: rows(ROUTES.length), tones: { [String(best)]: "ok" } }] });
  return { kind: "grid", title: `Routing ${dstS}: to ${ROUTES[best][2]}`, steps };
}

/* ---------- password guessing time ---------- */
const CHARSETS: [string, number][] = [["digits", 10], ["lowercase", 26], ["upper + lower", 52], ["letters + digits", 62], ["all printable", 95]];
function bruteForce(v: Record<string, number>): Flow {
  const [name, C] = CHARSETS[v.set - 1], L = v.len, rate = 10 ** v.speed, combos = C ** L, avg = combos / 2 / rate;
  const steps: ChainStep[] = [
    { node: `${L} characters from ${C} (${name})`, note: `An attacker who stole the password hashes tries every possible password of length ${L} built from ${C} symbols.` },
    { node: `${C}^${L} = ${big(combos)} passwords`, note: `Each position has ${C} choices, so there are ${C}^${L} = ${big(combos)} candidates.`, tone: "hot" },
    { node: `10^${v.speed} guesses per second`, note: v.speed >= 9 ? "A fast, unsalted hash on a rack of GPUs can be tried billions of times a second." : v.speed <= 5 ? "A slow password hash like bcrypt or Argon2 with a high cost keeps guesses to thousands per second." : "A middle speed: a fast hash on modest hardware, or a slow hash with a low cost." },
    { node: `about ${dur(avg)} on average`, note: `On average half the space is searched: ${big(combos)} / 2 / ${big(rate)} = ${dur(avg)}.`, tone: avg < 86_400 * 30 ? "bad" : avg < 31_557_600 * 100 ? "warn" : "ok" },
    { node: "length beats symbols", note: `One more character multiplies the work by ${C}. Store passwords with a slow, salted hash, and rate-limit logins so online guessing is far slower still.`, tone: "ok" },
  ];
  return { title: `${L} characters (${name}) at 10^${v.speed} guesses/s`, steps };
}

export const PLAY: Record<string, PlayFlow> = {
  "os-play-fork": { title: "fork() in a loop", knobs: [{ key: "n", label: "fork() calls", min: 1, max: 5, value: 3 }], make: forks },
  "os-play-states": { title: "One process through its states", knobs: [{ key: "work", label: "CPU work needed", min: 4, max: 16, value: 10, unit: " ms" }, { key: "slice", label: "time slice", min: 2, max: 8, value: 4, unit: " ms" }, { key: "io", label: "I/O after every (0 = none)", min: 0, max: 8, value: 6, unit: " ms" }], make: states },
  "os-play-race": { title: "A race on count++", knobs: [{ key: "k", label: "increments per thread", min: 1, max: 3, value: 2 }, { key: "slice", label: "instructions per turn", min: 1, max: 4, value: 1 }, { key: "lock", label: "mutex (0 off, 1 on)", min: 0, max: 1, value: 0 }], make: race },
  "os-play-translate": { title: "Logical to physical address", knobs: [{ key: "bits", label: "offset bits (page size 2^n)", min: 8, max: 12, value: 10 }, { key: "addr", label: "logical address", min: 0, max: 16383, value: 5000 }], make: translate },
  "os-play-buffer": { title: "Producer and consumer on a pipe", knobs: [{ key: "size", label: "buffer size", min: 1, max: 6, value: 3 }, { key: "prod", label: "producer per tick", min: 1, max: 3, value: 2 }, { key: "cons", label: "consumer per tick", min: 1, max: 3, value: 1 }], make: bounded },
  "dbms-play-redundancy": { title: "One fact stored once", knobs: [{ key: "customers", label: "customers (thousands)", min: 1, max: 100, value: 10 }, { key: "orders", label: "orders per customer", min: 1, max: 50, value: 20 }], make: redundancy },
  "dbms-play-superkeys": { title: "Superkeys from a candidate key", knobs: [{ key: "n", label: "attributes", min: 2, max: 8, value: 5 }, { key: "k", label: "attributes in the key", min: 1, max: 4, value: 2 }], make: superkeys },
  "dbms-play-er": { title: "Relationship to tables", knobs: [{ key: "type", label: "cardinality (1:1, 1:N, M:N)", min: 1, max: 3, value: 3 }, { key: "students", label: "students (hundreds)", min: 1, max: 50, value: 10 }, { key: "per", label: "clubs per student (M:N)", min: 1, max: 5, value: 2 }], make: erTables },
  "dbms-play-recovery": { title: "Recovering from the log", knobs: [{ key: "crash", label: "crash after record", min: 2, max: 11, value: 10 }, { key: "checkpoint", label: "checkpoint after (0 = none)", min: 0, max: 10, value: 6 }], make: recovery },
  "dbms-play-serial": { title: "Is this schedule serializable?", knobs: [{ key: "at", label: "T2 starts after T1 step", min: 0, max: 4, value: 2 }, { key: "both", label: "T2 also touches B (0 no, 1 yes)", min: 0, max: 1, value: 1 }], make: serial },
  "dbms-play-lag": { title: "Replication lag and stale reads", knobs: [{ key: "lag", label: "slowest replica behind", min: 0, max: 500, step: 50, value: 300, unit: " ms" }, { key: "after", label: "user reads after", min: 0, max: 500, step: 50, value: 100, unit: " ms" }, { key: "replicas", label: "replicas", min: 1, max: 5, value: 3 }], make: lagPlay },
  "cn-play-encap": { title: "Headers on the wire", knobs: [{ key: "payload", label: "data to send", min: 100, max: 20000, step: 100, value: 4000, unit: " B" }, { key: "mtu", label: "MTU", min: 576, max: 9000, step: 4, value: 1500, unit: " B" }], make: encap },
  "cn-play-dns": { title: "DNS caching and TTL", knobs: [{ key: "ttl", label: "TTL", min: 10, max: 600, step: 10, value: 60, unit: " s" }, { key: "every", label: "a lookup every", min: 5, max: 120, step: 5, value: 20, unit: " s" }], make: dnsTtl },
  "cn-play-http": { title: "HTTP/1.0, 1.1 and 2", knobs: [{ key: "n", label: "resources on the page", min: 1, max: 60, value: 30 }, { key: "rtt", label: "round trip", min: 10, max: 300, step: 10, value: 100, unit: " ms" }, { key: "conns", label: "parallel connections", min: 1, max: 8, value: 6 }], make: httpRtts },
  "cn-play-load": { title: "Where page load time goes", knobs: [{ key: "rtt", label: "round trip", min: 10, max: 300, step: 10, value: 80, unit: " ms" }, { key: "kb", label: "page size", min: 50, max: 5000, step: 50, value: 1500, unit: " KB" }, { key: "mbps", label: "bandwidth", min: 1, max: 100, value: 20, unit: " Mbps" }], make: pageLoad },
  "cn-play-lpm": { title: "Longest prefix match", knobs: [{ key: "b", label: "second octet", min: 0, max: 3, value: 1 }, { key: "c", label: "third octet", min: 0, max: 3, value: 2 }, { key: "d", label: "fourth octet", min: 0, max: 255, value: 200 }], make: lpm },
  "cn-play-brute": { title: "How long to guess a password", knobs: [{ key: "len", label: "password length", min: 4, max: 14, value: 8 }, { key: "set", label: "symbols (digits to all printable)", min: 1, max: 5, value: 4 }, { key: "speed", label: "guesses per second (10^n)", min: 3, max: 11, value: 10 }], make: bruteForce },
};

/** Chapter id to its interactive walk-through, per subject. */
export const CS_PLAY: Record<"os" | "dbms" | "cn", Record<string, string>> = {
  os: { process: "os-play-fork", states: "os-play-states", sync: "os-play-race", memory: "os-play-translate", ipc: "os-play-buffer" },
  dbms: { basics: "dbms-play-redundancy", keys: "dbms-play-superkeys", er: "dbms-play-er", acid: "dbms-play-recovery", concurrency: "dbms-play-serial", scale: "dbms-play-lag" },
  cn: { layers: "cn-play-encap", dns: "cn-play-dns", http: "cn-play-http", url: "cn-play-load", routing: "cn-play-lpm", security: "cn-play-brute" },
};
/** The subject with each mapped chapter's `play` set; a chapter's own `play` wins. */
export const withPlay = (s: Subject, map: Record<string, string>): Subject => ({ ...s, chapters: s.chapters.map((c) => (c.play || !map[c.id] ? c : { ...c, play: map[c.id] })) });
