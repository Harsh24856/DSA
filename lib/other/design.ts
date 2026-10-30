import type { Subject } from "./types";

export const DESIGN: Subject = {
  id: "design",
  name: "System Design",
  short: "SD",
  blurb: "How to run a design interview, estimate load, and scale a service: load balancers, caches, replication and sharding, consistency, queues, rate limits and reliability. Then case studies of big products (a URL shortener, a news feed and chat, YouTube, Uber, ticket flash sales, search autocomplete and crawling, Google Docs, Dropbox, payments) and the tricky cases interviewers love. Interviewers grade the trade-offs you name, not the boxes you draw.",
  chapters: [
    {
      id: "approach",
      title: "How to run a design interview",
      summary: "A 45-minute design round rewards structure. Pin down what to build and how big it is before drawing anything, sketch the simplest design that works, then spend most of the time on the one or two parts that break at scale. Say the trade-offs out loud.",
      points: [
        "**Requirements (5 min):** the 3 to 5 features in scope, and the non-functional targets: users, reads vs writes, latency, availability, consistency.",
        "**Estimates (5 min):** requests per second, storage per year, bandwidth. Only to the precision that changes a decision.",
        "**API and data model (5 min):** the main endpoints and the tables or documents behind them.",
        "**High-level design (10 min):** client, load balancer, services, storage, cache, queue. One request traced end to end.",
        "**Deep dive (15 min):** the hard part: the hot key, the fan-out, the consistency rule. Offer two options and pick one.",
        "**Wrap up (5 min):** bottlenecks, failure modes, monitoring, what you would build next.",
      ],
      diagram: `flowchart TB
  R["requirements: features, scale, latency, consistency"]:::hot --> E["estimates: QPS, storage, bandwidth"]
  E --> A["API + data model"]
  A --> H["high-level design: trace one request"]
  H --> D["deep dive: the part that breaks first"]:::warn
  D --> W["wrap up: bottlenecks, failures, monitoring"]:::ok
  D -.->|"new constraint found"| R`,
      caption: "Keep moving down the steps; loop back only when the deep dive changes a requirement.",
      cards: [
        { id: "clarify", q: "What do you ask before designing anything?", a: "Who uses it and how many (daily active users, peak vs average), what the core actions are and their read to write ratio, how fresh data must be (can a like count be a few seconds stale?), latency targets for the main path, and what must never be lost. Then confirm what is out of scope so you do not design analytics nobody asked for." },
        { id: "functional", q: "Functional vs non-functional requirements?", a: "Functional requirements are features: \"users can post a photo\", \"followers see it in their feed\". Non-functional requirements are qualities: availability (99.9% or 99.99%), latency (p99 under 200 ms), consistency, durability, cost. The non-functional ones drive the architecture; two systems with the same features can look nothing alike." },
        { id: "start-simple", q: "Why start with a single-server design?", a: "It shows you can build something that works, and it gives you a baseline to scale from. Then you add each component (load balancer, cache, replica, queue) only when an estimate or a requirement demands it, and you say which number forced it. Jumping straight to fifty microservices reads as pattern matching.", trap: "Naming technologies (\"use Kafka, Cassandra, Redis\") without saying which requirement each one serves." },
      ],
    },
    {
      id: "estimation",
      title: "Back-of-the-envelope estimation",
      summary: "Estimates decide whether one machine is enough or you need a fleet. Round aggressively: a day is about 10^5 seconds, so 1 million requests a day is about 12 per second. Peak is usually 2 to 10 times average.",
      table: { head: ["Quantity", "Rough value"], rows: [
        ["Seconds in a day", "86,400, call it 10^5"],
        ["L1 cache / main memory read", "1 ns / 100 ns"],
        ["Read 1 MB from memory / SSD / network in a data centre", "about 10 µs / 1 ms / 10 ms"],
        ["Round trip within a data centre", "about 0.5 ms"],
        ["Round trip across continents", "about 150 ms"],
        ["One web server (simple requests)", "1,000 to 10,000 QPS"],
        ["One SQL database (indexed reads)", "a few thousand to 10,000s QPS"],
        ["One Redis node", "about 100,000 QPS"],
      ] },
      code: {
        file: "Estimate a photo-sharing app",
        python: `DAU = 10_000_000             # daily active users
posts_per_user = 0.2         # one post every five days
reads_per_user = 50          # feed views per day
photo_kb = 300
day = 86_400

write_qps = DAU * posts_per_user / day
read_qps = DAU * reads_per_user / day
storage_tb_year = DAU * posts_per_user * photo_kb * 365 / 1e9   # KB to TB

print(f"writes {write_qps:,.0f}/s, reads {read_qps:,.0f}/s (peak x5: {read_qps * 5:,.0f}/s)")
print(f"photos {storage_tb_year:,.0f} TB per year")
assert round(write_qps) == 23 and round(read_qps) == 5787
assert round(storage_tb_year) == 219`,
      },
      cards: [
        { id: "qps", q: "100 million requests a day: what is the QPS?", a: "100 million / 10^5 seconds = about 1,000 requests per second on average. Plan for a peak of 2 to 5 times that, so 2,000 to 5,000 QPS. That is a handful of web servers, but a single database may struggle with the writes if each request writes." },
        { id: "storage", q: "How do you estimate storage?", a: "Items per day x size per item x retention, then add replication (usually x3) and indexes. Example: 1 million new 1 KB rows a day for 5 years is 1 KB x 10^6 x 1,825 = about 1.8 TB, about 5.5 TB with three replicas. Media is usually a separate, much larger number stored in object storage." },
        { id: "why", q: "Why estimate at all if the numbers are rough?", a: "Because the decision only needs the order of magnitude. 50 QPS fits on one server; 50,000 QPS needs caching and many replicas; 5 million QPS needs sharding and careful hot-key handling. Being off by 2x rarely changes the design; being off by 100x always does." },
      ],
    },
    {
      id: "scaling",
      title: "Load balancers and stateless services",
      summary: "**Vertical scaling** buys a bigger machine: simple, but it has a ceiling and one machine is one failure. **Horizontal scaling** adds machines behind a **load balancer**. It only works if the service is **stateless**: any server can handle any request because session data lives in a shared store.",
      diagram: `flowchart TB
  U["clients"] --> DNS["DNS: name to load balancer IP"]
  DNS --> LB["load balancer: health checks, TLS"]:::hot
  LB --> S1["app server 1"]
  LB --> S2["app server 2 ... n"]
  S1 --> SS[("shared session store: Redis")]
  S2 --> SS
  S1 --> DB[("database")]
  S2 --> DB`,
      caption: "Stateless servers can be added, removed or replaced at any time because nothing lives only on them.",
      table: { head: ["Algorithm", "How it picks a server", "Good for"], rows: [
        ["Round robin", "next server in turn", "identical servers, similar requests"],
        ["Least connections", "server with fewest open connections", "long or uneven requests"],
        ["Weighted", "share proportional to a weight", "mixed machine sizes, canary releases"],
        ["Hash of client IP or key", "same client to same server", "local caches, sticky sessions"],
      ] },
      cards: [
        { id: "l4-l7", q: "Layer 4 vs layer 7 load balancing?", a: "A layer 4 balancer routes by IP and port without reading the request: very fast, protocol-agnostic. A layer 7 balancer reads HTTP: it can route by path or header (`/api` to one pool, `/img` to another), terminate TLS, retry, and add headers. Most web stacks put an L7 balancer (or API gateway) in front of the app servers." },
        { id: "sticky", q: "What is wrong with sticky sessions?", a: "If a user's session lives in one server's memory, the balancer must always send them there. Load becomes uneven, and when that server dies or is deployed the user is logged out. Moving sessions to Redis or a signed token makes servers interchangeable." },
        { id: "lb-spof", q: "Is the load balancer a single point of failure?", a: "It would be, so it is run as a redundant pair (active-passive with a floating IP, or active-active behind DNS or anycast). Managed cloud balancers are already spread across availability zones." },
      ],
    },
    {
      id: "caching",
      anim: "caching",
      title: "Caching",
      summary: "A cache keeps hot data in memory so most reads skip the slow store. It only helps when reads repeat; the hard parts are keeping it fresh and surviving a cold start or a hot key.",
      diagram: `flowchart TB
  A["app reads user 42"] --> C{"in cache?"}:::hot
  C -->|"hit: about 1 ms"| R["return cached value"]:::ok
  C -->|"miss"| D[("database: about 10 ms")]
  D --> W["write into cache with a TTL"]
  W --> R`,
      caption: "Cache-aside: the app checks the cache, falls back to the database on a miss, and fills the cache on the way back.",
      table: { head: ["Strategy", "Write path", "Trade-off"], rows: [
        ["Cache-aside", "write DB, delete the cache key", "simple; a miss after every write"],
        ["Write-through", "write cache and DB together", "cache always fresh; slower writes"],
        ["Write-back", "write cache, flush to DB later", "fast writes; data loss if the cache dies"],
        ["Read-through", "cache loads from DB itself on a miss", "app code simpler; cache needs DB access"],
      ] },
      code: {
        file: "An LRU cache: evict the least recently used key",
        python: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap, self.data = capacity, OrderedDict()

    def get(self, key):
        if key not in self.data:
            return None
        self.data.move_to_end(key)            # mark as most recently used
        return self.data[key]

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.cap:
            self.data.popitem(last=False)     # evict the least recently used

c = LRUCache(2)
c.put("a", 1); c.put("b", 2)
c.get("a")                                    # a is now the most recent
c.put("c", 3)                                 # evicts b
assert c.get("b") is None and c.get("a") == 1 and c.get("c") == 3
print(list(c.data))`,
      },
      cards: [
        { id: "invalidate", q: "How do you keep a cache consistent with the database?", a: "Write to the database first, then delete (not update) the cache key, so the next read reloads fresh data. Add a TTL as a safety net for anything you miss. Deleting avoids a race where two writers update the cache in the opposite order to the database." },
        { id: "stampede", q: "What is a cache stampede and how do you stop it?", a: "A popular key expires and thousands of requests miss at once, all hitting the database. Fixes: let only one request rebuild the value (a lock or request coalescing) while others wait or get the stale value, refresh hot keys before they expire, and add random jitter to TTLs so keys do not expire together." },
        { id: "cdn", q: "Where do CDNs fit?", a: "A CDN is a cache at the edge, close to users, for static files and cacheable responses. It cuts latency (tens of ms instead of an ocean crossing) and offloads your origin. Use versioned file names (`app.3f2a.js`) so you never need to purge." },
        { id: "eviction", q: "LRU vs LFU vs TTL?", a: "LRU evicts what was used longest ago: good default. LFU evicts what is used least often: better when a few keys stay hot for a long time, but slow to adapt. TTL expires by age regardless of use: it bounds staleness. Real caches combine a size-based policy with TTLs." },
      ],
    },
    {
      id: "data",
      title: "Replication, sharding and consistent hashing",
      summary: "**Replication** copies the same data to several machines: more read capacity and survival when one dies. **Sharding** splits the data across machines: more write capacity and storage. Most large systems do both: every shard has its own replicas.",
      diagram: `flowchart TB
  APP["app"] --> RT["router: shard = hash(user_id)"]:::hot
  RT --> P1["shard 1 primary"]
  RT --> P2["shard 2 primary"]
  P1 -->|"replicates"| R1[("shard 1 replicas")]
  P2 -->|"replicates"| R2[("shard 2 replicas")]`,
      caption: "Writes go to the primary of the shard that owns the key; reads can go to its replicas if slightly stale data is acceptable.",
      lab: "hashring",
      code: {
        file: "Consistent hashing: adding a server moves only a slice of the keys",
        python: `import bisect, hashlib

def h(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % 2**32

class Ring:
    def __init__(self, servers, vnodes=100):
        self.points = sorted((h(f"{s}#{v}"), s) for s in servers for v in range(vnodes))
        self.keys = [p for p, _ in self.points]

    def owner(self, key):
        i = bisect.bisect(self.keys, h(key)) % len(self.points)   # next point clockwise
        return self.points[i][1]

keys = [f"user{i}" for i in range(10_000)]
before = Ring(["A", "B", "C", "D"])
after = Ring(["A", "B", "C", "D", "E"])
moved = sum(before.owner(k) != after.owner(k) for k in keys)
modulo = sum(h(k) % 4 != h(k) % 5 for k in keys)
print(f"ring moved {moved / 100:.0f}% of keys, modulo hashing moved {modulo / 100:.0f}%")
assert moved < 3_000 < modulo        # about 20% vs about 80%`,
      },
      cards: [
        { id: "leader", q: "Single-leader vs multi-leader vs leaderless replication?", a: "- **Single leader:** all writes go to one primary, replicas copy its log. Simple and consistent; the primary limits write throughput and failover takes seconds.\n- **Multi-leader:** each region accepts writes and syncs with the others. Low write latency everywhere, but concurrent writes conflict and need resolution.\n- **Leaderless** (Dynamo, Cassandra): clients write to several nodes and read from several; quorums decide what is current." },
        { id: "lag", q: "What problems does replication lag cause?", a: "A user updates their profile, the next read hits a replica that has not caught up, and the change seems lost. Fixes: read your own writes from the primary (or for a few seconds after writing), pin a user to one replica so time never goes backwards, or wait for the replica to reach a log position before reading." },
        { id: "shard-key", q: "How do you choose a shard key?", a: "Pick a key that spreads load evenly and keeps the data a request needs on one shard: `user_id` for a user's own data, `tenant_id` for a SaaS. Avoid keys with hot values (a celebrity, today's date). Queries that span shards (global leaderboards, cross-user joins) become scatter-gather, so design those separately." },
        { id: "consistent-hashing", q: "Why consistent hashing instead of hash mod N?", a: "With `hash(key) % N`, changing N from 4 to 5 moves about 80% of keys, which empties every cache at once. Consistent hashing places servers and keys on a ring and gives each key to the next server clockwise, so adding a server moves only about 1/N of keys. Virtual nodes (many points per server) even out the load.", trap: "Forgetting virtual nodes: with one point per server the slices are very uneven." },
      ],
    },
    {
      id: "consistency",
      title: "CAP, consistency and quorums",
      summary: "When a network partition splits your replicas, you must choose: refuse some requests (**consistency**) or answer with possibly stale data (**availability**). That is the CAP theorem. PACELC adds the everyday case: even with no partition, you trade **latency** against **consistency**.",
      diagram: `flowchart TB
  H0["a network partition splits the replicas"]:::hot
  subgraph R1[" "]
    direction LR
    Q1(["must reads be correct? bank balance"]) --> A1["CP: reject writes on the minority side"]:::warn
  end
  subgraph R2[" "]
    direction LR
    Q2(["must it stay up? likes, carts"]) --> A2["AP: accept writes, reconcile later"]:::ok
  end
  subgraph R3[" "]
    direction LR
    Q3(["no partition: a normal day"]) --> A3["still trade latency against consistency"]
  end
  H0 --> R1
  R1 -->|"or"| R2
  R2 ~~~ R3`,
      caption: "Partitions are rare but certain. The choice is per feature, not per company.",
      table: { head: ["Model", "Guarantee", "Example"], rows: [
        ["Strong (linearizable)", "every read sees the latest write", "bank balance, lock service"],
        ["Read-your-writes", "you see your own updates", "profile edits"],
        ["Monotonic reads", "you never see time go backwards", "comment threads"],
        ["Eventual", "replicas converge if writes stop", "like counts, view counts"],
      ] },
      cards: [
        { id: "quorum", q: "What are quorum reads and writes?", a: "With N replicas, a write waits for W acknowledgements and a read asks R replicas and takes the newest value. If R + W > N, every read set overlaps every write set, so a read sees the latest acknowledged write. N = 3, W = 2, R = 2 is the common choice; W = 1 makes writes fast but reads can be stale." },
        { id: "cap-myth", q: "Is \"pick two of C, A and P\" accurate?", a: "Not quite. You cannot opt out of partitions on a real network, so the real choice is what to do during one: stay consistent and reject some requests, or stay available and risk stale or conflicting data. Outside partitions, systems can be both consistent and available." },
        { id: "conflicts", q: "How are conflicting concurrent writes resolved?", a: "Last-write-wins by timestamp is simple but silently drops one write. Version vectors detect that two writes were concurrent and keep both for the app to merge. CRDTs (counters, sets) are data types whose merges always converge, which suits likes, carts and collaborative text." },
      ],
    },
    {
      id: "queues",
      title: "Queues, streams and async work",
      summary: "A message queue lets a service hand off work without waiting for it: the request returns fast and workers process jobs at their own pace. Queues absorb traffic spikes, decouple services, and let you retry failures. The cost is eventual completion and duplicate deliveries you must handle.",
      diagram: `flowchart TB
  API["API: POST /videos"] -->|"enqueue job, return 202"| Q[("queue or Kafka topic")]:::hot
  Q --> W1["worker: transcode"]
  Q --> W2["worker: thumbnails"]
  W1 -->|"fails 3 times"| DLQ[("dead-letter queue")]:::bad
  W1 --> S[("object storage")]:::ok
  W2 --> S`,
      caption: "The API answers in milliseconds; minutes of work happen behind the queue, and poison messages land in the dead-letter queue for a person to inspect.",
      table: { head: ["", "Queue (SQS, RabbitMQ)", "Log or stream (Kafka)"], rows: [
        ["Message after it is processed", "deleted", "kept for days; readers track an offset"],
        ["Many consumers of the same message", "needs a fan-out exchange", "built in: each group reads independently"],
        ["Ordering", "best effort", "ordered within a partition"],
        ["Replay old messages", "no", "yes, rewind the offset"],
      ] },
      code: {
        file: "Idempotent consumer: at-least-once delivery, exactly-once effect",
        python: `processed = set()            # in production: a unique key in the database
balance = {"alice": 100}

def handle(msg):
    if msg["id"] in processed:          # duplicate delivery: do nothing
        return "skipped"
    balance[msg["user"]] -= msg["amount"]
    processed.add(msg["id"])            # same transaction as the update
    return "applied"

m = {"id": "pay-7", "user": "alice", "amount": 30}
results = [handle(m), handle(m)]       # the queue delivered it twice
assert results == ["applied", "skipped"] and balance["alice"] == 70
print(results, balance)`,
      },
      cards: [
        { id: "delivery", q: "At-most-once, at-least-once, exactly-once?", a: "At-most-once acknowledges before processing: a crash loses the message. At-least-once acknowledges after processing: a crash causes a redelivery, so duplicates happen. Exactly-once delivery is not achievable end to end in general; you get exactly-once **effect** with at-least-once delivery plus idempotent processing (a dedupe key or an upsert)." },
        { id: "backpressure", q: "What happens when producers outpace consumers?", a: "The queue grows. That is fine for a burst, but if it keeps growing, latency for every job grows too. Watch queue depth and age of the oldest message, autoscale workers on them, and if needed shed load at the producer (reject or delay new work) rather than letting the backlog grow without limit." },
        { id: "outbox", q: "How do you update the database and publish an event without losing either?", a: "The transactional outbox: in the same database transaction, write the business row and an `outbox` row describing the event. A separate relay reads the outbox and publishes to the queue, marking rows sent. If the relay crashes it republishes, so consumers must be idempotent." },
      ],
    },
    {
      id: "ratelimit",
      title: "API design and rate limiting",
      summary: "A good API is predictable: resources as nouns, standard status codes, pagination with cursors, and idempotency keys on anything that charges money. A **rate limiter** protects it from abuse and overload by capping requests per client per time window.",
      lab: "ratelimit",
      table: { head: ["Algorithm", "How it works", "Behaviour"], rows: [
        ["Token bucket", "tokens refill at a steady rate up to a capacity; each request spends one", "allows short bursts, steady average"],
        ["Leaky bucket", "requests queue and drain at a fixed rate", "smooth output, bursts wait"],
        ["Fixed window", "count per clock window, reset at the boundary", "simple; double burst at the boundary"],
        ["Sliding window log or counter", "count over the last N seconds", "accurate; a little more memory"],
      ] },
      code: {
        file: "Token bucket",
        python: `class TokenBucket:
    def __init__(self, capacity, rate):          # rate = tokens per second
        self.cap, self.rate = capacity, rate
        self.tokens, self.last = capacity, 0.0

    def allow(self, now):
        self.tokens = min(self.cap, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False                                 # caller returns 429 Too Many Requests

b = TokenBucket(capacity=3, rate=1)
burst = [b.allow(0.0) for _ in range(5)]            # 3 pass, 2 rejected
later = b.allow(2.0)                                 # 2 seconds refilled 2 tokens
assert burst == [True, True, True, False, False] and later
print(burst, later)`,
      },
      cards: [
        { id: "where", q: "Where does the rate limiter live in a distributed system?", a: "Usually in the API gateway or a middleware, with counters in a shared store like Redis so every server sees the same count. Use an atomic operation (a Lua script or `INCR` with expiry) to avoid race conditions between check and update. Return `429` with a `Retry-After` header." },
        { id: "pagination", q: "Offset vs cursor pagination?", a: "`?offset=1000&limit=20` is simple, but the database still scans the skipped rows, and items shift when new ones are inserted. A cursor (`?after=<last id>`) uses an index seek, stays fast at any depth and never skips or repeats items. Use cursors for feeds and large lists." },
        { id: "idempotency", q: "Why do payment APIs take an idempotency key?", a: "A client times out and retries, but the first request may have succeeded. With an `Idempotency-Key` header, the server stores the result under that key and returns the same result for a retry instead of charging twice." },
      ],
    },
    {
      id: "reliability",
      title: "Reliability: redundancy, retries and circuit breakers",
      summary: "Everything fails eventually: disks, machines, whole data centres, and the network between them. Reliable systems remove single points of failure, fail fast instead of hanging, retry carefully, and degrade gracefully when a dependency is down.",
      table: { head: ["Availability", "Downtime per year", "Downtime per month"], rows: [
        ["99% (two nines)", "3.65 days", "7.3 hours"],
        ["99.9%", "8.8 hours", "44 minutes"],
        ["99.99%", "53 minutes", "4.4 minutes"],
        ["99.999%", "5.3 minutes", "26 seconds"],
      ] },
      diagram: `flowchart TB
  C["closed: calls pass, failures counted"]:::ok -->|"failure rate over threshold"| O["open: fail fast, no calls"]:::bad
  O -->|"after a cool-down"| H["half-open: let a few calls through"]:::warn
  H -->|"they succeed"| C
  H -->|"they fail"| O`,
      caption: "A circuit breaker stops a struggling dependency from tying up every thread while it recovers.",
      code: {
        file: "Retry with exponential backoff and jitter",
        python: `import random

def backoff_delays(attempts, base=0.1, cap=5.0, seed=1):
    rng = random.Random(seed)
    # "full jitter": wait a random time up to base * 2^n, never more than cap
    return [rng.uniform(0, min(cap, base * 2 ** n)) for n in range(attempts)]

delays = backoff_delays(6)
print([round(d, 2) for d in delays])
assert all(0 <= d <= min(5.0, 0.1 * 2 ** n) for n, d in enumerate(delays))`,
      },
      cards: [
        { id: "serial", q: "Three services in a chain each have 99.9% availability. What is the total?", a: "Dependencies in series multiply: 0.999^3 = 99.7%, about 26 hours of downtime a year instead of 8.8. Redundant copies in parallel do the opposite: two independent 99% replicas give 1 - 0.01^2 = 99.99%. That is why removing hard dependencies matters as much as making each one reliable." },
        { id: "retry-storm", q: "Why add jitter to retries?", a: "If a service blips and a thousand clients all retry after exactly 1, 2 and 4 seconds, they hit it in synchronized waves and keep it down. Random jitter spreads the retries out. Also cap the number of retries, retry only safe (idempotent) requests, and add a retry budget so retries never exceed, say, 10% of traffic." },
        { id: "degrade", q: "What is graceful degradation?", a: "When a non-critical dependency fails, serve a reduced experience instead of an error: show the product page without recommendations, show cached prices with a note, queue the email for later. Decide in advance which features are critical and put timeouts on everything else." },
        { id: "sla", q: "SLI vs SLO vs SLA?", a: "An SLI is a measurement (share of requests under 300 ms). An SLO is your internal target for it (99.9% over 30 days). An SLA is a contract with customers, with penalties, and is set looser than the SLO. The gap between 100% and the SLO is the error budget you can spend on releases." },
      ],
    },
    {
      id: "url",
      anim: "url",
      title: "Design a URL shortener",
      summary: "Turn a long URL into a short code and redirect anyone who visits it. Reads dominate (often 100 reads per write), codes must be unique, and redirects must be fast. It is the classic warm-up because every core idea fits in one page: IDs, encoding, caching, and storage.",
      points: [
        "**API:** `POST /urls {long_url}` returns `{code}`; `GET /{code}` returns `301` or `302` to the long URL.",
        "**Scale:** 100 million new URLs a month is about 40 writes per second and, at 100:1, about 4,000 reads per second.",
        "**Code length:** base62 (a-z, A-Z, 0-9) with 7 characters gives 62^7, about 3.5 trillion codes: enough for centuries at that rate.",
        "**Storage:** about 500 bytes per row x 1.2 billion rows a year is about 600 GB a year: one database with replicas, sharded later by code.",
      ],
      diagram: `flowchart TB
  C["client: GET /x7Kp2Qa"] --> LB["load balancer"]
  LB --> S["redirect service"]:::hot
  S --> CA{"code in cache?"}
  CA -->|"hit"| R["302 to the long URL"]:::ok
  CA -->|"miss"| DB[("code to URL table")]
  DB --> R
  W["POST /urls"] --> ID["unique ID: counter or Snowflake"]
  ID --> E["base62 encode"] --> DB`,
      caption: "Writes get a unique ID and encode it; reads are a cache lookup and a redirect.",
      code: {
        file: "Base62 codes from a unique ID",
        python: `ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode(n):
    s = ""
    while True:
        n, r = divmod(n, 62)
        s = ALPHABET[r] + s
        if n == 0:
            return s

def decode(s):
    n = 0
    for ch in s:
        n = n * 62 + ALPHABET.index(ch)
    return n

code = encode(125_000_000_000)
assert decode(code) == 125_000_000_000 and len(code) == 7
print(code)`,
      },
      cards: [
        { id: "ids", q: "How do you generate unique codes without collisions?", a: "Option 1: a unique numeric ID (a database sequence, or ranges of IDs handed out to each server, or a Snowflake-style ID of timestamp + machine + counter), then base62-encode it. No collisions by construction. Option 2: hash the URL and take 7 characters, then check for a collision and retry: simpler to shard, but costs a lookup per write. Sequential IDs make codes guessable; shuffle the bits if that matters." },
        { id: "301-302", q: "301 or 302 redirect?", a: "A `301` (permanent) is cached by browsers, so repeat visits never reach you: less load, but you lose click analytics and cannot change the target. A `302` (temporary) sends every visit through your service, so you can count clicks and expire links. Most shorteners use 302." },
        { id: "hot-links", q: "One link goes viral. What breaks and how do you handle it?", a: "Reads for one key spike to tens of thousands per second. The cache handles it if the key is cached on every node (or in a CDN at the edge), so put popular codes in a local in-process cache in front of Redis. The database is barely touched because the mapping never changes." },
      ],
    },
    {
      id: "feed",
      anim: "feed",
      title: "Design a news feed and chat",
      summary: "A news feed shows each user recent posts from the people they follow. The core decision is **when** to assemble it: at write time (push the post into every follower's feed) or at read time (pull from everyone you follow). Chat adds a second problem: delivering messages to online users in real time.",
      diagram: `flowchart TB
  P["user posts"] --> F{"author has millions of followers?"}:::hot
  F -->|"no: fan-out on write"| PUSH["push post id into each follower's feed list"]:::ok
  F -->|"yes: celebrity"| SKIP["store once, do not fan out"]:::warn
  PUSH --> R["reader opens feed"]
  SKIP --> R
  R --> M["merge precomputed feed + recent celebrity posts, rank"]`,
      caption: "The hybrid that large feeds use: push for normal accounts, pull for the few accounts whose fan-out would be enormous.",
      table: { head: ["", "Fan-out on write (push)", "Fan-out on read (pull)"], rows: [
        ["Reading a feed", "one fast lookup", "query every followee, merge: slow"],
        ["Posting", "one write per follower: slow for celebrities", "one write"],
        ["Wasted work", "feeds of inactive users", "none"],
        ["Best for", "most users", "celebrities, rarely active readers"],
      ] },
      cards: [
        { id: "chat", q: "How does a chat app deliver messages in real time?", a: "Each online client keeps a WebSocket open to a gateway server. A registry (Redis) maps user to gateway. To send, the chat service stores the message, looks up the recipient's gateway and pushes it there. If the recipient is offline, it sends a push notification and the client fetches missed messages by cursor when it reconnects." },
        { id: "ordering", q: "How do you order chat messages?", a: "Assign each message a sequence number per conversation (from the conversation's shard, or a timestamp plus tie-breaker) and let clients sort by it. Clients send a client-generated message id so a retried send is deduplicated rather than shown twice." },
        { id: "feed-storage", q: "Where is a precomputed feed stored?", a: "A capped list of post ids per user in Redis or a wide-column store (Cassandra), newest first, maybe the last 500 entries. Post bodies, authors and counts are fetched separately and cached, so an edited post shows up everywhere without rewriting feeds." },
      ],
    },
    {
      id: "video",
      anim: "video",
      title: "Case study: a video platform like YouTube or Netflix",
      summary: "Uploads are rare and heavy; views are constant and huge. The design splits into an offline pipeline that turns one upload into many encoded versions, and an online path that streams small segments from a CDN close to the viewer. Almost all bytes are served by the CDN, never by your servers.",
      points: [
        "**Scale:** 500 hours uploaded a minute, billions of views a day; video is most of the Internet's traffic.",
        "**Upload:** resumable, chunked upload straight to object storage with a pre-signed URL, so app servers never carry the bytes.",
        "**Transcode:** split into short segments, encode each at several resolutions and bitrates in parallel workers, store the segments and a playlist (HLS or DASH).",
        "**Playback:** the player downloads the playlist, then picks a bitrate per segment based on measured bandwidth: adaptive bitrate streaming.",
      ],
      diagram: `flowchart TB
  U["creator uploads, in chunks"] --> OS[("object storage: original")]
  OS --> Q[("transcode jobs queue")]:::hot
  Q --> T["workers: 240p to 4K segments"]
  T --> SEG[("segments + playlist")]
  SEG --> CDN["CDN edge caches"]:::ok
  V["viewer's player"] -->|"playlist, then segments"| CDN
  V -.->|"bandwidth drops: switch to 480p"| CDN`,
      caption: "Write once, encode many times offline, then read from the edge forever.",
      cards: [
        { id: "abr", q: "How does adaptive bitrate streaming work?", a: "The video is cut into segments of 2 to 6 seconds, each encoded at several bitrates. A playlist lists them all. The player measures how fast the last segments downloaded and how full its buffer is, and picks the bitrate for the next segment. On a slow network it drops to 480p instead of stalling, then climbs back." },
        { id: "popular", q: "Do you cache every video at every edge?", a: "No. Popularity is extremely skewed: a small share of videos gets most views. Push popular and new releases to edges ahead of time (Netflix pre-positions catalogue on its own appliances inside ISPs overnight); long-tail videos are fetched from a regional cache or origin on demand and cached only if requested again." },
        { id: "views", q: "How do you count views at this scale?", a: "Do not write to the video row on every view. Log view events to a stream, aggregate them in batches (per minute per video), and add the batch to the counter. The displayed count is slightly behind, which nobody notices. Filter bots and repeated views in the aggregation step." },
      ],
    },
    {
      id: "ride",
      anim: "ride",
      title: "Case study: ride hailing like Uber",
      summary: "Every driver sends its location every few seconds, and a rider wants the nearest free drivers in under a second. The core problems are a high-rate stream of location writes, fast \"who is near me\" queries, and matching each rider to exactly one driver.",
      points: [
        "**Location writes:** 1 million active drivers x one update every 4 s = 250,000 writes per second. Keep them in memory (Redis geo sets or an in-memory grid), not in the main database.",
        "**Nearby search:** index positions by geohash or grid cell; search the rider's cell and its neighbours.",
        "**Matching:** offer the trip to the best driver, wait a few seconds for acceptance, then try the next. A trip is a state machine: requested, matched, arriving, in progress, completed.",
        "**Consistency:** a driver must never be matched to two riders: lock the driver with an atomic compare-and-set on its state.",
      ],
      diagram: `flowchart TB
  D["driver app: location every 4 s"] --> LS["location service"]
  LS --> G[("in-memory geo index by cell")]:::hot
  R["rider requests a trip"] --> M["matching service"]
  M -->|"drivers in my cell and neighbours"| G
  M --> O{"best driver accepts within 10 s?"}
  O -->|"yes: set driver busy atomically"| T[("trip: matched")]:::ok
  O -->|"no"| M`,
      caption: "Locations live in memory and are queried by cell; only trips are written to a durable database.",
      code: {
        file: "Geohash: nearby points share a prefix",
        python: `BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

def geohash(lat, lon, precision=7):
    lat_r, lon_r, bits, even, out, ch, n = [-90.0, 90.0], [-180.0, 180.0], 0, True, "", 0, 0
    while len(out) < precision:
        rng, val = (lon_r, lon) if even else (lat_r, lat)
        mid = (rng[0] + rng[1]) / 2
        if val >= mid:
            ch = ch * 2 + 1; rng[0] = mid
        else:
            ch = ch * 2; rng[1] = mid
        even, n = not even, n + 1
        if n == 5:                       # 5 bits per base32 character
            out += BASE32[ch]; ch = n = 0
    return out

assert geohash(57.64911, 10.40744, 11) == "u4pruydqqvj"   # the standard reference point
a, b = geohash(12.9716, 77.5946), geohash(12.9721, 77.5950)  # two spots 70 m apart in Bengaluru
print(a, b)
assert a[:5] == b[:5]`,
      },
      cards: [
        { id: "geohash", q: "Geohash vs quadtree for nearby search?", a: "A geohash turns a point into a string where a shared prefix means nearby, so a normal index or Redis can answer \"all drivers with prefix tdr1v\". Cells are fixed size, so dense downtowns have crowded cells. A quadtree splits a cell only when it holds too many points, so cells adapt to density, but it is an in-memory structure you must rebuild or update. Both need neighbour cells checked, because a point near an edge has close neighbours in the next cell." },
        { id: "eta", q: "Why match by ETA, not straight-line distance?", a: "A driver 500 m away across a river or on the wrong side of a highway can take 10 minutes. Matching takes the nearest few candidates by distance, then ranks them by road-network ETA from a routing service." },
        { id: "surge", q: "How would surge pricing be computed?", a: "Aggregate open requests and free drivers per cell over the last few minutes from the event stream, compute the demand to supply ratio, smooth it in time and space, and map it to a multiplier. It is a stream-processing job, not part of the request path; the price is read from a cache when the rider asks for a quote." },
      ],
    },
    {
      id: "tickets",
      anim: "tickets",
      title: "Case study: flash sales and ticket booking",
      summary: "A concert goes on sale and 2 million people arrive for 50,000 seats in the same minute. Two requirements fight each other: absorb a gigantic spike, and never sell the same seat twice. The answer is a waiting room in front, and short seat holds with atomic updates behind it.",
      points: [
        "**Virtual waiting room:** admit users in batches at a rate the booking system can handle; everyone else sees their place in the queue. The spike hits a cheap static page, not the database.",
        "**Seat hold:** choosing a seat takes a hold that expires (say 8 minutes); payment converts the hold into a booking.",
        "**No double booking:** the hold is a conditional write that succeeds only if the seat is free or its hold expired, done atomically in one database or Redis operation.",
        "**Read-heavy seat map:** serve availability from a cache that may lag a little; the conditional write is the source of truth.",
      ],
      diagram: `flowchart TB
  U["2M users at 10:00"] --> WR["waiting room: static page + queue position"]:::warn
  WR -->|"admit 2,000 a minute"| SM["seat map, from cache"]
  SM --> H{"hold seat: free or expired?"}:::hot
  H -->|"yes, atomic"| P["pay within 8 minutes"]
  H -->|"no: taken"| SM
  P -->|"paid"| B[("booked")]:::ok
  P -.->|"timer expires"| F["seat freed"]`,
      caption: "The waiting room caps load; the atomic hold guarantees one seat, one buyer.",
      code: {
        file: "Seat holds: compare-and-set with expiry",
        python: `seats = {"A1": {"state": "free", "user": None, "until": 0}}

def hold(seat, user, now, ttl=480):
    s = seats[seat]
    # in a database: UPDATE seats SET ... WHERE id = ? AND (state = 'free' OR until < now)
    if s["state"] == "free" or (s["state"] == "held" and s["until"] < now):
        s.update(state="held", user=user, until=now + ttl)
        return True
    return False

def book(seat, user, now):
    s = seats[seat]
    if s["state"] == "held" and s["user"] == user and s["until"] >= now:
        s["state"] = "booked"
        return True
    return False

assert hold("A1", "asha", now=0) and not hold("A1", "ben", now=10)   # Ben loses the race
assert not book("A1", "asha", now=500)                              # Asha's hold expired
assert hold("A1", "ben", now=501) and book("A1", "ben", now=600)
assert not hold("A1", "chen", now=10_000)                           # booked seats never free up
print(seats)`,
      },
      cards: [
        { id: "double-book", q: "How do you guarantee a seat is never sold twice?", a: "Make the hold a single atomic conditional write: `UPDATE seats SET state = 'held', user_id = ?, until = now() + 8 min WHERE id = ? AND (state = 'free' OR until < now())` and check that one row changed. Two concurrent requests cannot both match. A unique constraint on (event, seat) in the bookings table is a second safety net." },
        { id: "fairness", q: "Bots buy everything in the first second. What do you do?", a: "Put everyone who arrives before the start in the waiting room and assign random queue positions at the start time, so being a millisecond faster does not help. Add per-account and per-card limits, CAPTCHAs or device checks before admission, and verified-fan pre-registration for big events." },
        { id: "inventory", q: "How is this different from an online store's stock count?", a: "Stock of identical items can be a counter: `UPDATE stock SET n = n - 1 WHERE n > 0`. For a hot item that one row becomes the bottleneck, so split the stock into several sub-counters (buckets) and decrement any bucket with stock left. Seats are distinct items, so each is its own row and contention is spread naturally." },
      ],
    },
    {
      id: "typeahead",
      anim: "typeahead",
      title: "Case study: search autocomplete and a web crawler",
      summary: "Two halves of a search engine. **Autocomplete** must suggest the top queries for a prefix within about 100 ms of each keystroke, so the answers are precomputed. A **crawler** must fetch billions of pages without hammering any single website or fetching the same page twice.",
      points: [
        "**Autocomplete:** a trie of popular queries where each node stores its own top 5 completions; rebuilt offline from query logs every hour or day; cached heavily because short prefixes repeat.",
        "**Crawler frontier:** a priority queue of URLs split per host, so each site gets at most one request every few seconds (politeness) and robots.txt is respected.",
        "**Dedupe:** a Bloom filter answers \"seen this URL?\" in a few bits per URL; a content hash catches the same page under different URLs.",
      ],
      diagram: `flowchart TB
  F[("URL frontier: one queue per host")]:::hot --> W["fetchers: one request per host every few seconds"]
  W --> P["parse: text + links"]
  P --> D{"URL seen before? Bloom filter"}
  D -->|"new"| F
  D -->|"seen"| X["drop"]
  P --> IDX[("store page for indexing")]:::ok`,
      caption: "The crawler loop: fetch politely, extract links, add only unseen URLs back to the frontier.",
      code: {
        file: "Autocomplete trie with the top completions stored at each node",
        python: `import heapq

class Trie:
    def __init__(self):
        self.root = {"kids": {}, "top": []}

    def add(self, query, count, k=3):
        node = self.root
        for ch in query:
            node = node["kids"].setdefault(ch, {"kids": {}, "top": []})
            # keep the k most popular completions at every prefix: a read is then one walk down
            node["top"] = heapq.nlargest(k, node["top"] + [(count, query)])

    def suggest(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node["kids"]:
                return []
            node = node["kids"][ch]
        return [q for _, q in node["top"]]

t = Trie()
for q, c in [("how to cook rice", 900), ("how to tie a tie", 1200), ("how tall is everest", 400), ("hotel near me", 2000)]:
    t.add(q, c)
assert t.suggest("how") == ["how to tie a tie", "how to cook rice", "how tall is everest"]
assert t.suggest("ho")[0] == "hotel near me" and t.suggest("xyz") == []
print(t.suggest("how t"))`,
      },
      cards: [
        { id: "update-trie", q: "How fresh are autocomplete suggestions, and how do trending queries get in?", a: "The main trie is rebuilt offline from aggregated logs (say hourly), then swapped in atomically. Trending terms need minutes, not hours, so a small fast layer counts recent queries in a stream with decay and is merged into the results. Filters remove offensive or personal suggestions before anything ships." },
        { id: "bloom", q: "What is a Bloom filter and why does a crawler use one?", a: "A bit array plus k hash functions. Adding an item sets k bits; checking it tests those k bits. If any bit is 0 the item was definitely never added; if all are 1 it was probably added. It never gives false negatives and uses about 10 bits per item for a 1% false-positive rate, so billions of URLs fit in memory. A false positive only means skipping a page that was not actually crawled." },
        { id: "politeness", q: "How does a crawler avoid overloading websites?", a: "Group the frontier by host and let each host's queue release one URL at a time with a delay, honour `robots.txt` and its crawl delay, back off on errors and 429s, and spread hosts across fetcher machines with consistent hashing so one machine owns each host's rate limit." },
      ],
    },
    {
      id: "docs",
      anim: "docs",
      title: "Case study: collaborative editing like Google Docs",
      summary: "Several people type into the same document at once, each seeing their own edits instantly. Edits made concurrently must be merged so everyone ends up with the same text, without a lock. The two known answers are Operational Transformation (OT), used by Google Docs, and CRDTs, used by Figma-style and local-first tools.",
      diagram: `flowchart TB
  A["Asha types 'X' at position 0"] --> S["server orders operations per document"]:::hot
  B["Ben deletes the char at position 3"] --> S
  S --> T["transform: Ben's delete shifts to position 4 because Asha inserted before it"]
  T --> BA["broadcast to every open editor"]
  BA --> SAME["all copies converge to the same text"]:::ok`,
      caption: "Edits are applied locally first, then sent; the server's order plus transformation makes every copy converge.",
      cards: [
        { id: "ot-crdt", q: "OT vs CRDT?", a: "OT sends operations (insert 'X' at 5) and transforms concurrent ones against each other, which needs a central server to define the order; it is compact and proven at scale. A CRDT gives every character a unique, ordered id so inserts and deletes commute and merge in any order without a server; great for offline and peer-to-peer, at the cost of metadata per character." },
        { id: "cursor", q: "How are other people's cursors shown?", a: "Cursor positions are sent as ephemeral presence messages over the same WebSocket, transformed like edits so they stay attached to the right text, and never stored. Presence can be lossy: if one update is dropped, the next one fixes it." },
        { id: "history", q: "How does version history work without storing a copy per keystroke?", a: "Store the operation log, plus periodic snapshots. To show version N, load the nearest snapshot before N and replay the operations after it. Old operations are compacted into coarser checkpoints over time." },
      ],
    },
    {
      id: "storage",
      anim: "storage",
      title: "Case study: file sync like Dropbox or Google Drive",
      summary: "Users edit large files on several devices and expect every device to catch up quickly, even after being offline. Splitting files into chunks named by their hash makes uploads incremental and deduplicated, and separates the small, consistent metadata from the huge, immutable blocks.",
      points: [
        "**Blocks:** files are cut into chunks (about 4 MB), each named by its SHA-256. Unchanged chunks are never uploaded again, and identical chunks across all users are stored once.",
        "**Metadata:** a database maps each file version to its ordered list of chunk hashes, plus folder tree and sharing. This is the strongly consistent part.",
        "**Sync:** devices keep a cursor into a per-user change journal; a long poll or WebSocket says \"something changed\", then the device fetches the changes since its cursor.",
        "**Conflicts:** if two devices edit the same file offline, keep both and save one as a conflicted copy rather than silently losing work.",
      ],
      diagram: `flowchart TB
  E["edit a 100 MB file"] --> C["split into chunks, hash each"]
  C --> Q{"server already has this hash?"}:::hot
  Q -->|"yes: most chunks"| SKIP["skip upload"]:::ok
  Q -->|"no: the changed chunk"| UP["upload to block storage"]
  SKIP --> M[("metadata: file v2 = list of hashes")]
  UP --> M
  M --> N["notify the user's other devices"]`,
      caption: "Changing one paragraph of a large file uploads one chunk, not the whole file.",
      code: {
        file: "Chunk hashing: only changed chunks are uploaded",
        python: `import hashlib

def chunks(data, size=4):                 # 4 bytes for the demo; about 4 MB in practice
    return [data[i:i + size] for i in range(0, len(data), size)]

store = {}                                # block storage: hash -> bytes

def upload(data):
    hashes, sent = [], 0
    for c in chunks(data):
        h = hashlib.sha256(c).hexdigest()
        if h not in store:
            store[h] = c; sent += 1
        hashes.append(h)
    return hashes, sent                   # the metadata row stores this list

v1, sent1 = upload(b"aaaabbbbccccdddd")
v2, sent2 = upload(b"aaaabbbbXXXXdddd")   # one chunk edited
assert (sent1, sent2) == (4, 1) and v1[0] == v2[0] and v1[2] != v2[2]
print(f"first upload sent {sent1} chunks, the edit sent {sent2}")`,
      },
      cards: [
        { id: "chunk-boundaries", q: "Inserting one byte at the start shifts every fixed-size chunk. How is that solved?", a: "Content-defined chunking: compute a rolling hash over a sliding window and cut a chunk wherever the hash matches a pattern (for example the low 13 bits are zero). Boundaries follow the content, so an insertion changes only the chunk it lands in, and later boundaries are found again at the same places." },
        { id: "metadata-db", q: "Why keep metadata and blocks in different stores?", a: "Blocks are immutable, huge in total and accessed by hash: perfect for cheap object storage. Metadata is small, changes constantly, and needs transactions (rename a folder, move a file, share with a team), so it belongs in a relational database sharded by user or namespace." },
        { id: "notify", q: "How does a device learn about changes without polling every few seconds?", a: "It holds a long poll (or WebSocket) to a notification service that returns only \"your journal moved\". The device then calls the metadata API with its cursor to fetch the actual changes. Keeping notification separate means millions of idle connections cost almost nothing." },
      ],
    },
    {
      id: "payments",
      anim: "payments",
      title: "Case study: a payment system",
      summary: "Money must never be created, lost or charged twice, even when networks time out and services crash halfway. The tools are idempotency keys on every call, a double-entry ledger that always balances, and reconciliation against the bank and payment provider every day.",
      diagram: `flowchart TB
  C["checkout: pay 500 with key k-123"] --> PS["payment service"]:::hot
  PS --> DB[("payment row: k-123, pending")]
  DB --> PSP["payment provider: charge card"]
  PSP -->|"success"| L[("ledger: debit customer, credit merchant")]:::ok
  PSP -.->|"timeout: unknown"| RQ["retry with the same key, or query status"]:::warn
  RQ --> PSP
  L --> REC["daily reconciliation with provider reports"]`,
      caption: "A timeout is not a failure: retry with the same idempotency key so the provider charges at most once.",
      code: {
        file: "Double-entry ledger: every transfer sums to zero",
        python: `from collections import defaultdict

entries = []                       # append-only: never update or delete a row

def transfer(tx, debit, credit, amount):
    if any(e[0] == tx for e in entries):
        return "duplicate"         # idempotent by transaction id
    entries.append((tx, debit, -amount))
    entries.append((tx, credit, amount))
    return "ok"

def balances():
    b = defaultdict(int)
    for _, acct, amt in entries:
        b[acct] += amt
    return dict(b)

transfer("t1", "customer:asha", "merchant:shop", 500)
transfer("t1", "customer:asha", "merchant:shop", 500)      # retried request
transfer("t2", "merchant:shop", "platform:fees", 15)
b = balances()
assert sum(b.values()) == 0                                  # money is never created or lost
assert b == {"customer:asha": -500, "merchant:shop": 485, "platform:fees": 15}
print(b)`,
      },
      cards: [
        { id: "timeout", q: "The call to the payment provider times out. Did the customer get charged?", a: "You do not know, so never assume either way. Mark the payment pending, then retry with the same idempotency key (the provider returns the original result if it already charged) or query the payment status. A background job resolves anything still pending, and daily reconciliation catches the rest." },
        { id: "ledger", q: "Why double-entry bookkeeping?", a: "Every movement is two rows, a debit and a credit of the same amount, so the sum of all entries is always zero and every balance can be recomputed from history. Bugs show up as an imbalance instead of silently wrong numbers, and auditors can trace every unit of money. Rows are append-only: corrections are new entries, never edits." },
        { id: "exactly-once", q: "How do you avoid charging twice when the user double-clicks or the app retries?", a: "The client creates an idempotency key once per checkout attempt and sends it with every retry. The server stores the key with the result in the same transaction as the payment row; a second request with the same key returns the stored result. A unique constraint on the key makes it safe under concurrency." },
      ],
    },
    {
      id: "tricky",
      anim: "hotkey",
      title: "Tricky cases interviewers love",
      summary: "A handful of problems come up again and again because they break naive designs: one key that is far hotter than the rest, counting at enormous scale, generating unique IDs without a central counter, finding the top items in an endless stream, and querying by location. Each has a standard trick worth knowing by name.",
      table: { head: ["Problem", "Naive design breaks because", "Standard trick"], rows: [
        ["Celebrity / hot key", "one shard or cache node gets all the traffic", "replicate the hot key, add a random suffix and fan out, local in-process cache"],
        ["Like or view counter", "one row updated 100,000 times a second", "sharded counters summed on read, or stream + batch aggregation"],
        ["Unique IDs", "one auto-increment database is a bottleneck", "Snowflake IDs: time + machine + sequence, or UUIDv7"],
        ["Top K trending", "exact counts for every item do not fit in memory", "Count-Min Sketch + a heap, per time window"],
        ["Distinct users", "storing every user id per day", "HyperLogLog: about 12 KB for billions, about 1% error"],
        ["Nearby search", "scanning every point", "geohash, quadtree or H3 cells"],
        ["Exactly-once effects", "retries and redeliveries", "idempotency keys and dedupe tables"],
      ] },
      diagram: `flowchart TB
  H["hot key: post:celebrity"]:::bad --> S["spread it: post:celebrity#0 to #9"]
  S --> N1["copies on different cache nodes"]
  N1 --> R["each read picks a random copy"]:::ok
  H --> L["plus a short in-process cache on every app server"]:::ok`,
      caption: "A hot key overloads one node no matter how many you add, until you make copies of it.",
      code: {
        file: "Snowflake IDs: unique and roughly time-ordered, no central counter",
        python: `import time

EPOCH = 1_700_000_000_000              # custom epoch in ms, so 41 bits last about 69 years

class Snowflake:
    def __init__(self, machine):
        assert 0 <= machine < 1024     # 10 bits of machine id
        self.machine, self.last, self.seq = machine, -1, 0

    def next_id(self, now_ms=None):
        now = now_ms if now_ms is not None else int(time.time() * 1000)
        if now == self.last:
            self.seq = (self.seq + 1) % 4096          # 12 bits: 4,096 ids per ms per machine
            if self.seq == 0:
                now = self.last + 1                   # sequence exhausted: move to the next ms
        else:
            self.seq = 0
        self.last = now
        return ((now - EPOCH) << 22) | (self.machine << 12) | self.seq

g = Snowflake(machine=7)
ids = [g.next_id(now_ms=1_700_000_000_500) for _ in range(3)] + [g.next_id(now_ms=1_700_000_000_501)]
assert ids == sorted(ids) and len(set(ids)) == 4
assert (ids[0] >> 12) & 1023 == 7                   # the machine id can be read back
print(ids)`,
      },
      cards: [
        { id: "counter", q: "How do you count likes on a post that gets 100,000 likes a second?", a: "Do not increment one row. Option 1: N sharded counter rows per post, increment a random one, sum them on read (and cache the sum). Option 2: write like events to a stream, aggregate per post per second, and add the batch total. Keep the per-user \"did I like this\" record separately so a user cannot like twice." },
        { id: "topk", q: "How would you find the top 10 trending hashtags in the last hour?", a: "Exact counts for every hashtag are expensive, so use a Count-Min Sketch (a small grid of counters, several hashes) to estimate counts, and keep a min-heap of the 10 largest estimates. Run it per minute window and combine the last 60 windows, or use exponential decay so old minutes fade out. The estimates can only over-count, never under-count." },
        { id: "uuid", q: "Snowflake IDs vs random UUIDs?", a: "Random UUIDv4s need no coordination but are 128 bits and land in random places in a B-tree index, causing page splits and poor cache locality. Snowflake IDs (or UUIDv7) start with a timestamp, so new rows append to the end of the index and IDs sort by creation time. The cost is assigning machine ids and trusting clocks not to jump backwards." },
        { id: "hll", q: "How do you count unique visitors per day without storing every id?", a: "HyperLogLog hashes each id and tracks, per bucket, the longest run of leading zeros seen. Long runs are rare, so they reveal how many distinct values passed through. About 12 KB estimates billions of distinct ids within about 1%, and daily sketches merge into weekly ones. Redis exposes it as `PFADD` and `PFCOUNT`." },
      ],
    },
  ],
};
