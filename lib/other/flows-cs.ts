// Animated walk-throughs for the CS core subjects. Anything an algorithm produces is computed below, not typed by hand.
import type { Flow, GridStep, GridTable } from "./flows.ts";

/* ---------- OS ---------- */
const translate = (): Flow => {
  const PAGE = 4096, va = 12708, page = Math.floor(va / PAGE), off = va % PAGE, frame = 7, pa = frame * PAGE + off;
  const tlb: GridTable = { label: "Page table", head: ["page", "frame", "valid"], rows: [[2, 5, "yes"], [page, frame, "yes"], [4, "none", "no"]] };
  return { kind: "grid", title: "Virtual address to physical address", steps: [
    { note: `The program reads virtual address ${va}. It has no idea where that really is in RAM.`, tables: [{ label: "Virtual address", head: ["address"], rows: [[va]], tones: { "0": "hot" } }, tlb] },
    { note: `With 4 KB pages, split it: ${va} / ${PAGE} gives page ${page}, and the remainder is offset ${off}. The offset never changes.`, tables: [{ label: "Split into page and offset", head: ["page", "offset"], rows: [[page, off]], tones: { "0:0": "hot" } }, tlb] },
    { note: `Look up page ${page} in the page table. It lives in frame ${frame}. The TLB caches this lookup, because doing it on every memory access would be slow.`, tables: [{ label: "Split into page and offset", head: ["page", "offset"], rows: [[page, off]], tones: { "0:0": "hot" } }, { ...tlb, tones: { "1": "hot" } }] },
    { note: `Physical address = frame x page size + offset = ${frame} x ${PAGE} + ${off} = ${pa}.`, tone: "ok", tables: [{ label: "Physical address", head: ["frame", "offset", "address"], rows: [[frame, off, pa]], tones: { "0:2": "ok" } }, { ...tlb, tones: { "1": "ok" } }] },
    { note: "Touch page 4 instead and the valid bit is no: a page fault. The OS loads it from disk, updates this table, and retries the same instruction.", tone: "warn", tables: [{ label: "A different access", head: ["page", "offset"], rows: [[4, off]], tones: { "0:0": "warn" } }, { ...tlb, tones: { "2": "warn" } }] },
  ] };
};

/* ---------- SQL ---------- */
const EMP: [string, number | null, number][] = [["Asha", 1, 90], ["Ben", 1, 70], ["Chen", 2, 50], ["Dia", 2, 65], ["Eli", null, 40]];
const DEPT: [number, string][] = [[1, "Eng"], [2, "Sales"], [3, "Legal"]];
const empTable = (tones?: GridTable["tones"]): GridTable => ({ label: "employees", head: ["name", "dept", "pay"], rows: EMP.map(([n, d, s]) => [n, d ?? "NULL", s]), tones });
const deptTable = (tones?: GridTable["tones"]): GridTable => ({ label: "departments", head: ["id", "name"], rows: DEPT.map(([i, n]) => [i, n]), tones });

const joins = (): Flow => {
  const name = (id: number | null) => DEPT.find((d) => d[0] === id)?.[1];
  const inner = EMP.filter((e) => name(e[1])).map((e) => [e[0], name(e[1])!] as (string | number)[]);
  const left = EMP.map((e) => [e[0], name(e[1]) ?? "NULL"] as (string | number)[]);
  return { kind: "grid", title: "INNER JOIN vs LEFT JOIN", steps: [
    { note: "Two tables. Eli has no department, and nobody works in Legal. Watch what happens to those two rows.", tables: [empTable({ "4": "warn" }), deptTable({ "2": "warn" })] },
    { note: "INNER JOIN keeps only pairs that match on dept = id. Eli and Legal both disappear, with no error at all.", tables: [{ label: "INNER JOIN", head: ["name", "department"], rows: inner, tones: { ":1": "ok" } }] },
    { note: "LEFT JOIN keeps every row from the left table. Eli stays, with NULL for the department. Legal is still missing, because it is on the right.", tables: [{ label: "employees LEFT JOIN departments", head: ["name", "department"], rows: left, tones: { "4": "warn" } }] },
    { note: "To find employees with no department, keep the LEFT JOIN and add WHERE d.id IS NULL. This anti-join pattern comes up in interviews constantly.", tone: "ok", tables: [{ label: "WHERE d.id IS NULL", head: ["name", "department"], rows: left.filter((r) => r[1] === "NULL"), tones: { "0": "ok" } }] },
  ] };
};

const grouping = (): Flow => {
  const g = new Map<string, number[]>();
  for (const [, d, s] of EMP) if (d !== null) g.set(DEPT.find((x) => x[0] === d)![1], [...(g.get(DEPT.find((x) => x[0] === d)![1]) ?? []), s]);
  const rows = [...g].map(([k, v]) => [k, v.length, v.reduce((a, b) => a + b, 0), v.reduce((a, b) => a + b, 0) / v.length]);
  const high = rows.filter((r) => (r[3] as number) >= 60);
  return { kind: "grid", title: "GROUP BY collapses rows", steps: [
    { note: "Start with one row per employee. WHERE runs first and removes Eli, who has no department.", tables: [empTable({ "4": "bad" })] },
    { note: "GROUP BY sorts the remaining rows into piles, one per department. There is no output yet, only groups.", tables: [...[...g].map(([k, v]) => ({ label: k, head: ["pay"], rows: v.map((x) => [x]), tones: { ":0": "hot" as const } }))] },
    { note: "Each group becomes exactly one output row, so every column must be a group key or an aggregate.", tables: [{ label: "SELECT dept, COUNT(*), SUM(pay), AVG(pay)", head: ["dept", "n", "sum", "avg"], rows, tones: { ":3": "hot" } }] },
    { note: "HAVING filters groups after they are built, which is why it can use AVG and WHERE cannot.", tone: "ok", tables: [{ label: "HAVING AVG(pay) >= 60", head: ["dept", "n", "sum", "avg"], rows: high, tones: { "0": "ok" } }] },
  ] };
};

const windows = (): Flow => {
  const rows = EMP.filter((e) => e[1] !== null).sort((a, b) => a[1]! - b[1]! || b[2] - a[2]);
  const out: (string | number)[][] = []; let prev: number | null = null, run = 0, rank = 0;
  const steps: GridStep[] = [{ note: "A window function adds a column and keeps every row, unlike GROUP BY. Partition by dept, order by pay, highest first.", tables: [{ head: ["name", "dept", "pay", "rank", "running"], rows: rows.map((r) => [r[0], r[1]!, r[2], "", ""]) }] }];
  rows.forEach((r, i) => {
    if (r[1] !== prev) { run = 0; rank = 0; prev = r[1]; }
    run += r[2]; rank++;
    out.push([r[0], r[1]!, r[2], rank, run]);
    const fresh = rank === 1;
    steps.push({ note: fresh ? `New department, so the window restarts: rank 1, running total ${run}.` : `Same department: rank ${rank}, running total ${run - r[2]} + ${r[2]} = ${run}. The row itself stays.`, tone: fresh ? "hot" : undefined,
      tables: [{ head: ["name", "dept", "pay", "rank", "running"], rows: [...out, ...rows.slice(i + 1).map((x) => [x[0], x[1]!, x[2], "", ""])], tones: { [`${i}:3`]: "ok", [`${i}:4`]: "ok" } }] });
  });
  return { kind: "grid", title: "ROW_NUMBER and a running total", steps };
};

/* ---------- programming languages ---------- */
const callStack = (): Flow => {
  const steps: GridStep[] = [], stack: string[] = [];
  const snap = (note: string, tone?: GridStep["tone"]) => steps.push({ note, tone, tables: [{ label: "Call stack, top first", rows: stack.length ? [...stack].reverse().map((x) => [x]) : [["(empty)"]], tones: stack.length ? { "0": tone ?? "hot" } : undefined }] });
  const fact = (n: number): number => {
    stack.push(`fact(${n})`); snap(n > 1 ? `fact(${n}) cannot answer yet: it needs fact(${n - 1}), so a new frame goes on top. Each frame has its own n.` : "fact(1) is the base case. It returns without calling anything.");
    const r = n <= 1 ? 1 : n * fact(n - 1);
    stack[stack.length - 1] = `fact(${n}) returns ${r}`; snap(n > 1 ? `fact(${n}) gets its answer: ${n} x ${r / n} = ${r}. Its frame is about to be popped.` : "The base case returns 1 and the stack starts unwinding.", "ok");
    stack.pop();
    return r;
  };
  const r = fact(4);
  snap(`Done: fact(4) = ${r}. Every call took one frame, so space is O(n), and very deep recursion overflows the stack.`, "ok");
  return { kind: "grid", title: "Recursion on the call stack", steps };
};

const binarySearch = (): Flow => {
  const a = [2, 5, 8, 12, 16, 23, 38, 56, 72], target = 23;
  const head = a.map((_, i) => String(i)), steps: GridStep[] = [];
  let lo = 0, hi = a.length - 1;
  steps.push({ note: `Find ${target} in a sorted array. Sorted is what lets us throw away half each time.`, tables: [{ head, rows: [a] }] });
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, tones: Record<string, "hot" | "ok" | "bad"> = {};
    a.forEach((_, i) => { if (i < lo || i > hi) tones[`0:${i}`] = "bad"; });
    tones[`0:${mid}`] = a[mid] === target ? "ok" : "hot";
    if (a[mid] === target) { steps.push({ note: `a[${mid}] = ${target}. Found in ${steps.length} comparisons. A linear scan would have taken ${mid + 1}.`, tone: "ok", tables: [{ head, rows: [a], tones }] }); break; }
    const big = a[mid] < target;
    steps.push({ note: `mid = (${lo} + ${hi}) / 2 = ${mid}, and a[${mid}] = ${a[mid]} is too ${big ? "small" : "big"}, so everything ${big ? "left" : "right"} of it can go.`, tables: [{ head, rows: [a], tones }] });
    if (big) lo = mid + 1; else hi = mid - 1;
  }
  return { kind: "grid", title: "Binary search", steps };
};

const hashMap = (): Flow => {
  const N = 4, hash = (k: string) => [...k].reduce((a, c) => a + c.charCodeAt(0), 0);
  const buckets: string[][] = [[], [], [], []];
  const table = (b: number | null, tone?: "hot" | "warn" | "ok"): GridTable => ({ head: ["bucket", "entries"], rows: buckets.map((x, i) => [i, x.join(", ") || "empty"]), tones: b === null ? undefined : { [String(b)]: tone ?? "hot" } });
  const steps: GridStep[] = [{ note: `A hash map is an array of ${N} buckets. A hash function turns any key into a number, and mod ${N} picks the bucket.`, tables: [table(null)] }];
  for (const k of ["ali", "bob", "cat", "dan"]) {
    const h = hash(k), b = h % N, clash = buckets[b].length > 0;
    buckets[b].push(k);
    steps.push({ note: `hash("${k}") = ${h}, and ${h} mod ${N} = ${b}. ${clash ? `Bucket ${b} is already taken: a collision, so both live there and a lookup checks each one.` : `Bucket ${b} is free. Lookup later goes straight here: O(1).`}`, tone: clash ? "warn" : undefined, tables: [table(b, clash ? "warn" : "hot")] });
  }
  steps.push({ note: "Lookups stay O(1) on average while buckets stay short, so real maps double the array and rehash once they get too full.", tone: "ok", tables: [table(null)] });
  return { kind: "grid", title: "Inside a hash map", steps };
};

const references = (): Flow => {
  const names = (rows: (string | number)[][], tones?: GridTable["tones"]): GridTable => ({ label: "Names (stack)", head: ["name", "points to"], rows, tones });
  const heap = (rows: (string | number)[][], tones?: GridTable["tones"]): GridTable => ({ label: "Objects (heap)", head: ["object", "value"], rows, tones });
  return { kind: "grid", title: "Two names, one list", steps: [
    { note: "a = [1, 2, 3] creates a list on the heap. The name a only holds a reference to it.", tables: [names([["a", "#1"]], { "0": "hot" }), heap([["#1", "[1, 2, 3]"]], { "0": "hot" })] },
    { note: "b = a copies the reference, not the list. Both names now point at object #1.", tone: "warn", tables: [names([["a", "#1"], ["b", "#1"]], { "1": "warn" }), heap([["#1", "[1, 2, 3]"]])] },
    { note: "b.append(4) changes the one shared object, so a sees the change too. This surprises everyone once.", tone: "bad", tables: [names([["a", "#1"], ["b", "#1"]], { ":1": "bad" }), heap([["#1", "[1, 2, 3, 4]"]], { "0": "bad" })] },
    { note: "c = list(a) makes a real copy: a new object. Changing c cannot touch a or b.", tone: "ok", tables: [names([["a", "#1"], ["b", "#1"], ["c", "#2"]], { "2": "ok" }), heap([["#1", "[1, 2, 3, 4]"], ["#2", "[1, 2, 3, 4]"]], { "1": "ok" })] },
  ] };
};

/* ---------- React ---------- */
const keys = (): Flow => {
  const rows = (items: [string | number, string, string][], tones?: GridTable["tones"], label?: string): GridTable => ({ label, head: ["key", "shows", "typed note"], rows: items, tones });
  return { kind: "grid", title: "Why keys matter", steps: [
    { note: "A list of two rows. Each row has a text box, and you typed a note into Asha's.", tables: [rows([[0, "Asha", "call her"], [1, "Ben", ""]], { "0:2": "hot" }, "key = index")] },
    { note: "Add Chen at the top. With index keys, React sees key 0 still exists, so it reuses that row with new text. The typed note stays in the box.", tone: "bad", tables: [rows([[0, "Chen", "call her"], [1, "Asha", ""], [2, "Ben", ""]], { "0:2": "bad", "0:1": "bad" }, "key = index: note now on the wrong person")] },
    { note: "With stable ids, React knows a2 and b7 only moved. It creates one new row for Chen and keeps Asha's note with Asha.", tone: "ok", tables: [rows([["c9", "Chen", ""], ["a2", "Asha", "call her"], ["b7", "Ben", ""]], { "1": "ok", "0:0": "hot" }, "key = item.id: note stays correct")] },
  ] };
};

const batching = (): Flow => {
  let count = 0; const a = [0, 0, 0].map(() => count + 1);
  let q = 0; const b = [0, 0, 0].map(() => (q = q + 1));
  const t = (label: string, rows: (string | number)[][], tones?: GridTable["tones"]): GridTable => ({ label, head: ["call", "queued", "result"], rows, tones });
  return { kind: "grid", title: "Why setCount ran three times but added one", steps: [
    { note: "count is 0 for this entire render. It is a constant in this function call, not a live variable.", tables: [t("setCount(count + 1), three times", [[1, "set to 0 + 1", ""], [2, "set to 0 + 1", ""], [3, "set to 0 + 1", ""]], { ":1": "hot" })] },
    { note: `Each call read the same count, so all three said "set to 1". The next render shows ${a[2]}, not 3.`, tone: "bad", tables: [t("setCount(count + 1), three times", a.map((x, i) => [i + 1, "set to 0 + 1", x]), { "2:2": "bad" })] },
    { note: `The updater form queues a function, and React feeds each one the latest value: 0 gives 1, 1 gives 2, 2 gives ${b[2]}.`, tone: "ok", tables: [t("setCount((c) => c + 1), three times", b.map((x, i) => [i + 1, `${x - 1} + 1`, x]), { "2:2": "ok" })] },
  ] };
};

/* ---------- aptitude ---------- */
const euclid = (): Flow => {
  const start = [252, 105]; let [a, b] = start; const rows: (string | number)[][] = [], steps: GridStep[] = [];
  const head = ["a", "b", "a mod b"];
  steps.push({ note: `HCF of ${a} and ${b}. Anything dividing both also divides their remainder, so we can keep swapping for smaller numbers.`, tables: [{ head, rows: [[a, b, ""]] }] });
  while (b) {
    const r = a % b; rows.push([a, b, r]);
    steps.push({ note: r ? `${a} mod ${b} = ${r}. Replace (a, b) with (${b}, ${r}).` : `${a} mod ${b} = 0, so the HCF is ${b}.`, tone: r ? undefined : "ok", tables: [{ head, rows: [...rows], tones: { [`${rows.length - 1}:${r ? 2 : 1}`]: r ? "hot" : "ok" } }] });
    [a, b] = [b, r];
  }
  steps.push({ note: `LCM follows at once: ${start[0]} x ${start[1]} / ${a} = ${start[0] * start[1] / a}. Use this instead of factorising big numbers in a timed test.`, tone: "ok", tables: [{ head: ["HCF", "LCM"], rows: [[a, start[0] * start[1] / a]], tones: { "0": "ok" } }] });
  return { kind: "grid", title: "HCF by Euclid's algorithm", steps };
};

export const CS_FLOWS: Record<string, Flow> = {
  "os-switch": { title: "A context switch", steps: [
    { node: "timer interrupt fires", note: "Process A was running. A hardware timer forces the CPU into the kernel, so no process can hog it forever." },
    { node: "save A's registers to its PCB", note: "Program counter, stack pointer and registers go into A's process control block, so A can resume exactly here.", tone: "hot" },
    { node: "scheduler picks B", note: "The scheduling algorithm chooses who runs next from the ready queue." },
    { node: "switch address space", note: "Threads of one process skip this step, which is a large part of why they are cheaper to switch between." , tone: "warn" },
    { node: "restore B's registers", note: "Load B's saved state. Caches and the TLB now hold A's data, which is the hidden cost: B starts slow." },
    { node: "B continues", note: "B has no idea it ever stopped. This happens many times a second.", tone: "ok" },
  ] },
  "os-race": { kind: "lanes", title: "A lost update", lanes: ["Thread A", "count", "Thread B"], steps: [
    { from: 1, to: 0, label: "read 5", note: "count++ looks like one operation but is three: read, add, write. Thread A reads 5." },
    { from: 1, to: 2, label: "read 5", note: "The scheduler switches before A writes. Thread B also reads 5.", tone: "warn" },
    { from: 0, to: 1, label: "write 6", note: "A adds one and writes 6." },
    { from: 2, to: 1, label: "write 6", note: "B also computed 6 and overwrites it. Two increments, but count only went up by one.", tone: "bad" },
    { from: 1, to: 1, label: "should be 7", note: "This bug appears rarely and vanishes under a debugger. A mutex or an atomic increment makes the three steps indivisible.", tone: "ok" },
  ] },
  "os-deadlock": { kind: "lanes", title: "A deadlock, step by step", lanes: ["Thread 1", "Lock A", "Lock B", "Thread 2"], steps: [
    { from: 0, to: 1, label: "take A", note: "Thread 1 takes lock A. So far so good.", tone: "ok" },
    { from: 3, to: 2, label: "take B", note: "Thread 2 takes lock B at the same moment.", tone: "ok" },
    { from: 0, to: 2, label: "wait for B", note: "Thread 1 now needs B too, and blocks while still holding A.", tone: "warn" },
    { from: 3, to: 1, label: "wait for A", note: "Thread 2 needs A and blocks while holding B. Each waits for the other, forever. All four deadlock conditions hold.", tone: "bad" },
    { from: 0, to: 0, label: "always A, then B", note: "Fix it by taking locks in one global order. That breaks the circular wait, and it is the fix used in real code.", tone: "ok" },
  ] },
  "os-translate": translate(),
  "dbms-wal": { title: "How a commit survives a crash", steps: [
    { node: "BEGIN: move 100 from A to B", note: "A transaction starts. Nothing is permanent yet." },
    { node: "write the change to the log (WAL)", note: "The change is appended to a log first. Appending is sequential, so it is fast.", tone: "hot" },
    { node: "update pages in memory", note: "The tables change in memory only. Writing them to disk now would be slow random I/O." },
    { node: "COMMIT: fsync the log", note: "Once the log reaches the disk, the commit is durable, even though the tables on disk are still old.", tone: "ok" },
    { node: "power cut", note: "Memory is gone, and the table files on disk are out of date.", tone: "bad" },
    { node: "restart: replay the log", note: "Recovery redoes committed changes and undoes unfinished ones. No committed money is lost.", tone: "ok" },
  ] },
  "dbms-dirty": { kind: "lanes", title: "A dirty read", lanes: ["Transaction 1", "balance", "Transaction 2"], steps: [
    { from: 0, to: 1, label: "set to 50", note: "T1 changes the balance from 100 to 50 but has not committed." },
    { from: 1, to: 2, label: "read 50", note: "With READ UNCOMMITTED, T2 sees the unfinished value and approves a decision based on it.", tone: "warn" },
    { from: 0, to: 1, label: "ROLLBACK", note: "T1 fails and rolls back. The balance is 100 again. T2 acted on a number that never officially existed.", tone: "bad" },
    { from: 1, to: 2, label: "read 100", note: "READ COMMITTED prevents this: T2 only ever sees committed data. It is the default in Postgres.", tone: "ok" },
  ] },
  "cn-dns": { kind: "lanes", title: "Looking up example.com", lanes: ["You", "Resolver", "Root", ".com", "Name server"], steps: [
    { from: 0, to: 1, label: "example.com?", note: "Your device asks a recursive resolver, usually run by your ISP, or a public one." },
    { from: 1, to: 2, label: "example.com?", note: "Not cached, so it starts at a root server, which only knows who runs each top-level domain." },
    { from: 2, to: 1, label: "ask .com", note: "The root server does not know the answer, but it refers the resolver onward." },
    { from: 1, to: 3, label: "example.com?", note: "The .com servers do not store the address either." },
    { from: 3, to: 1, label: "ask its NS", note: "They know which name servers are authoritative for this one domain." },
    { from: 1, to: 4, label: "example.com?", note: "The authoritative server is the source of truth for this domain.", tone: "hot" },
    { from: 4, to: 1, label: "IP + TTL", note: "It returns the IP address and a TTL, which says how long this answer may be cached." },
    { from: 1, to: 0, label: "IP", note: "Everyone caches it until the TTL expires. This is why DNS changes take time to spread.", tone: "ok" },
  ] },
  "cn-tls": { kind: "lanes", title: "An HTTPS request", lanes: ["Browser", "Server"], steps: [
    { from: 0, to: 1, label: "TCP SYN", note: "First TCP: the three-way handshake sets up a reliable connection." },
    { from: 1, to: 0, label: "SYN-ACK", note: "The server agrees and picks its own starting sequence number." },
    { from: 0, to: 1, label: "ACK + ClientHello", note: "TLS begins: the browser lists the ciphers it supports and sends a key share." },
    { from: 1, to: 0, label: "ServerHello + certificate", note: "The server picks a cipher and proves who it is with a certificate signed by a trusted authority.", tone: "hot" },
    { from: 0, to: 0, label: "verify certificate", note: "The browser checks the signature, the domain and the expiry date. This is what stops an impostor.", tone: "warn" },
    { from: 0, to: 1, label: "encrypted GET /cart", note: "Both sides derived the same keys without ever sending them. Everything from now on is encrypted." },
    { from: 1, to: 0, label: "encrypted 200 OK", note: "Later requests reuse this connection, so this setup cost is paid once.", tone: "ok" },
  ] },
  "cn-url": { title: "What happens when you press Enter", steps: [
    { node: "parse the URL", note: "The browser checks its cache and works out the scheme, host and path." },
    { node: "DNS: name to IP", note: "Browser cache, OS cache, then the resolver. Often this needs no network at all." },
    { node: "TCP handshake", note: "One round trip to open a reliable connection." },
    { node: "TLS handshake", note: "One more round trip to agree keys and verify the certificate.", tone: "hot" },
    { node: "HTTP request and response", note: "The server, often behind a CDN and a load balancer, returns the HTML." },
    { node: "parse, fetch, paint", note: "HTML builds the DOM, and CSS and JS trigger more requests, then the page paints.", tone: "ok" },
  ] },
  "cn-lpm": { kind: "grid", title: "Longest prefix match", steps: [
    { note: "A router gets a packet for 10.1.2.5. Its table has several routes, and more than one may match.", tables: [{ label: "Destination 10.1.2.5", head: ["prefix", "next hop"], rows: [["0.0.0.0/0", "ISP"], ["10.0.0.0/8", "core"], ["10.1.0.0/16", "campus"], ["10.1.2.0/24", "lab"]] }] },
    { note: "Compare the first n bits of each prefix with the destination. All four match, since /0 matches everything.", tone: "warn", tables: [{ label: "Destination 10.1.2.5", head: ["prefix", "next hop"], rows: [["0.0.0.0/0", "ISP"], ["10.0.0.0/8", "core"], ["10.1.0.0/16", "campus"], ["10.1.2.0/24", "lab"]], tones: { ":0": "warn" } }] },
    { note: "The most specific route wins, so /24 beats /16, /8 and /0. The packet goes to lab.", tone: "ok", tables: [{ label: "Destination 10.1.2.5", head: ["prefix", "next hop"], rows: [["0.0.0.0/0", "ISP"], ["10.0.0.0/8", "core"], ["10.1.0.0/16", "campus"], ["10.1.2.0/24", "lab"]], tones: { "3": "ok" } }] },
    { note: "This rule explains the 2008 YouTube hijack: a false /24 beat YouTube's real /22 worldwide.", tone: "bad", tables: [{ label: "Destination in YouTube's range", head: ["prefix", "next hop"], rows: [["208.65.152.0/22", "YouTube"], ["208.65.153.0/24", "Pakistan Telecom"]], tones: { "1": "bad" } }] },
  ] },
  "sql-join": joins(),
  "sql-group": grouping(),
  "sql-window": windows(),
  "oop-ctor": { title: "Building new Dog()", steps: [
    { node: "memory allocated for the whole object", note: "Room for the base class's fields and Dog's own, as one block." },
    { node: "Animal constructor runs first", note: "The base part must be valid before the derived part can rely on it.", tone: "hot" },
    { node: "Dog's field initialisers run", note: "Dog's fields get their initial values." },
    { node: "Dog constructor body runs", note: "Now the object is fully built. Calling a virtual method in a constructor before this point is a classic trap.", tone: "warn" },
    { node: "object is used", note: "Normal life." },
    { node: "C++: ~Dog, then ~Animal", note: "Destruction runs in the reverse order, so Dog can still use its base while cleaning up. Base destructors must be virtual.", tone: "ok" },
  ] },
  "oop-unwind": { kind: "grid", title: "An exception unwinding the stack", steps: [
    { note: "main calls load, load calls parse. Each call adds a frame, and load has a try block around its call.", tables: [{ label: "Call stack, top first", rows: [["parse()"], ["load(): try { ... }"], ["main()"]], tones: { "0": "hot" } }] },
    { note: "parse throws. It has no matching catch, so its frame is destroyed. C++ runs destructors here, and Java runs finally blocks.", tone: "bad", tables: [{ label: "Call stack, top first", rows: [["parse(): throws ParseError"], ["load(): try { ... }"], ["main()"]], tones: { "0": "bad" } }] },
    { note: "The runtime checks load. Its catch matches the type, so unwinding stops right here.", tone: "ok", tables: [{ label: "Call stack, top first", rows: [["load(): catch (ParseError)"], ["main()"]], tones: { "0": "ok" } }] },
    { note: "load handles it and returns normally. main never knows anything went wrong. With no matching catch anywhere, the program would have terminated.", tone: "ok", tables: [{ label: "Call stack, top first", rows: [["main()"]], tones: { "0": "ok" } }] },
  ] },
  "syn-stack": callStack(),
  "syn-binary": binarySearch(),
  "syn-hash": hashMap(),
  "syn-refs": references(),
  "react-render": { title: "From setState to the screen", steps: [
    { node: "click: setCount(1)", note: "The setter does not change the variable. It asks React for another render." },
    { node: "render: React calls your function", note: "Your component runs again with count = 1 and returns a description of the UI. Nothing on screen has changed yet.", tone: "hot" },
    { node: "reconcile: compare with last time", note: "React diffs the new description against the previous one to find what actually changed." },
    { node: "commit: patch only those DOM nodes", note: "Only the text node that changed gets touched. That is why re-rendering is cheaper than it sounds.", tone: "ok" },
    { node: "browser paints", note: "Now you see the new value." },
    { node: "useEffect runs", note: "Effects run after paint, last of all. An effect that sets state starts this whole cycle again.", tone: "warn" },
  ] },
  "react-effect": { kind: "lanes", title: "The life of an effect", lanes: ["React", "Your component", "Effect"], steps: [
    { from: 0, to: 1, label: "render, userId = 1", note: "First render. The component only returns UI, so no fetch should happen here." },
    { from: 0, to: 2, label: "run effect", note: "After the screen updates, React runs the effect: fetch user 1.", tone: "hot" },
    { from: 0, to: 1, label: "render, userId = 2", note: "The prop changes. React renders again and compares the dependency array: [1] became [2]." },
    { from: 0, to: 2, label: "cleanup, abort fetch", note: "Before running the new effect, React runs the old cleanup. Without it, a slow first response could overwrite the newer one.", tone: "warn" },
    { from: 0, to: 2, label: "run effect", note: "Now it fetches user 2." },
    { from: 0, to: 2, label: "unmount: cleanup", note: "When the component leaves the screen, cleanup runs a final time. Forgetting this is how apps leak timers and sockets.", tone: "ok" },
  ] },
  "react-keys": keys(),
  "react-batch": batching(),
  "node-mw": { title: "One request through Express", steps: [
    { node: "request arrives", note: "Express walks its middleware in the exact order you registered them." },
    { node: "logger: next()", note: "Reads the request, starts a timer, calls next() to pass it on." },
    { node: "express.json(): next()", note: "Parses the body into req.body. Register it after your routes and req.body is undefined." , tone: "warn" },
    { node: "requireAuth: next()", note: "Checks the token. Without one it would respond 401 and stop here: not calling next() ends the chain.", tone: "hot" },
    { node: "route handler", note: "Runs your code. In Express 5, a rejected promise here jumps to the error handler automatically." },
    { node: "res.json(): response sent", note: "The response goes out, and the logger's finish listener records the time.", tone: "ok" },
  ] },
  "node-jwt": { kind: "lanes", title: "Logging in with a JWT", lanes: ["Browser", "API", "Database"], steps: [
    { from: 0, to: 1, label: "POST /login", note: "Email and password travel over HTTPS, never in a URL." },
    { from: 1, to: 2, label: "get user", note: "Fetch the stored password hash. The password itself is never stored." },
    { from: 1, to: 1, label: "verify hash", note: "scrypt or bcrypt is slow on purpose, so stolen hashes are expensive to crack.", tone: "warn" },
    { from: 1, to: 0, label: "signed JWT", note: "The token holds a user id and expiry, signed with a server secret. Anyone can read it, so no secrets inside.", tone: "hot" },
    { from: 0, to: 1, label: "GET /me + token", note: "Each later request carries the token in the Authorization header." },
    { from: 1, to: 1, label: "check signature", note: "No database call needed, which is why JWTs scale. The cost: revoking one before it expires is hard.", tone: "ok" },
  ] },
  "node-backpressure": { kind: "bars", title: "Backpressure in a stream", max: 24, format: (v) => `${Math.round(v)} KB`, steps: [
    { note: "A fast disk reader feeds a slow network writer. The buffer between them has a 16 KB high water mark.", bars: [{ label: "buffer", value: 0 }, { label: "limit", value: 16, tone: "warn" }] },
    { note: "The reader pushes chunks faster than the writer drains them, so the buffer fills.", bars: [{ label: "buffer", value: 12, tone: "hot" }, { label: "limit", value: 16, tone: "warn" }] },
    { note: "write() returns false at the limit. That is the signal to stop reading. If you ignore it, memory grows until the process dies.", tone: "bad", bars: [{ label: "buffer", value: 18, tone: "bad" }, { label: "limit", value: 16, tone: "warn" }] },
    { note: "The reader pauses and the writer catches up.", bars: [{ label: "buffer", value: 4, tone: "ok" }, { label: "limit", value: 16, tone: "warn" }] },
    { note: "The 'drain' event says resume. pipeline() does all of this for you, so memory stays flat whatever the file size.", tone: "ok", bars: [{ label: "buffer", value: 8, tone: "ok" }, { label: "limit", value: 16, tone: "warn" }] },
  ] },
  "apt-euclid": euclid(),
};
