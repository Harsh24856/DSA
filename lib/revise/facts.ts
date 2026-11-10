// The "must know" facts at the top of each CS core revision sheet: the tables and one-liners interviewers check first.
// Hand-written and standard; numbers that follow from a formula are computed here.
import type { Table } from "../other/types";

export type FactSection = { id: string; title: string; table?: Table; points?: string[] };

const hosts = (prefix: number) => (2 ** (32 - prefix) - 2).toLocaleString("en-US");

export const FACTS: Record<string, FactSection[]> = {
  os: [
    { id: "f-scheduling", title: "CPU scheduling", table: { head: ["Algorithm", "Preemptive", "Runs next", "Weak spot"], rows: [
      ["FCFS", "no", "earliest arrival", "convoy effect: short jobs wait behind a long one"],
      ["SJF", "no", "shortest burst", "starvation; needs burst estimates"],
      ["SRTF", "yes", "shortest remaining time", "starvation; many context switches"],
      ["Round robin", "yes", "next in queue after each time quantum", "tiny quantum wastes time switching, huge quantum becomes FCFS"],
      ["Priority", "either", "highest priority", "starvation, fixed by aging"],
      ["Multilevel feedback queue", "yes", "moves jobs between queues by how they behave", "many settings to tune"],
    ] }, points: [
      "**Turnaround** = completion - arrival. **Waiting** = turnaround - burst. **Response** = first run - arrival.",
      "SRTF gives the lowest average waiting time; round robin gives the best response time for interactive work.",
    ] },
    { id: "f-sync", title: "Processes, threads and synchronization", points: [
      "**Process vs thread:** a process has its own address space; threads of one process share memory but each has its own stack and registers.",
      "**Mutex vs semaphore:** a mutex is a lock with an owner; a counting semaphore allows up to N holders and anyone may signal it.",
      "**Critical section rules:** mutual exclusion, progress, bounded waiting.",
      "**Race condition:** the result depends on timing; fix with a lock, an atomic operation or by not sharing.",
      "**Zombie:** finished, but the parent has not called `wait`. **Orphan:** the parent died first; init adopts it.",
      "**Context switch:** save the registers and program counter in the PCB, load the next process's.",
    ] },
    { id: "f-deadlock", title: "Deadlock", table: { head: ["Necessary condition", "Break it by"], rows: [
      ["Mutual exclusion", "sharing the resource where possible"],
      ["Hold and wait", "requesting everything at once"],
      ["No preemption", "allowing resources to be taken back"],
      ["Circular wait", "taking locks in one global order (the fix used in practice)"],
    ] }, points: ["Strategies: prevention (break a condition), avoidance (Banker's algorithm checks for a safe state), detection and recovery, or ignoring it (most desktop OSes)."] },
    { id: "f-memory", title: "Memory and virtual memory", table: { head: ["Page replacement", "Evicts", "Note"], rows: [
      ["FIFO", "the oldest page", "can show Belady's anomaly: more frames, more faults"],
      ["LRU", "the least recently used page", "good in practice, costly to track exactly"],
      ["Optimal", "the page used farthest in the future", "fewest faults; needs the future, so only a benchmark"],
      ["Clock (second chance)", "the first page whose reference bit is 0", "cheap approximation of LRU"],
    ] }, points: [
      "**Paging** removes external fragmentation but can waste part of the last page (internal). **Segmentation** has external fragmentation.",
      "**TLB:** a cache of page table entries. Effective access time with one page table level = hit rate x (TLB + memory) + miss rate x (TLB + 2 x memory).",
      "**Thrashing:** too little memory per process, so it pages more than it runs. Reduce the number of processes.",
      "**Disk scheduling:** FCFS, SSTF (nearest first, can starve), SCAN (elevator), C-SCAN (one direction, fairer), LOOK (turns at the last request).",
    ] },
  ],
  dbms: [
    { id: "f-normal", title: "Normal forms", table: { head: ["Form", "Rule"], rows: [
      ["1NF", "every column holds one atomic value; no repeating groups"],
      ["2NF", "1NF, and no non-key column depends on only part of a composite key"],
      ["3NF", "2NF, and no non-key column depends on another non-key column (no transitive dependency)"],
      ["BCNF", "for every dependency X -> Y, X is a superkey"],
    ] }, points: ["3NF decomposition is always lossless and dependency-preserving; BCNF is always lossless but may lose a dependency."] },
    { id: "f-isolation", title: "Transactions and isolation", table: { head: ["Isolation level", "Dirty read", "Non-repeatable read", "Phantom"], rows: [
      ["Read uncommitted", "possible", "possible", "possible"],
      ["Read committed", "no", "possible", "possible"],
      ["Repeatable read", "no", "no", "possible (in the standard)"],
      ["Serializable", "no", "no", "no"],
    ] }, points: [
      "**ACID:** atomicity (all or nothing), consistency (rules hold), isolation (concurrent runs look serial), durability (commits survive crashes, via the log).",
      "**Two-phase locking:** a growing phase, then a shrinking phase; it guarantees conflict serializability but not freedom from deadlock. Strict 2PL holds write locks until commit.",
      "**Deadlock schemes:** wait-die (older waits, younger aborts) and wound-wait (older aborts the younger, younger waits).",
    ] },
    { id: "f-keys", title: "Keys and indexes", table: { head: ["Key", "Meaning"], rows: [
      ["Super key", "any set of columns that identifies a row"],
      ["Candidate key", "a minimal super key"],
      ["Primary key", "the chosen candidate key; unique and not null"],
      ["Alternate key", "a candidate key that was not chosen"],
      ["Foreign key", "references a key in another table"],
    ] }, points: [
      "**B+ tree index:** all data in linked leaves, so equality and range queries are O(log n). **Hash index:** equality only.",
      "**Clustered index:** the table is stored in index order, so only one per table. **Non-clustered:** a separate structure pointing to rows.",
      "**CAP:** during a network partition, choose consistency or availability.",
    ] },
  ],
  cn: [
    { id: "f-layers", title: "OSI and TCP/IP layers", table: { head: ["Layer", "Unit", "Examples"], rows: [
      ["7 Application", "data", "HTTP, DNS, SMTP, FTP"],
      ["6 Presentation", "data", "encoding, compression, TLS"],
      ["5 Session", "data", "sessions, checkpoints"],
      ["4 Transport", "segment", "TCP, UDP, ports"],
      ["3 Network", "packet", "IP, ICMP, routers"],
      ["2 Data link", "frame", "Ethernet, MAC addresses, ARP, switches"],
      ["1 Physical", "bits", "cables, radio, hubs"],
    ] }, points: ["TCP/IP folds these into 4 layers: application, transport, internet, link."] },
    { id: "f-tcp", title: "TCP vs UDP", table: { head: ["", "TCP", "UDP"], rows: [
      ["Connection", "yes, three-way handshake", "no"],
      ["Delivery", "reliable, ordered, retransmits", "best effort, may drop or reorder"],
      ["Control", "flow control and congestion control", "none"],
      ["Header", "20 bytes or more", "8 bytes"],
      ["Used by", "web, email, file transfer", "DNS, video calls, games, QUIC"],
    ] }, points: [
      "**Handshake:** SYN, SYN-ACK, ACK. **Close:** FIN and ACK in each direction; the side that closes first waits in TIME_WAIT.",
      "**Flow control** protects the receiver (window size). **Congestion control** protects the network (slow start, then additive increase, multiplicative decrease).",
    ] },
    { id: "f-ports", title: "Ports, addressing and HTTP", table: { head: ["Protocol", "Port"], rows: [
      ["HTTP", "80"], ["HTTPS", "443"], ["SSH", "22"], ["FTP", "20, 21"], ["Telnet", "23"], ["SMTP", "25"],
      ["DNS", "53"], ["DHCP", "67, 68"], ["POP3", "110"], ["IMAP", "143"],
    ] }, points: [
      `**Usable hosts** in a subnet = 2^(32 - prefix) - 2: /24 has ${hosts(24)}, /26 has ${hosts(26)}, /30 has ${hosts(30)}.`,
      "**Private ranges:** 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Loopback: 127.0.0.1.",
      "**HTTP status:** 2xx success (200, 201, 204), 3xx redirect (301 permanent, 302 temporary, 304 not modified), 4xx client error (400, 401, 403, 404, 409, 429), 5xx server error (500, 502, 503, 504).",
      "**Typing a URL:** DNS lookup, TCP handshake, TLS handshake, HTTP request, response, render.",
      "**DHCP:** Discover, Offer, Request, Acknowledge. **ARP:** IP address to MAC address.",
    ] },
  ],
  sql: [
    { id: "f-order", title: "Clause order", table: { head: ["Written order", "Runs as step"], rows: [
      ["SELECT", "5"], ["FROM and JOIN", "1"], ["WHERE", "2"], ["GROUP BY", "3"], ["HAVING", "4"], ["ORDER BY", "6"], ["LIMIT", "7"],
    ] }, points: ["WHERE filters rows before grouping and cannot use aggregates; HAVING filters groups after. A SELECT alias works in ORDER BY but not in WHERE."] },
    { id: "f-window", title: "Ranking functions for scores 90, 90, 80, 70", table: { head: ["Function", "Result"], rows: [
      ["ROW_NUMBER()", "1, 2, 3, 4"], ["RANK()", "1, 1, 3, 4"], ["DENSE_RANK()", "1, 1, 2, 3"],
    ] }, points: ["`LAG` and `LEAD` read the previous and next row; `SUM(x) OVER (ORDER BY d)` is a running total. PARTITION BY restarts the window per group without collapsing rows."] },
    { id: "f-nulls", title: "NULLs and other traps", points: [
      "Any comparison with NULL is unknown: use `IS NULL`, never `= NULL`.",
      "`COUNT(*)` counts rows; `COUNT(col)` and `AVG(col)` skip NULLs.",
      "`NOT IN` with a NULL in the list returns no rows; prefer `NOT EXISTS`.",
      "`UNION` removes duplicates; `UNION ALL` keeps them and is faster.",
      "`DELETE` removes chosen rows (logged, can roll back); `TRUNCATE` empties the table fast; `DROP` removes the table.",
      "**DDL:** CREATE, ALTER, DROP. **DML:** INSERT, UPDATE, DELETE. **DCL:** GRANT, REVOKE. **TCL:** COMMIT, ROLLBACK, SAVEPOINT.",
      "**Second highest salary:** `SELECT MAX(pay) FROM emp WHERE pay < (SELECT MAX(pay) FROM emp)`, or DENSE_RANK = 2.",
    ] },
  ],
  oops: [
    { id: "f-pillars", title: "The four pillars", table: { head: ["Pillar", "In one line"], rows: [
      ["Encapsulation", "keep data private and change it only through methods"],
      ["Abstraction", "expose what an object does, hide how"],
      ["Inheritance", "a class reuses and extends another (is-a)"],
      ["Polymorphism", "one call, different behaviour by type: overloading (compile time) and overriding (run time)"],
    ] } },
    { id: "f-compare", title: "Comparisons interviewers ask", table: { head: ["", "Overloading", "Overriding"], rows: [
      ["Where", "same class", "subclass"],
      ["Signature", "different parameters", "same signature"],
      ["Resolved", "at compile time", "at run time (virtual dispatch)"],
    ] }, points: [
      "**Abstract class vs interface (Java):** an abstract class can hold state and constructors and is extended once; a class can implement many interfaces.",
      "**Java access:** private (class), default (package), protected (package and subclasses), public (everyone). **C++:** class members default to private, struct members to public.",
      "**C++:** make the base destructor `virtual` when deleting through a base pointer. One vtable per class, one vptr per object.",
      "**Diamond problem:** C++ solves it with virtual inheritance; Java forbids multiple class inheritance.",
      "**Shallow vs deep copy:** a shallow copy shares the pointed-to data. Rule of three: destructor, copy constructor, copy assignment together.",
      "**SOLID:** single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion.",
      "**Patterns:** singleton (one instance), factory (creation hidden behind a method), builder (step-by-step construction), observer (subscribers notified), strategy (swappable algorithm), adapter (wraps an incompatible interface), decorator (adds behaviour by wrapping).",
    ] },
  ],
  aptitude: [
    { id: "f-formulas", title: "Formulas", table: { head: ["Topic", "Formula"], rows: [
      ["Successive % changes a and b", "a + b + ab/100"],
      ["Profit %", "(SP - CP) / CP x 100"],
      ["Simple interest", "P x R x T / 100"],
      ["Compound amount", "P (1 + R/100)^T"],
      ["CI - SI over 2 years", "P (R/100)^2"],
      ["Work together", "ab / (a + b) days"],
      ["km/h to m/s", "x 5/18"],
      ["Train passing a platform", "(train + platform length) / speed"],
      ["Boat speeds", "upstream = b - s, downstream = b + s"],
      ["Average speed, equal distances", "2xy / (x + y)"],
      ["Permutations, combinations", "nPr = n!/(n-r)!, nCr = n!/(r!(n-r)!)"],
      ["Circular arrangements", "(n - 1)!"],
      ["P(A or B)", "P(A) + P(B) - P(A and B)"],
      ["Two numbers", "HCF x LCM = product"],
      ["Clock angle", "|30H - 5.5M| degrees"],
    ] } },
  ],
  design: [
    { id: "f-blocks", title: "Building blocks: need to tool", table: { head: ["Need", "Reach for"], rows: [
      ["fast repeated reads", "cache (Redis) with cache-aside and a TTL"],
      ["static files near users", "CDN"],
      ["slow or spiky work", "queue or log (SQS, Kafka) with workers"],
      ["full-text search", "search index (Elasticsearch)"],
      ["large files", "object storage (S3) with pre-signed URLs"],
      ["spread data over servers", "sharding with consistent hashing"],
      ["unique IDs at scale", "Snowflake-style 64-bit IDs"],
      ["protect an API", "rate limiter (token bucket) at the gateway"],
      ["live updates", "WebSocket or server-sent events"],
      ["nearby search", "geohash or quadtree"],
      ["safe retries", "idempotency keys"],
    ] }, points: [
      "**Interview steps:** requirements, estimates, API and data model, high-level design, deep dive, wrap up.",
      `**Estimates:** a day is about 10^5 seconds, so 1 million requests a day is about ${Math.round(1e6 / 86400)} per second; plan for 2 to 10 times that at peak.`,
      "**CAP:** under a partition, pick consistency or availability. **Quorums:** W + R > N means reads see the latest write.",
    ] },
  ],
  react: [
    { id: "f-react", title: "Must-know rules", points: [
      "**Rules of hooks:** call them at the top level of a component or custom hook, never in loops, conditions or nested functions.",
      "**State is immutable:** copy and replace (`[...list, x]`), never mutate; React compares by reference.",
      "**Keys:** stable, unique ids, not array indexes when items can move.",
      "**useEffect:** runs after render; list every value it reads in the dependency array; return a cleanup function.",
      "**Memoization:** `memo` skips re-rendering a component, `useMemo` caches a value, `useCallback` caches a function; use them after measuring.",
      "**React 19:** `use` reads a promise or context, actions handle form submits, `useOptimistic` shows the expected result early.",
      "**Re-render triggers:** its own state change, a parent re-render, or a context it reads changing.",
    ] },
  ],
  node: [
    { id: "f-node", title: "Must-know facts", points: [
      "**Event loop phases:** timers, pending callbacks, poll (I/O), check (`setImmediate`), close. Between callbacks, `process.nextTick` runs first, then promise callbacks.",
      "**Single thread:** JavaScript runs on one thread; I/O is handed to the OS and libuv's thread pool, so CPU-heavy work blocks everyone (use worker threads).",
      "**Streams:** read and write in chunks; `pipeline` handles backpressure and errors.",
      "**Express middleware** runs in the order it is added; call `next()` or send a response; error handlers take four arguments.",
      "**Sessions vs JWT:** a session id points to server-side state and is easy to revoke; a JWT carries signed claims and is hard to revoke before it expires.",
      "**Modules:** CommonJS uses `require`; ES modules use `import` and need `\"type\": \"module\"` or `.mjs`.",
    ] },
  ],
  syntax: [
    { id: "f-langs", title: "Languages at a glance", table: { head: ["Language", "Typing", "Runs as", "Memory"], rows: [
      ["C++", "static", "compiled to machine code", "manual and RAII"],
      ["Java", "static", "bytecode on the JVM", "garbage collected"],
      ["Python", "dynamic", "interpreted bytecode", "reference counting and GC"],
      ["JavaScript", "dynamic", "JIT-compiled in the engine", "garbage collected"],
      ["TypeScript", "static, erased at run time", "compiled to JavaScript", "garbage collected"],
      ["Rust", "static", "compiled to machine code", "ownership, no GC"],
    ] }, points: ["The Syntax page has the same 49 programs in all six languages, including every DSA container and what each language lacks."] },
  ],
};
