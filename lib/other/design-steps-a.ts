// Step-by-step versions of the System Design basics, building blocks, tricky cases, production and ML framing chapters.
// Every number is computed here from the stated inputs. Merged into the chapters by design.ts.
import { BLOCK_FRAME, fmt, framed, perSec } from "./design-calc.ts";
import type { Step } from "./types.ts";

/* ---------- worked numbers ---------- */
// approach: a photo app
const apUsers = 10_000_000, apReq = 20, apAvg = perSec(apUsers * apReq), apPeak = apAvg * 3;
// estimation: a social app
const esUsers = 50_000_000, esPosts = 4, esWrites = perSec(esUsers * esPosts), esPeakW = esWrites * 3;
const esGbDay = (esUsers * esPosts * 1_000) / 1e9, esTbYear = (esGbDay * 365) / 1_000;
const esReads = esWrites * 10, esPeakR = esReads * 3, esMBs = (esPeakR * 1_000) / 1e6, esServers = Math.ceil(esPeakR / 10_000);
// scaling
const scPeak = 30_000, scPer = 5_000, scNeed = Math.ceil(scPeak / scPer);
// caching
const caHit = 0.9, caFast = 1, caSlow = 10, caAvg = caHit * caFast + (1 - caHit) * caSlow;
// data: share of keys that move when a fifth server joins four
const daModMoved = 1 - 1 / 5, daRingMoved = 1 / 5;
// ids: Snowflake
const idYears = 2 ** 41 / 1000 / 86_400 / 365.25, idPerMs = 2 ** 12, idMachines = 2 ** 10;
// queues: Little's law and a backlog
const quRate = 500, quSecs = 0.2, quWorkers = quRate * quSecs, quIn = 600, quBacklogMin = (quIn - quRate) * 60;
// rate limiting: token bucket
const rlCap = 10, rlRefill = 2, rlMinute = rlCap + rlRefill * 60;
// reliability
const reSerial = 0.999 ** 3, reParallel = 1 - 0.01 ** 2, reStorm = 3 ** 3;
const pct = (x: number, d = 2) => `${+(x * 100).toFixed(d)}%`;

export const STEPS_A: Record<string, Step[]> = {
  approach: [
    { title: "Clarify the requirements (5 min)", text: "Ask who uses the system and list the **3 to 5 features** in scope. Then pin the non-functional targets: how many users, reads against writes, latency, availability and consistency. Say what is out of scope so you do not try to design everything." },
    { title: "Estimate the scale (5 min)", text: `Turn users into load. ${fmt(apUsers)} daily users making ${apReq} requests each is ${fmt(apUsers * apReq)} a day, about **${fmt(apAvg)} per second**, and about ${fmt(apPeak)} at a 3x peak. Estimate only what changes a decision: one server, or a fleet? one database, or shards?` },
    { title: "Define the API (3 min)", text: "Write the main calls with their inputs and outputs, for example `POST /photos` and `GET /feed?cursor=`. Mention authentication, cursor pagination, and an idempotency key on any call that must not run twice." },
    { title: "Sketch the data model (3 min)", text: "Name the main entities, their keys and how they are read. The access pattern picks the store: joins and transactions point to SQL, huge key lookups to a key-value or wide-column store. Name the partition key now; it matters later." },
    { title: "Draw the high-level design (10 min)", text: "Client, load balancer, stateless services, database, cache, queue, CDN: only the boxes you need. Trace **one read and one write** from end to end. Start with the simplest design that meets the requirements." },
    { title: "Deep dive on the hard part (15 min)", text: "Pick the one or two parts that break at your scale: a hot key, a fan-out, a consistency rule. Offer two options, compare them on your numbers, choose one and say why. Let the interviewer steer which part." },
    { title: "Wrap up (4 min)", text: "Name the bottlenecks and single points of failure left, how you would monitor the system, and what you would build next. End by restating the main trade-off you made." },
  ],
  estimation: [
    { title: "Write down the inputs", text: "Daily active users, actions per user per day, bytes per item, the read to write ratio and how long data is kept. Say each assumption out loud so the interviewer can correct it." },
    { title: "Requests per second", text: `Divide a daily total by 86,400, or by 10^5 to round. ${fmt(esUsers)} users posting ${esPosts} times a day is ${fmt(esUsers * esPosts)} posts, about **${fmt(esWrites)} writes per second**.` },
    { title: "Peak load", text: `Traffic is not flat. Multiply the average by 2 to 10; with 3x the system must take about **${fmt(esPeakW)} writes per second**. Design for the peak, not the average.` },
    { title: "Storage", text: `At 1 KB a post that is ${fmt(esGbDay)} GB a day and about **${fmt(esTbYear)} TB a year**, or ${fmt(esTbYear * 3)} TB with 3 replicas. Media such as photos usually dwarfs text, so count it separately.` },
    { title: "Reads and bandwidth", text: `With 10 reads per write, reads average ${fmt(esReads)} per second and peak at ${fmt(esPeakR)}. At 1 KB each the peak is about **${fmt(esMBs)} MB/s** leaving the servers.` },
    { title: "Machines", text: `Divide by what one machine handles (the table below). At 10,000 simple requests per second per web server, the read peak needs **${esServers} servers**, plus spares. One Redis node at about 100,000 operations per second could cache the hot posts.` },
    { title: "Decide something", text: "Round hard and state the decision each number drives: this fits one database, this needs a cache, this storage needs sharding within a year. An estimate that changes nothing was not worth the time." },
  ],
  growth: [
    { title: "Start on one server", text: "Web app, database and files on one machine; DNS gives clients its address. Perfect for a prototype, but one crash or one traffic spike takes everything down." },
    { title: "Split out the database, add a load balancer", text: "Put the database on its own machine so web and data scale separately. Put a load balancer in front of two or more web servers: a dead server just stops getting traffic." },
    { title: "Replicate the database", text: "One primary takes the writes; replicas copy it and serve reads. If a replica dies, replace it; if the primary dies, promote a replica. The cost: replicas lag a little behind." },
    { title: "Add a cache and a CDN", text: "Keep hot query results in memory and serve images, scripts and video from CDN edges near users. Latency and database load drop; the cost is stale data and invalidation." },
    { title: "Make the web tier stateless", text: "Move sessions to a shared store such as Redis. Now any server can handle any user, so autoscaling and rolling deploys just work." },
    { title: "Add queues and more data centres", text: "Slow work (resizing photos, sending email) goes on a queue for workers, so it scales apart from the web tier. GeoDNS sends users to the nearest data centre, and the others take over if one fails." },
    { title: "Shard the database", text: "When writes or data outgrow one primary, split rows across databases by a shard key such as user ID. Expect new problems: resharding, a hot celebrity key, and joins that cross shards." },
  ],
  scaling: framed(BLOCK_FRAME, [
    "One machine has a ceiling on CPU, memory and network, and when it dies the service dies with it.",
    "**Vertical scaling** buys a bigger machine: easy, but limited and still one failure. **Horizontal scaling** adds machines behind a load balancer, and works only if any server can answer any request: the service must be **stateless**.",
    "Clients reach the load balancer's public address. It health-checks the servers on private addresses and forwards each request to a healthy one. A layer 4 balancer routes by IP and port; a layer 7 balancer reads HTTP, so it can route by path or header and end TLS.",
    "Round robin for identical servers and similar requests; least connections for long or uneven requests; weighted for mixed machine sizes and canaries; hashing a key when the same client should reach the same server.",
    `Size the pool from the peak: ${fmt(scPeak)} requests per second at ${fmt(scPer)} per server needs ${scNeed} servers. Run **${scNeed + 1}** (N + 1) so losing one at peak still fits.`,
    "Sticky sessions lose users when their server dies. A single load balancer is itself a single point of failure, so run a pair with a floating IP. Slow health checks keep sending traffic to a dead server for seconds.",
    "\"The service is stateless, sessions live in Redis, so I scale by adding servers behind a pair of load balancers with health checks. I size for peak plus one spare.\"",
  ]),
  caching: framed(BLOCK_FRAME, [
    "Reading from the database takes milliseconds and costs it capacity, and most systems read the same few items again and again.",
    "Keep hot data in memory close to the code. The **hit rate**, the share of reads the cache answers, decides how much it helps.",
    "Cache-aside, the common default:\n\n- read: look in the cache; on a miss read the database and store the result with a TTL\n- write: update the database, then **delete** the cache key so the next read reloads it",
    "Write-through updates cache and database together (fresh, slower writes). Write-back writes the cache and flushes later (fast, can lose data). Read-through lets the cache load from the database itself. Caches live in the browser, the CDN, the app process, or a shared tier such as Redis.",
    `With a ${caFast} ms cache, a ${caSlow} ms database and a ${pct(caHit, 0)} hit rate, an average read takes ${caHit} x ${caFast} + ${(1 - caHit).toFixed(1)} x ${caSlow} = **${caAvg.toFixed(1)} ms** instead of ${caSlow}, and the database sees only ${pct(1 - caHit, 0)} of the reads.`,
    "**Stale data** after a write; a **stampede** when a hot key expires and thousands of requests hit the database at once (fix: one loader with a lock, or refresh early); a **hot key** that overloads one cache node; lookups for keys that do not exist going straight to the database (cache the miss, or use a Bloom filter); a cold cache after a restart.",
    "\"Cache-aside in Redis with a TTL; writes go to the database and delete the key. For hot keys I add a short in-process cache, and for expiry stampedes a single-flight lock.\"",
  ]),
  data: framed(BLOCK_FRAME, [
    "One database runs out of read capacity, write capacity or disk, and if it dies the data may be gone.",
    "**Replication** copies the same data to several machines: more reads and survival. **Sharding** splits the data across machines: more writes and storage. Large systems shard, then replicate each shard.",
    "With single-leader replication the leader takes writes and ships its log to followers, synchronously (safe, slower) or asynchronously (fast, may lose the last writes). With sharding a router maps each key to its shard, for example `hash(user_id)`.",
    "Range sharding keeps nearby keys together (good for scans, risks hot ranges). Hash sharding spreads load evenly. A directory maps keys to shards explicitly. **Consistent hashing** places servers and keys on a ring so adding a server moves only nearby keys; virtual nodes even out the load.",
    `With hash mod N, going from 4 to 5 servers moves about **${pct(daModMoved, 0)}** of all keys. On a consistent hashing ring the new server takes only about **${pct(daRingMoved, 0)}**, its own share.`,
    "Replication lag gives stale reads; a failover can end with two leaders (split brain) unless fenced; one celebrity key overloads its shard; joins and transactions across shards get hard; resharding a live system is slow and risky.",
    "\"I shard by user ID with consistent hashing so growth moves few keys, and each shard has a leader and two followers. Reads that must see the user's own writes go to the leader.\"",
  ]),
  consistency: framed(BLOCK_FRAME, [
    "Replicas talk over a network, and networks split. When they do, a replica that cannot reach the others must decide what to answer.",
    "**CAP**: during a partition you choose consistency (refuse some requests) or availability (answer, maybe stale). **PACELC** adds the normal case: with no partition you still trade latency against consistency.",
    "Quorums make the choice tunable. Each key lives on N replicas; a write waits for W acknowledgements and a read for R replies. If **W + R > N**, every read overlaps the latest write.",
    "Strong (linearizable) for balances and locks; read-your-writes for profile edits; monotonic reads so time never goes backwards; eventual for like counts. Pick per feature, not per system.",
    `With N = 3, W = 2 and R = 2, ${2 + 2} > 3, so reads see the latest write. With W = 1 and R = 1, ${1 + 1} is not more than 3, so a read can miss it. Strong consistency across continents costs at least one round trip, about 150 ms, on every write.`,
    "Stale reads after failover; concurrent writes to different replicas, where last-write-wins silently drops one (vector clocks or CRDTs keep both); clocks that disagree between machines.",
    "\"Payments need strong consistency, so they go through one leader with a quorum. The feed and like counts can be eventual, which keeps them fast and available during a partition.\"",
  ]),
  ids: framed(BLOCK_FRAME, [
    "One database's auto-increment is a bottleneck and a single point of failure, and two databases incrementing on their own hand out the same numbers.",
    "Let every machine make IDs locally, with a layout that cannot collide: **time + machine + sequence**. Time first means IDs sort by creation time.",
    "Snowflake packs 64 bits: 1 sign bit, 41 bits of milliseconds since a custom epoch, 10 bits of machine (5 data centre + 5 worker), 12 bits of sequence. Within one millisecond a machine counts up the sequence; the next millisecond it starts again at 0.",
    "Multi-master increment (each of k databases steps by k); UUID v4 (random, 128 bits, no order); a ticket server (one database hands out numbers); Snowflake; UUID v7 (time-ordered 128 bits).",
    `41 bits of milliseconds last about **${idYears.toFixed(1)} years**. 12 bits give ${fmt(idPerMs)} IDs per millisecond per machine, ${fmt(idPerMs * 1000)} per second. 10 bits allow ${fmt(idMachines)} machines.`,
    "A clock that jumps backwards could repeat IDs, so the generator waits or refuses. Two machines given the same machine ID collide. If the sequence runs out within a millisecond, wait for the next one.",
    "\"Snowflake-style 64-bit IDs: time-ordered so they index well, made locally with no coordination, and the generator refuses to run if its clock goes backwards.\"",
  ]),
  queues: framed(BLOCK_FRAME, [
    "Slow work inside a request (sending email, resizing images) makes users wait, a traffic spike overloads the slow service, and one service being down breaks its callers.",
    "Put a **queue** between them. The producer adds a message and returns at once; workers take messages at their own pace. The queue absorbs spikes and lets each side scale and fail separately.",
    "A worker receives a message, which becomes invisible for a timeout. It processes it and **acknowledges**; the queue deletes it. If the worker crashes, the timeout passes and the message is delivered again. Messages that keep failing go to a dead letter queue.",
    "A classic queue (SQS, RabbitMQ) deletes messages once handled. A log (Kafka) keeps them for days, keeps order per partition and lets many consumer groups and replays read the same data. Delivery is at-most-once or at-least-once; \"exactly once\" in practice means at-least-once plus idempotent handling.",
    `Little's law: workers busy = arrival rate x time per job. ${quRate} jobs a second at ${quSecs} s each keeps **${quWorkers} workers** busy. If ${quIn} arrive a second, the backlog grows by ${fmt(quBacklogMin)} jobs every minute until you add workers.`,
    "Duplicates (make consumers idempotent); a poison message that fails forever (dead letter queue); lost ordering when several workers share a queue (partition by key); a backlog nobody notices (alert on queue age).",
    "\"The API writes the job to a queue and returns 202. Workers process at least once, so each job carries an ID and the handler skips IDs it has already done. I alert on the age of the oldest message.\"",
  ]),
  ratelimit: framed(BLOCK_FRAME, [
    "One client, buggy or abusive, can flood an API and starve everyone else; the API also needs predictable rules so clients know what to send and what comes back.",
    "Count each client's requests over time and reject the excess with **429 Too Many Requests** and a `Retry-After` header. Good APIs also use nouns for resources, standard status codes, cursor pagination and idempotency keys.",
    "A token bucket per client: the bucket holds up to a capacity of tokens and refills at a steady rate. Each request spends one token; with none left it is rejected. Shared counters live in Redis and are updated by one atomic script, so every API server sees the same count.",
    "Token bucket (bursts allowed, steady average), leaky bucket (smooth output), fixed window (simple, double burst at the boundary), sliding window (accurate, a bit more memory). Key by user, API key or IP, at the gateway or per service.",
    `A bucket of ${rlCap} tokens refilling ${rlRefill} per second allows a burst of ${rlCap} and then ${rlRefill} a second: at most **${rlMinute} requests in the first minute**. A fixed window of 100 a minute can let through 200 in two seconds across the boundary.`,
    "Two servers reading and writing the counter without atomicity let extra requests through; when Redis is down you must choose to fail open (allow) or fail closed (reject); clocks differ between servers.",
    "\"A token bucket per API key in Redis, updated by a Lua script, checked at the gateway. Over the limit returns 429 with Retry-After. If Redis is down I fail open for reads and closed for expensive writes.\"",
  ]),
  reliability: framed(BLOCK_FRAME, [
    "Disks, machines, networks and whole data centres fail, and a slow dependency is often worse than a dead one because callers hang waiting.",
    "Remove single points of failure, **fail fast** with timeouts, retry carefully, and degrade gracefully instead of falling over.",
    "Every call has a timeout. Retries use exponential backoff with jitter, and only for safe or idempotent calls. A **circuit breaker** counts failures: past a threshold it opens and fails calls instantly, after a pause it lets one test call through (half-open), and closes again when that works.",
    "Active-active (all copies serve) or active-passive (a standby takes over); spread copies over availability zones; bulkheads give each dependency its own connection pool; fallbacks serve cached or simpler results.",
    `Services in series multiply: three at 99.9% give ${pct(reSerial)}. Two copies in parallel at 99% each give ${pct(reParallel)}. 99.9% allows about 8.8 hours of downtime a year.`,
    `Retry storms: three layers each retrying 3 times turn one failing call into up to **${reStorm}** calls on the struggling service. Failures cascade when one slow service ties up its callers' threads; correlated failures (one bad deploy everywhere) beat any redundancy.`,
    "\"Every call has a timeout and a circuit breaker, retries back off with jitter and are capped, and if recommendations are down the page still loads with a popular list.\"",
  ]),
  tricky: [
    { title: "Hot key or celebrity", text: "One key gets most of the traffic, so one shard or cache node melts. Spread it: copies under `key#0` to `key#9` on different nodes, each read picking one at random, plus a short in-process cache on every app server." },
    { title: "Counting at huge rates", text: "A like counter updated 100,000 times a second cannot be one row. Split it into many sub-counters and sum them on read, or send likes into a stream and add them up in batches every second." },
    { title: "Unique IDs without a central counter", text: "Make IDs locally from time + machine + sequence (Snowflake) or use UUID v7. Both sort by time, so they make good database keys." },
    { title: "Top K trending", text: "Exact counts for every item do not fit in memory. A Count-Min Sketch estimates counts in fixed memory, and a small heap keeps the current top K, per time window." },
    { title: "Distinct users", text: "Storing every user ID to count unique visitors is huge. HyperLogLog estimates the count in about 12 KB with about 1% error, and sketches from many servers merge exactly." },
    { title: "Nearby search", text: "Do not scan every point. Index locations by geohash, quadtree or H3 cell, then search the user's cell and its neighbours." },
    { title: "Exactly-once effects", text: "Retries and redeliveries are normal, so make the effect idempotent: the client sends an idempotency key, and the server stores it with the result and returns the stored result for a repeat." },
  ],
  production: [
    { title: "Make the change small", text: "Small changes are easy to review, test and undo. Large migrations are split into steps that each can ship and roll back on their own." },
    { title: "Test it before it ships", text: "CI runs unit and integration tests on every change. Config and data files are validated like code: many big outages were a bad config push, not a code bug." },
    { title: "Ship it dark", text: "Deploy the code with a **feature flag** turned off. Deploying and releasing become separate steps, and turning a feature off takes seconds, not a redeploy." },
    { title: "Release to a canary first", text: "Turn it on for 1% of traffic or one region, compare its error rate and latency with the rest, then widen in stages. The same goes for config." },
    { title: "Watch the right signals", text: "Metrics say something is wrong, traces say where, logs say why. Alert on symptoms users feel (errors, latency) measured against an SLO, and keep dashboards outside the system they watch." },
    { title: "Roll back fast", text: "The on-call engineer needs a runbook with a safe first step, usually \"roll back\". Database changes follow expand, migrate, contract, so the old code still works during a rollback." },
    { title: "Learn without blame", text: "After an incident, write a blameless postmortem: how did the system let this happen, and what change makes it impossible next time? An error budget decides when reliability work comes before features." },
  ],
  mlframe: [
    { title: "Clarify the goal", text: "Ask what the business wants to improve (watch time, fraud losses, ad revenue) and what the product will do with a prediction. Agree scale and latency limits." },
    { title: "Frame it as an ML task", text: "Turn the goal into a prediction: \"probability this user watches this video for 30 seconds\". Name the task type: classification, regression, ranking or retrieval. Most feeds, search and ads are ranking." },
    { title: "Choose the metrics", text: "Offline metrics on held-out data (AUC, log loss, precision and recall, NDCG) pick candidates. Online metrics in an A/B test (click rate, watch time, revenue, complaints) decide what ships." },
    { title: "Find the data and labels", text: "Explicit labels (ratings, human review) are clean but scarce; implicit ones (clicks, watch time) are plentiful but biased by what was shown. Say how you split train and test by time to avoid leaking the future." },
    { title: "Design the features", text: "User, item, context (time, device) and cross features (has this user watched this creator before?). Say which are computed daily and which must be seconds fresh." },
    { title: "Start with a baseline", text: "Popularity or logistic regression first, so there is something to beat; then the real model. Justify every bit of extra complexity with the metric it buys." },
    { title: "Serve it and keep it healthy", text: "Batch predictions or online scoring, the latency budget, and the hardware it implies. Then monitor inputs and outputs for drift and retrain on a schedule." },
  ],
};
