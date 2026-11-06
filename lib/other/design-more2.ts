// System Design chapters, part 3: location services, data pipelines, storage, money and trading.
// Every estimate is computed here from the stated assumptions, never typed by hand.
import type { Chapter } from "./types.ts";

const DAY = 86_400;
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");

/* ---------- proximity: geohash cell sizes at the equator ---------- */
export const geohashCell = (len: number) => {
  const bits = 5 * len, lonBits = Math.ceil(bits / 2), latBits = Math.floor(bits / 2);
  return { w: (360 / 2 ** lonBits) * 111.32, h: (180 / 2 ** latBits) * 110.57 };   // km per degree at the equator
};
const km = (x: number) => (x >= 1 ? `${n1(x)} km` : `${n0(x * 1000)} m`);
/** The longest geohash whose cell is at least as big as the radius, so the cell and its 8 neighbours cover the circle. */
export const geohashFor = (radiusKm: number) => { for (let len = 9; len >= 1; len--) { const c = geohashCell(len); if (Math.min(c.w, c.h) >= radiusKm) return len; } return 1; };
const PROX = { dau: 100e6, searches: 5, businesses: 200e6, perLeaf: 100 };
const proxQps = (PROX.dau * PROX.searches) / DAY;
const leaves = PROX.businesses / PROX.perLeaf, internal = leaves / 3;
const quadBytes = leaves * (PROX.perLeaf * 8 + 32) + internal * (4 * 8 + 32);

/* ---------- nearby friends ---------- */
const NF = { dau: 100e6, concurrent: 0.1, everySec: 30, friends: 400, onlineFriends: 40, channelBytes: 20, pushesPerServer: 100_000 };
const nfUsers = NF.dau * NF.concurrent;
const nfQps = nfUsers / NF.everySec;
const nfPushes = nfQps * NF.onlineFriends;
const nfMemGB = (NF.dau * NF.friends * NF.channelBytes) / 1e9;

/* ---------- maps ---------- */
const tiles = (z: number) => 4 ** z;
const MAP = { zoom: 21, tileKB: 100, navigating: 10e6, batchSec: 15 };
const tilePB = (tiles(MAP.zoom) * MAP.tileKB) / 1e12;
const mapQps = MAP.navigating / MAP.batchSec;

/* ---------- ad clicks ---------- */
const AD = { clicksPerDay: 1e9, peak: 5, eventKB: 0.1 };
const adQps = AD.clicksPerDay / DAY;
const adGBDay = (AD.clicksPerDay * AD.eventKB) / 1e6;

/* ---------- hotel ---------- */
const HOTEL = { hotels: 5000, rooms: 1e6, occupancy: 0.7, stay: 3, roomTypes: 20 };
const resPerDay = (HOTEL.rooms * HOTEL.occupancy) / HOTEL.stay;
const inventoryRows = HOTEL.hotels * HOTEL.roomTypes * 365;

/* ---------- email ---------- */
const MAIL = { users: 1e9, sent: 10, received: 40, metaKB: 50, attachShare: 0.2, attachKB: 500 };
const mailQps = (MAIL.users * MAIL.sent) / DAY;
const metaPB = (MAIL.users * MAIL.received * 365 * MAIL.metaKB) / 1e12;
const attachPB = (MAIL.users * MAIL.received * 365 * MAIL.attachShare * MAIL.attachKB) / 1e12;

/* ---------- object storage ---------- */
const OBJ = { totalPB: 100, medianMB: 4, metaKB: 1 };
const objects = (OBJ.totalPB * 1e9) / OBJ.medianMB;
const objMetaTB = (objects * OBJ.metaKB) / 1e9;
const EC = { data: 8, parity: 4 };
const ecOverhead = (EC.data + EC.parity) / EC.data;

/* ---------- leaderboard ---------- */
const LB = { dau: 5e6, games: 10, peak: 5, mau: 25e6, bytes: 26 };
const lbQps = (LB.dau * LB.games) / DAY;
const lbMB = (LB.mau * LB.bytes) / 1e6;

/* ---------- wallet ---------- */
const WAL = { tps: 1e6, perNode: 10_000 };
const walNodes = (WAL.tps * 2) / WAL.perNode;

/* ---------- exchange ---------- */
const EX = { ordersPerDay: 1e9, hours: 6.5, peak: 5 };
const exQps = EX.ordersPerDay / (EX.hours * 3600);

export const MORE_B: Chapter[] = [
  {
    id: "proximity",
    title: "Design a proximity service (nearby places)",
    summary: "Given a location and a radius, return the businesses nearby, as Yelp or Google Maps do. Reads dominate and businesses change rarely, so the whole problem is the spatial index: how to find points near a point without scanning every row.",
    points: [
      `**Scale:** ${n0(PROX.dau)} daily users making ${PROX.searches} searches a day is about ${n0(proxQps)} searches per second, over ${n0(PROX.businesses)} businesses.`,
      "**API:** `GET /search/nearby?lat=&lng=&radius=` returns a page of businesses; separate CRUD APIs edit businesses, and edits may appear the next day.",
      "**Services:** a stateless location-based service answers searches from read replicas; a business service handles edits on the primary.",
      "**Naive:** filter by a latitude range and a longitude range. Each index alone returns a huge strip, and intersecting two strips is slow.",
      "**Even grid:** fixed cells are simple, but cities are dense and oceans empty, so cells hold wildly different counts.",
      "**Geohash:** halve the world by longitude, then latitude, again and again, writing the bits as base32. A longer shared prefix usually means closer, so a search reads one cell and its 8 neighbours.",
      `**Quadtree:** split any square holding more than ${PROX.perLeaf} businesses into four, recursively. It adapts to density and answers k-nearest queries; it lives in memory, about ${n1(quadBytes / 1e9)} GB here.`,
      "**Google S2:** maps the sphere onto a Hilbert curve, so nearby points get nearby numbers; good for geofences and arbitrary regions.",
      "**Scaling:** the geo index is small enough for one server, so add read replicas rather than shards. Shard the business table by business ID. Cache by geohash cell, not by raw coordinates.",
    ],
    diagram: `flowchart TB
  U["App: search near me"] --> LB["Load balancer"]
  LB --> LBS["Location service: read only"]:::hot
  LB --> BS["Business service: edits"]
  LBS --> C["Cache: geohash to business IDs"]
  LBS --> R[("Read replicas: geo index + businesses")]
  BS --> P[("Primary database")]
  P -.->|"replicates"| R`,
    caption: "Searches never touch the primary; edits never block searches.",
    table: { head: ["Geohash length", "Cell width", "Cell height", "Use for radius"], rows: [4, 5, 6].map((len) => { const c = geohashCell(len); return [String(len), km(c.w), km(c.h), [0.5, 1, 2, 5].filter((r) => geohashFor(r) === len).map((r) => km(r)).join(", ") || "larger areas"]; }) },
    anim: "sd-proximity",
    cards: [
      { id: "boundary", q: "Two cafes are 10 m apart but their geohashes share no prefix. Why, and what do you do?", a: "They sit on either side of a cell boundary, such as the equator or a major split line, where the codes diverge right at the start. Never search only your own cell: search it and its 8 neighbours. If that returns too few results, drop the last character to widen the cell and repeat." },
      { id: "geo-vs-quad", q: "Geohash or quadtree?", a: "- **Geohash:** a string column with a normal index, easy to shard and to update when a business moves. Fixed cell sizes do not adapt to density.\n- **Quadtree:** adapts to density and finds the k nearest directly, but it is an in-memory structure that must be rebuilt on startup and is awkward to update.\n\nWith rare edits either works; geohash is simpler to run." },
      { id: "no-shard", q: "Why replicate the geo index instead of sharding it?", a: `Each entry is just a geohash and a business ID, so ${n0(PROX.businesses)} businesses fit in a few GB. Sharding would force every search to ask several shards; replicas let any one server answer alone, and adding replicas scales reads.` },
      { id: "cache-key", q: "What should the cache key be?", a: "The geohash cell (and its length), mapping to a list of business IDs, plus a second cache from business ID to details. Raw coordinates are useless as keys: every user stands at a slightly different point, so nothing would ever hit." },
      { id: "radius", q: "How do you pick the geohash length for a radius?", a: `Pick the longest geohash whose cell is at least as large as the radius, then search that cell and its neighbours. With cells computed at the equator, ${[0.5, 1, 2, 5].map((r) => `${km(r)} needs length ${geohashFor(r)}`).join(", ")}.` },
    ],
  },
  {
    id: "nearby",
    title: "Design nearby friends",
    summary: "Show which friends are close to you right now, updating as everyone moves. Unlike nearby places, every point moves every few seconds and every update must reach a few friends, so this is a real-time fan-out problem rather than an index problem.",
    points: [
      `**Scale:** ${n0(NF.dau)} daily users with ${n0(NF.concurrent * 100)}% online at once is ${n0(nfUsers)} users. One update every ${NF.everySec} s each is about ${n0(nfQps)} location updates per second.`,
      "**Connections:** each app keeps a WebSocket to a stateful WebSocket server; profile and friend lists go through ordinary stateless REST servers.",
      "**Location cache:** Redis holds each user's latest position with a TTL, so a user who goes quiet disappears by themselves.",
      "**History:** every update is also written to a write-heavy database such as Cassandra, sharded by user ID.",
      "**Pub/sub:** each user has a Redis pub/sub channel. An update is published to the user's channel; the WebSocket handler of every online friend is subscribed, computes the distance and pushes only if the friend is within range.",
      `**Pub/sub load:** about ${n0(nfPushes)} pushes per second if ${NF.onlineFriends} friends are online on average. At ${n0(NF.pushesPerServer)} per server that is about ${n0(nfPushes / NF.pushesPerServer)} pub/sub servers, spread by a hash ring kept in service discovery.`,
      "**Friend changes:** adding a friend subscribes the handler to the new channel; removing unsubscribes.",
      "**Strangers nearby:** use one channel per geohash cell, and subscribe to your cell and its neighbours.",
    ],
    diagram: `flowchart TB
  A["Asha's phone"] -->|"location every 30 s"| WS["WebSocket server"]
  WS --> LC[("Location cache with TTL")]
  WS --> H[("Location history")]
  WS --> PS["Pub/sub: Asha's channel"]:::hot
  PS --> F["Friends' WebSocket handlers"]
  F --> D{"Within range?"}
  D -- yes --> B["Push to Ben's phone"]:::ok`,
    caption: "Distance is checked by the subscriber, so each friend's own radius setting applies.",
    anim: "sd-nearby",
    cards: [
      { id: "why-ws", q: "Why WebSockets instead of polling?", a: "Updates flow both ways every few seconds. Polling would make millions of requests that mostly return nothing and still add delay. A persistent connection lets the server push the moment a friend moves." },
      { id: "why-pubsub", q: "Why route updates through pub/sub instead of the database?", a: "The database would have to answer \"which online friends care about this update\" millions of times a second. A channel per user turns that into one publish, delivered to exactly the handlers that subscribed, and channels with no subscribers cost almost nothing." },
      { id: "memory", q: "How much memory do the channels need?", a: `About one pointer per subscription: ${n0(NF.dau)} users with ${NF.friends} friends at ${NF.channelBytes} bytes each is about ${n0(nfMemGB)} GB, which a handful of servers hold. The real limit is CPU for pushes, not memory.` },
      { id: "stateful-scale", q: "How do you remove a WebSocket server without dropping users?", a: "Mark it draining at the load balancer so it gets no new connections, then wait for existing ones to close or ask clients to reconnect elsewhere. Stateful servers need this care; stateless ones can simply be killed." },
      { id: "ring-resize", q: "What goes wrong when you add a pub/sub server?", a: "The hash ring moves some channels to the new server, and every handler subscribed to those channels must resubscribe at once, a burst of work and possibly missed updates. Size the cluster with headroom and resize at quiet hours." },
    ],
  },
  {
    id: "maps",
    title: "Design a map and navigation service",
    summary: "Three services: one shows the map (tiles), one records where users are (location updates), and one finds the route and its arrival time (navigation). Most of the heavy work, rendering tiles and turning road data into graphs, happens offline.",
    points: [
      "**Map basics:** points are latitude and longitude; the round Earth is drawn flat with a projection such as Web Mercator, which stretches areas near the poles. Geocoding turns an address into coordinates and back.",
      `**Tiles:** the world is pre-rendered as square images at each zoom level; zoom z has 4^z tiles, so zoom ${MAP.zoom} has ${n0(tiles(MAP.zoom))} tiles. At ${MAP.tileKB} KB each that would be ${n0(tilePB)} PB, but most tiles are empty sea or land and compress to almost nothing.`,
      "**Serving tiles:** the client works out which tiles cover the screen and fetches them from a CDN by a URL built from zoom and position, so tiles are static and cached everywhere. Vector tiles send geometry instead of pixels: smaller and smoother when zooming.",
      "**Road graph:** roads become a graph of intersections and segments, cut into routing tiles. Tiles exist at several levels: detailed local streets, and coarse highway-only tiles for long trips.",
      "**Routing:** a shortest-path search (A* or Dijkstra variants) loads routing tiles on demand, then ranks the candidate routes by user filters such as avoiding tolls.",
      "**ETA:** a machine learning model on live and historical traffic predicts travel time per segment.",
      `**Location updates:** phones record GPS often but send in batches. ${n0(MAP.navigating)} people navigating, each sending a batch every ${MAP.batchSec} s, is about ${n0(mapQps)} writes per second, into Kafka and a write-heavy database.`,
      "**Adaptive ETA:** traffic updates find users whose route crosses the slowed segment and push a new ETA or a reroute over a persistent connection.",
    ],
    diagram: `flowchart TB
  P["Phone"] --> T["Map tiles from CDN"]
  P --> L["Location service"]
  P --> N["Navigation service"]:::hot
  L --> K["Kafka"]
  K --> TR["Live traffic"]
  K --> DB[("User location history")]
  N --> SP["Shortest path on routing tiles"]
  N --> ETA["ETA model"]
  TR --> ETA
  SP --> RK["Ranker: filters, best routes"]`,
    caption: "Location updates feed live traffic, which feeds ETA, which feeds every other user's route.",
    anim: "sd-maps",
    cards: [
      { id: "why-tiles", q: "Why pre-render tiles instead of drawing the map per request?", a: "Rendering a map view from raw data is expensive, and millions of users look at the same places. Pre-rendered tiles are static files: compute once, cache on a CDN, and every client just downloads the few it needs for the current view." },
      { id: "hierarchy", q: "Why keep routing tiles at several levels?", a: "A cross-country route over street-level tiles would load an enormous graph. With levels, the search uses detailed tiles near the start and end and highway-only tiles in between, so the graph it explores stays small." },
      { id: "batch-gps", q: "Why do phones batch location updates?", a: "Sending every GPS reading would multiply request count and drain the battery. A batch every few seconds keeps the server's write rate manageable while keeping enough points for traffic estimation." },
      { id: "reroute", q: "Traffic jams up on a road. How do affected drivers find out?", a: "The traffic updater marks the slowed segments. The service looks up active navigation sessions whose remaining route uses those segments, recomputes their ETA and possibly a better route, and pushes the result to those phones over their open connection." },
      { id: "projection", q: "Why does Greenland look as big as Africa on many web maps?", a: "Web Mercator keeps angles and shapes locally correct, which navigation needs, but stretches areas more and more toward the poles. Africa is actually many times larger." },
    ],
  },
  {
    id: "adclick",
    title: "Design ad click aggregation",
    summary: "Count clicks per ad per minute, and find the most-clicked ads, from a stream of billions of events. The results decide how much advertisers pay, so correctness matters as much as speed: no lost clicks, no double counting, and late events handled on purpose.",
    points: [
      `**Scale:** ${n0(AD.clicksPerDay)} clicks a day is about ${n0(adQps)} per second on average and ${n0(adQps * AD.peak)} at a ${AD.peak} times peak. At ${AD.eventKB} KB per event, raw data grows about ${n0(adGBDay)} GB a day.`,
      "**Queries:** clicks on ad X in the last M minutes, the top N ads in the last minute, both filterable by country, IP or user.",
      "**Keep raw and aggregated data:** aggregates answer queries fast; raw events let you recompute when a bug is found.",
      "**Pipeline:** click logs, then Kafka, then an aggregation service (map by ad ID, count per minute in memory, reduce to the top N), then a second Kafka topic, then a writer into the aggregation database.",
      "**Kappa, not lambda:** one streaming path for everything; reprocess history by replaying raw data through the same code instead of maintaining a separate batch system.",
      "**Event time:** count a click in the minute it happened, not the minute it arrived. A watermark waits a little for late events; anything later is fixed by a daily reconciliation.",
      "**Windows:** tumbling one-minute windows for counts, sliding windows for \"top N in the last M minutes\".",
      "**Exactly once:** save each aggregation result together with the Kafka offset it covers, and deduplicate events by ID.",
      "**Hot ads:** a very popular ad gets more aggregation nodes, each counting part of its clicks.",
    ],
    diagram: `flowchart TB
  LW["Click logs"] --> K1["Kafka: raw clicks"]
  K1 --> RAW[("Raw data store")]
  K1 --> AG["Aggregation: map, count per minute, top N"]:::hot
  AG --> K2["Kafka: results + offsets"]
  K2 --> DB[("Aggregation database")]
  DB --> Q["Query service: dashboards, billing"]
  RAW -.->|"daily reconciliation"| DB`,
    caption: "The second Kafka topic lets the writer commit results and offsets together.",
    table: { head: ["Window", "Shape", "Used for"], rows: [
      ["Tumbling", "fixed, back to back, no overlap", "clicks per ad per minute"],
      ["Hopping", "fixed size, starts every step, overlapping", "rolling totals"],
      ["Sliding", "moves with each event", "top N in the last M minutes"],
      ["Session", "ends after a gap of inactivity", "per-user browsing sessions"],
    ] },
    anim: "sd-adclick",
    cards: [
      { id: "event-time", q: "Event time or processing time?", a: "Event time, the moment the click happened, because billing is about when clicks happened. Processing time is simpler and never late, but a delayed batch of clicks would be counted in the wrong minute. The cost of event time is handling events that arrive after their window closed." },
      { id: "watermark", q: "What is a watermark and how long should it be?", a: "An extension to each window: keep it open a little longer, say 15 seconds, for stragglers. Longer is more accurate but delays every result by that much. Events later than the watermark are rare, so let a daily batch over raw data correct them." },
      { id: "exactly-once", q: "How do you avoid double counting when an aggregator crashes?", a: "Make the result and its position in the input one atomic unit: write the aggregate together with the Kafka offset it covers. On restart, resume from the last committed offset, so each event is counted exactly once. Deduplicate by event ID for clicks the client sent twice." },
      { id: "raw-why", q: "Why keep raw events if you already store aggregates?", a: "Aggregates cannot be un-aggregated. When a bug in the counting code is found, or a new breakdown is needed, only raw data lets you recompute. It also backs audits and billing disputes." },
      { id: "kappa", q: "Lambda or kappa architecture?", a: "Lambda runs a batch path and a streaming path and merges them, which means two codebases that must agree. Kappa uses only streaming and handles reprocessing by replaying stored events through the same job. Kappa is simpler when the stream processor is reliable." },
    ],
  },
  {
    id: "hotel",
    title: "Design a hotel reservation system",
    summary: "Search rooms, reserve, pay, cancel. Traffic is modest, but two requirements are strict: never sell a room twice, and never charge a guest twice for one click. Allowing a little overbooking, as hotels really do, is part of the design.",
    points: [
      `**Scale:** ${n0(HOTEL.hotels)} hotels with ${n0(HOTEL.rooms)} rooms, ${n0(HOTEL.occupancy * 100)}% full, with stays of ${HOTEL.stay} days, is about ${n0(resPerDay)} reservations a day, only a few per second.`,
      "**Reserve by room type, not room number:** guests book \"a double room\"; a specific room is assigned at check-in.",
      "**Inventory table:** one row per hotel, room type and date, with `total_inventory` and `total_reserved`. A stay of 3 nights checks and updates 3 rows.",
      `**Size:** ${n0(HOTEL.hotels)} hotels with ${HOTEL.roomTypes} room types for 365 days is ${n0(inventoryRows)} rows a year: one database handles it.`,
      "**Overbooking:** allow `total_reserved` up to, say, 110% of `total_inventory`, because some guests cancel or never arrive.",
      "**Double click:** the booking page gets a reservation ID when it loads; the database rejects a second insert with that ID.",
      "**Last room race:** two guests check availability at once and both see one room. Use a lock, a version check or a database constraint so only one succeeds.",
      "**Scale out:** shard by hotel ID; cache availability in Redis for search, but always make the final check in the database.",
    ],
    diagram: `flowchart TB
  G["Guest"] --> S["Search: cached availability"]
  G --> R["Reservation service"]:::hot
  R --> I[("Inventory per hotel, room type, date")]
  R --> RS[("Reservations")]
  R --> P["Payment service"]
  I -.->|"change data capture"| C["Availability cache"]
  C --> S`,
    caption: "Search may be a little stale; the reservation itself is checked against the database.",
    table: { head: ["Option", "How", "Good when", "Cost"], rows: [
      ["Pessimistic lock", "`SELECT ... FOR UPDATE` on the inventory rows", "contention is high", "blocks other bookers, risk of deadlock"],
      ["Optimistic lock", "a version column; update only if unchanged, else retry", "contention is low", "retries pile up under contention"],
      ["Database constraint", "`CHECK (total_reserved <= total_inventory)`", "simple schemas", "same retries; not every database supports it"],
    ] },
    anim: "sd-hotel",
    cards: [
      { id: "last-room", q: "Two guests book the last room at the same moment. What stops both succeeding?", a: "The update must be conditional. For example: `UPDATE room_type_inventory SET total_reserved = total_reserved + 1, version = version + 1 WHERE ... AND version = 7`. The first update changes the version, so the second matches no row and fails, and that guest retries and sees the room is gone." },
      { id: "double-click", q: "The guest double-clicks Book. How do you avoid two reservations?", a: "Generate the reservation ID before the request, when the page loads, and make it the primary key. The second request carries the same ID, the insert hits the unique constraint, and the server returns the first result. This is an idempotency key." },
      { id: "per-date", q: "Why store inventory per date instead of per reservation?", a: "Checking availability for dates is then a read of a few rows, one per night, and booking is an update of those same rows. Deriving availability from a list of overlapping reservations would mean scanning and summing them on every search." },
      { id: "saga", q: "Reservation and payment are separate services. How do they stay consistent?", a: "Either keep reservation and inventory in one database so one transaction covers both, or use a saga: reserve, then charge, and if the charge fails run the compensating step that releases the room. Two-phase commit also works but blocks everyone while the coordinator is down." },
      { id: "stale-cache", q: "Search says a room is free, but booking fails. Is that a bug?", a: "No, it is the intended trade-off. Search reads a cache that lags slightly, which keeps it fast; correctness is enforced only at booking time against the database. The guest sees a clear \"just sold out\" message." },
    ],
  },
  {
    id: "email",
    title: "Design an email service",
    summary: "Send, receive, store, search and sync mail for a billion users. Old mail servers kept each mailbox as files on one disk; a large service splits that into stateless web servers, queues, a metadata database, an attachment store and a search index, and spends real effort on getting mail delivered.",
    points: [
      `**Scale:** ${n0(MAIL.users)} users sending ${MAIL.sent} mails a day is about ${n0(mailQps)} sends per second. Receiving ${MAIL.received} a day with ${MAIL.metaKB} KB of metadata each is about ${n0(metaPB)} PB a year; attachments add about ${n0(attachPB)} PB.`,
      "**Protocols:** SMTP moves mail between servers; POP downloads and usually deletes it; IMAP keeps mail on the server and syncs folders; web and mobile apps use HTTPS APIs. DNS MX records say which server accepts mail for a domain.",
      "**Sending:** API, then an outgoing queue, then SMTP workers that check for spam and viruses and retry when the receiving server is down.",
      "**Receiving:** SMTP servers, then an incoming queue, then workers that filter spam, store the mail, and notify the user's real-time server if they are online.",
      "**Real-time servers:** hold WebSocket connections and push new mail to open apps.",
      "**Metadata database:** reads are per user and mostly recent mail, never across users. A wide-column store partitioned by user ID, with a time-ordered email ID, fits that exactly.",
      "**Attachments:** in object storage, with only a reference in the metadata.",
      "**Deliverability:** dedicated sending IPs warmed up slowly, separate IPs for marketing and for important mail, quick bans for spammers, bounce and complaint feedback, and SPF, DKIM and DMARC records.",
    ],
    diagram: `flowchart TB
  U["Web and mobile apps"] --> W["Web servers: send, list, read, search"]
  U --> RT["Real-time servers: push new mail"]
  W --> OQ["Outgoing queue"] --> SO["SMTP out: spam check, retry"]
  IN["SMTP in"] --> IQ["Incoming queue"] --> MP["Mail processing: spam filter"]
  MP --> M[("Metadata by user")]:::hot
  MP --> A[("Attachment store")]
  MP --> RT
  W --> M`,
    caption: "Queues on both sides absorb bursts and remote servers that are down.",
    anim: "sd-email",
    cards: [
      { id: "imap-pop", q: "IMAP or POP?", a: "POP downloads mail to one device and usually deletes it from the server, so a second device sees nothing. IMAP keeps mail on the server and syncs folders and read state across devices, which is what people expect today." },
      { id: "nosql", q: "Why a wide-column store rather than a relational database for metadata?", a: "The volume is enormous, every query is within one user's mailbox, and recent mail is read most. Partitioning by user ID with mail sorted newest first gives each query one partition and a sequential read. Cross-user joins, the strength of SQL, are never needed." },
      { id: "unread", q: "How do you list unread mail if the store cannot filter on a non-key column?", a: "Denormalize: keep separate tables (or partitions) for read and unread mail per folder, and move a row between them when it is read. Writes do a little more work so the common reads stay single-partition lookups." },
      { id: "spf", q: "What do SPF, DKIM and DMARC do?", a: "- **SPF:** a DNS record listing which servers may send mail for the domain.\n- **DKIM:** a signature on each message, checked with a public key in DNS, proving it was not altered.\n- **DMARC:** tells receivers what to do when SPF or DKIM fail (deliver, quarantine, reject) and where to send reports.\n\nWithout them, big providers send your mail to spam." },
      { id: "search", q: "How would you build search over a user's mail?", a: "Index each mail asynchronously (through Kafka) into a search engine such as Elasticsearch, keyed by user so a query touches one user's index. A custom per-user index built on an LSM store is an alternative that some providers run at their scale. Either way the index lags slightly behind new mail." },
    ],
  },
  {
    id: "objectstore",
    title: "Design object storage like S3",
    summary: "Store any number of immutable objects in buckets, each addressed by a key, and never lose one. The design separates small, frequently changed metadata from huge, write-once data, and spends its cleverness on durability and on packing small objects efficiently.",
    points: [
      "**Model:** a bucket has a globally unique name; an object is bytes plus metadata, addressed by bucket and key. Objects are replaced whole, never edited in place.",
      `**Scale:** ${OBJ.totalPB} PB with a median object of ${OBJ.medianMB} MB is about ${n0(objects / 1e9)} billion objects; at ${OBJ.metaKB} KB of metadata each that is ${n0(objMetaTB)} TB of metadata.`,
      "**Components:** a stateless API service (authentication, validation), a metadata service (buckets and objects), and a data store of data nodes run by a placement service that knows every node's location and health.",
      "**Upload:** the API stores the bytes in the data store, which returns an object ID, then records bucket, key and object ID in the metadata store.",
      "**Small objects:** instead of one file per object, append many objects into large files; a lookup table on each node maps object ID to file, offset and size.",
      "**Durability:** copies go to different racks and availability zones. Erasure coding saves space: data plus parity chunks, any of which can be rebuilt from the rest.",
      "**Correctness:** a checksum per object (and per file) catches silent disk corruption on read.",
      "**Listing:** keys are flat; \"folders\" are a prefix filter. Sharding metadata by bucket and key makes listing a scatter-gather, so a listing table per bucket is often kept as well.",
      "**Large files:** multipart upload sends parts in parallel and retries only failed parts.",
      "**Deletes:** mark objects deleted and reclaim space later with compaction that copies live objects into new files.",
    ],
    diagram: `flowchart TB
  CL["Client"] --> API["API service: auth, validation"]
  API --> MS[("Metadata: bucket, key, object ID")]
  API --> DR["Data routing"]
  DR --> PL["Placement service: cluster map, heartbeats"]
  DR --> DN["Primary data node"]:::hot
  DN --> RP["Replicas or erasure-coded chunks in other zones"]`,
    caption: "Metadata and data scale separately: one is small and changes; the other is huge and written once.",
    table: { head: ["Method", "Storage used per byte", "Survives", "Cost"], rows: [
      ["3 replicas", "3x", "2 lost copies", "simple, fast reads"],
      [`Erasure coding ${EC.data} + ${EC.parity}`, `${n1(ecOverhead)}x`, `${EC.parity} lost chunks`, `reads and repairs need ${EC.data} chunks and some computing`],
    ] },
    anim: "sd-objectstore",
    cards: [
      { id: "split", q: "Why separate the metadata store from the data store?", a: "They have opposite shapes. Metadata is small, queried by key and prefix, and updated (versions, deletes); it suits a database. Data is enormous, written once and read in large chunks; it suits plain files on many disks. Separating them lets each be scaled and tuned on its own." },
      { id: "erasure", q: "Erasure coding or replication?", a: `Replication stores 3 full copies and reads from any one. Erasure coding with ${EC.data} data and ${EC.parity} parity chunks stores ${n1(ecOverhead)}x the data, survives ${EC.parity} lost chunks, but every read gathers ${EC.data} chunks from different nodes and every repair needs computation. Use replication for hot data and erasure coding for the bulk.` },
      { id: "small", q: "Why not store each small object as its own file?", a: "Billions of tiny files waste disk blocks and exhaust inodes, and file system metadata becomes the bottleneck. Appending objects into large files and keeping an ID to file-and-offset table gives sequential writes and few files." },
      { id: "versions", q: "How does versioning work, and what does delete do?", a: "Each upload of a key adds a new version row with a time-ordered version ID instead of overwriting. A delete adds a delete marker as the newest version, so a plain read finds nothing but older versions remain until removed explicitly or by a lifecycle rule." },
      { id: "multipart", q: "How is a 10 GB upload made reliable?", a: "Multipart upload: start the upload and get an ID, send parts in parallel (each acknowledged with a checksum), retry only the parts that fail, then complete by listing the parts in order. Parts of uploads never completed are cleaned up by garbage collection." },
    ],
  },
  {
    id: "leaderboard",
    title: "Design a real-time leaderboard",
    summary: "Players win matches, scores rise, and everyone wants the top 10 and their own rank, live. Ranking millions of players on every request is the expensive part, and a Redis sorted set does it in logarithmic time.",
    points: [
      `**Scale:** ${n0(LB.dau)} daily players with ${LB.games} games each is about ${n0(lbQps)} score updates per second, ${n0(lbQps * LB.peak)} at peak.`,
      "**Features:** top 10, a player's own rank, the players just above and below, and a fresh board every month.",
      "**SQL:** `ORDER BY score DESC` works for the top 10 with an index, but a player's rank means counting everyone above them, which grows with the table.",
      "**Redis sorted set:** each member has a score; a skip list keeps them ordered. `ZINCRBY` adds points, `ZREVRANGE 0 9` returns the top 10 and `ZREVRANK` a player's rank, each in about log n time.",
      `**Size:** ${n0(LB.mau)} monthly players at about ${LB.bytes} bytes each is about ${n0(lbMB)} MB, plus sorted set overhead: one Redis node.`,
      "**Monthly reset:** use one key per month, such as `leaderboard_2026_11`, and start a new key when the month changes.",
      "**Trust:** only the game server may report a win; clients never send scores directly.",
      "**Bigger scale:** shard by score range, so the top 10 is always in one shard and a rank is the rank inside its shard plus the counts of the shards above.",
    ],
    diagram: `flowchart TB
  P["Player wins a match"] --> GS["Game service: validates the win"]
  GS --> LS["Leaderboard service"]
  LS --> R[("Redis sorted set for this month")]:::hot
  LS --> UP[("Player profiles")]
  U["Player opens the board"] --> LS
  R --> TOP["Top 10 + my rank + my neighbours"]:::ok`,
    caption: "Scores and ranks come from Redis; names and avatars come from the profile store.",
    anim: "sd-leaderboard",
    cards: [
      { id: "why-zset", q: "Why a sorted set instead of a database query?", a: "A sorted set keeps members ordered as scores change, using a skip list plus a hash. Updating a score, fetching a range and finding a member's rank are all about log n. A database query for a rank has to count the rows above, which costs more as the table grows." },
      { id: "ties", q: "Two players have the same score. Who ranks higher?", a: "Usually whoever reached it first. Encode the tie-break into the sorted set score, for example the points in the high digits and the time remaining until a far-future moment in the low digits, or keep a second sort key and resolve ties in the service." },
      { id: "shard", q: "One Redis node is not enough. How do you shard?", a: "- **By score range:** each shard holds a band of scores. The top 10 is in the top shard; a rank is the local rank plus the sizes of higher shards. A player moves between shards as their score crosses a boundary.\n- **By hash:** spread players evenly, but the top 10 needs every shard (scatter-gather) and an exact rank is hard.\n\nScore ranges keep the common queries cheap." },
      { id: "reset", q: "How do you reset the board each month without downtime?", a: "Do not reset: write to a new key named for the new month. Old months stay readable for history and can be expired later." },
      { id: "cheat", q: "How do you stop players posting fake scores?", a: "Never accept a score from the client. The game server, which ran the match, calls the leaderboard service with the result; the client only reads. Add rate checks for impossible score jumps." },
    ],
  },
  {
    id: "wallet",
    title: "Design a digital wallet",
    summary: "Move money between wallets at very high rates without ever creating or losing a cent, and be able to prove every balance by replaying history. The design moves from database transactions, to distributed transaction protocols, to event sourcing.",
    points: [
      `**Scale:** ${n0(WAL.tps)} transfers a second means ${n0(WAL.tps * 2)} balance changes (one debit, one credit). At ${n0(WAL.perNode)} transactional updates per database node that is ${n0(walNodes)} nodes.`,
      "**In-memory shards:** balances in Redis, sharded by account. Fast, but a transfer between two shards is not atomic, and a crash can lose money.",
      "**Two-phase commit:** a coordinator asks every database to prepare, then to commit. Correct, but locks are held across the network and a stuck coordinator blocks everyone.",
      "**Try-Confirm/Cancel (TC/C):** each step is its own local transaction: try (reserve or debit), then confirm, or cancel to undo. No long locks, but every step needs a cancel action and the coordinator must record each phase.",
      "**Saga:** run the steps in order; if one fails, run the compensating steps backwards. Orchestrated by one coordinator, or choreographed through events.",
      "**Event sourcing:** store validated commands as immutable events (\"A sent B 5\"); balances are derived by applying events in order. Any past balance can be rebuilt, which auditors love.",
      "**CQRS:** writes append events; read views (balances, statements) are projected from the event stream.",
      "**Speed:** keep the event log in append-only files (memory-mapped), keep state in a local embedded store, and take snapshots so restarts do not replay from the beginning.",
      "**Reliability:** only the event log must be durable; replicate it with Raft to several nodes.",
    ],
    diagram: `flowchart TB
  C["Transfer request: A pays B 5"] --> V["Validate against current state"]
  V --> E["Append event to log"]:::hot
  E --> R["Replicate log with Raft"]
  E --> S["Apply event: A minus 5, B plus 5"]
  S --> Q["Read views: balances, statements"]
  E -.->|"replay from snapshot"| S`,
    caption: "The event log is the truth; balances are a cache that can always be rebuilt.",
    table: { head: ["", "Two-phase commit", "TC/C", "Saga"], rows: [
      ["Locks held across services", "yes, until commit", "no", "no"],
      ["Undo", "rollback", "cancel step per service", "compensating steps in reverse"],
      ["Consistency", "strong", "eventual", "eventual"],
      ["Main risk", "coordinator blocks everyone", "cancel arrives before try", "a compensation can fail"],
    ] },
    anim: "sd-wallet",
    cards: [
      { id: "why-es", q: "Why use event sourcing for a wallet?", a: "Every balance can be explained and rebuilt by replaying the events, which makes audits and bug investigations possible. Events are immutable, so history cannot be quietly changed, and the same events can feed new read views later." },
      { id: "out-of-order", q: "In TC/C, the cancel arrives before the try. What happens?", a: "The participant records that it saw a cancel for that transaction with no try, and returns success. When the late try arrives, it sees the record and refuses to act. Without that record, the try would reserve money that nobody will ever release." },
      { id: "saga-fail", q: "What if a compensating step itself fails?", a: "Retry it, because compensations must be idempotent and eventually succeed. If they still fail, escalate to a person with full context. This is why money flows also keep a ledger and run reconciliation." },
      { id: "snapshot", q: "Replaying years of events on every restart is slow. What fixes it?", a: "Periodic snapshots of the state, tagged with the last event they include. On restart, load the latest snapshot and replay only the events after it." },
      { id: "determinism", q: "Why must applying events be deterministic?", a: "Replicas and rebuilds apply the same events and must reach the same balances. So the state machine may not read clocks, random numbers or anything outside the event; any such value must already be recorded in the event." },
    ],
  },
  {
    id: "exchange",
    title: "Design a stock exchange",
    summary: "Match buy and sell orders fairly, in strict order, with latency measured in microseconds, and publish what happened to everyone at the same time. The design puts the critical path on as few machines and network hops as possible and makes it deterministic.",
    points: [
      `**Scale:** ${n0(EX.ordersPerDay)} orders in a ${EX.hours}-hour trading day is about ${n0(exQps)} orders per second on average, ${n0(exQps * EX.peak)} at peak.`,
      "**Basics:** brokers connect retail clients to the exchange. A limit order names a price; a market order takes the best available price. The order book lists open buy orders (bids) and sell orders (asks) by price.",
      "**Market data:** L1 is the best bid and ask; L2 adds the quantity at each price level; L3 shows every order. Candlestick charts summarize open, high, low, close and volume per interval.",
      "**Trading path:** client gateway (authentication, rate limits, validation), order manager (risk checks, funds), sequencer (stamps every order with a sequence number), matching engine (one order book per symbol), then executions back the same way.",
      "**Matching:** price-time priority: the best price first, and at one price the earliest order first.",
      "**Order book:** a doubly linked list of orders at each price, a map from price to level, and a map from order ID to its list node, so adding, cancelling and matching are constant time.",
      "**Low latency:** run the critical path on one server, each component a single thread pinned to a CPU core, passing events through shared memory instead of the network.",
      "**Event sourcing and determinism:** the sequenced events are the truth; replaying them always produces the same book and trades.",
      "**High availability:** a warm standby matching engine replays the same events and takes over; the event log is replicated with Raft.",
      "**Fair market data:** multicast sends each update to all subscribers at the same time instead of one after another.",
    ],
    diagram: `flowchart TB
  B["Broker"] --> GW["Client gateway: auth, rate limit"]
  GW --> OM["Order manager: risk, funds"]
  OM --> SQ["Sequencer: numbers every event"]:::hot
  SQ --> ME["Matching engine: order book per symbol"]
  ME --> SQ2["Sequencer: numbers executions"]
  SQ2 --> MD["Market data publisher: multicast"]
  SQ2 --> RP["Reporter: trades to database"]
  SQ2 --> OM`,
    caption: "Everything on the critical path is sequenced, so it can be replayed exactly.",
    anim: "sd-exchange",
    cards: [
      { id: "book", q: "What data structure holds an order book?", a: "For each side, price levels in sorted order, each level a doubly linked list of orders in arrival time. A map from price to level finds a level directly, and a map from order ID to its list node makes cancels constant time. The best bid and ask are the ends of the sorted levels." },
      { id: "one-box", q: "Why put the whole critical path on one server?", a: "Every network hop adds latency and jitter. Single-threaded components pinned to cores, talking through shared memory, avoid locks, context switches and the network, so latency becomes small and predictable." },
      { id: "sequencer", q: "What is the sequencer for?", a: "It gives every incoming order and every outgoing execution a strictly increasing number. That defines one fair order of events, makes gaps detectable, and lets any component or standby rebuild exactly the same state by replaying events in sequence." },
      { id: "failover", q: "The matching engine server dies mid-day. What happens?", a: "A warm standby has been receiving and applying the same sequenced events all along, so its order book is already identical. It is promoted and continues from the next sequence number. The event log, replicated with Raft, guarantees no acknowledged event is lost." },
      { id: "fair-data", q: "How do you make market data fair to all subscribers?", a: "Publish with multicast so every subscriber on the network receives an update at the same moment, rather than sending to subscribers one after another, which would favour whoever is first in the list." },
    ],
  },
];
