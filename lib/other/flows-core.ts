// Walk-throughs for CS core chapters that had no lab or animation. Anything an algorithm produces is computed here.
import type { Bar, Flow, GridStep, GridTable } from "./flows.ts";
import { candidateKeys, closure } from "./sim.ts";

/* ---------- OS ---------- */
const states: Flow = { title: "One process, start to finish", steps: [
  { node: "new", note: "fork() or CreateProcess: the OS builds a PCB and an address space. Nothing runs yet." },
  { node: "ready", note: "Admitted to the ready queue. It could run; it is waiting for a CPU.", tone: "hot" },
  { node: "running", note: "The dispatcher loads its registers and jumps in. On one core, exactly one process is here.", tone: "ok" },
  { node: "timer interrupt: back to ready", note: "Its time slice ran out. Preempted, it goes to the back of the ready queue, not to waiting.", tone: "warn" },
  { node: "read() from disk: waiting", note: "It asked for I/O and cannot continue until the data arrives, so it gives up the CPU." },
  { node: "I/O done: ready again", note: "The disk interrupt wakes it. Waiting never goes straight to running; it queues like everyone else." },
  { node: "exit(): terminated", note: "Resources are freed, but the PCB stays as a zombie until the parent calls wait() for its exit code.", tone: "ok" },
] };

const ipc: Flow = { kind: "lanes", title: "A pipe between two processes", lanes: ["Producer", "Kernel pipe buffer", "Consumer"], steps: [
  { from: 0, to: 1, label: "write 4 KB", note: "ls writes into the pipe. The bytes are copied into a kernel buffer; the processes share no memory." },
  { from: 1, to: 2, label: "read 4 KB", note: "grep reads them out, a second copy. Two copies per message is the price of isolation." },
  { from: 2, to: 1, label: "read: blocks", note: "The buffer is empty, so read() sleeps until more data arrives. No busy waiting, no locks to write.", tone: "warn" },
  { from: 0, to: 1, label: "write 64 KB", note: "On Linux a pipe holds 64 KB by default. A writer that fills it blocks too: built-in backpressure.", tone: "hot" },
  { from: 0, to: 0, label: "close: EOF", note: "When the producer closes its end, the consumer's read returns 0 and it knows the stream ended.", tone: "ok" },
  { from: 2, to: 2, label: "shared memory?", note: "For big data, shared memory skips both copies, but then you need a semaphore or mutex yourself.", tone: "ok" },
] };

/* ---------- DBMS ---------- */
const threeSchema: Flow = { title: "One query through the three schemas", steps: [
  { node: "external: view student_grades", note: "The registrar's app sees a view with only the columns it needs. No fee data, no internal ids." },
  { node: "conceptual: students JOIN results", note: "The DBMS expands the view into the real tables and their constraints: the logical schema.", tone: "hot" },
  { node: "internal: B+ tree on roll_no", note: "The optimizer picks an index scan; pages, files and indexes live at this level." },
  { node: "add an index: app unchanged", note: "Physical data independence: storage changed, no query or view changed.", tone: "ok" },
  { node: "split a table: view rewritten", note: "Logical data independence: the view is redefined over the new tables and the app still works.", tone: "ok" },
] };

const keysFlow = (): Flow => {
  const A = ["roll", "email", "name", "dept"], FDS: [string[], string[]][] = [[["roll"], ["email", "name", "dept"]], [["email"], ["roll"]]];
  const ck = candidateKeys(A, FDS).map((k) => k.join(", ")), cl = closure(["email"], FDS);
  return { kind: "grid", title: "Super, candidate and primary keys", steps: [
    { note: "Students(roll, email, name, dept). roll decides everything, and email is unique too, so email decides roll.", tables: [{ label: "dependencies", head: ["if you know", "you know"], rows: FDS.map(([l, r]) => [l.join(", "), r.join(", ")]) }] },
    { note: `The closure of {email} is {${cl.join(", ")}}: every column. So email alone identifies a row.`, tone: "hot", tables: [{ label: "closure of email", head: ["column", "reached"], rows: A.map((a) => [a, cl.includes(a) ? "yes" : "no"]), tones: { ":1": "ok" } }] },
    { note: "Any set that contains a key is a superkey: {roll, name} works, but name adds nothing.", tables: [{ label: "superkeys (some)", head: ["set", "minimal?"], rows: [["roll", "yes"], ["email", "yes"], ["roll, name", "no"], ["email, dept", "no"]], tones: { "2:1": "warn", "3:1": "warn" } }] },
    { note: `Minimal superkeys are candidate keys: ${ck.join(" and ")}. Pick one as primary (roll); the other is an alternate key with a UNIQUE constraint.`, tone: "ok", tables: [{ label: "candidate keys", head: ["key", "role"], rows: ck.map((k) => [k, k === "roll" ? "primary" : "alternate (UNIQUE)"]), tones: { "0": "ok" } }] },
  ] };
};

const er: Flow = { title: "From an ER diagram to tables", steps: [
  { node: "Student (roll, name)", note: "Each strong entity becomes a table, and its key attribute becomes the primary key." },
  { node: "Course (code, title)", note: "Course is a second entity and a second table." },
  { node: "enrolls: many to many", note: "A student takes many courses; a course has many students. Neither table can hold the link.", tone: "hot" },
  { node: "Enrollment (roll, code, grade)", note: "So the relationship becomes its own table, with both foreign keys as a composite primary key. grade lives here.", tone: "ok" },
  { node: "Dept 1 to many Student", note: "One-to-many needs no new table: put dept_id as a foreign key on the many side, Student." },
  { node: "phone numbers: multivalued", note: "A multivalued attribute gets its own table (roll, phone), because a cell holds one value in 1NF.", tone: "warn" },
] };

const replication: Flow = { kind: "lanes", title: "Replication lag", lanes: ["App", "Primary", "Replica"], steps: [
  { from: 0, to: 1, label: "UPDATE name", note: "All writes go to the primary. It commits and replies at once (asynchronous replication)." },
  { from: 1, to: 2, label: "WAL stream", note: "The change log is shipped to the replica, which replays it a few milliseconds later.", tone: "hot" },
  { from: 0, to: 2, label: "SELECT name", note: "The user reloads and the read is sent to the replica before it has replayed the change.", tone: "warn" },
  { from: 2, to: 0, label: "old name", note: "They see their own edit vanish: a read-your-writes violation, the classic replication bug.", tone: "bad" },
  { from: 0, to: 1, label: "read own data", note: "Fix: send a user's reads to the primary for a short while after they write, or track the log position.", tone: "ok" },
  { from: 1, to: 1, label: "sharding for writes", note: "Replicas scale reads only. When the primary cannot take the writes, shard: split rows across primaries by a key." },
] };

/* ---------- CN ---------- */
const layers = (): Flow => {
  const data = 1200, tcp = 20, ip = 20, eth = 18;
  return { kind: "bars", title: "Encapsulation: each layer adds a header", format: (v) => `${v} B`, steps: [
    { note: `The app hands ${data} bytes of HTTP to the transport layer. It does not know about IP or Wi-Fi.`, bars: [{ label: "data", value: data, tone: "hot" }, { label: "TCP", value: 0 }, { label: "IP", value: 0 }, { label: "Ethernet", value: 0 }] },
    { note: `TCP adds a ${tcp}-byte header: ports, sequence number, checksum. Now it is a segment of ${data + tcp} bytes.`, bars: [{ label: "data", value: data }, { label: "TCP", value: tcp, tone: "hot" }, { label: "IP", value: 0 }, { label: "Ethernet", value: 0 }] },
    { note: `IP adds ${ip} bytes: source and destination addresses and a TTL. A packet of ${data + tcp + ip} bytes.`, bars: [{ label: "data", value: data }, { label: "TCP", value: tcp }, { label: "IP", value: ip, tone: "hot" }, { label: "Ethernet", value: 0 }] },
    { note: `Ethernet adds ${eth} bytes of MAC addresses and a CRC: a frame of ${data + tcp + ip + eth} bytes on the wire. Each router strips it and adds a new one.`, tone: "ok", bars: [{ label: "data", value: data }, { label: "TCP", value: tcp }, { label: "IP", value: ip }, { label: "Ethernet", value: eth, tone: "hot" }] },
    { note: `Overhead is ${tcp + ip + eth} bytes, ${(((tcp + ip + eth) / (data + tcp + ip + eth)) * 100).toFixed(1)}% here. The receiver peels the headers off in reverse order, bottom layer first.`, tone: "ok", bars: [{ label: "data", value: data, tone: "ok" }, { label: "TCP", value: tcp }, { label: "IP", value: ip }, { label: "Ethernet", value: eth }] },
  ] };
};

const csrf: Flow = { kind: "lanes", title: "A CSRF attack and its fix", lanes: ["You", "evil.example", "bank.example"], steps: [
  { from: 0, to: 2, label: "log in", note: "You log in to your bank. It sets a session cookie in your browser." },
  { from: 0, to: 1, label: "open a link", note: "Later you open a page on another site, in another tab." },
  { from: 1, to: 0, label: "hidden form", note: "The page holds a form that posts to bank.example/transfer and submits itself with JavaScript.", tone: "warn" },
  { from: 0, to: 2, label: "POST + your cookie", note: "Your browser attaches the bank cookie automatically. To the bank it looks like you clicked Transfer.", tone: "bad" },
  { from: 2, to: 2, label: "SameSite + token", note: "Defence: SameSite=Lax cookies are not sent on cross-site POSTs, and a per-form CSRF token the attacker cannot read.", tone: "ok" },
] };

/* ---------- SQL ---------- */
const EMP: [string, number, number][] = [["Asha", 1, 90], ["Ben", 1, 70], ["Chen", 2, 50], ["Dia", 2, 65], ["Eli", 2, 80]];
const correlated = (): Flow => {
  const avg = (d: number) => { const p = EMP.filter((e) => e[1] === d).map((e) => e[2]); return p.reduce((a, b) => a + b, 0) / p.length; };
  const t = (k: number, tones?: GridTable["tones"]): GridTable => ({ label: "outer row, then its subquery", head: ["name", "dept", "pay", "dept avg", "pay > avg"], rows: EMP.map((e, i) => (i <= k ? [e[0], e[1], e[2], +avg(e[1]).toFixed(2), e[2] > avg(e[1]) ? "yes" : "no"] : [e[0], e[1], e[2], "", ""])), tones });
  const steps: GridStep[] = EMP.map((e, i) => ({ note: `Row ${e[0]}: the subquery runs with dept = ${e[1]} and returns ${+avg(e[1]).toFixed(2)}. ${e[2]} is ${e[2] > avg(e[1]) ? "above, kept" : "not above, dropped"}.`, tone: e[2] > avg(e[1]) ? "ok" : undefined, tables: [t(i, { [`${i}`]: e[2] > avg(e[1]) ? "ok" : "warn" })] }));
  const kept = EMP.filter((e) => e[2] > avg(e[1]));
  return { kind: "grid", title: "A correlated subquery, row by row", steps: [
    { note: "WHERE pay > (SELECT AVG(pay) FROM emp i WHERE i.dept = o.dept). The inner query uses the outer row, so it runs again for each one.", tables: [t(-1)] },
    ...steps,
    { note: `Result: ${kept.map((e) => e[0]).join(" and ")}. A CTE or window function (AVG(pay) OVER (PARTITION BY dept)) computes each average once instead.`, tone: "ok", tables: [{ label: "result", head: ["name", "pay"], rows: kept.map((e) => [e[0], e[2]]), tones: { ":0": "ok" } }] },
  ] };
};

/** Gaps and islands: consecutive login days. grp = day - ROW_NUMBER is constant within a streak. */
export const LOGINS = [1, 2, 3, 5, 6, 9];
export const islands = () => LOGINS.map((d, i) => ({ day: d, rn: i + 1, grp: d - (i + 1) }));
const gaps = (): Flow => {
  const r = islands(), groups = [...new Set(r.map((x) => x.grp))].map((g) => { const ds = r.filter((x) => x.grp === g).map((x) => x.day); return [ds[0], ds.at(-1)!, ds.length]; });
  const long = groups.reduce((a, b) => (b[2] > a[2] ? b : a));
  return { kind: "grid", title: "Gaps and islands: login streaks", steps: [
    { note: `One user logged in on days ${LOGINS.join(", ")}. Find each streak of consecutive days.`, tables: [{ head: ["day"], rows: LOGINS.map((d) => [d]) }] },
    { note: "Number the rows in order with ROW_NUMBER() OVER (ORDER BY day).", tables: [{ head: ["day", "rn"], rows: r.map((x) => [x.day, x.rn]), tones: { ":1": "hot" } }] },
    { note: "Subtract: day - rn. Inside a streak both go up by one, so the difference stays the same. A gap changes it.", tone: "hot", tables: [{ head: ["day", "rn", "day - rn"], rows: r.map((x) => [x.day, x.rn, x.grp]), tones: { ":2": "hot" } }] },
    { note: `GROUP BY that difference: ${groups.length} streaks. The longest runs from day ${long[0]} to ${long[1]}, ${long[2]} days.`, tone: "ok", tables: [{ label: "GROUP BY day - rn", head: ["from", "to", "days"], rows: groups, tones: { [`${groups.indexOf(long)}`]: "ok" } }] },
  ] };
};

const txn: Flow = { kind: "grid", title: "A transfer that fails halfway", steps: [
  { note: "BEGIN. Move 30 from A to B: two UPDATEs that must happen together or not at all.", tables: [{ label: "accounts", head: ["id", "balance"], rows: [["A", 100], ["B", 20]] }] },
  { note: "UPDATE accounts SET balance = balance - 30 WHERE id = 'A'. Only this transaction can see the change so far.", tone: "hot", tables: [{ label: "inside the transaction", head: ["id", "balance"], rows: [["A", 70], ["B", 20]], tones: { "0:1": "hot" } }] },
  { note: "The app crashes before the second UPDATE runs. Without a transaction, 30 would have left A and reached nobody.", tone: "bad", tables: [{ label: "inside the transaction", head: ["id", "balance"], rows: [["A", 70], ["B", "not reached"]], tones: { "1:1": "bad" } }] },
  { note: "ROLLBACK undoes everything since BEGIN. Atomicity: other sessions never saw the half-done state.", tone: "ok", tables: [{ label: "accounts", head: ["id", "balance"], rows: [["A", 100], ["B", 20]], tones: { ":1": "ok" } }] },
] };

/* ---------- OOP ---------- */
const objects: Flow = { title: "new Account(\"Asha\", 500)", steps: [
  { node: "class Account: the blueprint", note: "The class is loaded once. It describes fields and methods; it holds no balance itself." },
  { node: "new: memory on the heap", note: "new allocates room for this object's own fields, all zero at first.", tone: "hot" },
  { node: "constructor sets owner, balance", note: "The constructor runs and puts the object in a valid state before anyone can use it." },
  { node: "reference a on the stack", note: "The variable a holds a reference to the object, not the object itself. Copying a copies the reference." },
  { node: "second object: own state", note: "new Account(\"Ben\", 0) is a separate object with its own fields; the methods are shared through the class.", tone: "ok" },
] };

const encapsulation: Flow = { kind: "lanes", title: "Why balance is private", lanes: ["Caller", "Account methods", "balance field"], steps: [
  { from: 0, to: 2, label: "balance = -900", note: "If the field were public, any code could set it to anything. The class could not keep its rule.", tone: "bad" },
  { from: 0, to: 1, label: "withdraw(900)", note: "With private balance, the only way in is through a method." },
  { from: 1, to: 1, label: "900 > 500: refuse", note: "The method checks the invariant, balance never below zero, and throws.", tone: "warn" },
  { from: 0, to: 1, label: "withdraw(200)", note: "A valid request." },
  { from: 1, to: 2, label: "500 - 200 = 300", note: "Only the class itself writes the field, so the rule holds everywhere and logging can be added in one place.", tone: "ok" },
] };

const lookup: Flow = { title: "Method lookup: dog.describe()", steps: [
  { node: "Dog: describe()? no", note: "The call starts at the object's own class. Dog overrides speak() but not describe()." },
  { node: "Animal: describe()? yes", note: "Not found, so the search moves up to the parent. Animal has it.", tone: "hot" },
  { node: "describe calls this.speak()", note: "Inside Animal's code, this is still the Dog object." },
  { node: "Dog.speak() runs: Woof", note: "So speak() is looked up from Dog again and the override wins: dynamic dispatch.", tone: "ok" },
  { node: "diamond: two copies of Base?", note: "In C++ multiple inheritance, B and C both extend A; D extends both and gets two A parts. virtual inheritance keeps one.", tone: "warn" },
] };

const abstraction: Flow = { title: "Coding to an interface", steps: [
  { node: "interface Payment { pay(amount) }", note: "The interface says what a payment can do, not how. It holds no state." },
  { node: "abstract class CardPayment", note: "An abstract class can share real code, such as validating the card number, and leave charge() abstract.", tone: "hot" },
  { node: "Visa, UPI: concrete classes", note: "Each one fills in the how. You cannot write new Payment() or new CardPayment()." },
  { node: "checkout(Payment p)", note: "Checkout depends only on the interface, so it compiles without knowing any concrete class.", tone: "ok" },
  { node: "add Wallet: checkout unchanged", note: "A new payment type is one new class. Nothing that uses Payment changes or is retested.", tone: "ok" },
] };

const staticFlow = (): Flow => {
  const objs = ["a", "b", "c"]; let count = 0;
  const rows: (string | number)[][] = [];
  const steps: GridStep[] = objs.map((o, i) => { count++; rows.push([o, i + 1, 0]); return { note: `new Counter() as ${o}: the constructor runs count++, so the one shared count is now ${count}. ${o}.id = ${i + 1}.`, tables: [{ label: "per object", head: ["object", "id (instance)", "hits (instance)"], rows: rows.map((r) => [...r]) }, { label: "Counter (static)", head: ["count"], rows: [[count]], tones: { "0:0": "hot" } }] }; });
  rows[0][2] = 2;
  return { kind: "grid", title: "One static field, many objects", steps: [
    { note: "class Counter { static int count; int id; int hits; }. count belongs to the class: one copy before any object exists.", tables: [{ label: "Counter (static)", head: ["count"], rows: [[0]] }] },
    ...steps,
    { note: `a.hits += 2 changes only a. Every object has its own hits, but they all see count = ${count}. A static method has no this, so it cannot read hits.`, tone: "ok", tables: [{ label: "per object", head: ["object", "id (instance)", "hits (instance)"], rows, tones: { "0:2": "ok" } }, { label: "Counter (static)", head: ["count"], rows: [[count]], tones: { "0:0": "ok" } }] },
  ] };
};

const relationships: Flow = { title: "Delete a House: what survives?", steps: [
  { node: "Person uses a Car: association", note: "Two objects that know about each other. Neither owns the other." },
  { node: "Team has Players: aggregation", note: "Has-a, but players existed before the team and can join another." },
  { node: "House has Rooms: composition", note: "Rooms are created by the house and make no sense without it.", tone: "hot" },
  { node: "delete the Team", note: "The players live on. In code the team just drops its references.", tone: "ok" },
  { node: "delete the House", note: "Its rooms go with it. In C++ the House destructor deletes them; in Java nothing else holds them, so they are collected.", tone: "warn" },
] };

const openClosed: Flow = { title: "Open for extension, closed for change", steps: [
  { node: "if circle ... else if square", note: "One function knows every shape. Adding a triangle means editing and retesting it.", tone: "bad" },
  { node: "interface Shape { area() }", note: "Move the knowledge into the shapes. Each class answers for itself.", tone: "hot" },
  { node: "Circle, Square implement Shape", note: "The total is now shapes.map(s => s.area()). It never mentions a concrete class." },
  { node: "add Triangle: one new class", note: "Nothing existing changes. That is O in SOLID, and it is the strategy pattern in miniature.", tone: "ok" },
  { node: "depend on Shape, not Circle", note: "D: high-level code depends on the abstraction, so a test can pass in a fake shape.", tone: "ok" },
] };

/* ---------- aptitude ---------- */
const di = (): Flow => {
  const sales: [string, number][] = [["2022", 100], ["2023", 150], ["2024", 180], ["2025", 240]];
  const growth = sales.map(([y, v], i) => [y, v, i ? +(((v - sales[i - 1][1]) / sales[i - 1][1]) * 100).toFixed(1) : 0] as const);
  const best = growth.slice(1).reduce((a, b) => (b[2] > a[2] ? b : a));
  const bars = (tones: Record<string, Bar["tone"]> = {}): Bar[] => sales.map(([y, v]) => ({ label: y, value: v, tone: tones[y] }));
  return { kind: "bars", title: "Reading a growth question", format: (v) => `${v}`, steps: [
    { note: "Sales in crore over four years. Question: in which year was growth the highest?", bars: bars() },
    ...growth.slice(1).map(([y, v, g], i) => ({ note: `${y}: (${v} - ${sales[i][1]}) / ${sales[i][1]} = ${g}%.${g < 0 ? " A fall." : ""}`, tone: g < 0 ? ("warn" as const) : undefined, bars: bars({ [y]: g < 0 ? "warn" : "hot" }) })),
    { note: `Highest growth: ${best[0]} at ${best[2]}%. The biggest jump in value (2025, +60) is not the biggest percentage: always divide by the year before.`, tone: "ok", bars: bars({ [best[0]]: "ok" }) },
  ] };
};

/* ---------- syntax ---------- */
const typing: Flow = { title: "When is a type error caught?", steps: [
  { node: "C++ / Java: int n = \"5\";", note: "The compiler rejects it. The program never runs, so the bug never ships.", tone: "ok" },
  { node: "TypeScript: let n: number = \"5\"", note: "tsc reports the error before running, the same benefit, but only if you run the checker." },
  { node: "tsc erases the types", note: "The emitted JavaScript is let n = \"5\". Types do not exist at run time, so no check happens there.", tone: "warn" },
  { node: "Python: n = \"5\"; n + 1", note: "Fine until that line runs, then TypeError. A test or mypy finds it earlier.", tone: "warn" },
  { node: "JavaScript: \"5\" + 1", note: "No error at all: it gives \"51\". Coercion is why === exists.", tone: "bad" },
] };

const loopTrace = (): Flow => {
  const rows: (string | number)[][] = []; let sum = 0; const steps: GridStep[] = [];
  for (let i = 1; i <= 6; i++) {
    if (i % 2 === 0) { rows.push([i, "even: continue", sum]); steps.push({ note: `i = ${i} is even, so continue skips the rest of the body. sum stays ${sum}.`, tables: [{ head: ["i", "action", "sum"], rows: rows.map((r) => [...r]), tones: { [`${rows.length - 1}`]: "warn" } }] }); continue; }
    if (i > 4) { rows.push([i, "i > 4: break", sum]); steps.push({ note: `i = ${i} passes 4, so break leaves the loop. Final sum ${sum}.`, tone: "ok", tables: [{ head: ["i", "action", "sum"], rows: rows.map((r) => [...r]), tones: { [`${rows.length - 1}`]: "ok" } }] }); break; }
    sum += i; rows.push([i, `sum += ${i}`, sum]); steps.push({ note: `i = ${i} is odd: sum becomes ${sum}.`, tone: "hot", tables: [{ head: ["i", "action", "sum"], rows: rows.map((r) => [...r]), tones: { [`${rows.length - 1}`]: "hot" } }] });
  }
  return { kind: "grid", title: "for i in 1..6 with continue and break", steps: [{ note: "for (int i = 1; i <= 6; i++) { if (i % 2 == 0) continue; if (i > 4) break; sum += i; }", tables: [{ head: ["i", "action", "sum"], rows: [["", "start", 0]] }] }, ...steps] };
};

const concat = (): Flow => {
  const n = [10, 100, 1000], copied = (k: number) => (k * (k + 1)) / 2;   // chars copied when each += copies the whole string
  const bars = (show: number, builder: boolean): Bar[] => n.flatMap((k, i) => [{ label: `+= ${k}`, value: i < show ? copied(k) : 0, tone: i < show ? ("bad" as const) : undefined }, { label: `join ${k}`, value: builder && i < show ? k : 0, tone: builder && i < show ? ("ok" as const) : undefined }]);
  return { kind: "bars", title: "Characters copied building a string", max: copied(1000), format: (v) => v.toLocaleString("en-US"), steps: [
    { note: "Strings are immutable in Java, Python and JavaScript, so s += c builds a brand new string and copies the old one into it.", bars: bars(0, false) },
    { note: `10 characters one at a time: 1 + 2 + ... + 10 = ${copied(10)} characters copied. Small enough to ignore.`, bars: bars(1, false) },
    { note: `100 characters: ${copied(100).toLocaleString("en-US")} copied. 1,000: ${copied(1000).toLocaleString("en-US")}. The work grows with n squared.`, tone: "bad", bars: bars(3, false) },
    { note: "StringBuilder, a list joined at the end or \"\".join() copy each character about once: n, not n squared.", tone: "ok", bars: bars(3, true) },
  ] };
};

const dispatchFlow: Flow = { title: "for (Shape s : shapes) s.area()", steps: [
  { node: "List<Shape>: a Circle, a Square", note: "The list's type is the base type; each element is a real subclass object." },
  { node: "s.area() on the Circle", note: "The compiler only checks that Shape has area(). Which one runs is decided at run time.", tone: "hot" },
  { node: "Circle.area(): pi r squared", note: "Java and C# use the object's class; C++ does too, if area is virtual; Python and JS look it up on the object." },
  { node: "s.area() on the Square", note: "Same line of code, a different method: side times side." },
  { node: "add Triangle: loop unchanged", note: "This is why the base type exists: callers are written once for every subclass.", tone: "ok" },
] };

const tryFinally: Flow = { title: "Who runs when parse() throws?", steps: [
  { node: "try { open(); parse(); }", note: "open() succeeds. parse() throws a ParseError partway through." },
  { node: "rest of try: skipped", note: "Control leaves the try block at the throw; lines after it never run.", tone: "warn" },
  { node: "catch (IOException): no match", note: "Catch blocks are tried in order and must match the type. ParseError is not an IOException." },
  { node: "catch (ParseError e): runs", note: "The first matching catch handles it. Put specific types before general ones.", tone: "hot" },
  { node: "finally: close()", note: "finally runs whether or not anything was thrown, even after a return. Or use try-with-resources, with, or using.", tone: "ok" },
] };

const erasure: Flow = { title: "One generic, five languages", steps: [
  { node: "Box<T> { T value }", note: "Write the container once, for any element type." },
  { node: "C++: one class per type", note: "Templates are stamped out per type at compile time: fast, but a bigger binary and long error messages.", tone: "hot" },
  { node: "Java: one Box at run time", note: "Generics are checked, then erased to Object. So no new T(), no int (use Integer), and List<String> equals List<Integer> at run time.", tone: "warn" },
  { node: "TypeScript: types vanish", note: "The checker uses Box<number>; the JavaScript it emits has no types at all." },
  { node: "Python hints, JS anything", note: "list[int] is a hint for tools such as mypy; nothing stops a string at run time.", tone: "ok" },
] };

const pipeline = (): Flow => {
  const xs = [1, 2, 3, 4, 5, 6], ev = xs.filter((x) => x % 2 === 0), sq = ev.map((x) => x * x), total = sq.reduce((a, b) => a + b, 0);
  return { kind: "grid", title: "filter, map, reduce", steps: [
    { note: `Start with ${xs.join(", ")}. Keep the even ones, square them, add them up.`, tables: [{ label: "input", rows: [xs] }] },
    { note: `filter(x => x % 2 == 0) keeps ${ev.join(", ")}. A new list; the input is untouched.`, tone: "hot", tables: [{ label: "input", rows: [xs], tones: Object.fromEntries(xs.map((x, i) => [`0:${i}`, x % 2 ? "bad" : "ok"])) }, { label: "filter", rows: [ev] }] },
    { note: `map(x => x * x) turns each into its square: ${sq.join(", ")}.`, tables: [{ label: "filter", rows: [ev] }, { label: "map", rows: [sq], tones: { "0": "hot" } }] },
    { note: `reduce((a, b) => a + b, 0) folds them into one value: ${sq.join(" + ")} = ${total}. Java streams and Python generators do this lazily, one item at a time.`, tone: "ok", tables: [{ label: "map", rows: [sq] }, { label: "reduce", rows: [[total]], tones: { "0:0": "ok" } }] },
  ] };
};

/* ---------- React ---------- */
const jsx: Flow = { title: "From JSX to pixels", steps: [
  { node: "<Greeting name=\"Asha\" />", note: "JSX is syntax for a function call. The compiler turns it into jsx(Greeting, { name: \"Asha\" })." },
  { node: "React calls Greeting(props)", note: "Your component is a plain function: props in, a description of UI out.", tone: "hot" },
  { node: "returns { type: \"h1\", children }", note: "The result is a small object, a React element. Nothing is on screen yet." },
  { node: "compare with the last render", note: "Reconciliation: React diffs this tree against the previous one." },
  { node: "DOM: change one text node", note: "Only what differs is written to the page. Same output, no DOM work at all.", tone: "ok" },
] };

const controlled: Flow = { kind: "lanes", title: "One keystroke in a controlled input", lanes: ["Input", "React state", "Render"], steps: [
  { from: 0, to: 1, label: "onChange: \"As\"", note: "You type s. The input fires onChange with the new text; React has not shown it yet." },
  { from: 1, to: 1, label: "setName(\"As\")", note: "The handler stores it in state. State is the single source of truth.", tone: "hot" },
  { from: 1, to: 2, label: "re-render", note: "New state means the component runs again with name = \"As\"." },
  { from: 2, to: 0, label: "value=\"As\"", note: "The input shows exactly what state says. Validation or uppercasing can happen on the way.", tone: "ok" },
  { from: 0, to: 1, label: "form action", note: "React 19: <form action={save}> passes FormData to save, and useActionState tracks pending and the result.", tone: "ok" },
] };

const contextFlow: Flow = { kind: "lanes", title: "A context update", lanes: ["Provider", "Page (no theme)", "Button (reads theme)"], steps: [
  { from: 0, to: 0, label: "value: dark", note: "The provider holds the theme in state and passes it as value." },
  { from: 0, to: 2, label: "useContext: dark", note: "Button reads it directly, with no props threaded through Page.", tone: "hot" },
  { from: 0, to: 0, label: "set light", note: "The theme changes: the provider's value is a new object." },
  { from: 0, to: 2, label: "re-render Button", note: "Every component that reads this context renders again, even inside a memo parent.", tone: "warn" },
  { from: 1, to: 1, label: "Page: skipped", note: "If Page is memo, or passed as children, it does not render: only readers wake. Keep context values small and stable.", tone: "ok" },
] };

const hookSlots: Flow = { kind: "grid", title: "Why hooks cannot go inside an if", steps: [
  { note: "React stores each component's hooks in a list and matches them by call order, not by name.", tables: [{ label: "render 1", head: ["slot", "hook", "value"], rows: [[1, "useState (name)", "Asha"], [2, "useState (age)", 21], [3, "useEffect", "title"]] }] },
  { note: "Now say useState(age) sits inside if (showAge), and showAge became false.", tone: "warn", tables: [{ label: "render 2: hooks called", head: ["slot", "hook"], rows: [[1, "useState (name)"], [2, "useEffect"]] }] },
  { note: "Slot 2 still holds 21, but the effect is asking for it. Every later hook gets the wrong value. React throws Rendered fewer hooks than expected.", tone: "bad", tables: [{ label: "render 2: what React matches", head: ["slot", "hook", "stored value"], rows: [[1, "useState (name)", "Asha"], [2, "useEffect", 21]], tones: { "1": "bad" } }] },
  { note: "Call every hook unconditionally at the top, and put the condition inside: the order never changes.", tone: "ok", tables: [{ label: "fixed", head: ["slot", "hook", "value"], rows: [[1, "useState (name)", "Asha"], [2, "useState (age)", 21], [3, "useEffect", "title"]], tones: { ":0": "ok" } }] },
] };

const rsc: Flow = { kind: "lanes", title: "Loading a page with Server Components", lanes: ["Browser", "Server", "Database"], steps: [
  { from: 0, to: 1, label: "GET /posts/42", note: "The request reaches the framework's router, which finds the page component." },
  { from: 1, to: 2, label: "SELECT post 42", note: "A Server Component is async and can query the database directly: no API route, no secrets in the browser.", tone: "hot" },
  { from: 1, to: 0, label: "HTML + RSC payload", note: "The server sends finished HTML plus a description of the tree. Server Component code itself is never shipped." },
  { from: 0, to: 0, label: "hydrate LikeButton", note: "Only \"use client\" components download JavaScript and become interactive.", tone: "ok" },
  { from: 0, to: 1, label: "server action: like", note: "A click calls a server function; the server updates data and sends back the new UI.", tone: "ok" },
] };

const optimistic: Flow = { kind: "lanes", title: "Sending a message with useOptimistic", lanes: ["You", "React", "Server"], steps: [
  { from: 0, to: 1, label: "submit \"Hi\"", note: "The form calls its action. React runs every form action inside a transition, so isPending turns true." },
  { from: 1, to: 1, label: "addOptimistic(\"Hi\")", note: "The list shows \"Hi (sending)\" in the same frame. The real state has not changed yet.", tone: "hot" },
  { from: 1, to: 2, label: "await sendToServer", note: "The request is in flight. The user can keep typing, since nothing is blocked." },
  { from: 2, to: 1, label: "saved, id 7", note: "setMessages adds the saved copy to the real state.", tone: "ok" },
  { from: 1, to: 1, label: "action ends", note: "React drops the optimistic copy and shows the real list, which already holds the saved message, so nothing flickers.", tone: "ok" },
  { from: 2, to: 1, label: "error instead", note: "If the server throws, the real state never changed, so the optimistic copy just disappears. No rollback code to write.", tone: "bad" },
] };

/* ---------- system design ---------- */
const approach = (): Flow => {
  const phases: [string, number][] = [["requirements", 5], ["estimates", 5], ["API + data", 5], ["high level", 10], ["deep dive", 15], ["wrap up", 5]];
  const steps = phases.map(([p, m], i) => ({ note: `${p}: ${m} minutes. ${["Pin down 3 to 5 features and the scale before drawing.", "Requests a second, storage, bandwidth: just enough to choose a design.", "The main endpoints and the tables behind them.", "Client, load balancer, services, storage, cache, queue.", "The hard part: hot keys, fan-out, consistency. Most of the marks are here.", "Bottlenecks, failure modes, monitoring, next steps."][i]} Elapsed ${phases.slice(0, i + 1).reduce((s, x) => s + x[1], 0)} of 45.`, tone: i === 4 ? ("hot" as const) : undefined, bars: phases.map(([q, n], j) => ({ label: q, value: j <= i ? n : 0, tone: j === i ? ("hot" as const) : undefined })) }));
  return { kind: "bars", title: "Spending a 45-minute design round", max: 15, format: (v) => `${v} min`, steps };
};

const roundRobin = (): Flow => {
  const servers = ["s1", "s2", "s3"], load = [0, 0, 0], steps: { note: string; tone?: "ok" | "bad" | "warn" | "hot"; bars: Bar[] }[] = [];
  for (let r = 0; r < 6; r++) { load[r % 3]++; steps.push({ note: `Request ${r + 1} goes to ${servers[r % 3]} (round robin). Any server can take it, because sessions live in Redis.`, bars: servers.map((s, i) => ({ label: s, value: load[i], tone: i === r % 3 ? "hot" : undefined })) }); }
  const after = [load[0] + 2, 0, load[2] + 1];
  steps.push({ note: "s2 fails its health check. The load balancer stops sending it traffic; users notice nothing because no state was on s2.", tone: "warn", bars: servers.map((s, i) => ({ label: s, value: i === 1 ? 0 : load[i], tone: i === 1 ? "bad" : undefined })) });
  steps.push({ note: `The next three requests spread over s1 and s3. Add s4 later and it takes traffic at once: that is horizontal scaling.`, tone: "ok", bars: servers.map((s, i) => ({ label: s, value: after[i], tone: i === 1 ? "bad" : "ok" })) });
  return { kind: "bars", title: "A load balancer in front of stateless servers", max: 5, format: (v) => `${v} req`, steps };
};

/** Queue depth when `arrive` jobs a second come in and workers finish `serve` a second. */
export const queueDepth = (arrive: number[], serve: number) => arrive.reduce<number[]>((d, a) => [...d, Math.max(0, (d.at(-1) ?? 0) + a - serve)], []);
export const SPIKE = [80, 200, 200, 40, 40];
const queues = (): Flow => {
  const depth = queueDepth(SPIKE, 120), max = Math.max(...depth);
  return { kind: "bars", title: "A queue absorbing a traffic spike", max, format: (v) => `${v}`, steps: depth.map((d, i) => ({
    note: i === 0 ? `Orders arrive at ${SPIKE[0]} a second; workers handle 120. The queue stays empty.` : SPIKE[i] > 120 ? `Spike: ${SPIKE[i]} arrive, 120 are processed, ${SPIKE[i] - 120} wait. Depth ${d}. Without the queue those requests would time out.` : d > 0 ? `Back to ${SPIKE[i]} a second: workers drain the backlog by ${120 - SPIKE[i]} a second. Depth ${d}.` : "Backlog gone. Users got a fast \"order received\" all along; the work just finished later.",
    tone: SPIKE[i] > 120 ? ("warn" as const) : d === 0 && i > 0 ? ("ok" as const) : undefined,
    bars: depth.map((x, j) => ({ label: `t${j}`, value: j <= i ? x : 0, tone: j === i ? ("hot" as const) : undefined })),
  })) };
};

export const CORE_FLOWS: Record<string, Flow> = {
  "os-states": states, "os-ipc": ipc,
  "dbms-schema": threeSchema, "dbms-keys": keysFlow(), "dbms-er": er, "dbms-replica": replication,
  "cn-layers": layers(), "cn-csrf": csrf,
  "sql-correlated": correlated(), "sql-islands": gaps(), "sql-txn": txn,
  "oop-object": objects, "oop-encap": encapsulation, "oop-lookup": lookup, "oop-interface": abstraction, "oop-static": staticFlow(), "oop-relations": relationships, "oop-solid": openClosed,
  "apt-di": di(),
  "syn-types": typing, "syn-loop": loopTrace(), "syn-concat": concat(), "syn-dispatch": dispatchFlow, "syn-finally": tryFinally, "syn-generics": erasure, "syn-pipeline": pipeline(),
  "react-jsx": jsx, "react-controlled": controlled, "react-context": contextFlow, "react-hooks": hookSlots, "react-rsc": rsc, "react-optimistic": optimistic,
  "design-approach": approach(), "design-lb": roundRobin(), "design-queue": queues(),
};
