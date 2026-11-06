// System Design chapters, part 2: the building blocks and classic designs missing from design.ts.
// Every estimate is computed here from the stated assumptions, never typed by hand.
import type { Chapter } from "./types.ts";

const DAY = 86_400;
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");

/* ---------- unique IDs: Snowflake layout ---------- */
const SNOW = { sign: 1, time: 41, dc: 5, machine: 5, seq: 12 };
const snowYears = 2 ** SNOW.time / (1000 * 3600 * 24 * 365);
const perMs = 2 ** SNOW.seq, machines = 2 ** (SNOW.dc + SNOW.machine);

/* ---------- web crawler ---------- */
const CRAWL = { pagesPerMonth: 1e9, pageKB: 500, years: 5 };
const crawlQps = CRAWL.pagesPerMonth / 30 / DAY;
const crawlTBMonth = (CRAWL.pagesPerMonth * CRAWL.pageKB) / 1e9;
const crawlPB = (crawlTBMonth * 12 * CRAWL.years) / 1000;

/* ---------- key-value store quorums ---------- */
const QUORUMS: [number, number, number, string][] = [[3, 1, 3, "fast writes, slow reads"], [3, 3, 1, "fast reads, slow writes"], [3, 2, 2, "balanced"], [3, 1, 1, "lowest latency"]];

/* ---------- message queue ---------- */
const MQ = { msgsPerSec: 1e6, msgKB: 1, days: 7, replicas: 3 };
const mqTB = (MQ.msgsPerSec * MQ.msgKB * DAY * MQ.days * MQ.replicas) / 1e9;

/* ---------- metrics ---------- */
const MET = { pools: 1000, perPool: 100, metrics: 100, everySec: 10 };
const series = MET.pools * MET.perPool * MET.metrics;
const pointsPerSec = series / MET.everySec;
const TS = [1_700_000_000, 1_700_000_010, 1_700_000_020, 1_700_000_031];
const deltas = TS.slice(1).map((t, i) => t - TS[i]);
const dod = deltas.slice(1).map((d, i) => d - deltas[i]);

export const MORE_A: Chapter[] = [
  {
    id: "growth",
    anim: "sd-growth",
    title: "From one server to millions of users",
    summary: "Almost every large system started as one machine. Each step below fixes the bottleneck the previous step exposed, so walking through them in order is the clearest way to explain why a big architecture looks the way it does.",
    points: [
      "**One server:** the web app, database and files share one machine. DNS gives the client its IP address, and the client talks to it over HTTP. Fine for a prototype, but any failure takes everything down.",
      "**Separate the database:** the web tier and the data tier can now grow on their own. Start relational (joins, transactions, constraints, mature tools). Reach for NoSQL when the data is mostly key lookups at huge volume, has no fixed shape, or needs very low latency at scale.",
      "**Load balancer and more web servers:** clients reach the balancer's public address; servers sit on private addresses. A dead server simply stops receiving traffic.",
      "**Replicate the database:** one primary takes writes and several replicas serve reads. A dead replica is replaced; a dead primary is replaced by promoting a replica.",
      "**Cache and CDN:** keep hot query results in memory, and serve images, scripts and video from CDN edges close to users.",
      "**Stateless web tier:** move session data to a shared store, so any server can serve any user and autoscaling just works.",
      "**Several data centres:** GeoDNS sends each user to the nearest site. If one site fails, all traffic goes to the others. The hard parts are copying data between regions and testing every deploy in every region.",
      "**Message queue:** slow work such as photo processing goes on a queue, so the web tier and the workers scale apart.",
      "**Logs, metrics and automation:** aggregated logs, host and business metrics, and CI/CD let many engineers change the system safely.",
      "**Shard the database:** split rows across databases by a shard key. This brings new problems: resharding when data grows unevenly, a hot key such as a celebrity, and joins that now cross shards.",
    ],
    diagram: `flowchart TB
  U["Web and mobile users"] --> DNS["GeoDNS"]
  U --> CDN["CDN for static files"]
  DNS --> LB["Load balancer"]
  LB --> W["Stateless web servers"]
  W --> C["Cache"]
  W --> S["Session store"]
  W --> Q["Message queue"]
  Q --> K["Workers"]
  W --> DB[("Sharded databases, each a primary with replicas")]:::hot`,
    caption: "The end state. Each box was added to fix one specific bottleneck.",
    table: { head: ["Step", "What it fixes", "What it costs"], rows: [
      ["Separate database", "web and data scale apart", "the database is still one point of failure"],
      ["Load balancer", "web capacity and failover", "sessions stuck to one server"],
      ["Replication", "read load and database failover", "replicas lag behind the primary"],
      ["Cache and CDN", "latency and database load", "stale data and invalidation"],
      ["Stateless tier", "any server can serve anyone", "needs a shared session store"],
      ["Multiple regions", "a whole site going down, distance", "keeping data in sync across regions"],
      ["Sharding", "write volume and data size", "resharding, hot keys, cross-shard joins"],
    ] },
    cards: [
      { id: "sql-nosql", q: "SQL or NoSQL for a new system?", a: "Default to a relational database: transactions, joins, constraints and decades of tooling, and with replicas and caching it goes further than most products ever need.\n\nChoose NoSQL when the access pattern is mostly lookups by key at very high volume, the data has no fixed shape, you need very low latency at scale, or writes must be spread over many machines from the start. Many real systems use both.", trap: "Picking NoSQL \"because it scales\". The deciding question is the access pattern, not the brand." },
      { id: "primary-dies", q: "The primary database dies. What happens next?", a: "A replica is promoted to primary. It may be slightly behind, so the last writes can be lost unless replication was synchronous or semi-synchronous; recovery scripts can replay what is missing.\n\n- Clients must find the new primary, through a proxy, DNS or service discovery.\n- The old primary must be fenced off when it returns, or two primaries accept writes (split brain)." },
      { id: "multi-dc", q: "What is hard about running in two data centres?", a: "- **Routing:** GeoDNS or anycast sends users to the nearest healthy site.\n- **Data:** replication between regions is usually asynchronous, so a failover can lose recent writes, and writes accepted in both regions can conflict.\n- **Operations:** every deploy, migration and alert has to work in each region, and failover must be practised, not assumed." },
      { id: "stateless-why", q: "Why make the web tier stateless?", a: "If a server keeps a user's session in memory, that user must always return to it: the load balancer cannot spread load freely, and a crash logs everyone out. With sessions in a shared store, any server can handle any request, so you can add, remove and replace servers at will." },
      { id: "shard-problems", q: "What new problems does sharding bring?", a: "- **Resharding:** a shard fills up or data is uneven; consistent hashing limits how much moves.\n- **Hot keys:** one celebrity's data overloads one shard; give it its own shard or split the key.\n- **Joins and transactions:** they now cross shards, so denormalize, or do the work in the application.\n- **Unique IDs:** auto-increment no longer works across shards." },
    ],
  },
  {
    id: "kvstore",
    anim: "sd-kvstore",
    title: "Design a key-value store",
    summary: "The interface is two calls: `put(key, value)` and `get(key)`. On one machine it is a hash table. Spread over many machines it becomes a set of decisions about partitioning, replication, consistency and failure, and Amazon's Dynamo paper and Cassandra are the usual reference designs.",
    points: [
      "**Single server:** an in-memory hash table, with compression and only hot keys kept in memory. It stops at one machine's memory.",
      "**Partition:** consistent hashing with virtual nodes spreads keys evenly and moves few keys when servers join or leave. Bigger servers get more virtual nodes.",
      "**Replicate:** store each key on the first N distinct physical servers clockwise from it on the ring, ideally in different data centres.",
      "**Quorum:** a write waits for W acknowledgements and a read for R replies. If `W + R > N`, every read set overlaps every write set, so a read sees the latest write.",
      "**Conflicts:** concurrent writes on different replicas are tracked with vector clocks and merged on read, by the client or by a rule.",
      "**Failure detection:** gossip. Each node keeps a heartbeat counter for every member and shares its list with a few random peers. A member whose counter stops rising is marked down.",
      "**Temporary failures:** a sloppy quorum uses the first W healthy servers, and the stand-in returns the data later (hinted handoff).",
      "**Permanent failures:** replicas compare Merkle trees of their key ranges and copy only the ranges whose hashes differ.",
      "**Write path:** append to a commit log, write to an in-memory table, and flush full tables to sorted files on disk (SSTables), merged later by compaction.",
      "**Read path:** check memory first, then ask a Bloom filter which SSTables might hold the key, and read only those.",
    ],
    diagram: `flowchart TB
  C["Client"] --> CO["Coordinator node"]
  CO --> R["N replicas on the hash ring:<br/>wait for W acks or R replies"]
  subgraph WP["Write path on each replica"]
    direction TB
    L["Append to commit log"] --> M["Write to memtable"] --> F["Flush full memtable to SSTable"]
  end
  subgraph RP["Read path"]
    direction TB
    M2["Memtable hit?"] --> B["Bloom filter picks SSTables"] --> S["Read those SSTables"]
  end
  R --> WP
  R --> RP`,
    caption: "Any node can coordinate. There is no master, so there is no single point of failure.",
    table: { head: ["N", "W", "R", "W + R > N", "Behaviour"], rows: QUORUMS.map(([n, w, r, note]) => [String(n), String(w), String(r), w + r > n ? "yes" : "no", note]) },
    cards: [
      { id: "nwr", q: "With N = 3, which W and R guarantee a read sees the latest write?", a: "Any pair with `W + R > 3`, such as W = 2 and R = 2. The two acknowledged writers and the two readers must share at least one replica, and that replica has the newest version. W = 1 and R = 1 is fastest but only eventually consistent.", trap: "Sloppy quorums break this guarantee during failures, because the W writes may land on stand-in servers that the reader never asks." },
      { id: "vector", q: "How do vector clocks detect a conflict?", a: "Each version carries a list of `[server, counter]` pairs. A write handled by server S increments S's counter.\n\n- Version A **descends from** B if every counter in A is at least the counter in B: keep A.\n- If each has a counter larger than the other's, they were written concurrently: a conflict. Return both, merge them, and write back a clock that covers both.\n\nThe cost is clock size, so systems cap the number of pairs and drop the oldest, which can rarely mistake order for conflict." },
      { id: "merkle", q: "How do two replicas find the keys that differ without comparing every key?", a: "Each builds a Merkle tree: keys are split into buckets, each bucket is hashed, and each parent hashes its children. If the roots match, the replicas agree. If not, compare children and go down only the branches that differ. The data transferred is proportional to the differences, not to the data set." },
      { id: "sloppy", q: "What are a sloppy quorum and hinted handoff?", a: "When a replica that owns a key is down, a strict quorum would reject the write. A sloppy quorum instead writes to the next healthy servers on the ring. The stand-in keeps a hint saying whose data it is and sends it back when the owner recovers. Availability goes up; consistency during the outage goes down." },
      { id: "cap-kv", q: "Should a key-value store be CP or AP?", a: "It depends on the data. A shopping cart prefers availability: accept the write and merge later (Dynamo's original case). An account balance prefers consistency: refuse the write rather than diverge. A real network has partitions, so a \"CA\" distributed store does not exist; the choice is what to give up while partitioned." },
      { id: "gossip", q: "Why gossip instead of every node pinging every other node?", a: "All-to-all heartbeats cost about n² messages, which does not scale to thousands of nodes. With gossip each node talks to a few random peers each round, and information still reaches everyone in a number of rounds that grows only with log n. Requiring several nodes to agree a member is down also avoids false alarms from one flaky link." },
    ],
  },
  {
    id: "ids",
    anim: "sd-ids",
    title: "Unique IDs in a distributed system",
    summary: "One database's auto-increment cannot serve many databases. The usual requirements are: unique, a 64-bit number, roughly ordered by time, and generated at very high rates without a central bottleneck. Twitter's Snowflake layout is the standard answer.",
    points: [
      "**Multi-master increment:** each of k databases increments by k (server 1 makes 1, k + 1, 2k + 1). Simple, but IDs are not time-ordered across servers and adding a server is awkward.",
      "**UUID:** 128 random bits made locally with no coordination. Collisions are practically impossible, but the IDs are long, not numeric and (in version 4) not ordered by time.",
      "**Ticket server:** one database hands out auto-increment numbers to everyone. Simple and numeric, but a single point of failure unless you run two (odd and even).",
      `**Snowflake:** ${SNOW.sign} sign bit, ${SNOW.time} bits of milliseconds since a custom epoch, ${SNOW.dc} bits of data centre, ${SNOW.machine} bits of machine, ${SNOW.seq} bits of sequence that resets every millisecond.`,
      "**Clocks:** Snowflake needs synchronized clocks (NTP). If a clock moves backwards, the generator must wait or refuse, or it may repeat IDs.",
      "**Tuning:** a low-traffic system can give fewer bits to the sequence and more to time, so IDs last longer.",
    ],
    diagram: `flowchart TB
  ID["64-bit Snowflake ID"] --> A["1 bit: sign, always 0"]
  ID --> T["41 bits: ms since custom epoch"]:::hot
  ID --> D["5 bits: data centre"]
  ID --> M["5 bits: machine"]
  ID --> S["12 bits: sequence within the ms"]`,
    caption: "Time comes first, so sorting by ID sorts by creation time.",
    table: { head: ["Approach", "Ordered by time", "Coordination", "Weak spot"], rows: [
      ["Multi-master increment", "no", "none at runtime", "hard to add servers"],
      ["UUID v4", "no", "none", "128 bits, random index inserts"],
      ["Ticket server", "yes", "every ID", "single point of failure"],
      ["Snowflake", "roughly", "only machine IDs", "clock skew"],
    ] },
    cards: [
      { id: "capacity", q: "How many IDs can one Snowflake machine make, and for how long?", a: `With ${SNOW.seq} sequence bits, one machine makes ${n0(perMs)} IDs per millisecond, about ${n0(perMs * 1000)} per second. ${SNOW.dc + SNOW.machine} bits of data centre and machine allow ${n0(machines)} generators. ${SNOW.time} bits of milliseconds last about ${n1(snowYears)} years from the chosen epoch.` },
      { id: "clock-back", q: "The server's clock jumps backwards. What happens?", a: "The generator could produce a timestamp it already used, and with the same sequence numbers that repeats IDs. A safe generator remembers the last timestamp it used: if the clock is behind it, wait until it catches up (for a small jump) or stop and alert (for a big one)." },
      { id: "uuid-index", q: "Why are random UUIDs poor primary keys in a B-tree index?", a: "Each new key lands at a random place in the index, so inserts touch random pages, split pages often and keep the whole index hot in memory. Time-ordered IDs (Snowflake, UUID version 7) append at the right edge of the index, which is far cheaper." },
      { id: "why-ordered", q: "Why do we want IDs roughly ordered by time?", a: "Sorting by ID then sorts by creation time, which feeds timelines and pagination (\"items before ID x\") without an extra timestamp index, and keeps index inserts at one end of the B-tree." },
      { id: "epoch", q: "Why use a custom epoch instead of 1970?", a: `The ${SNOW.time} time bits only cover about ${n1(snowYears)} years. Starting the count at the system's launch date instead of 1970 spends none of that range on years before the system existed.` },
    ],
  },
  {
    id: "crawler",
    anim: "sd-crawler",
    title: "Design a web crawler",
    summary: "Start from seed URLs, download pages, extract links, and repeat, for billions of pages. Search engines, archives, monitoring and data mining all use one. The hard parts are being polite to websites, avoiding duplicates and traps, and staying fresh.",
    points: [
      `**Scale:** ${n0(CRAWL.pagesPerMonth)} pages a month is about ${n0(crawlQps)} pages per second on average, double that at peak. At ${CRAWL.pageKB} KB a page that is ${n0(crawlTBMonth)} TB a month, about ${n0(crawlPB)} PB over ${CRAWL.years} years.`,
      "**Pipeline:** seed URLs, URL frontier, HTML downloader (with a DNS cache), content parser, \"content seen?\", link extractor, URL filter, \"URL seen?\", then back to the frontier.",
      "**BFS, not DFS:** the web is too deep for depth-first. But plain BFS hammers one host (most links on a page point to the same site) and treats every URL as equally important.",
      "**Frontier:** front queues by priority (page rank, traffic, how often it changes) feed back queues with one host each. A worker takes from one back queue and waits between requests to that host.",
      "**Freshness:** recrawl pages based on how often they changed before, and important pages more often.",
      "**Downloader:** obey robots.txt (cached per host), use short timeouts, cache DNS, and run crawlers near the hosts they fetch.",
      "**Robustness:** spread hosts over downloaders with consistent hashing, save crawl state so a crash resumes, and survive malformed pages.",
      "**Problem content:** duplicates (detect by content hash), spider traps such as endless calendars (cap URL length and depth, keep a blocklist) and spam.",
      "**Extensions:** server-side rendering for pages built by JavaScript, modules for other content types, and filters for unwanted pages.",
    ],
    diagram: `flowchart TB
  SEED["Seed URLs"] --> FR["URL frontier: priority, then one queue per host"]:::hot
  FR --> DL["HTML downloader + DNS cache + robots.txt"]
  DL --> PA["Content parser"]
  PA --> CS{"Content seen before?"}
  CS -- no --> ST[("Content storage")]
  CS -- no --> EX["Link extractor"]
  EX --> UF["URL filter"]
  UF --> US{"URL seen before?"}
  US -- no --> FR`,
    caption: "Two dedupe checks: one on page content, one on URLs.",
    cards: [
      { id: "politeness", q: "How does a crawler avoid overloading one website?", a: "Map each host to exactly one back queue, give each queue one worker, and wait between downloads from it. Also obey robots.txt, including any crawl delay it asks for. Politeness is built into the frontier, not bolted on." },
      { id: "dedupe", q: "How do you avoid downloading or storing the same thing twice?", a: "- **URL seen:** a Bloom filter or a hash set of normalized URLs. A Bloom filter uses a few bits per URL and never misses a seen URL, at the cost of rarely skipping a new one.\n- **Content seen:** hash each page (or a fingerprint that tolerates small changes) and skip pages whose hash is known, because many URLs serve the same content." },
      { id: "traps", q: "What is a spider trap and how do you escape one?", a: "A site that generates endless URLs, such as a calendar with a link to the next month forever, or `a/b/a/b/...` paths. Cap URL length and depth, cap pages per host, and keep a manual blocklist for hosts found to trap crawlers." },
      { id: "freshness", q: "How do you keep the index fresh without recrawling everything?", a: "Recrawl each page on its own schedule: pages that changed on the last few visits come back soon, stable pages rarely, and important pages more often. Use conditional requests (`If-Modified-Since`, ETags) so unchanged pages cost little." },
      { id: "js-pages", q: "Some pages build their links with JavaScript. What changes?", a: "The raw HTML has no links. Run those pages through a headless browser to render them first (server-side rendering), which is far more expensive, so do it only for hosts that need it." },
    ],
  },
  {
    id: "mq",
    anim: "sd-mq",
    title: "Design a distributed message queue",
    summary: "A Kafka-style queue stores messages as append-only logs on disk, split into partitions spread over brokers. Producers append, consumers read at their own pace and remember an offset. Order is kept per partition; throughput comes from many partitions in parallel.",
    points: [
      "**Models:** point-to-point (each message to one consumer) and publish-subscribe (each message to every subscriber). Topics with consumer groups give both.",
      "**Topics and partitions:** a topic is split into partitions, each an ordered log. A message's key picks its partition, so messages with one key stay in order.",
      "**Brokers:** servers that hold partitions. Each partition has a leader replica on one broker and followers on others.",
      "**Consumer groups:** each partition is read by exactly one consumer in a group, so a group's parallelism is at most the number of partitions.",
      "**Storage:** each partition is a write-ahead log cut into segment files. Writes and reads are sequential, which disks and the OS page cache handle very fast. Old segments are deleted after the retention period.",
      "**Message:** key, value, topic, partition, offset, timestamp, size and a CRC checksum.",
      "**Batching:** producers and brokers send and write in batches, trading a few milliseconds of latency for much higher throughput.",
      "**Pull, not push:** consumers pull at their own rate and in batches, so a slow consumer is not overwhelmed.",
      "**Coordination:** a coordinator broker tracks group members by heartbeat and reassigns partitions when one joins or leaves (rebalancing). Topic metadata and leaders live in ZooKeeper or Kafka's own Raft quorum.",
      `**Size check:** ${n0(MQ.msgsPerSec)} messages a second of ${MQ.msgKB} KB kept ${MQ.days} days with ${MQ.replicas} replicas is about ${n0(mqTB)} TB of disk.`,
    ],
    diagram: `flowchart TB
  P["Producers + routing in the client library"] --> L["Leader replica of partition"]
  L --> F["Follower replicas: the in-sync set"]
  L --> CG["Consumer group: one consumer per partition"]
  CG --> O[("Committed offsets")]
  CO["Coordinator and metadata: ZooKeeper or Raft"] -.-> L
  CO -.-> CG`,
    caption: "Producers write only to leaders; followers copy the leader; consumers commit how far they have read.",
    table: { head: ["Producer ack setting", "Waits for", "Latency", "Can lose acked data"], rows: [
      ["acks = 0", "nothing", "lowest", "yes"],
      ["acks = 1", "the leader", "low", "if the leader dies before followers copy it"],
      ["acks = all", "every in-sync replica", "highest", "no, while one in-sync replica survives"],
    ] },
    cards: [
      { id: "disk-fast", q: "Why can a queue that writes everything to disk be so fast?", a: "It only appends and reads sequentially. Sequential disk I/O is far faster than random I/O, recent data is usually still in the OS page cache, and batching amortizes each write over many messages. Data can also go from the page cache to the network without being copied through the application." },
      { id: "ordering", q: "What ordering does it guarantee?", a: "Order within one partition only. Give related messages the same key (an order ID, a user ID) so they land in one partition. Global order across a topic would need one partition, which removes all parallelism." },
      { id: "isr", q: "What are in-sync replicas?", a: "The followers that are caught up with the leader within a time limit. With `acks = all`, a write is acknowledged once every in-sync replica has it, and only an in-sync replica may become the new leader, so acknowledged messages survive a leader crash. Requiring a minimum number of in-sync replicas stops writes from succeeding with only one copy." },
      { id: "semantics", q: "How do you get at-most-once, at-least-once and exactly-once?", a: "- **At most once:** commit the offset before processing. A crash skips messages.\n- **At least once:** process, then commit. A crash repeats messages, so consumers must be idempotent.\n- **Exactly once:** idempotent producers (the broker drops repeated sends) plus transactions that write results and offsets together. It holds inside the queue's world; side effects outside it still need idempotency keys." },
      { id: "more-consumers", q: "A topic has 4 partitions and you start 6 consumers in one group. What happens?", a: "Four consumers each get one partition and two sit idle. To read faster you must add partitions. Adding partitions changes which partition a key maps to, so plan the count up front for keyed data." },
      { id: "delayed", q: "How would you support delayed messages?", a: "Write them first to internal delay topics (one per delay level, such as 1 s, 10 s, 1 min) and move each to the real topic when its time comes, or hold them in a timing wheel in memory. Consumers then see them only when due." },
    ],
  },
  {
    id: "metrics",
    anim: "sd-metrics",
    title: "Design metrics monitoring and alerting",
    summary: "Collect numbers such as CPU, request latency and error counts from every machine, store them as time series, draw dashboards and wake someone up when a rule breaks. The load is almost all writes; reads come in bursts from dashboards and alert checks.",
    points: [
      "**Data model:** a metric name, labels (host, region, status), a timestamp and a value. Each unique name plus label set is one time series.",
      `**Scale:** ${n0(MET.pools)} server pools of ${MET.perPool} machines with ${MET.metrics} metrics each is ${n0(series)} series. Collected every ${MET.everySec} s that is ${n0(pointsPerSec)} points per second.`,
      "**Collection:** pull (the server scrapes each target's metrics endpoint, found through service discovery) or push (an agent on each host sends to collectors).",
      "**Buffer:** put Kafka between collectors and storage, partitioned by metric name, so a slow database does not lose data.",
      "**Aggregate:** on the agent (sum counters), in a stream processor before storage, or at query time. Earlier is cheaper but loses detail.",
      "**Storage:** a time-series database (Prometheus, InfluxDB). Delta-of-delta timestamps and compressed floats store a point in a couple of bytes.",
      "**Retention:** keep raw data for days, one-minute rollups for weeks, hourly rollups for a year, then move to cold storage.",
      "**Alerting:** rules in config files are checked on a schedule. An alert manager deduplicates, groups and routes alerts to pager, email or chat, and tracks each alert's state (inactive, pending, firing).",
      "**Dashboards:** Grafana or similar, reading through a query service with a cache.",
    ],
    diagram: `flowchart TB
  S["Metric sources: hosts, services, databases"] --> CO["Collectors: pull or push"]
  CO --> K["Kafka"]
  K --> AG["Stream aggregation"]
  AG --> DB[("Time-series database")]:::hot
  DB --> Q["Query service + cache"]
  Q --> V["Dashboards"]
  Q --> AL["Alert rules"]
  AL --> AM["Alert manager"]
  AM --> N["Pager, email, chat"]`,
    caption: "Kafka absorbs spikes; the time-series database is built for this one shape of data.",
    table: { head: ["", "Pull", "Push"], rows: [
      ["Who starts", "the server scrapes targets", "agents send to collectors"],
      ["Detecting a dead host", "easy: the scrape fails", "harder: silence is ambiguous"],
      ["Short-lived jobs", "may finish before a scrape", "push before exiting"],
      ["Firewalls and NAT", "server must reach every target", "only outbound traffic needed"],
    ] },
    cards: [
      { id: "why-tsdb", q: "Why not store metrics in MySQL?", a: "The load is millions of small appends a second and queries over time ranges with aggregation. A general database would need heavy tuning for both. A time-series database compresses points to a few bytes, indexes series by labels, and downsamples and expires data by itself." },
      { id: "delta", q: "How does delta-of-delta encoding shrink timestamps?", a: `Store the first timestamp, then the differences. For ${TS.join(", ")}, the differences are ${deltas.join(", ")} and the differences of those are ${dod.join(", ")}. Regular scrapes make most of these zero or tiny, so they fit in a few bits instead of 64.` },
      { id: "cardinality", q: "Why must you never put a user ID in a metric label?", a: "Every distinct label set is a new time series. A label with millions of values creates millions of series, which blows up memory and the index. Put high-cardinality data in logs or traces, and keep labels to small sets such as region, status code and endpoint." },
      { id: "flapping", q: "How do you stop an alert firing and clearing every minute?", a: "Require the condition to hold for a while before firing (a pending state, such as \"for 5 minutes\"), alert on a rate over a window instead of a single point, and let the alert manager group and deduplicate repeats." },
      { id: "who-watches", q: "What monitors the monitoring system?", a: "Something outside it: a separate, simple check that the pipeline is alive (a heartbeat alert that should always fire, a \"dead man's switch\"), running on different infrastructure, so an outage of the main system cannot silence its own alarms." },
    ],
  },
];
