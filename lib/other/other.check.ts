// Run: npm run check:other. Checks every simulator against known results, then checks the content:
// SQL answers run in SQLite (node:sqlite), Java and C++ programs compile and run, and no text has an em dash.
import assert from "node:assert";
import { bankerSafety, bplusInsertAll, candidateKeys, closure, dispatch, levelsOf, pageReplace, schedule, slidingWindow, subnet, aptitude, hashRing, modOwner, rateLimit, type AptTopic, type BNode } from "./sim.ts";

/* ---------- simulators ---------- */
const REFS = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
assert.equal(pageReplace(REFS, 3, "fifo").faults, 15);
assert.equal(pageReplace(REFS, 3, "lru").faults, 12);
assert.equal(pageReplace(REFS, 3, "opt").faults, 9);
const BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
assert.equal(pageReplace(BELADY, 3, "fifo").faults, 9);
assert.equal(pageReplace(BELADY, 4, "fifo").faults, 10);           // Belady's anomaly: more frames, more faults
assert.ok(pageReplace(BELADY, 4, "lru").faults <= pageReplace(BELADY, 3, "lru").faults);  // stack algorithms never do that

export const PROCS = [{ id: "P1", arrival: 0, burst: 5, priority: 2 }, { id: "P2", arrival: 1, burst: 3, priority: 1 }, { id: "P3", arrival: 2, burst: 8, priority: 4 }, { id: "P4", arrival: 3, burst: 6, priority: 3 }];
const sch = (a: Parameters<typeof schedule>[1]) => schedule(PROCS, a, 2);
assert.equal(sch("fcfs").avgWait, 5.75); assert.equal(sch("fcfs").avgTurn, 11.25);
assert.equal(sch("sjf").avgWait, 5.25); assert.equal(sch("sjf").avgTurn, 10.75);
assert.equal(sch("srtf").avgWait, 5); assert.equal(sch("srtf").avgTurn, 10.5);
assert.equal(sch("rr").avgWait, 9.75); assert.equal(sch("rr").avgTurn, 15.25);
assert.equal(sch("priority").avgWait, 5.25);
assert.deepEqual(sch("srtf").gantt.map((g) => `${g.id}:${g.start}-${g.end}`), ["P1:0-1", "P2:1-4", "P1:4-8", "P4:8-14", "P3:14-22"]);
for (const a of ["fcfs", "sjf", "srtf", "rr", "priority"] as const) {
  const g = sch(a).gantt;
  assert.equal(g.reduce((s, x) => s + (x.id ? x.end - x.start : 0), 0), 22, `${a}: CPU time = total burst`);
}

export const BANK = { avail: [2, 1, 1], max: [[5, 3, 2], [3, 2, 2], [4, 1, 3], [2, 2, 2], [3, 3, 1]], alloc: [[1, 1, 0], [2, 0, 1], [1, 0, 2], [1, 1, 1], [0, 2, 0]] };
const bk = bankerSafety(BANK.avail, BANK.max, BANK.alloc.map((r) => [...r]));
assert.ok(bk.safe); assert.deepEqual(bk.order, [3, 1, 0, 2, 4]);
assert.ok(!bankerSafety([0, 0, 0], BANK.max, BANK.alloc.map((r) => [...r])).safe);

assert.equal(slidingWindow(8, 4, [2], "gbn").sent, 10);
assert.equal(slidingWindow(8, 4, [2], "sr").sent, 9);
assert.equal(slidingWindow(8, 4, [], "gbn").sent, 8);

const sn = subnet("192.168.10.77", 26);
assert.deepEqual([sn.network, sn.broadcast, sn.first, sn.last, sn.hosts, sn.mask], ["192.168.10.64", "192.168.10.127", "192.168.10.65", "192.168.10.126", 62, "255.255.255.192"]);
assert.equal(subnet("10.0.0.1", 8).isPrivate, true); assert.equal(subnet("172.32.0.1", 16).isPrivate, false);

export const BKEYS = [10, 20, 5, 6, 12, 30, 7, 17, 3, 25];
const { root } = bplusInsertAll(BKEYS, 3);
const leaves: number[][] = [];
const depths = new Set<number>();
(function walk(n: BNode, d: number) { assert.ok(n.keys.length <= 3); if (!n.children) { leaves.push(n.keys); depths.add(d); return; } assert.equal(n.children.length, n.keys.length + 1); n.children.forEach((c) => walk(c, d + 1)); })(root, 0);
assert.equal(depths.size, 1, "all leaves at one depth");
assert.deepEqual(leaves.flat(), [...BKEYS].sort((a, b) => a - b), "leaves hold every key in order");
assert.ok(levelsOf(root).length >= 2);

export const FDS: [string[], string[]][] = [[["StudentId"], ["StudentName"]], [["CourseId"], ["CourseName", "Instructor"]], [["Instructor"], ["InstructorPhone"]], [["StudentId", "CourseId"], ["Grade"]]];
const ALL = ["StudentId", "StudentName", "CourseId", "CourseName", "Instructor", "InstructorPhone", "Grade"];
assert.deepEqual(candidateKeys(ALL, FDS), [["StudentId", "CourseId"]]);
assert.deepEqual(closure(["CourseId"], FDS), ["CourseId", "CourseName", "Instructor", "InstructorPhone"]);

const CLS = [{ name: "Animal", methods: ["speak", "move"] }, { name: "Dog", parent: "Animal", methods: ["speak"] }, { name: "Puppy", parent: "Dog", methods: ["move"] }];
assert.equal(dispatch(CLS, "Animal", "Dog", "speak", true), "Dog");
assert.equal(dispatch(CLS, "Animal", "Dog", "speak", false), "Animal");
assert.equal(dispatch(CLS, "Animal", "Puppy", "speak", true), "Dog");
assert.equal(dispatch(CLS, "Dog", "Puppy", "move", true), "Puppy");

for (const t of ["percent", "profit", "interest", "work", "trains", "boats", "pnc", "dice", "mixture", "hcf"] as AptTopic[])
  for (let seed = 1; seed <= 200; seed++) {
    const p = aptitude(t, seed);
    assert.ok(Number.isFinite(p.answer) && p.steps.length > 0 && !p.q.includes("NaN"), `${t} seed ${seed}`);
  }
assert.equal(aptitude("work", 3).answer, aptitude("work", 3).answer, "deterministic per seed");

// consistent hashing: adding a 5th server moves about 1/5 of keys on the ring, about 4/5 with mod N
{
  const keys = Array.from({ length: 2000 }, (_, i) => `user${i}`), four = ["A", "B", "C", "D"], five = [...four, "E"];
  const r4 = hashRing(four, keys, 100).owner, r5 = hashRing(five, keys, 100).owner, m4 = modOwner(four, keys), m5 = modOwner(five, keys);
  const ringMoved = keys.filter((k) => r4[k] !== r5[k]).length, modMoved = keys.filter((k) => m4[k] !== m5[k]).length;
  assert.ok(ringMoved > 200 && ringMoved < 600 && modMoved > 1400, `ring moved ${ringMoved}, mod moved ${modMoved}`);
  assert.ok(keys.every((k) => r5[k] === "E" || r4[k] === r5[k]), "on the ring, keys only ever move to the new server");
}
// rate limiting: the fixed window lets a double burst through at the boundary; sliding window and token bucket do not
{
  const t = [0.9, 0.9, 0.9, 1.0, 1.0, 1.0];
  const okCount = (a: "token" | "fixed" | "sliding") => rateLimit(a, t, 3, 1).filter((s) => s.ok).length;
  assert.deepEqual([okCount("fixed"), okCount("sliding"), okCount("token")], [6, 3, 3]);
  const steady = rateLimit("token", [0, 1, 2, 3, 4], 3, 3);
  assert.ok(steady.every((s) => s.ok), "one request a second never empties a 3-per-3s bucket");
}

console.log("simulators ok");
import "./sim-core.check.ts";

/* ---------- content ---------- */
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Code, Subject } from "./types.ts";
import { OS } from "./os.ts";
import { DBMS } from "./dbms.ts";
import { CN } from "./cn.ts";
import { SQL } from "./sql.ts";
import { OOPS } from "./oops.ts";
import { APTITUDE } from "./aptitude.ts";
import { ORDER_SETUP, ORDER_SQL, orderSteps, NF_STAGES, LOOP_SCENARIOS } from "./labdata.ts";
import { SYNTAX } from "./syntax.ts";
import { REACT } from "./react.ts";
import { NODE } from "./node.ts";
import { DESIGN } from "./design.ts";
import { FLOWS, type BarStep, type GridStep, type LaneStep } from "./flows.ts";
import { FLOW_SLOTS } from "../genai/labs.ts";
import { FACTS } from "../landingFacts.ts";
import { compile, type PlayMode } from "./playground/compile.ts";
import { STARTERS } from "./playground/starters.ts";
import { OA } from "./oa/index.ts";
import { COVERAGE } from "./design-coverage.ts";
import { geohash, matchBuy } from "./flows-design.ts";

const SUBJECTS: Subject[] = [OS, DBMS, CN, SQL, OOPS, APTITUDE, SYNTAX, REACT, NODE, DESIGN];
// further reading: https only, no repeats, and only on chapters that exist
{
  const urls = DESIGN.chapters.flatMap((c) => (c.read ?? []).map((r) => r.url));
  assert.ok(urls.length >= 30 && urls.every((u) => u.startsWith("https://")), "reading links must use https");
  assert.equal(new Set(urls).size, urls.length, "a reading link appears twice");
}
// System Design covers every topic on the list: each term appears in the chapter it is mapped to
for (const { topic, terms } of COVERAGE) for (const [term, id] of terms) {
  const ch = DESIGN.chapters.find((c) => c.id === id);
  assert.ok(ch, `coverage ${topic}: no chapter ${id}`);
  assert.ok(JSON.stringify(ch).toLowerCase().includes(term.toLowerCase()), `coverage ${topic}: chapter ${id} never mentions "${term}"`);
}
assert.equal(geohash(57.64911, 10.40744, 11), "u4pruydqqvj", "geohash matches the reference implementation");
assert.deepEqual(matchBuy([{ id: "a", px: 10, qty: 5 }, { id: "b", px: 11, qty: 5 }], 11, 7).fills, [["a", 10, 5], ["b", 11, 2]], "price-time matching");
// parts: each starts at a real chapter, in order, and the first starts at the first chapter
for (const s of SUBJECTS) if (s.parts) {
  const at = s.parts.map(([, from]) => s.chapters.findIndex((c) => c.id === from));
  assert.ok(at[0] === 0 && at.every((k, i) => k >= 0 && (i === 0 || k > at[i - 1])), `${s.id}: parts must start at chapters in order`);
}
const text = JSON.stringify(SUBJECTS);
assert.ok(!text.includes(String.fromCharCode(0x2014)), "no em dashes in Other content");

const cell = (v: unknown) => (v === null ? "NULL" : String(v));
function runSql(where: string, code: Code) {
  const db = new DatabaseSync(":memory:");
  if (code.sqlSetup) db.exec(code.sqlSetup);
  const stmts = code.sql!.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
  stmts.slice(0, -1).forEach((s) => db.exec(s));
  const last = stmts[stmts.length - 1];
  if (/^\s*(SELECT|WITH)/i.test(last)) {
    const rows = db.prepare(last).all() as Record<string, unknown>[];
    if (code.result) {
      assert.deepEqual(rows.length ? Object.keys(rows[0]) : code.result.head, code.result.head, `${where}: columns`);
      assert.deepEqual(rows.map((r) => Object.values(r).map(cell)), code.result.rows, `${where}: rows`);
    }
  } else db.exec(last);
}

const dir = mkdtempSync(join(tmpdir(), "other-check-"));
let compiled = 0;
function runJava(where: string, src: string) {
  const name = /public class (\w+)/.exec(src)?.[1];
  assert.ok(name, `${where}: Java needs a public class`);
  const d = mkdtempSync(join(dir, "j-"));
  writeFileSync(join(d, `${name}.java`), src);
  execFileSync("javac", ["-d", d, join(d, `${name}.java`)], { stdio: "pipe" });
  const out = execFileSync("java", ["-cp", d, name!], { stdio: "pipe", timeout: 20000 }).toString();
  compiled++;
  return out;
}
function runCpp(where: string, src: string) {
  const d = mkdtempSync(join(dir, "c-"));
  writeFileSync(join(d, "main.cpp"), src);
  execFileSync("c++", ["-std=c++17", "-Wall", "-Werror", "-pthread", "-o", join(d, "a.out"), join(d, "main.cpp")], { stdio: "pipe" });
  const out = execFileSync(join(d, "a.out"), { stdio: "pipe", timeout: 20000 }).toString();
  compiled++;
  return out;
}

// Python, JavaScript and TypeScript run directly; TS and TSX are also type-checked in one tsc pass below.
// tsc needs node_modules (react types), so those files go in a folder inside the repo, deleted at the end.
const tsDir = join(process.cwd(), ".other-check");
rmSync(tsDir, { recursive: true, force: true }); mkdirSync(tsDir);
let tsFiles = 0;
function runPython(where: string, src: string) {
  const f = join(mkdtempSync(join(dir, "p-")), "main.py");
  writeFileSync(f, src);
  execFileSync("python3", ["-I", f], { stdio: "pipe", timeout: 20000 });
  compiled++;
}
function runJs(where: string, src: string) {
  const f = join(mkdtempSync(join(dir, "n-")), "main.mjs");
  writeFileSync(f, src);
  const local = /from "express"/.test(src) ? join(tsDir, `x${compiled}.mjs`) : f;   // express resolves from this repo's node_modules
  if (local !== f) writeFileSync(local, src);
  const serves = /\.listen\([1-9]/.test(src);          // a fixed-port server would block: the preload answers one request and closes it
  execFileSync("node", [...(serves ? ["--import", join(process.cwd(), "lib/other/express-preload.mjs")] : []), local], { stdio: "pipe", timeout: 20000 });
  compiled++;
}
function runTs(where: string, src: string, tsx = false) {
  const f = join(tsDir, `t${tsFiles++}.${tsx ? "tsx" : "ts"}`);
  writeFileSync(f, src);
  if (!tsx) { execFileSync("node", ["--disable-warning=ExperimentalWarning", f], { stdio: "pipe", timeout: 20000 }); compiled++; }
}

let sqlRun = 0;
for (const s of SUBJECTS) for (const ch of s.chapters) {
  if (ch.anim) assert.ok(FLOWS[ch.anim], `${s.id}/${ch.id}: unknown animation ${ch.anim}`);
  for (const r of ch.real ?? []) assert.ok(/^https:\/\//.test(r.url) && r.what && r.lesson, `${s.id}/${ch.id}: story ${r.who} needs a source and a takeaway`);
  const codes: [string, Code | undefined][] = [[`${s.id}/${ch.id}`, ch.code], ...ch.cards.map((c) => [`${s.id}/${ch.id}/${c.id}`, c.code] as [string, Code | undefined])];
  for (const [where, code] of codes) {
    if (!code) continue;
    try {
      if (code.sql) { runSql(where, code); sqlRun++; }
      if (code.java) runJava(where, code.java);
      if (code.cpp) runCpp(where, code.cpp);
      if (code.python) runPython(where, code.python);
      if (code.js) runJs(where, code.js);
      if (code.ts) runTs(where, code.ts);
      if (code.tsx) runTs(where, code.demo ? `${code.tsx}\n\n${code.demo}` : code.tsx, true);
    } catch (e) {
      const err = e as { stderr?: Buffer; message: string };
      console.error(`FAIL ${where}\n${err.stderr?.toString() ?? err.message}`);
      process.exitCode = 1;
    }
  }
  const ids = new Set<string>();
  for (const c of ch.cards) { assert.ok(!ids.has(c.id), `${s.id}/${ch.id}: duplicate card id ${c.id}`); ids.add(c.id); }
}

// the OA bank: well-formed options, and every code question answers what the code really does
{
  assert.ok(!JSON.stringify(OA).includes(String.fromCharCode(0x2014)), "no em dashes in OA questions");
  let ran = 0;
  for (const s of OA) {
    assert.ok(s.questions.length >= 30, `oa/${s.id}: only ${s.questions.length} questions`);
    assert.equal(new Set(s.questions.map((q) => q.id)).size, s.questions.length, `oa/${s.id}: duplicate id`);
    for (const q of s.questions) {
      const where = `oa/${s.id}/${q.id}`, options = [q.answer, ...q.wrong];
      assert.equal(new Set(options).size, 4, `${where}: needs 4 different options, got ${options.join(" | ")}`);
      assert.ok(options.every((o) => o && !/NaN|undefined|Infinity|of the above/.test(o)), `${where}: bad option in ${options.join(" | ")}`);
      assert.ok(q.q && q.why.length > 15, `${where}: needs a question and an explanation`);
      if (q.kind !== "output") continue;
      const c = q.code!;
      let got: string;
      if (c.lang === "sql") {
        const d = new DatabaseSync(":memory:");
        d.exec(c.setup!);
        const rows = d.prepare(c.src.replace(/;\s*$/, "")).all() as Record<string, unknown>[];
        got = rows.length ? rows.map((r) => Object.values(r).map(cell).join(", ")).join("; ") : "no rows";
      } else got = (c.lang === "java" ? runJava(where, c.src) : runCpp(where, c.src)).trim();
      assert.equal(got, q.answer, where);
      ran++;
    }
  }
  console.log(`OA ok: ${OA.reduce((n, s) => n + s.questions.length, 0)} questions, ${ran} code answers checked by running them`);
}

// one strict type-check over every TypeScript and TSX example
if (tsFiles) {
  try {
    execFileSync("npx", ["tsc", "--noEmit", "--strict", "--skipLibCheck", "--target", "es2022", "--module", "esnext", "--moduleResolution", "bundler",
      "--jsx", "react-jsx", "--moduleDetection", "force", "--allowImportingTsExtensions", "--types", "node", ...Array.from({ length: tsFiles }, (_, i) => join(tsDir, `t${i}.${existsTsx(i) ? "tsx" : "ts"}`))], { stdio: "pipe" });
  } catch (e) {
    const err = e as { stdout?: Buffer; message: string };
    console.error(`FAIL tsc\n${err.stdout?.toString() ?? err.message}`); process.exitCode = 1;
  }
}
function existsTsx(i: number) { try { return statSync(join(tsDir, `t${i}.tsx`)).isFile(); } catch { return false; } }
if (!process.exitCode) rmSync(tsDir, { recursive: true, force: true });

// event-loop lab: the last frame's output must match what Node really prints
for (const sc of LOOP_SCENARIOS) {
  const f = join(mkdtempSync(join(dir, "e-")), "loop.mjs");
  writeFileSync(f, sc.code);
  const out = execFileSync("node", [f], { encoding: "utf8" }).trim().split("\n");
  assert.deepEqual(out, sc.frames.at(-1)!.out, `event loop: ${sc.name}`);
}

// the SQL-order lab's last step must match what SQLite returns for the same query
const db = new DatabaseSync(":memory:");
db.exec(ORDER_SETUP);
const real = (db.prepare(ORDER_SQL.replace(/;$/, "")).all() as Record<string, unknown>[]).map((r) => Object.values(r).map(cell));
assert.deepEqual(orderSteps().at(-1)!.rows.map((r) => r.map(cell)), real, "SQL order lab matches SQLite");
// every 3NF table's key determines the table's columns
for (const tb of NF_STAGES[3].tables) assert.ok(tb.cols.every((c) => closure(tb.key, FDS).includes(c)), `3NF ${tb.name}: key covers columns`);

/* ---------- playground: the browser emulation of Node against the real thing ---------- */
{
  // the sandbox runtime is a plain script for the iframe; load it the same way here
  new Function(readFileSync(join(process.cwd(), "public/playground/runtime.js"), "utf8"))();
  const pg = (globalThis as unknown as { __pg: { run(js: string, write: (k: string, t: string) => void, src?: string): { node: { dispatch(port: number, m: string, u: string, h: object, b?: string): Promise<{ status: number; headers: Record<string, string>; body: { toString(): string } }>; busy(): boolean }; done: Promise<void> } } }).__pg;
  const norm = (t: string) => t.replace(/\s+/g, " ").trim();
  async function emulate(code: string, mode: PlayMode, wait = 1500) {
    const c = compile(code, mode);
    assert.ok(c.js !== undefined, `compile: ${c.error}`);
    const lines: string[] = [], errors: string[] = [];
    const r = pg.run(c.js!, (k, t) => { if (k === "log" || k === "raw") lines.push(t); else if (k === "error" || k === "warn" || k === "rawerr") errors.push(t); }, code);
    await r.done;
    const t0 = Date.now();
    while (r.node.busy() && Date.now() - t0 < wait) await new Promise((res) => setTimeout(res, 10));
    return { out: lines.join("\n"), errors, node: r.node };
  }
  // anything that runs under real Node with the same output each time must print the same here
  let same = 0, ran = 0;
  for (const s of [NODE, SYNTAX]) for (const ch of s.chapters) for (const code of [ch.code, ...ch.cards.map((x) => x.code)]) {
    for (const [src, mode] of [[code?.js, "node"], [code?.ts, "ts"]] as const) {
      if (!src) continue;
      const where = `${s.id}/${ch.id}`;
      const em = await emulate(src, mode);
      assert.deepEqual(em.errors, [], `playground ${where}: ${em.errors[0]}`);
      ran++;
      if (/\.listen\(|node:test|node:os|tmpdir/.test(src)) continue;       // servers, test reporters and machine details differ by design
      const f = join(tsDir, `pg${ran}.${mode === "ts" ? "ts" : "mjs"}`);
      mkdirSync(tsDir, { recursive: true }); writeFileSync(f, src);
      const realRun = () => execFileSync("node", ["--disable-warning=ExperimentalWarning", f], { encoding: "utf8", timeout: 20000, cwd: process.cwd() });
      const a = realRun(), b = realRun();
      rmSync(f);
      if (a !== b) continue;                                                 // random or timed output
      assert.equal(norm(em.out), norm(a), `playground output differs from Node: ${where}`);
      same++;
    }
  }
  // scrypt, SHA-256 and HMAC are real implementations: same bytes as Node's crypto
  const cr = await emulate(`import { scryptSync, createHash, createHmac, pbkdf2Sync } from "node:crypto";
console.log(scryptSync("pw", "salt", 32).toString("hex"));
console.log(createHash("sha256").update("abc").digest("hex"));
console.log(createHmac("sha256", "key").update("abc").digest("base64"));
console.log(pbkdf2Sync("pw", "salt", 10, 40, "sha256").toString("hex"));`, "node");
  const nc = await import("node:crypto");
  assert.equal(cr.out, [nc.scryptSync("pw", "salt", 32).toString("hex"), nc.createHash("sha256").update("abc").digest("hex"), nc.createHmac("sha256", "key").update("abc").digest("base64"), nc.pbkdf2Sync("pw", "salt", 10, 40, "sha256").toString("hex")].join("\n"), "emulated crypto matches Node");
  // the same Express app, real and emulated, must answer every request the same way
  const APP = `import express from "express";
const app = express();
app.use(express.json());
app.use((req, res, next) => { res.set("x-seen", req.method + " " + req.url); next(); });
const api = express.Router();
api.get("/items/:id", (req, res) => res.json({ id: req.params.id, q: req.query, base: req.baseUrl, url: req.url }));
api.post("/items", (req, res) => (req.body?.name ? res.status(201).location("/api/items/9").json(req.body) : res.status(400).json({ error: "name is required" })));
api.delete("/items/:id", (req, res) => res.status(204).end());
app.use("/api", api);
app.get("/", (req, res) => res.send("ok"));
app.get("/text", (req, res) => res.type("text").send("plain"));
app.get("/status", (req, res) => res.sendStatus(418 - 15));
app.get("/redirect", (req, res) => res.redirect("/"));
app.get("/boom", async () => { throw Object.assign(new Error("db down"), { status: 503 }); });
app.get("/caught", () => { throw new Error("oops"); });
app.use("/caught", (err, req, res, next) => res.status(500).json({ error: err.message }));
app.use((req, res) => res.status(404).json({ error: "not found", path: req.path }));
app.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: err.message }));
globalThis.__server = app.listen(PORT);`;
  const REQUESTS: [string, string, string?][] = [["GET", "/"], ["GET", "/text"], ["GET", "/status"], ["GET", "/redirect"], ["GET", "/api/items/7?a=1&a=2&b=x"], ["POST", "/api/items", '{"name":"x"}'], ["POST", "/api/items", "{}"], ["POST", "/api/items", "{bad json"], ["DELETE", "/api/items/3"], ["GET", "/missing"], ["GET", "/boom"], ["GET", "/caught"], ["PUT", "/"], ["GET", "/api/items/"]];
  const shape = (status: number, ct: string | null | undefined, xs: string | null | undefined, loc: string | null | undefined, body: string) => JSON.stringify({ status, type: (ct ?? "").split(";")[0], xs: xs ?? null, loc: loc ?? null, body: /^</.test(body) ? "(html)" : body });
  const realFile = join(tsDir, "express-real.mjs");
  mkdirSync(tsDir, { recursive: true });
  writeFileSync(realFile, `${APP.replace("PORT", "0")}
await new Promise((r) => setTimeout(r, 100));
const base = "http://127.0.0.1:" + globalThis.__server.address().port, out = [];
for (const [m, u, b] of ${JSON.stringify(REQUESTS)}) {
  const r = await fetch(base + u, { method: m, redirect: "manual", headers: b ? { "content-type": "application/json" } : {}, body: b });
  out.push([r.status, r.headers.get("content-type"), r.headers.get("x-seen"), r.headers.get("location"), await r.text()]);
}
console.log(JSON.stringify(out));
globalThis.__server.close(); process.exit(0);`);
  const realOut = JSON.parse(execFileSync("node", [realFile], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })) as [number, string, string, string, string][];
  rmSync(realFile);
  const em = await emulate(APP.replace("PORT", "3000"), "node");
  for (const [i, [m, u, b]] of REQUESTS.entries()) {
    const r = await em.node.dispatch(3000, m, u, b ? { "content-type": "application/json" } : {}, b);
    const [st, ct, xs, loc, body] = realOut[i];
    assert.equal(shape(r.status, r.headers["content-type"], r.headers["x-seen"], r.headers.location, r.body.toString()), shape(st, ct, xs, loc, body), `emulated Express: ${m} ${u}`);
  }
  // an endless loop is stopped, and every starter compiles and runs
  const hang = await emulate("while (true) {}", "js");
  assert.ok(hang.errors.some((e) => e.includes("Stopped")), "endless loop is stopped");
  for (const list of Object.values(STARTERS)) for (const st of list) if (st.mode === "node" || st.mode === "js" || st.mode === "ts") assert.deepEqual((await emulate(st.code, st.mode)).errors, [], `starter ${st.label}`);
  for (const list of Object.values(STARTERS)) for (const st of list) if (st.mode === "react") assert.ok(compile(st.code, "react").js, "React starter compiles");
  console.log(`playground ok: ${ran} samples ran on the emulation, ${same} match real Node output, ${REQUESTS.length} requests match real Express`);
  if (!process.exitCode) rmSync(tsDir, { recursive: true, force: true });
}

// the landing page states these numbers publicly
{
  const count = (f: (c: (typeof SUBJECTS)[number]["chapters"][number]) => number) => SUBJECTS.reduce((n, s) => n + s.chapters.reduce((m, c) => m + f(c), 0), 0);
  assert.deepEqual({ subjects: SUBJECTS.length, chapters: count(() => 1), questions: count((c) => c.cards.length), stories: count((c) => c.real?.length ?? 0) },
    { subjects: FACTS.subjects, chapters: FACTS.chapters, questions: FACTS.questions, stories: FACTS.stories }, "lib/landingFacts.ts is out of date");
}

// every animated walk-through: well formed, placed somewhere real, and showing numbers that make sense
{
  const used = new Set<string>();
  for (const s of SUBJECTS) for (const c of s.chapters) if (c.anim) used.add(c.anim);
  const source = readFileSync(join(process.cwd(), "lib/genai/content.ts"), "utf8");
  const G = JSON.parse(source.slice(source.indexOf("= [") + 2).replace(/;\s*$/, "")) as { id: string; html: string }[];
  for (const [sec, list] of Object.entries(FLOW_SLOTS)) for (const [slide, flow] of list) {
    assert.ok(FLOWS[flow], `Gen AI slot ${sec}: unknown flow ${flow}`);
    assert.ok(G.find((g) => g.id === sec)?.html.includes(`id="${slide}"`), `Gen AI slot ${sec}/${slide}: no such slide`);
    used.add(flow);
  }
  for (const [id, f] of Object.entries(FLOWS)) {
    assert.ok(used.has(id), `flow ${id} is not shown anywhere`);
    assert.ok(f.steps.length >= 2 && f.title, `flow ${id}`);
    const text = JSON.stringify(f);
    const bad = /NaN|(?<!is )undefined|Infinity|[:,[]null/;      // JSON turns NaN into null
    assert.ok(!bad.test(text), `flow ${id} has a bad value: ${text.match(new RegExp(`.{0,40}(${bad.source}).{0,20}`))?.[0]}`);
    for (const st of f.steps) {
      assert.ok(st.note.length > 10, `flow ${id}: step needs a caption`);
      if (f.kind === "lanes") { const l = st as LaneStep; assert.ok(l.from in f.lanes && l.to in f.lanes && l.label, `flow ${id}: bad lane`); assert.ok(l.label.length <= 26, `flow ${id}: label too long: ${l.label}`); }
    }
    if (f.kind === "bars") for (const st of f.steps) assert.equal((st as BarStep).bars.length, f.steps[0].bars.length, `flow ${id}: bar count changes`);
  }
  const noteHas = (id: string, s: string) => assert.ok(FLOWS[id].steps.some((x) => x.note.includes(s)), `flow ${id} should say ${s}`);
  // spot checks against values worked out independently
  noteHas("apt-euclid", "HCF is 21"); noteHas("apt-euclid", "= 1260");
  noteHas("os-translate", "= 29092");
  noteHas("g-backprop", "from 9 to 5.76");
  noteHas("g-kappa", "= 0.38");
  noteHas("g-lora", "65,536");
  noteHas("g-batching", "against 9 for static");
  noteHas("syn-stack", "fact(4) = 24");
  // the window example must match what SQLite really computes
  const wdb = new DatabaseSync(":memory:");
  wdb.exec("CREATE TABLE e (name TEXT, dept INT, pay INT); INSERT INTO e VALUES ('Asha',1,90),('Ben',1,70),('Chen',2,50),('Dia',2,65),('Eli',NULL,40);");
  const real2 = (wdb.prepare("SELECT name, dept, pay, ROW_NUMBER() OVER w AS rk, SUM(pay) OVER w AS run FROM e WHERE dept IS NOT NULL WINDOW w AS (PARTITION BY dept ORDER BY pay DESC) ORDER BY dept, pay DESC").all() as Record<string, unknown>[]).map((r) => Object.values(r).map(cell));
  const shown = (FLOWS["sql-window"].steps.at(-1) as GridStep).tables[0].rows.map((r) => r.map(cell));
  assert.deepEqual(shown, real2, "SQL window flow matches SQLite");
  const join2 = (wdb.exec("CREATE TABLE d (id INT, name TEXT); INSERT INTO d VALUES (1,'Eng'),(2,'Sales'),(3,'Legal');"), wdb.prepare("SELECT e.name, COALESCE(d.name,'NULL') FROM e LEFT JOIN d ON e.dept = d.id").all() as Record<string, unknown>[]).map((r) => Object.values(r).map(cell));
  assert.deepEqual((FLOWS["sql-join"].steps[2] as GridStep).tables[0].rows.map((r) => r.map(cell)), join2, "SQL join flow matches SQLite");
  console.log(`flows ok: ${Object.keys(FLOWS).length} animated walk-throughs`);
}

console.log(`content ok: ${SUBJECTS.length} subjects, ${SUBJECTS.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.cards.length, 0), 0)} questions, ${sqlRun} SQL runs, ${compiled} programs run, ${tsFiles} TypeScript files type-checked`);
