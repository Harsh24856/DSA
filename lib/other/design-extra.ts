// Additions to existing System Design chapters, so each covers every topic in lib/other/design-coverage.ts.
// Merged in lib/other/design.ts: points and cards are appended to the chapter with the same id.
import type { Card } from "./types.ts";

const DAY = 86_400;
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// a feed service: estimate from stated assumptions
const FEED = { dau: 200e6, posts: 3, mediaShare: 0.2, mediaMB: 0.5, years: 5, peak: 2 };
const feedQps = (FEED.dau * FEED.posts) / DAY;
const feedTBDay = (FEED.dau * FEED.posts * FEED.mediaShare * FEED.mediaMB) / 1e6;
const feedPB = (feedTBDay * 365 * FEED.years) / 1000;

// keys that move when a 5th server joins: mod N against a hash ring (ideal share)
const moveMod = Array.from({ length: 20 }, (_, h) => h).filter((h) => h % 4 !== h % 5).length / 20;
const moveRing = 1 / 5;

export const EXTRA: Record<string, { points?: string[]; cards: Card[] }> = {
  approach: { cards: [
    { id: "dos", q: "What should you do, and avoid, during a design round?", a: "- **Do:** ask clarifying questions, state your assumptions, think out loud, offer two options and pick one with a reason, and check in with the interviewer as you go.\n- **Avoid:** jumping into a detailed component before the high-level picture exists, designing in silence, claiming one design fits every scale, and running out of time before the deep dive.", trap: "Treating the interviewer as an examiner rather than a teammate. Their hints are part of the round." },
  ] },
  estimation: { cards: [
    { id: "powers", q: "Which powers of two should you know by heart?", a: "They turn data sizes into round numbers quickly.", table: { head: ["Power", "Approximate value", "Name"], rows: [10, 20, 30, 40, 50].map((p, i) => [`2^${p}`, ["one thousand", "one million", "one billion", "one trillion", "one quadrillion"][i], ["KB", "MB", "GB", "TB", "PB"][i]]) } },
    { id: "feed-estimate", q: "Estimate posts per second and media storage for a social feed.", a: `State the assumptions first: ${n0(FEED.dau)} daily users, ${FEED.posts} posts each a day, ${FEED.mediaShare * 100}% with media of ${FEED.mediaMB * 1000} KB, kept ${FEED.years} years.\n\n- Posts per second: ${n0(FEED.dau * FEED.posts)} / ${n0(DAY)} ≈ ${n0(feedQps)}, about ${n0(feedQps * FEED.peak)} at a ${FEED.peak} times peak.\n- Media per day: ${n0(FEED.dau * FEED.posts * FEED.mediaShare)} files x ${FEED.mediaMB} MB ≈ ${n0(feedTBDay)} TB.\n- Over ${FEED.years} years: about ${n0(feedPB)} PB, before replication.`, trap: "Forgetting replicas and peak traffic. Multiply storage by the replication factor and size servers for the peak, not the average." },
  ] },
  data: { cards: [
    { id: "moved-keys", q: "A fifth server joins four. How many keys move?", a: `With \`hash mod N\`, changing N from 4 to 5 sends a key to a new server unless \`h mod 4\` equals \`h mod 5\`: about ${n0(moveMod * 100)}% of keys move. On a hash ring, only the keys in the new server's arcs move, about ${n0(moveRing * 100)}% (1/5), and all of them move to the new server.` },
    { id: "vnodes", q: "Why do consistent hashing rings use virtual nodes?", a: "With one point per server, arcs between servers are uneven, so some servers own far more keys, and when a server leaves, all its keys land on a single neighbour. Giving each server many points spreads its share evenly and spreads a departed server's keys over many others. Bigger servers can simply get more points.\n\nDynamo, Cassandra, Discord's chat routing and many CDNs and load balancers use this idea." },
  ] },
  ratelimit: { cards: [
    { id: "five", q: "Compare the five rate-limiting algorithms.", a: "All five cap requests per client per time window; they differ in memory, accuracy and how they treat bursts.", table: { head: ["Algorithm", "Idea", "Strength", "Weakness"], rows: [
      ["Token bucket", "tokens refill at a fixed rate; a request spends one", "allows short bursts, little memory", "two settings to tune"],
      ["Leaking bucket", "requests join a queue drained at a fixed rate", "perfectly smooth output", "a burst fills the queue and delays newer requests"],
      ["Fixed window counter", "count per clock window, such as per minute", "simplest", "up to double the limit across a window edge"],
      ["Sliding window log", "keep a timestamp per request, drop old ones", "exact", "memory for every timestamp"],
      ["Sliding window counter", "current count plus a weighted share of the previous window", "close to exact, little memory", "assumes requests were spread evenly"],
    ] } },
    { id: "headers", q: "What does a client see when it is rate limited?", a: "HTTP status `429 Too Many Requests`, plus headers telling it how to behave: the limit, how many requests remain in the window, and when to retry (such as `Retry-After`). Good clients slow down instead of retrying at once. Dropped requests can be discarded or queued for later." },
    { id: "race", q: "Two servers share a Redis counter. What race can break the limit?", a: "Both read the count 9 (limit 10), both allow the request and both write 10, so 11 requests pass. Make the check and increment one atomic step: `INCR` and compare the result, a Lua script, or a sorted set updated in a transaction. Keep one central store so every limiter sees the same counts, and place it near the limiters to keep latency low." },
    { id: "placement", q: "Client side, server side, or in a gateway?", a: "Client-side limits are easily bypassed, so they are only a courtesy. Server-side or in an API gateway or middleware is the norm, and a gateway is convenient when you already run one. Coarse limits can also sit lower in the stack, such as IP-level rules at the network layer." },
  ] },
  url: { cards: [
    { id: "base62-vs-hash", q: "Base62 of an ID, or a hash with collision checks?", a: "Both produce a short code; they differ in what they need and what they leak.", table: { head: ["", "Hash + collision check", "Base62 of a unique ID"], rows: [
      ["Code length", "fixed (take the first 7 characters)", "grows with the ID"],
      ["Needs", "nothing else", "a unique ID generator"],
      ["Collisions", "possible: check, then rehash with a salt", "impossible"],
      ["Next code guessable", "no", "yes, IDs are sequential"],
    ] }, trap: "Checking collisions with a database query on every write is slow. A Bloom filter of existing codes answers \"definitely new\" in memory." },
  ] },
  notifications: { points: [
    "**Contact details:** device tokens, phone numbers and emails are collected at install or sign-up and kept per user and device.",
    "**Providers:** APNs for iOS, FCM for Android, an SMS provider and an email provider, each behind its own queue and workers.",
    "**Templates and logs:** reusable templates keep messages consistent; a notification log records every send so failures can be retried.",
    "**Security:** only authenticated internal services may call the send API.",
  ], cards: [] },
  feed: { cards: [
    { id: "feed-cache", q: "What exactly is cached for a news feed?", a: "Several layers, each small and specific:\n\n- **Feed:** the list of post IDs per user, not the posts themselves.\n- **Content:** post bodies by ID, with hot posts in a separate tier.\n- **Social graph:** who follows whom.\n- **Actions:** whether the user liked or replied to a post.\n- **Counters:** likes, replies and followers.\n\nBuilding a feed reads the ID list, then fetches posts, authors and counters in batches." },
    { id: "publish-steps", q: "What happens when a user publishes a post?", a: "Authenticate and rate limit the request, store the post, then hand its ID to fan-out workers through a queue. The workers fetch follower IDs from the social graph, drop muted or blocked followers, and prepend the post ID to each remaining follower's feed cache. Celebrities are skipped: their posts are merged in at read time." },
  ] },
  messaging: { cards: [
    { id: "protocols", q: "Polling, long polling or WebSocket for chat?", a: "The server must push new messages, which plain HTTP cannot do by itself.", table: { head: ["Method", "How", "Cost"], rows: [
      ["Polling", "ask every few seconds", "mostly empty answers, wasted requests"],
      ["Long polling", "hold the request open until a message or a timeout", "reconnects constantly; the server cannot tell easily if the client left"],
      ["WebSocket", "one persistent two-way connection", "stateful servers, but cheap per message"],
    ] } },
    { id: "discovery", q: "How does a client find which chat server to connect to?", a: "After login, the API asks a service discovery system (such as ZooKeeper) for the best chat server, by region and current load, and returns its address. The client then opens its WebSocket there. Chat servers are stateful, while login, profiles and group management stay on ordinary stateless servers." },
  ] },
  typeahead: { cards: [
    { id: "trie-fast", q: "How does the trie answer a prefix within milliseconds?", a: "Limit the prefix length (users rarely type more than about 50 characters), and store the top k completions in every node. A lookup is then: walk to the prefix node, and read its cached list. Updates cost more and memory grows, which is acceptable because the trie is rebuilt offline." },
    { id: "trie-store", q: "Where is the trie stored and how is it sharded?", a: "Built weekly from aggregated query logs by workers, then saved as a snapshot or as a key-value table from prefix to top completions, and loaded into an in-memory cache. Shard by prefix, but not naively by first letter, because far more words start with some letters than others: a shard map manager balances ranges by actual traffic." },
    { id: "extras", q: "How do you handle offensive suggestions, other languages and trends?", a: "A filter layer in front of the cache removes blocked suggestions immediately, without waiting for a rebuild. Store Unicode characters in the trie for other languages, possibly one trie per country. Trending queries need a streaming path that updates counts in near real time, since a weekly rebuild is far too slow." },
  ] },
  video: { cards: [
    { id: "dag", q: "How is video transcoding organized?", a: "As a directed acyclic graph of tasks defined per video: inspect and split the input, then encode video, encode audio and make thumbnails in parallel, then package the results. A preprocessor builds the graph, a scheduler splits it into stages, a resource manager places tasks on workers, and temporary storage holds intermediate files." },
    { id: "cdn-cost", q: "Serving video from a CDN is expensive. How do you cut the cost?", a: "- Serve only popular videos from the CDN, and the long tail from your own high-capacity storage servers.\n- Encode rarely watched videos at fewer resolutions, or on demand.\n- Place popular content per region rather than everywhere.\n- Partner with ISPs to cache inside their networks." },
    { id: "upload-safety", q: "How do you keep uploads and videos safe?", a: "Clients upload with pre-signed URLs, so only authorized users can write to storage. Protect paid content with DRM or encryption, and add watermarks to discourage copying. Upload speed improves with parallel chunk uploads to upload centres near the user." },
    { id: "errors", q: "A transcoding step fails. What happens?", a: "Recoverable errors, such as a worker dying, are retried a few times and then reported. Non-recoverable errors, such as an unsupported format, stop the job and tell the creator. Each component (upload, split, encode, metadata) has its own recovery: replace the worker, retry from the last finished segment, fail over the database." },
  ] },
  storage: { cards: [
    { id: "block-servers", q: "What do block servers do?", a: "They split each file into blocks, compress and encrypt each block, upload only blocks that changed (delta sync) and record the block list in metadata. Downloads reverse the steps. This keeps transfers small and makes deduplication possible." },
    { id: "meta-tables", q: "What tables does the metadata database hold?", a: "Users, devices (with push tokens), namespaces (each user's root folder), files, file versions (immutable, one row per edit) and blocks (ordered, with the hash of each block). Metadata needs strong consistency, so a relational database with transactions is a natural fit, and caches are invalidated on every write." },
    { id: "save-space", q: "How do you keep storage costs down?", a: "Deduplicate identical blocks across a user's files, cap the number of versions kept (and drop old versions of files that change constantly), and move data nobody has touched for months to cheaper cold storage." },
  ] },
  payments: { points: [
    "**Pay-in:** the payment service records the event, the payment executor sends the order to a provider (the PSP), the provider charges the card through the card network, and the wallet and ledger are updated.",
    "**Hosted payment page:** the provider renders the card form, so card numbers never touch your servers, which keeps your PCI DSS scope small.",
    "**Pay-out:** money is later sent to the seller's bank through a pay-out provider.",
    "**Failures:** retry with backoff through a retry queue; payments that keep failing go to a dead letter queue for inspection.",
  ], cards: [
    { id: "reconcile", q: "What is reconciliation and why is it needed?", a: "Every night, compare your ledger with the settlement file the provider sends. Systems talk asynchronously and messages can be lost, so this is the final safety net. Mismatches are classified: some fixed automatically, some by finance staff." },
    { id: "pci", q: "How do you keep card data secure?", a: "Do not store it. Use the provider's hosted page or SDK so you only ever see a token. Add HTTPS everywhere, encryption at rest, strict access control and audit logs, and fraud checks such as address and CVV verification." },
  ] },
};
