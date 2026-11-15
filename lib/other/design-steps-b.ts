// Step-by-step versions of the classic System Design chapters, each in the seven steps of a design round
// (DESIGN_FRAME). Every number is computed here from the stated inputs. Merged into the chapters by design.ts.
import { DESIGN_FRAME, fmt, framed, perSec } from "./design-calc.ts";
import type { Step } from "./types.ts";

const MONTH = 30 * 86_400;
/* ---------- worked numbers ---------- */
const kvKeys = 1e9, kvTb = (kvKeys * 1_000) / 1e12, kvNodes = Math.ceil((kvTb * 3) / 0.5);
const mqRate = 1e6, mqTb = (mqRate * 1_000 * 86_400 * 7 * 3) / 1e12;
const urlNew = 100e6, urlW = urlNew / MONTH, urlR = urlW * 100, urlRows = urlNew * 12, urlGb = (urlRows * 500) / 1e9, urlCodes = 62 ** 7, urlYears = urlCodes / urlRows;
const crPages = 1e9, crRate = crPages / MONTH, crTbMonth = (crPages * 500e3) / 1e12, crPb5 = (crTbMonth * 12 * 5) / 1_000;
const noPush = 10e6, noSms = 1e6, noMail = 5e6;
const feDau = 300e6, feReads = perSec(feDau * 10), fePosts = perSec(feDau * 1), feFans = 200, feFanRate = fePosts * feFans;
const meDau = 500e6, meMsgs = meDau * 40, meRate = perSec(meMsgs), meTbDay = (meMsgs * 100) / 1e12, meOnline = meDau * 0.2, mePerGw = 500_000, meGws = Math.ceil(meOnline / mePerGw);
const taDau = 10e6, taReq = taDau * 10 * 20, taRate = perSec(taReq);
const viHoursDay = 500 * 60 * 24, viPbDay = (viHoursDay * 3) / 1e6, viViews = 5e9, viRate = perSec(viViews);
const stUsers = 50e6, stDau = 10e6, stUploads = perSec(stDau * 2), stPb = (stUsers * 2) / 1e6;
const prDau = 100e6, prRate = perSec(prDau * 5);
const nbDau = 100e6, nbOnline = nbDau * 0.1, nbRate = nbOnline / 30, nbPush = nbRate * 40, nbServers = Math.ceil(nbPush / 100_000);
const mpTiles = 4 ** 21, mpNav = 10e6, mpRate = mpNav / 15;
const meSeries = 1_000 * 100 * 100, mePoints = meSeries / 10, meRawTb = (mePoints * 86_400 * 16) / 1e12, meCompGb = (mePoints * 86_400 * 2) / 1e9;

export const STEPS_B: Record<string, Step[]> = {
  kvstore: framed(DESIGN_FRAME, [
    "Two calls, `put(key, value)` and `get(key)`, with small values (under 10 KB). It must stay **available** when machines fail, scale to billions of keys, answer in milliseconds, and let each use choose its own consistency.",
    `${fmt(kvKeys)} keys of about 1 KB is ${fmt(kvTb)} TB, ${fmt(kvTb * 3)} TB with 3 replicas. At 0.5 TB of usable disk per node that is at least **${kvNodes} nodes**, so the data must be partitioned.`,
    "`put(key, value, context)` and `get(key)` returning the value (or several conflicting versions) plus a context, a vector clock the client passes back on its next write.",
    "Each node stores key, value and vector clock. On disk: a commit log for durability, an in-memory table, and sorted files (SSTables) flushed from it and merged by compaction.",
    "Any node can coordinate a request. It hashes the key onto a **consistent hashing ring** with virtual nodes and sends it to the next N distinct servers clockwise, ideally in different data centres. Nodes learn who is alive by gossip.",
    "- **Quorum:** wait for W write acks and R read replies; W + R > N gives read-your-latest-write.\n- **Conflicts:** concurrent writes produce sibling versions with vector clocks, merged on read.\n- **Failures:** a sloppy quorum writes to a stand-in that hands the data back later (hinted handoff); Merkle trees find which key ranges differ between replicas.\n- **Reads:** memory first, then a Bloom filter per SSTable skips files that cannot hold the key.",
    "This design leans to **availability**: it accepts conflicting writes and merges later. A log-structured store makes writes fast and reads a little slower. Tuning N, W and R moves each use along the latency against consistency line.",
  ]),
  mq: framed(DESIGN_FRAME, [
    "Producers publish to topics; consumer groups read them at their own pace. Keep order for messages with the same key, keep data for days so consumers can replay, deliver at least once, and let throughput and durability be tuned.",
    `${fmt(mqRate)} messages a second of 1 KB is 1 GB/s in. Kept 7 days with 3 replicas: about **${fmt(mqTb)} TB** of disk, so many brokers and many partitions.`,
    "`produce(topic, key, value)` returns the partition and offset. `fetch(topic, partition, offset, max_bytes)` returns a batch. `commit(group, partition, offset)` saves how far a group has read.",
    "A partition is an append-only log cut into segment files, each with an index from offset to file position. A message holds key, value, timestamp, offset, size and a CRC checksum.",
    "Producers send to the **leader** of each partition; followers on other brokers copy it. Consumers in a group each own some partitions and **pull** batches. A coordinator tracks group members; topic metadata and leaders live in a Raft quorum (or ZooKeeper).",
    "- **Durability:** `acks=all` waits for every in-sync replica; `acks=1` only the leader.\n- **Rebalancing:** when a consumer joins or dies, its partitions move to others.\n- **Speed:** sequential disk writes, the OS page cache, batching and zero-copy sends.\n- **Delivery:** commit the offset after processing for at-least-once; make processing idempotent for effectively-once.",
    "More partitions give more parallelism but order only holds inside one partition. `acks=all` is safest and slowest. Pull lets slow consumers keep up at their own pace, at the cost of polling. Larger batches raise throughput and add milliseconds.",
  ]),
  url: framed(DESIGN_FRAME, [
    "Shorten a long URL, redirect anyone who opens the short one, maybe custom aliases and expiry. Reads outnumber writes about **100 to 1**, redirects must be fast, and every code must be unique.",
    `${fmt(urlNew)} new URLs a month is about **${fmt(urlW)} writes per second** and ${fmt(urlR)} reads per second. A year is ${fmt(urlRows)} rows; at 500 bytes each, about ${fmt(urlGb)} GB. 7 base62 characters give ${fmt(urlCodes)} codes, enough for about ${fmt(urlYears)} years at this rate.`,
    "`POST /urls {long_url, alias?, expires_at?}` returns `{code}`. `GET /{code}` answers **301** (permanent, browsers cache it) or **302** (temporary, every click reaches you, so you can count clicks).",
    "One table: `code` (primary key), `long_url`, `user_id`, `created_at`, `expires_at`. Lookups are only by code, so a key-value store works as well as SQL; shard by code when it grows.",
    "Write: the API gets a unique number from an ID generator, encodes it in base62 and stores the row. Read: look up the code in **Redis**, fall back to the database on a miss, and redirect.",
    "- **Making codes:** hashing the URL and taking 7 characters needs a collision check and retry. A counter or Snowflake ID encoded in base62 never collides.\n- **Guessable codes:** sequential codes let people walk through every link; shuffle the bits or add a random part.\n- **Hot links:** a viral link is one key; the cache and a CDN in front of redirects absorb it.",
    "301 saves load, 302 keeps analytics. Counter-based codes are simple but predictable; random ones need collision checks. With a 100:1 read ratio the cache does most of the work, so its hit rate is the number to watch.",
  ]),
  crawler: framed(DESIGN_FRAME, [
    "Download a billion pages a month starting from seed URLs, store them, and follow their links. Be **polite** (do not overload any site, obey robots.txt), skip duplicates and traps, recrawl pages that change, and survive bad pages and crashes.",
    `${fmt(crPages)} pages a month is about **${fmt(crRate)} pages per second**, ${fmt(crRate * 2)} at peak. At 500 KB a page that is ${fmt(crTbMonth)} TB a month and about ${fmt(crPb5)} PB over 5 years.`,
    "Internal interfaces rather than a public API: `frontier.push(url, priority)`, `frontier.pop()` returning a URL whose host may be fetched now, `fetch(url)` and `store(url, html, hash)`.",
    "A page store in object storage; a metadata table per URL (last crawl time, how often it changed, content hash); a **URL seen** set (a Bloom filter or a hash table); and the frontier's queues, one per host.",
    "Seeds go into the **frontier**. Downloaders take URLs, resolve DNS from a cache, check robots.txt, fetch the page. A parser checks \"content seen?\" by hash, extracts links, filters them, checks \"URL seen?\", and new URLs go back into the frontier.",
    "- **Politeness:** back queues hold one host each; a worker waits between requests to the same host.\n- **Priority:** front queues order URLs by importance and change rate before they reach the back queues.\n- **Dedupe:** a Bloom filter for URLs, a content hash for the same page at different URLs.\n- **Traps:** cap URL length and depth, and block hosts that generate endless pages.",
    "Breadth-first with priorities instead of depth-first, so important pages come early and no site is hammered. A Bloom filter may skip a few new pages by mistake in exchange for tiny memory. Recrawling more often costs bandwidth but keeps the index fresh.",
  ]),
  notifications: framed(DESIGN_FRAME, [
    "Other services ask to notify a user by push (iOS, Android), SMS or email. Respect each user's preferences, quiet hours and a frequency cap, deliver within seconds, never send the same notification twice, and keep working when one provider is down.",
    `Say ${fmt(noPush)} push, ${fmt(noSms)} SMS and ${fmt(noMail)} emails a day: about ${fmt(perSec(noPush))} push per second on average. Averages mislead here: a marketing campaign can send millions in minutes, so queues must absorb bursts.`,
    "`POST /v1/notifications {user_id, template_id, params, channels?, idempotency_key}`, callable only by authenticated internal services. It returns at once; delivery happens asynchronously.",
    "Users with phone and email; devices with token and platform; preferences per user, channel and notification type; templates; and a **notification log** with status and attempts for every send.",
    "The notification service authenticates the caller, checks the idempotency key, loads preferences and contact details, applies limits, renders the template, and puts one message on **a queue per channel**. Channel workers call APNs, FCM, the SMS or email provider, and record the result.",
    "- **No duplicates:** the idempotency key is stored and checked before anything is queued.\n- **Retries:** temporary failures retry with backoff; permanent ones (invalid token) stop and clean up.\n- **Priority:** one-time passwords go on a faster queue than marketing.\n- **Quiet hours:** a scheduler holds messages until the user's morning in their timezone.",
    "At-least-once delivery plus dedupe instead of exactly-once. Separate queues per channel keep one provider's outage local. Strict caps and quiet hours send fewer messages but keep users from turning notifications off forever.",
  ]),
  feed: framed(DESIGN_FRAME, [
    "Users post and follow others; the home feed shows recent posts from people they follow, loading in under about 200 ms. Chat adds real-time delivery of messages to users who are online.",
    `${fmt(feDau)} daily users reading their feed 10 times a day is about **${fmt(feReads)} feed reads per second**. One post each per day is ${fmt(fePosts)} posts per second; pushed to ${feFans} followers on average that is about **${fmt(feFanRate)} feed inserts per second**.`,
    "`POST /posts`, `POST /follows/{user_id}`, `GET /feed?cursor=` returning a page of posts and the next cursor. Chat runs over a WebSocket: send a message, receive messages and acks.",
    "Posts (id, author, text, media, time); follows (follower, followee); and a **feed cache** per user in Redis holding only post IDs, capped at a few hundred. Post bodies are cached separately and shared by everyone.",
    "Posting writes the post and puts a fan-out job on a queue; workers add the post ID to each follower's feed list. Reading a feed takes the ID list and fills in the post bodies from the post cache.",
    "- **Celebrities:** pushing to 50 million followers is too slow, so their posts are pulled and merged at read time: a hybrid.\n- **Ranking:** score the candidate posts by recency and predicted engagement instead of pure time order.\n- **Chat:** WebSocket gateways hold connections; a presence service knows who is online and where.",
    "Push makes reads fast and writes expensive; pull is the opposite; the hybrid uses each where it is cheap. Feeds of inactive users waste memory, so they are rebuilt on demand. Feeds are eventually consistent: a new post may take seconds to appear.",
  ]),
  messaging: framed(DESIGN_FRAME, [
    "One-to-one and group chats; delivery in real time when online and catch-up when not; several devices per user; delivered and read receipts; messages never lost and in order within a conversation.",
    `${fmt(meDau)} daily users sending 40 messages each is ${fmt(meMsgs)} a day, about **${fmt(meRate)} per second**. At 100 bytes that is ${fmt(meTbDay)} TB a day. If 20% are online, ${fmt(meOnline)} connections at ${fmt(mePerGw)} per gateway need **${meGws} gateway servers**.`,
    "Over a WebSocket: `send {conversation_id, client_msg_id, body}` answered by `ack {seq}`; the server pushes `message {conversation_id, seq, ...}`; `sync {conversation_id, after_seq}` fetches what a device missed.",
    "Messages partitioned by conversation and time bucket, ordered by a **per-conversation sequence number**; conversations and members; a map from user to gateway in Redis; each device's last seen sequence number.",
    "Clients keep a connection to a gateway. The chat service gives each message the conversation's next sequence number, stores it, looks up where the recipients are connected and routes it there. Recipients who are offline get a push notification and sync later.",
    "- **Ordering:** one owner per conversation assigns sequence numbers; there is no global order.\n- **No loss, no duplicates:** clients retry until acked, and the client message ID lets the server drop repeats.\n- **Catch-up:** \"I have up to 501\" returns 502 onwards: reconnects and new devices work the same way.\n- **Big groups:** fan out through a queue, and shard storage by time bucket so one busy chat cannot grow one partition forever.",
    "Per-conversation order is enough and far cheaper than global order. At-least-once plus dedupe beats exactly-once. End-to-end encryption protects users but means the server cannot search or filter message text.",
  ]),
  typeahead: framed(DESIGN_FRAME, [
    "As the user types, show the 5 most popular queries that start with the prefix, within about **100 ms** of each keystroke. Popularity is updated daily or hourly; offensive suggestions are filtered out.",
    `${fmt(taDau)} daily users making 10 searches, each about 20 keystrokes, is ${fmt(taReq)} requests a day, about **${fmt(taRate)} per second** and twice that at peak. That is why answers must be precomputed.`,
    "`GET /suggest?q=pre&limit=5` returning the top suggestions. The browser caches answers for an hour, and waits a few milliseconds between keystrokes (debounce) before asking.",
    "A **trie** of popular queries where every node stores its own top 5 completions, so a lookup is one walk down the prefix. Offline: a table of query counts per week built from the search logs.",
    "Query servers keep the trie in memory (or in a fast key-value store keyed by prefix) behind a cache. Offline, log aggregation counts queries, a builder makes a new trie, and servers load it on a schedule.",
    "- **Top 5 per node:** stored in the node, so no subtree search at query time.\n- **Sharding:** split by first letters, sized by real traffic, since far more queries start with \"s\" than with \"x\".\n- **Trending:** a small real-time layer adds fast-rising queries between rebuilds.\n- **Filtering:** a blocklist applied when the trie is built and again at serving time.",
    "Precomputing trades freshness for speed: rebuilding hourly is cheap, real time is costly. Caching short prefixes captures most traffic. (The crawler half of this case study has its own chapter, \"Design a web crawler\".)",
  ]),
  video: framed(DESIGN_FRAME, [
    "Upload videos, convert them for every device and connection, and stream with a fast start and few stalls, worldwide. Views vastly outnumber uploads.",
    `500 hours uploaded a minute is ${fmt(viHoursDay)} hours a day. If all encoded versions of an hour take about 3 GB, that is about **${fmt(viPbDay * 1000)} TB of new storage a day**. ${fmt(viViews)} views a day is about ${fmt(viRate)} starts per second, served almost entirely by CDNs.`,
    "`POST /videos` returns a pre-signed upload URL; the client uploads in chunks and resumes after failures. `GET /videos/{id}` returns metadata and the playlist URL; segments are fetched from the CDN.",
    "Videos (id, owner, title, status, duration); renditions (video, resolution, bitrate, playlist URL); the segments themselves in object storage. Metadata is small and cached; video bytes never touch the database.",
    "Upload goes straight to object storage. An event starts the **transcoding pipeline**: split into segments, encode each at several resolutions and bitrates in parallel, make thumbnails, write HLS or DASH playlists. Players fetch playlist and segments from the CDN.",
    "- **Transcoding:** a graph of tasks run by many workers, so one long video finishes fast.\n- **Adaptive bitrate:** the player measures bandwidth and picks the bitrate per segment.\n- **CDN cost:** popular videos live at every edge; the long tail stays near the origin.\n- **Resumable uploads:** chunks with checksums, so a dropped connection resends only one chunk.",
    "Encoding every rendition up front costs compute and storage but makes playback instant; encoding rare versions on demand saves money. Longer segments are more efficient; shorter ones start faster and switch bitrate sooner.",
  ]),
  storage: framed(DESIGN_FRAME, [
    "Upload, download and share files; every device sees changes quickly, including after editing offline; old versions can be restored; large files must not be re-uploaded for a small change.",
    `${fmt(stUsers)} users with ${fmt(stDau)} daily, each saving 2 files a day, is about **${fmt(stUploads)} commits per second**. At 2 GB stored per user that is ${fmt(stPb)} PB before deduplication.`,
    "`POST /commit {path, block_hashes}` returns the hashes the server does not have; `PUT /blocks/{hash}` uploads those; `GET /changes?cursor=` lists what changed since the cursor; `GET /blocks/{hash}` downloads.",
    "Files and folders; versions as an ordered list of block hashes; blocks (hash, storage location, reference count); and a per-user **change journal** with increasing sequence numbers. Metadata is relational and strongly consistent; blocks are immutable.",
    "The client splits files into blocks of about 4 MB named by their SHA-256. It commits the list, uploads only missing blocks to the block service (backed by object storage), and the metadata service records the new version and appends to the journal. Other devices are told something changed and fetch the changes.",
    "- **Dedupe:** a block with a known hash is never uploaded twice, across all users.\n- **Small edits:** only changed blocks move; content-defined chunking keeps an insert from shifting every block.\n- **Sync:** each device keeps a cursor into the journal; a long poll or WebSocket wakes it.\n- **Conflicts:** two offline edits of one file keep both, saving one as a conflicted copy.",
    "Splitting small consistent metadata from large immutable blocks lets each scale its own way. Dedupe saves huge storage but raises a privacy question (it reveals whether a file already exists), so some services dedupe only within one account.",
  ]),
  proximity: framed(DESIGN_FRAME, [
    "Given a location and a radius, return nearby businesses, paged and fast. Business owners add and edit listings; changes may show up the next day. Reads dominate.",
    `${fmt(prDau)} daily users making 5 searches a day is about **${fmt(prRate)} searches per second** over 200,000,000 businesses. The index is the problem, not raw traffic.`,
    "`GET /search/nearby?lat=&lng=&radius=&cursor=` returns business summaries. `GET /businesses/{id}` and create, update, delete calls for owners.",
    "A business table (id, name, address, lat, lng, details) and a **geo index** table mapping a geohash cell to business IDs. Both are small enough for one database with read replicas.",
    "A stateless location service answers searches from replicas: compute the user's geohash cell at a precision that fits the radius, read that cell and its 8 neighbours, filter by real distance, sort, page. A business service writes edits to the primary.",
    "- **Geohash:** a longer shared prefix usually means closer; neighbours fix points just across a cell edge.\n- **Quadtree:** split any square with more than 100 businesses into four; adapts to density, lives in memory.\n- **Few results:** widen the radius one geohash level at a time.\n- **Caching:** cache by geohash cell, not by raw coordinates, so nearby users share entries.",
    "Geohash in a database table is simple and easy to update; a quadtree adapts to density but must be rebuilt on each server. Accepting next-day edits makes caching easy. Replicas, not shards, scale an index this small.",
  ]),
  nearby: framed(DESIGN_FRAME, [
    "Show which friends are near you now, updated every few seconds, only for friends who opted in, and dropped when they go offline. Updates must reach friends within seconds.",
    `${fmt(nbDau)} daily users with 10% online is ${fmt(nbOnline)}. An update every 30 s is about **${fmt(nbRate)} updates per second**. With 40 online friends each, about ${fmt(nbPush)} pushes per second; at 100,000 per server that is **${nbServers} pub/sub servers**.`,
    "Over a WebSocket: the client sends `location {lat, lng, time}` periodically; the server pushes `friend_location {friend_id, lat, lng, distance}`. Friend lists and settings use normal REST calls.",
    "A location cache in Redis: user to latest position, with a TTL so a quiet user disappears. A history table in a write-heavy store such as Cassandra, sharded by user ID.",
    "Each app holds a WebSocket to a stateful WebSocket server. An update is saved to the cache and history, then **published on the user's channel**. Every online friend's WebSocket handler is subscribed to it, computes the distance and pushes only if within range.",
    "- **Pub/sub scale:** channels are spread over many Redis servers by a hash ring kept in service discovery.\n- **WebSocket servers:** stateful, so deploys drain connections gradually.\n- **Friend changes:** subscribe or unsubscribe the handler.\n- **Strangers nearby:** one channel per geohash cell, subscribe to your cell and neighbours.",
    "Pushing only to friends in range saves bandwidth; a short TTL keeps the map honest. Stateful connections are harder to deploy and balance than stateless HTTP, but polling at this rate would cost far more.",
  ]),
  maps: framed(DESIGN_FRAME, [
    "Show the map at any zoom, find a route between two places with an accurate arrival time, and reroute when traffic changes. Phones report location while navigating.",
    `Zoom 21 alone has 4^21 = ${fmt(mpTiles)} tiles, so tiles are pre-rendered and mostly empty. ${fmt(mpNav)} people navigating, each sending a batch every 15 s, is about **${fmt(mpRate)} location writes per second**.`,
    "`GET /tiles/{z}/{x}/{y}` (static, from a CDN); `POST /locations` with a batch of GPS points; `GET /route?from=&to=&avoid=` returning routes with ETAs; a persistent connection for live ETA and reroute pushes.",
    "Map tiles and **routing tiles** (road graph pieces, at several levels of detail) in object storage; a geocoding database from addresses to coordinates; location history in a write-heavy store; live traffic per road segment.",
    "Clients fetch tiles from the CDN by zoom and position. Location batches go through a service into Kafka, feeding storage, live traffic and ETA. The navigation service geocodes, runs a shortest-path search over routing tiles, asks the ETA service for times and ranks the routes.",
    "- **Routing:** A* over a hierarchy: local streets near the ends, highway-only tiles in between.\n- **ETA:** a model on live and historical traffic predicts time per segment.\n- **Rerouting:** when traffic on a segment changes, find active routes through it and push new ETAs.\n- **Vector tiles:** send geometry instead of pixels, smaller and smooth when zooming.",
    "Pre-rendering and CDN caching make map display cheap; routing is the expensive, dynamic part. Batching GPS points saves battery and requests but delays traffic data by a few seconds.",
  ]),
  metrics: framed(DESIGN_FRAME, [
    "Collect CPU, latency, error counts and similar numbers from every machine, store them as time series, show dashboards and fire alerts. Writes are constant and huge; reads come in bursts.",
    `1,000 pools of 100 machines with 100 metrics each is ${fmt(meSeries)} series. Collected every 10 s that is **${fmt(mePoints)} points per second**: ${fmt(meRawTb)} TB a day at 16 bytes a point, but about ${fmt(meCompGb)} GB compressed to 2 bytes.`,
    "Ingest: agents push to `POST /write`, or the server scrapes each target's `/metrics`. Query: `GET /query?expr=&start=&end=&step=`. Alert rules live in config files.",
    "A series is a metric name plus labels (host, region, status), mapped to a series ID. Points (time, value) are stored in compressed blocks per series and time range, with an index from labels to series IDs.",
    "Collectors receive or scrape metrics and write to **Kafka**, so a slow database cannot lose data. Consumers write into a time-series database. A query service with a cache serves dashboards; an alert evaluator runs rules on a schedule and sends firing alerts to an alert manager.",
    "- **Pull or push:** pull spots dead hosts easily; push suits short jobs and firewalls.\n- **Cardinality:** a label like user ID makes millions of series; ban unbounded labels.\n- **Retention:** raw for days, 1-minute rollups for weeks, hourly for a year.\n- **Alerts:** deduplicate, group and route to pager, chat or email; track pending and firing.",
    "Compression (delta-of-delta times, XOR floats) is why a point fits in a couple of bytes. Rollups save storage but lose detail. Aggregating early is cheaper, aggregating at query time is more flexible.",
  ]),
};
