// Run: npm run check:other. Checks every simulator against known results, then checks the content:
// SQL answers run in SQLite (node:sqlite), Java and C++ programs compile and run, and no text has an em dash.
import assert from "node:assert";
import { bankerSafety, bplusInsertAll, candidateKeys, closure, dispatch, levelsOf, pageReplace, schedule, slidingWindow, subnet, aptitude, type AptTopic, type BNode } from "./sim.ts";

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

console.log("simulators ok");

/* ---------- content ---------- */
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Code, Subject } from "./types.ts";
import { OS } from "./os.ts";
import { DBMS } from "./dbms.ts";
import { CN } from "./cn.ts";
import { SQL } from "./sql.ts";
import { OOPS } from "./oops.ts";
import { APTITUDE } from "./aptitude.ts";
import { ORDER_SETUP, ORDER_SQL, orderSteps, NF_STAGES } from "./labdata.ts";

const SUBJECTS: Subject[] = [OS, DBMS, CN, SQL, OOPS, APTITUDE];
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
  execFileSync("java", ["-cp", d, name!], { stdio: "pipe", timeout: 20000 });
  compiled++;
}
function runCpp(where: string, src: string) {
  const d = mkdtempSync(join(dir, "c-"));
  writeFileSync(join(d, "main.cpp"), src);
  execFileSync("c++", ["-std=c++17", "-Wall", "-Werror", "-pthread", "-o", join(d, "a.out"), join(d, "main.cpp")], { stdio: "pipe" });
  execFileSync(join(d, "a.out"), { stdio: "pipe", timeout: 20000 });
  compiled++;
}

let sqlRun = 0;
for (const s of SUBJECTS) for (const ch of s.chapters) {
  const codes: [string, Code | undefined][] = [[`${s.id}/${ch.id}`, ch.code], ...ch.cards.map((c) => [`${s.id}/${ch.id}/${c.id}`, c.code] as [string, Code | undefined])];
  for (const [where, code] of codes) {
    if (!code) continue;
    try {
      if (code.sql) { runSql(where, code); sqlRun++; }
      if (code.java) runJava(where, code.java);
      if (code.cpp) runCpp(where, code.cpp);
    } catch (e) {
      const err = e as { stderr?: Buffer; message: string };
      console.error(`FAIL ${where}\n${err.stderr?.toString() ?? err.message}`);
      process.exitCode = 1;
    }
  }
  const ids = new Set<string>();
  for (const c of ch.cards) { assert.ok(!ids.has(c.id), `${s.id}/${ch.id}: duplicate card id ${c.id}`); ids.add(c.id); }
}

// the SQL-order lab's last step must match what SQLite returns for the same query
const db = new DatabaseSync(":memory:");
db.exec(ORDER_SETUP);
const real = (db.prepare(ORDER_SQL.replace(/;$/, "")).all() as Record<string, unknown>[]).map((r) => Object.values(r).map(cell));
assert.deepEqual(orderSteps().at(-1)!.rows.map((r) => r.map(cell)), real, "SQL order lab matches SQLite");
// every 3NF table's key determines the table's columns
for (const tb of NF_STAGES[3].tables) assert.ok(tb.cols.every((c) => closure(tb.key, FDS).includes(c)), `3NF ${tb.name}: key covers columns`);

console.log(`content ok: ${SUBJECTS.length} subjects, ${SUBJECTS.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.cards.length, 0), 0)} questions, ${sqlRun} SQL runs, ${compiled} Java/C++ programs`);
