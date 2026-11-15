// Interactive walk-throughs for SQL and OOP chapters (see flows-play.ts). The SQL ones evaluate the query in code on the
// learner's numbers, and SQL_PLAY_SQL gives the same data and query so check:other can run them in SQLite and compare the
// last table. The OOP ones simulate what the language really does: object layout, copies, constructor order, unwinding.
// Chapters that already have a lab (SQL clause order and NULLs, OOP polymorphism) are left out.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { BarStep, ChainStep, Flow, FlowTone, GridStep, GridTable } from "./flows.ts";

type V = Record<string, number>;
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");
const pct = (x: number) => `${n1(x * 100)}%`;
const plural = (k: number, w: string) => `${n0(k)} ${w}${k === 1 ? "" : "s"}`;
const tonesOf = (rows: unknown[], f: (i: number) => FlowTone | undefined) => Object.fromEntries(rows.map((_, i) => [String(i), f(i)]).filter(([, t]) => t)) as Record<string, FlowTone>;
const vals = (rows: (string | number | null)[][]) => rows.map((r) => `(${r.map((x) => (x === null ? "NULL" : typeof x === "number" ? x : `'${x}'`)).join(", ")})`).join(", ");

/* =============================== SQL =============================== */

/* ---------- joins ---------- */
const JOINS = ["INNER", "LEFT", "RIGHT", "FULL"];
const joinData = (k: number) => ({
  customers: [[1, "ana"], [2, "bo"], [3, "cy"]] as [number, string][],
  orders: [...Array.from({ length: k }, (_, i) => [i + 1, 1]), [k + 1, 2], [k + 2, 9]] as [number, number][],
});
function join(v: V): Flow {
  const type = JOINS[v.type - 1], k = v.k, { customers, orders } = joinData(k);
  const keepLeft = type === "LEFT" || type === "FULL", keepRight = type === "RIGHT" || type === "FULL";
  const head = ["customer", "order"], out: [number | null, string, string][] = [];
  const res = (hot: number[] = []): GridTable => ({ label: "result", head, rows: out.map(([, c, o]) => [c, o]), tones: Object.fromEntries(hot.map((i) => [String(i), "hot" as FlowTone])) });
  const ordersT = (hot?: number): GridTable => ({ label: "orders", head: ["id", "cust"], rows: orders.map(([id, c]) => [id, c]), tones: tonesOf(orders, (i) => (orders[i][1] === hot ? "hot" : undefined)) });
  const steps: GridStep[] = [{ note: `customers ${type} JOIN orders ON o.cust = c.id. ana has ${plural(k, "order")}, bo has 1, cy has none, and order ${k + 2} belongs to customer 9, who was deleted.`,
    tables: [{ label: "customers", head: ["id", "name"], rows: customers.map(([id, n]) => [id, n]) }, ordersT()] }];
  for (const [id, name] of customers) {
    const mine = orders.filter(([, c]) => c === id), from = out.length;
    if (mine.length) mine.forEach(([oid]) => out.push([id, name, String(oid)]));
    else if (keepLeft) out.push([id, name, "NULL"]);
    const added = Array.from({ length: out.length - from }, (_, i) => from + i);
    steps.push({ note: mine.length ? `${name} matches ${plural(mine.length, "order")}, so ${name} appears ${mine.length === 1 ? "once" : `${mine.length} times`}${mine.length > 1 ? ": a join repeats a row once for every match, which is why a SUM after a join can double count" : ""}.`
      : keepLeft ? `${name} matches no order. ${type} JOIN keeps every customer, so ${name} appears once with NULL for the order.` : `${name} matches no order, so ${type} JOIN drops ${name}.`,
      tone: mine.length ? "hot" : keepLeft ? "warn" : "bad", tables: [res(added), ordersT(id)] });
  }
  const orphan = orders.at(-1)![0];
  if (keepRight) out.push([null, "NULL", String(orphan)]);
  steps.push({ note: keepRight ? `Order ${orphan} matches no customer. ${type} JOIN keeps every order, so it appears with NULL for the customer.` : `Order ${orphan} matches no customer. ${type} JOIN keeps only rows with a customer, so it is dropped.`, tone: keepRight ? "warn" : "bad", tables: [res(keepRight ? [out.length - 1] : []), ordersT(9)] });
  steps.push({ note: `${plural(out.length, "row")}. INNER keeps matches only, LEFT adds customers with no order, RIGHT adds orders with no customer, FULL adds both. Count from the right table (COUNT(o.id)) so NULL rows count as 0.`, tone: "ok", tables: [res()] });
  return { kind: "grid", title: `${type} JOIN, ana with ${plural(k, "order")}`, steps };
}
const joinSql = (v: V) => { const { customers, orders } = joinData(v.k); return { setup: `CREATE TABLE customers (id INT, name TEXT); CREATE TABLE orders (id INT, cust INT); INSERT INTO customers VALUES ${vals(customers)}; INSERT INTO orders VALUES ${vals(orders)};`, query: `SELECT c.name, o.id FROM customers c ${JOINS[v.type - 1]} JOIN orders o ON o.cust = c.id ORDER BY c.id IS NULL, c.id, o.id` }; };

/* ---------- WHERE vs HAVING ---------- */
const ORDERS: [number, string, number][] = [[1, "ravi", 250], [2, "ravi", 100], [3, "meera", 400], [4, "ravi", 80], [5, "meera", 120], [6, "sam", 60], [7, "sam", 300], [8, "lin", 40]];
function having(v: V): Flow {
  const w = v.w, h = v.h, kept = ORDERS.filter(([, , a]) => a >= w);
  const groups = [...new Set(kept.map(([, c]) => c))].sort().map((c) => { const mine = kept.filter(([, x]) => x === c); return [c, mine.length, mine.reduce((s, [, , a]) => s + a, 0)] as [string, number, number]; });
  const pass = groups.filter(([, , t]) => t >= h), gHead = ["customer", "n", "total"];
  const steps: GridStep[] = [
    { note: `SELECT customer, COUNT(*), SUM(amount) FROM orders WHERE amount >= ${w} GROUP BY customer HAVING SUM(amount) >= ${h}. ${ORDERS.length} orders to start.`, tables: [{ label: "orders", head: ["id", "customer", "amount"], rows: ORDERS.map((r) => [...r]) }] },
    { note: `WHERE runs first, on single rows: amount >= ${w} keeps ${kept.length} of ${ORDERS.length} orders. It cannot use SUM, because no groups exist yet.`, tone: "hot", tables: [{ label: "orders", head: ["id", "customer", "amount"], rows: ORDERS.map((r) => [...r]), tones: tonesOf(ORDERS, (i) => (ORDERS[i][2] >= w ? "ok" : "bad")) }] },
    { note: `GROUP BY customer folds the ${kept.length} kept rows into ${plural(groups.length, "group")}, one per customer, with a count and a total.`, tables: [{ label: "groups", head: gHead, rows: groups.map((g) => [...g]) }] },
    { note: `HAVING runs on groups: SUM(amount) >= ${h} keeps ${pass.length} of ${groups.length}. A customer with many small orders can pass HAVING even if WHERE dropped their big one.`, tone: "hot", tables: [{ label: "groups", head: gHead, rows: groups.map((g) => [...g]), tones: tonesOf(groups, (i) => (groups[i][2] >= h ? "ok" : "bad")) }] },
    { note: pass.length ? `${plural(pass.length, "row")} in the result. Put every condition that does not need an aggregate in WHERE: fewer rows reach GROUP BY.` : `No group reaches ${h}, so the result is empty. Lower the HAVING bar or let more rows through WHERE.`, tone: pass.length ? "ok" : "warn", tables: [{ label: "result", head: gHead, rows: pass.map(([c, n, t]) => [c, String(n), String(t)]) }] },
  ];
  return { kind: "grid", title: `WHERE amount >= ${w}, HAVING total >= ${h}`, steps };
}
const havingSql = (v: V) => ({ setup: `CREATE TABLE orders (id INT, customer TEXT, amount INT); INSERT INTO orders VALUES ${vals(ORDERS)};`, query: `SELECT customer, COUNT(*) AS n, SUM(amount) AS total FROM orders WHERE amount >= ${v.w} GROUP BY customer HAVING SUM(amount) >= ${v.h} ORDER BY customer` });

/* ---------- correlated subquery ---------- */
const staff = (ben: number): [string, string, number][] => [["Asha", "eng", 90], ["Ben", "eng", ben], ["Chen", "eng", 70], ["Dia", "sales", 65], ["Eli", "sales", 48], ["Fay", "support", 45]];
function correlated(v: V): Flow {
  const m = v.m, emp = staff(v.ben), depts = [...new Set(emp.map((e) => e[1]))];
  const avg = Object.fromEntries(depts.map((d) => { const p = emp.filter((e) => e[1] === d).map((e) => e[2]); return [d, p.reduce((s, x) => s + x, 0) / p.length]; }));
  const bar = (d: string) => avg[d] * (1 + m / 100), above = emp.filter(([, d, p]) => p > bar(d)).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const head = ["name", "dept", "pay"];
  const steps: GridStep[] = [
    { note: `Who earns more than their department's average${m ? ` by over ${m}%` : ""}? Pay is in thousands; Ben earns ${v.ben}. The inner query runs once per outer row, using that row's dept.`, tables: [{ label: "emp", head, rows: emp.map((e) => [...e]) }] },
    { note: `The subquery SELECT AVG(pay) FROM emp WHERE dept = e.dept gives each department's average${m ? `, and the bar is ${100 + m}% of it` : ""}.`, tone: "hot", tables: [{ label: "per department", head: ["dept", "average", "bar"], rows: depts.map((d) => [d, n1(avg[d]), n1(bar(d))]) }] },
    { note: `Each row compares its pay with its own department's bar. ${emp.filter(([, d]) => emp.filter((e) => e[1] === d).length === 1).map(([n]) => n).join(", ")} is alone in a department, so equals the average and never beats it.`, tables: [{ label: "emp", head: ["name", "pay", "bar"], rows: emp.map(([n, d, p]) => [n, p, n1(bar(d))]), tones: tonesOf(emp, (i) => (emp[i][2] > bar(emp[i][1]) ? "ok" : "bad")) }] },
    { note: above.length ? `${plural(above.length, "person")} above the bar. The same answer comes from a window: AVG(pay) OVER (PARTITION BY dept), computed once instead of per row.` : "Nobody beats the bar. Raise Ben's pay or lower the margin to see someone pass.", tone: above.length ? "ok" : "warn", tables: [{ label: "result", head, rows: above.map(([n, d, p]) => [n, d, String(p)]) }] },
  ];
  return { kind: "grid", title: `Ben at ${v.ben}, beating the average by over ${m}%`, steps };
}
const correlatedSql = (v: V) => ({ setup: `CREATE TABLE emp (name TEXT, dept TEXT, pay INT); INSERT INTO emp VALUES ${vals(staff(v.ben))};`, query: `SELECT name, dept, pay FROM emp e WHERE pay > (SELECT AVG(pay) FROM emp WHERE dept = e.dept) * (1 + ${v.m} / 100.0) ORDER BY name` });

/* ---------- ROW_NUMBER, RANK, DENSE_RANK ---------- */
const scores = (b: number, c: number): [string, number][] => [["Asha", 90], ["Ben", b], ["Chen", c], ["Dia", 75], ["Eli", 70]];
function rank(v: V): Flow {
  const N = v.n, rows = [...scores(v.b, v.c)].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
  const full = rows.map(([name, s], i) => [name, s, i + 1, 1 + rows.filter((r) => r[1] > s).length, 1 + new Set(rows.filter((r) => r[1] > s).map((r) => r[1])).size] as [string, number, number, number, number]);
  const head = ["name", "score", "row#", "rank", "dense"], upTo = (c: number) => full.map((r) => r.slice(0, c).map(String));
  const ties = rows.length - new Set(rows.map((r) => r[1])).size, byRank = full.filter((r) => r[3] <= N).length, byDense = full.filter((r) => r[4] <= N).length;
  const steps: GridStep[] = [
    { note: `Five scores, Ben ${v.b} and Chen ${v.c}, sorted high to low (ties by name). ${ties ? `${plural(ties, "tie")} to break.` : "No ties, so all three functions agree."} We want the top ${N}.`, tables: [{ head: head.slice(0, 2), rows: upTo(2) }] },
    { note: "ROW_NUMBER() OVER (ORDER BY score DESC, name) numbers rows 1, 2, 3 with no repeats, so ties get different numbers. Add a tie-break column or the order is not fixed.", tone: "hot", tables: [{ head: head.slice(0, 3), rows: upTo(3) }] },
    { note: "RANK() gives tied rows the same number and then skips: two people at 2 are followed by 4.", tone: "hot", tables: [{ head: head.slice(0, 4), rows: upTo(4) }] },
    { note: "DENSE_RANK() also shares numbers on ties but never skips: two at 2 are followed by 3.", tone: "hot", tables: [{ head, rows: upTo(5) }] },
    { note: `Top ${N}: row# <= ${N} keeps exactly ${Math.min(N, 5)}, rank <= ${N} keeps ${byRank}, dense <= ${N} keeps ${byDense}. Filter in an outer query: WHERE cannot see a window result.`, tone: "ok", tables: [{ head, rows: upTo(5), tones: tonesOf(full, (i) => (full[i][4] <= N ? "ok" : undefined)) }] },
  ];
  return { kind: "grid", title: `Ben ${v.b}, Chen ${v.c}: ranks and the top ${N}`, steps };
}
const rankSql = (v: V) => ({ setup: `CREATE TABLE t (name TEXT, score INT); INSERT INTO t VALUES ${vals(scores(v.b, v.c))};`, query: "SELECT name, score, ROW_NUMBER() OVER (ORDER BY score DESC, name), RANK() OVER (ORDER BY score DESC), DENSE_RANK() OVER (ORDER BY score DESC) FROM t ORDER BY score DESC, name" });

/* ---------- gaps and islands ---------- */
const loginDays = (a: number, g: number, c: number) => [...Array.from({ length: a }, (_, i) => i + 1), ...Array.from({ length: c }, (_, i) => a + g + 1 + i)];
function islands(v: V): Flow {
  const days = loginDays(v.a, v.g, v.c), grp = days.map((d, i) => d - (i + 1)), keys = [...new Set(grp)];
  const isl = keys.map((k) => { const ds = days.filter((_, i) => grp[i] === k); return [ds[0], ds.at(-1)!, ds.length]; });
  const tone = (i: number): FlowTone => (keys.indexOf(grp[i]) === 0 ? "hot" : "ok");
  const steps: GridStep[] = [
    { note: `A user logs in on days 1 to ${v.a}, skips ${plural(v.g, "day")}, then logs in ${plural(v.c, "more day")}. Find each streak of consecutive days.`, tables: [{ head: ["day"], rows: days.map((d) => [d]) }] },
    { note: "Number the rows in day order with ROW_NUMBER(). Inside a streak, day and row number both go up by 1.", tables: [{ head: ["day", "row#"], rows: days.map((d, i) => [d, i + 1]) }] },
    { note: `So day minus row number stays the same along a streak and jumps after a gap: ${keys.length === 1 ? "no gap here, so every row gets the same value" : `the gap of ${v.g} makes it jump by ${v.g}`}. That value labels the island.`, tone: "hot", tables: [{ head: ["day", "row#", "day-row#"], rows: days.map((d, i) => [d, i + 1, grp[i]]), tones: tonesOf(days, tone) }] },
    { note: `GROUP BY that label gives ${plural(isl.length, "island")}: MIN(day) is the start, MAX(day) the end, COUNT(*) the length. With real dates, subtract the row number in days.`, tone: "ok", tables: [{ label: "islands", head: ["first", "last", "days"], rows: isl.map((r) => r.map(String)) }] },
  ];
  return { kind: "grid", title: `Streaks of ${v.a} and ${v.c} days, ${v.g} apart`, steps };
}
const islandsSql = (v: V) => ({ setup: `CREATE TABLE logins (day INT); INSERT INTO logins VALUES ${loginDays(v.a, v.g, v.c).map((d) => `(${d})`).join(", ")};`, query: "SELECT MIN(day), MAX(day), COUNT(*) FROM (SELECT day, day - ROW_NUMBER() OVER (ORDER BY day) AS grp FROM logins) GROUP BY grp ORDER BY 1" });

/* ---------- index or full scan ---------- */
const RANDOM_COST = 4, FANOUT = 200;
function indexPlay(v: V): Flow {
  const n = v.rows * 1000, m = Math.max(1, Math.round((n * v.pct) / 100)), height = Math.max(1, Math.ceil(Math.log(n) / Math.log(FANOUT)));
  const scan = n, descend = height * RANDOM_COST, idx = descend + m * RANDOM_COST, win = idx < scan;
  const bars = (a: number, b: number, tb?: FlowTone) => [{ label: "full scan", value: a, tone: a && !win ? "ok" as const : undefined }, { label: "index", value: b, tone: tb }];
  const steps: BarStep[] = [
    { note: `SELECT * FROM orders WHERE status = 'x' on ${n0(n)} rows, where ${v.pct}% (${n0(m)} rows) match. Cost counts reads: a sequential read is 1, a random one ${RANDOM_COST} (PostgreSQL's default random_page_cost is 4.0). Rows stand in for pages to keep it simple.`, bars: bars(0, 0) },
    { note: `A full scan reads every row once, in order: ${n0(scan)}.`, tone: "hot", bars: bars(scan, 0) },
    { note: `The index is a B+ tree with about ${FANOUT} keys per node, so ${n0(n)} keys need ${plural(height, "level")}: ${height} random reads to reach the first match, cost ${descend}.`, tone: "hot", bars: bars(scan, descend, "hot") },
    { note: `Then each of the ${n0(m)} matches is fetched from the table by a random read: ${n0(m)} x ${RANDOM_COST} = ${n0(m * RANDOM_COST)}, so ${n0(idx)} in all.`, tone: win ? "ok" : "bad", bars: bars(scan, idx, win ? "ok" : "bad") },
    { note: win ? `The index costs ${pct(idx / scan)} of the scan. Indexes win when a query picks a small slice of the table.` : `At ${v.pct}% the index costs ${n1(idx / scan)} times the scan, so the planner ignores it. Past about ${100 / RANDOM_COST}% here, scanning is cheaper; a covering index avoids the table fetches.`, tone: "ok", bars: bars(scan, idx, win ? "ok" : "bad") },
  ];
  return { kind: "bars", title: `${n0(n)} rows, ${v.pct}% match`, max: Math.max(scan, idx), format: n0, steps };
}

/* =============================== OOP =============================== */

/* ---------- what an object holds ---------- */
const HEADER = 12;
function objects(v: V): Flow {
  const n = v.n * 1000, f = v.f, size = Math.ceil((HEADER + 4 * f) / 8) * 8, data = 4 * f * n, over = (size - 4 * f) * n;
  const kb = (x: number) => `${n1(x / 1024)} KB`;
  const bars = (a: number, b: number) => [{ label: "fields", value: a, tone: a ? "ok" as const : undefined }, { label: "header+pad", value: b, tone: b ? "warn" as const : undefined }];
  return { kind: "bars", title: `${n0(n)} objects, ${plural(f, "int field")} each`, max: data + over, format: kb, steps: [
    { note: `A class with ${plural(f, "int field")} and some methods, and ${n0(n)} objects made from it with new. On a 64-bit JVM with compressed pointers each object starts with a ${HEADER}-byte header.`, bars: bars(0, 0) },
    { note: `One object: ${HEADER} header + ${f} x 4 = ${HEADER + 4 * f} bytes, rounded up to a multiple of 8: ${size} bytes.`, tone: "hot", bars: bars(4 * f, size - 4 * f) },
    { note: `${n0(n)} objects: ${kb(data)} of fields and ${kb(over)} of headers and padding.`, tone: "hot", bars: bars(data, over) },
    { note: "The methods are not in any object. Their code is stored once, with the class; every object only points at its class through the header.", tone: "ok", bars: bars(data, over) },
    { note: `Overhead is ${pct(over / (data + over))} of the memory. In C++ the object is just its ${f * 4} bytes of fields, plus an 8-byte vptr if the class has virtual methods.`, tone: "ok", bars: bars(data, over) },
  ] };
}

/* ---------- a private field guarded by a method ---------- */
const TRIES = 4;
function guard(v: V): Flow {
  const guarded = v.guard === 1, w = v.w, head = ["try", "amount", "balance", "result"], rows: (string | number)[][] = [];
  let bal = v.bal;
  const steps: GridStep[] = [{ note: guarded ? `balance is private; the only way to change it is withdraw(${w}), which refuses if the money is not there. Start at ${v.bal}, withdraw ${w}, ${plural(TRIES, "time")}.` : `balance is a public field, so any code can write account.balance -= ${w}. Start at ${v.bal}, withdraw ${w}, ${plural(TRIES, "time")}.`, tables: [{ label: "account", head, rows: [] }] }];
  for (let t = 1; t <= TRIES; t++) {
    const ok = !guarded || w <= bal;
    if (ok) bal -= w;
    rows.push([t, w, bal, ok ? (bal < 0 ? "negative" : "ok") : "refused"]);
    steps.push({ note: ok ? bal < 0 ? `Try ${t}: nothing checks the balance, so it drops to ${bal}. The object is now in a state that should be impossible.` : `Try ${t}: ${w} taken, ${bal} left.` : `Try ${t}: withdraw sees only ${bal} and refuses, so the balance stays valid.`, tone: !ok ? "warn" : bal < 0 ? "bad" : "ok", tables: [{ label: "account", head, rows: [...rows], tones: { [String(t - 1)]: !ok ? "warn" : bal < 0 ? "bad" : "ok" } }] });
  }
  steps.push({ note: guarded ? `Balance ends at ${bal} and never goes below 0. The rule lives in one method, so no caller can break it.` : bal < 0 ? `Balance ends at ${bal}. Every caller would have to remember the check; making the field private and adding withdraw() puts it in one place.` : `Balance ends at ${bal}; no harm this time, but nothing stopped it. Make the field private and check inside withdraw().`, tone: guarded || bal >= 0 ? "ok" : "bad", tables: [{ label: "account", head, rows }] });
  return { kind: "grid", title: `${guarded ? "Private field" : "Public field"}: ${v.bal} minus ${w}, ${plural(TRIES, "time")}`, steps };
}

/* ---------- shallow and deep copy ---------- */
function copyPlay(v: V): Flow {
  const deep = v.deep === 1, len = v.len, i = v.idx;
  if (i >= len) throw new PlayError(`Index ${i} is outside an array of ${len}. Pick an index below ${len}.`);
  const a = Array.from({ length: len }, (_, j) => j + 1), b = deep ? [...a] : a;
  const head = ["", "points to", "values"], show = (withB: boolean, hot?: number): GridTable => ({ head, rows: [["a.data", "block 1", a.join(" ")], ...(withB ? [["b.data", deep ? "block 2" : "block 1", b.join(" ")]] : [])], tones: hot === undefined ? {} : { [`${hot}:2`]: "hot" } });
  const steps: GridStep[] = [{ note: `Object a owns an array of ${len} on the heap (block 1). Then b = a is copied with a ${deep ? "deep" : "shallow"} copy, and b.data[${i}] is set to 99.`, tables: [show(false)] }];
  steps.push({ note: deep ? "A deep copy allocates block 2 and copies every value, so b owns its own array." : "A shallow copy (the default copy constructor, or Java's clone) copies the pointer, not the array: both point at block 1.", tone: deep ? "ok" : "warn", tables: [show(true)] });
  b[i] = 99;
  steps.push({ note: deep ? `b.data[${i}] = 99 changes block 2 only; a still holds ${a[i]}.` : `b.data[${i}] = 99 writes into block 1, so a sees 99 too: changing the copy changed the original.`, tone: deep ? "ok" : "bad", tables: [show(true, deep ? 1 : 0)] });
  steps.push(deep
    ? { note: "When both go out of scope, each destructor deletes its own block. Rule of three: a class that owns memory needs its own copy constructor, copy assignment and destructor.", tone: "ok", tables: [show(true)] }
    : { note: "When both go out of scope in C++, both destructors delete block 1: a double delete, which can crash the program or corrupt the heap. Write a deep copy constructor (rule of three), or hold a std::vector, which copies itself.", tone: "bad", tables: [show(true)] });
  return { kind: "grid", title: `${deep ? "Deep" : "Shallow"} copy of ${len} values, change index ${i}`, steps };
}

/* ---------- constructor and destructor order ---------- */
const CLS = ["A", "B", "C", "D"];
function chain(v: V): Flow {
  const d = v.d, m = v.m, cls = CLS.slice(0, d), build: string[][] = [], kill: string[][] = [];
  const t = (label: string, rows: string[][], hot: number): GridTable => ({ label, head: ["#", "what runs"], rows, tones: tonesOf(rows, (r) => (r >= hot ? "hot" : undefined)) });
  const members = (c: string) => Array.from({ length: m }, (_, j) => `${c}.p${j + 1}`);
  const steps: GridStep[] = [{ note: `${cls.join(" <- ")}: each class extends the one before it${m ? ` and has ${plural(m, "member object")}` : ""}. new ${cls.at(-1)}() builds the whole chain, then the object is destroyed.`, tables: [t("construction", [], 0)] }];
  for (const c of cls) {
    const from = build.length;
    for (const p of members(c)) build.push([String(build.length + 1), `${p} built`]);
    build.push([String(build.length + 1), `${c}() body`]);
    steps.push({ note: c === "A" ? `The base comes first: ${m ? `A's members are built in declaration order, then ` : ""}A's constructor body runs. A derived class may use base fields, so they must exist first.` : `Then ${c}: ${m ? "its members first, then " : ""}its constructor body. Every constructor calls its parent's before its own code runs.`, tone: "hot", tables: [t("construction", [...build], from)] });
  }
  for (const c of [...cls].reverse()) {
    const from = kill.length;
    kill.push([String(kill.length + 1), `~${c}() body`]);
    for (const p of members(c).reverse()) kill.push([String(kill.length + 1), `${p} destroyed`]);
    steps.push({ note: c === cls.at(-1) ? `Destruction runs in exactly the reverse order: ~${c}() body first${m ? ", then its members, last built first destroyed" : ""}, while the base parts still exist.` : `Then ${c}'s part goes${m ? ", body first, then its members" : ""}.`, tone: "warn", tables: [t("destruction", [...kill], from)] });
  }
  steps.push({ note: `${build.length} steps to build, ${kill.length} to destroy, mirror images. In Java the order of construction is the same (super() first, then field initializers, then the body), but there is no destructor: the garbage collector frees the object later.`, tone: "ok", tables: [t("destruction", kill, kill.length)] });
  return { kind: "grid", title: `${d} level${d > 1 ? "s" : ""}, ${plural(m, "member")} per class`, steps };
}

/* ---------- switch on type or one class per type ---------- */
const SHAPES = ["Circle", "Square", "Triangle", "Hexagon", "Ellipse", "Star", "Ring", "Kite"], OPS = ["area", "perimeter", "draw", "scale", "rotate", "toJSON"];
function expression(v: V): Flow {
  const n = v.n, k = v.k, head = ["change", "switch", "interface"];
  const rows = [["code", `${k} switches`, `${n} classes`], ["new shape", `${k} edits`, "1 new class"], ["new op", "1 function", `${n} edits`]];
  const tab = (upTo: number, hot?: number, tones: Record<string, FlowTone> = {}): GridTable => ({ head, rows: rows.slice(0, upTo), tones: hot === undefined ? tones : { ...tones, [String(hot)]: "hot" } });
  const steps: GridStep[] = [
    { note: `${n} shapes (${SHAPES.slice(0, n).join(", ")}) and ${plural(k, "operation")} (${OPS.slice(0, k).join(", ")}). Either each operation switches on the shape's type, or Shape is an interface and each class implements every operation.`, tables: [tab(1)] },
    { note: `Both hold ${n} x ${k} = ${n * k} pieces of logic: ${k} functions with ${n} cases each, or ${n} classes with ${k} methods each.`, tables: [tab(1, 0)] },
    { note: `Add a ${SHAPES[n] ?? "Polygon"}: the switch style edits all ${k} functions, and a forgotten case fails at run time. The interface style adds one class, and the compiler insists it implements all ${k} methods; old code is untouched.`, tone: "hot", tables: [tab(2, 1, { "1:1": "bad", "1:2": "ok" })] },
    { note: `Add an operation: the switch style writes one new function with ${n} cases. The interface style must add a method to all ${n} classes.`, tone: "hot", tables: [tab(3, 2, { "1:1": "bad", "1:2": "ok", "2:1": "ok", "2:2": "bad" })] },
    { note: `Abstraction makes new types cheap and new operations expensive. If shapes keep coming, use the interface (open-closed principle); if operations keep coming over a fixed set, a switch or the visitor pattern fits.`, tone: "ok", tables: [tab(3, undefined, { "1:1": "bad", "1:2": "ok", "2:1": "ok", "2:2": "bad" })] },
  ];
  return { kind: "grid", title: `${n} shapes, ${plural(k, "operation")}`, steps };
}

/* ---------- static and instance fields ---------- */
function staticPlay(v: V): Flow {
  const n = v.n, c = v.c, mine = Array.from({ length: n }, () => 0);
  let total = 0;
  const tabs = (hot?: number): GridTable[] => [{ label: "instance field: mine", head: ["object", "mine"], rows: mine.map((x, i) => [`c${i + 1}`, x]), tones: hot === undefined ? {} : { [String(hot)]: "hot" } }, { label: "static field: total", rows: [[total]] }];
  const steps: GridStep[] = [{ note: `class Counter { static int total; int mine; void hit() { mine++; total++; } }. Make ${plural(n, "object")} and call hit() ${plural(c, "time")} on each.`, tables: tabs() }];
  for (let i = 0; i < n; i++) {
    mine[i] += c; total += c;
    steps.push({ note: `c${i + 1}.hit() ${c} time${c > 1 ? "s" : ""}: c${i + 1} has its own mine, now ${mine[i]}, while every object adds to the one shared total, now ${total}.`, tone: "hot", tables: tabs(i) });
  }
  steps.push({ note: `${n} copies of mine (one per object) but one total, stored with the class: ${n} x ${c} = ${total}. A static method can read total but not mine, because it runs without an object (no this).`, tone: "ok", tables: tabs() });
  return { kind: "grid", title: `${plural(n, "object")}, ${c} hit() call${c > 1 ? "s" : ""} each`, steps };
}

/* ---------- composition and aggregation ---------- */
function lifetime(v: V): Flow {
  const d = v.d, r = v.r, p = v.p, head = ["objects", "before", "after"];
  const rows = (after: boolean) => [["departments", d, after ? d - 1 : ""], ["rooms", d * r, after ? (d - 1) * r : ""], ["professors", d * p, after ? d * p : ""]];
  const steps: GridStep[] = [
    { note: `A university with ${plural(d, "department")}. Each department is composed of ${plural(r, "room")} it creates and owns, and aggregates ${plural(p, "professor")} who were hired on their own and only linked to it.`, tables: [{ head, rows: rows(false) }] },
    { note: "Composition: a room is a member the department creates; it cannot exist without it. Aggregation: the department holds a reference to a professor made elsewhere.", tone: "hot", tables: [{ head, rows: rows(false), tones: { "1": "hot", "2": "warn" } }] },
    { note: `Close department 1. Its ${plural(r, "room")} die with it, because the whole owns the parts: ${d * r} rooms become ${(d - 1) * r}.`, tone: "bad", tables: [{ head, rows: rows(true), tones: { "0:2": "bad", "1:2": "bad" } }] },
    { note: `Its ${plural(p, "professor")} survive: only the link is gone, so all ${d * p} professors still exist and can join another department.`, tone: "ok", tables: [{ head, rows: rows(true), tones: { "0:2": "bad", "1:2": "bad", "2:2": "ok" } }] },
    { note: "In C++ composition is a member object or a unique_ptr; aggregation is a raw pointer or reference to something owned elsewhere. In Java both are references; composition means no one else keeps one.", tone: "ok", tables: [{ head, rows: rows(true) }] },
  ];
  return { kind: "grid", title: `${plural(d, "department")}, ${r} room${r > 1 ? "s" : ""} and ${p} professor${p > 1 ? "s" : ""} each`, steps };
}

/* ---------- Liskov: a Square is not a Rectangle ---------- */
function lsp(v: V): Flow {
  const w = v.w, h = v.h, ok = w === h;
  const steps: ChainStep[] = [
    { node: `resize(r): width ${w}, height ${h}`, note: `A test calls r.setWidth(${w}); r.setHeight(${h}); and expects area ${w} x ${h} = ${w * h}. Any Rectangle should pass it.` },
    { node: `Rectangle: area ${w * h}`, note: `A plain Rectangle stores the two sides apart, so the area is ${w * h}. Pass.`, tone: "ok" },
    { node: `Square: setWidth(${w}) sets both`, note: `Square extends Rectangle and keeps its sides equal: setWidth(${w}) sets width and height to ${w}.`, tone: "hot" },
    { node: `setHeight(${h}): side ${h}, area ${h * h}`, note: `setHeight(${h}) sets both sides again, to ${h}, so the area is ${h} x ${h} = ${h * h}.`, tone: ok ? "ok" : "bad" },
    { node: ok ? "passes, by luck" : `expected ${w * h}, got ${h * h}`, note: ok ? `With equal sides the test passes, so the bug stays hidden until someone resizes to unequal sides.` : "A Square cannot stand in for a Rectangle, which breaks the Liskov substitution principle. Make both implement a Shape interface, or make shapes immutable.", tone: ok ? "warn" : "bad" },
  ];
  return { title: `Resize to ${w} by ${h}`, steps };
}

/* ---------- stack unwinding ---------- */
function unwind(v: V): Flow {
  const d = v.d, c = v.c;
  if (c > d) throw new PlayError(`Only f1 to f${d} exist, so f${c} cannot catch. Pick a level up to ${d}, or 0 for main.`);
  const frames = ["main", ...Array.from({ length: d }, (_, i) => `f${i + 1}`)], state = frames.map(() => "running");
  const head = ["frame", "local", "state"], tab = (hot?: number): GridTable => ({ label: "call stack", head, rows: frames.map((f, i) => [f, i ? `g${i}` : "-", state[i]]), tones: tonesOf(frames, (i) => (state[i] === "unwound" ? "bad" : state[i] === "catches" ? "ok" : i === hot ? "hot" : undefined)) });
  const steps: GridStep[] = [{ note: `main calls f1, f1 calls f2, and so on down to f${d}. Each f creates a local object g (a lock, a file); f${d} throws, and ${c ? `f${c}` : "main"} has the matching catch.`, tables: [tab()] }];
  steps.push({ note: `f${d} throws. The rest of f${d} is skipped and the runtime looks for a handler, starting in f${d} and moving outwards.`, tone: "hot", tables: [tab(d)] });
  for (let i = d; i > c; i--) {
    state[i] = "unwound";
    steps.push({ note: `f${i} has no matching catch, so its frame is popped. On the way out its local g${i} is destroyed (C++ destructor, Java finally or try-with-resources), so the lock or file is released.`, tone: "bad", tables: [tab()] });
  }
  state[c] = "catches";
  steps.push({ note: `${c ? `f${c}` : "main"} has the catch: the handler runs and execution continues after the try block. ${d - c ? `${plural(d - c, "frame")} unwound, ${d - c} local${d - c > 1 ? "s" : ""} cleaned up.` : "Nothing was unwound: the throw was caught where it happened."}`, tone: "ok", tables: [tab()] });
  steps.push({ note: "Catch where you can do something useful, often far from the throw. Cleanup belongs to objects (RAII) or finally, so it runs on every path out of a function.", tone: "ok", tables: [tab()] });
  return { kind: "grid", title: `Throw in f${d}, caught in ${c ? `f${c}` : "main"}`, steps };
}

export const PLAY: Record<string, PlayFlow> = {
  "sql-play-join": { title: "Four joins on the same tables", knobs: [{ key: "type", label: "join (INNER, LEFT, RIGHT, FULL)", min: 1, max: 4, value: 2 }, { key: "k", label: "orders for ana", min: 0, max: 3, value: 2 }], make: join },
  "sql-play-having": { title: "WHERE filters rows, HAVING filters groups", knobs: [{ key: "w", label: "WHERE amount at least", min: 0, max: 300, step: 20, value: 100 }, { key: "h", label: "HAVING total at least", min: 0, max: 800, step: 50, value: 300 }], make: having },
  "sql-play-correlated": { title: "A correlated subquery", knobs: [{ key: "ben", label: "Ben's pay (thousands)", min: 40, max: 120, step: 5, value: 70 }, { key: "m", label: "margin over the average", min: 0, max: 30, step: 5, value: 0, unit: "%" }], make: correlated },
  "sql-play-rank": { title: "ROW_NUMBER, RANK and DENSE_RANK", knobs: [{ key: "b", label: "Ben's score", min: 60, max: 100, step: 5, value: 75 }, { key: "c", label: "Chen's score", min: 60, max: 100, step: 5, value: 90 }, { key: "n", label: "top N", min: 1, max: 5, value: 3 }], make: rank },
  "sql-play-islands": { title: "Gaps and islands", knobs: [{ key: "a", label: "first streak", min: 1, max: 5, value: 3, unit: " days" }, { key: "g", label: "gap", min: 0, max: 3, value: 2, unit: " days" }, { key: "c", label: "second streak", min: 1, max: 5, value: 2, unit: " days" }], make: islands },
  "sql-play-index": { title: "Index or full scan?", knobs: [{ key: "rows", label: "table rows (thousands)", min: 10, max: 5000, step: 10, value: 1000 }, { key: "pct", label: "rows that match", min: 1, max: 60, value: 5, unit: "%" }], make: indexPlay },
  "oop-play-objects": { title: "What an object holds", knobs: [{ key: "n", label: "objects (thousands)", min: 1, max: 100, value: 10 }, { key: "f", label: "int fields", min: 1, max: 8, value: 3 }], make: objects },
  "oop-play-guard": { title: "Encapsulation keeps an object valid", knobs: [{ key: "bal", label: "starting balance", min: 0, max: 500, step: 50, value: 200 }, { key: "w", label: "each withdrawal", min: 50, max: 300, step: 50, value: 100 }, { key: "guard", label: "private + check (0 no, 1 yes)", min: 0, max: 1, value: 0 }], make: guard },
  "oop-play-copy": { title: "Shallow and deep copy", knobs: [{ key: "deep", label: "copy (0 shallow, 1 deep)", min: 0, max: 1, value: 0 }, { key: "len", label: "array length", min: 1, max: 5, value: 3 }, { key: "idx", label: "index to change", min: 0, max: 4, value: 1 }], make: copyPlay },
  "oop-play-chain": { title: "Constructor and destructor order", knobs: [{ key: "d", label: "levels of inheritance", min: 1, max: 4, value: 3 }, { key: "m", label: "member objects per class", min: 0, max: 2, value: 1 }], make: chain },
  "oop-play-expression": { title: "New types or new operations?", knobs: [{ key: "n", label: "shapes", min: 2, max: 8, value: 3 }, { key: "k", label: "operations", min: 2, max: 6, value: 2 }], make: expression },
  "oop-play-static": { title: "Static and instance fields", knobs: [{ key: "n", label: "objects", min: 1, max: 5, value: 3 }, { key: "c", label: "hit() calls per object", min: 1, max: 4, value: 2 }], make: staticPlay },
  "oop-play-lifetime": { title: "Composition and aggregation", knobs: [{ key: "d", label: "departments", min: 1, max: 4, value: 2 }, { key: "r", label: "rooms each (composition)", min: 1, max: 3, value: 2 }, { key: "p", label: "professors each (aggregation)", min: 1, max: 3, value: 2 }], make: lifetime },
  "oop-play-lsp": { title: "When a subclass breaks the contract", knobs: [{ key: "w", label: "new width", min: 1, max: 10, value: 5 }, { key: "h", label: "new height", min: 1, max: 10, value: 4 }], make: lsp },
  "oop-play-unwind": { title: "An exception unwinding the stack", knobs: [{ key: "d", label: "call depth (throws in the deepest)", min: 1, max: 6, value: 4 }, { key: "c", label: "catch in f_n (0 = main)", min: 0, max: 5, value: 1 }], make: unwind },
};

/** The data and query each SQL walk-through evaluates, so check:other can run it in SQLite and compare the last table. */
export const SQL_PLAY_SQL: Record<string, (v: V) => { setup: string; query: string }> = {
  "sql-play-join": joinSql, "sql-play-having": havingSql, "sql-play-correlated": correlatedSql, "sql-play-rank": rankSql, "sql-play-islands": islandsSql,
};

/** Chapter id to its interactive walk-through, per subject. */
export const SQL_OOP_PLAY: Record<"sql" | "oops", Record<string, string>> = {
  sql: { joins: "sql-play-join", grouping: "sql-play-having", subqueries: "sql-play-correlated", windows: "sql-play-rank", patterns: "sql-play-islands", ddl: "sql-play-index" },
  oops: { basics: "oop-play-objects", encapsulation: "oop-play-guard", ctors: "oop-play-copy", inheritance: "oop-play-chain", abstraction: "oop-play-expression", static: "oop-play-static", relationships: "oop-play-lifetime", solid: "oop-play-lsp", exceptions: "oop-play-unwind" },
};
