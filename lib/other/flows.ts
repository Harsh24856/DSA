// Animated walk-throughs for the System Design chapters: one request (or one event) travelling through the
// system, a step at a time. Played by components/other/FlowPlayer.tsx (Remotion Player); a chapter opts in
// with `anim: "<id>"`. Each step is one box in a top-to-bottom chain and one caption.

export type FlowTone = "ok" | "bad" | "warn" | "hot";
export type FlowStep = { node: string; note: string; tone?: FlowTone };
export type Flow = { title: string; steps: FlowStep[] };

export const FLOWS: Record<string, Flow> = {
  caching: {
    title: "A read with cache-aside",
    steps: [
      { node: "app: GET user 42", note: "The app needs user 42 and asks the cache first." },
      { node: "cache: miss", note: "The key is not there yet (cold cache, or it expired).", tone: "warn" },
      { node: "database: about 10 ms", note: "Fall back to the database, the slow source of truth." },
      { node: "cache: set user 42, TTL 5 min", note: "Store the result so the next reads are fast; the TTL bounds how stale it can get.", tone: "hot" },
      { node: "next read: hit, about 1 ms", note: "Every read for 5 minutes skips the database.", tone: "ok" },
    ],
  },
  url: {
    title: "Opening a short link",
    steps: [
      { node: "browser: GET /x7Kp2Qa", note: "Someone clicks a short link." },
      { node: "load balancer", note: "Any redirect server can answer: they are stateless." },
      { node: "local cache, then Redis", note: "Popular codes are in memory on the server itself; others in Redis.", tone: "hot" },
      { node: "database (only on a miss)", note: "The code to URL mapping never changes, so a miss is rare and cacheable forever." },
      { node: "302 to the long URL", note: "A temporary redirect, so every click is counted and links can expire.", tone: "ok" },
    ],
  },
  feed: {
    title: "A post reaching followers' feeds",
    steps: [
      { node: "Asha posts a photo", note: "The post is stored once, with an id." },
      { node: "fan-out worker", note: "A queue hands the post id to a worker, so posting returns immediately.", tone: "hot" },
      { node: "300 followers: not a celebrity", note: "Small audience, so push now: fan-out on write." },
      { node: "prepend id to each follower's feed list", note: "300 cheap list writes in Redis or Cassandra." },
      { node: "Ben opens the app: one read", note: "His feed is already assembled; post bodies come from cache.", tone: "ok" },
    ],
  },
  video: {
    title: "From upload to playback",
    steps: [
      { node: "creator uploads in chunks", note: "A pre-signed URL sends the bytes straight to object storage; resumable if Wi-Fi drops." },
      { node: "transcode job queued", note: "Upload done: a message starts the offline pipeline.", tone: "hot" },
      { node: "workers: 240p to 4K segments", note: "The video is cut into 4-second segments, each encoded at several bitrates in parallel." },
      { node: "segments + playlist on CDN", note: "Popular videos are pushed to edge caches near viewers.", tone: "ok" },
      { node: "player measures bandwidth", note: "Each segment is fetched at the best bitrate the network can sustain." },
      { node: "network slows: switch to 480p", note: "Adaptive bitrate: lower quality instead of a frozen spinner.", tone: "warn" },
    ],
  },
  ride: {
    title: "Matching a rider to a driver",
    steps: [
      { node: "drivers send location every 4 s", note: "About 250,000 writes a second, kept in an in-memory geo index, not the database." },
      { node: "rider requests a trip", note: "Pickup at a point; its geohash cell is computed." },
      { node: "search the cell + 8 neighbours", note: "Neighbouring cells matter: the closest driver may be just across a cell edge.", tone: "hot" },
      { node: "rank 5 candidates by road ETA", note: "Straight-line distance lies about rivers and one-way streets." },
      { node: "offer to best driver, 10 s timeout", note: "No answer? Offer to the next one.", tone: "warn" },
      { node: "accept: driver set busy atomically", note: "Compare-and-set on the driver's state, so two riders can never get the same driver.", tone: "ok" },
    ],
  },
  tickets: {
    title: "A flash sale without double booking",
    steps: [
      { node: "2 million fans at 10:00", note: "Far more people than the booking system can serve at once." },
      { node: "virtual waiting room", note: "A static page shows each fan a random queue position; the spike never reaches the database.", tone: "warn" },
      { node: "admitted: pick seat A1", note: "Fans are let in at about 2,000 a minute." },
      { node: "atomic hold: free or expired?", note: "UPDATE ... WHERE state = 'free' OR until < now(). Exactly one buyer wins.", tone: "hot" },
      { node: "pay within 8 minutes", note: "If the timer runs out, the hold lapses and A1 returns to the pool." },
      { node: "booked", note: "Payment confirmed: the seat is sold once, to one person.", tone: "ok" },
    ],
  },
  typeahead: {
    title: "One keystroke of autocomplete",
    steps: [
      { node: "user types 'how t'", note: "Every keystroke (debounced by about 100 ms) sends the prefix." },
      { node: "browser / CDN cache", note: "Short prefixes repeat across users, so many answers come from cache.", tone: "ok" },
      { node: "suggestion service", note: "On a miss, ask the service that holds the trie in memory." },
      { node: "walk the trie: h, o, w, space, t", note: "Each node already stores its top 5 completions: no search at read time.", tone: "hot" },
      { node: "return the top 5", note: "Merged with a few trending terms from the last minutes." },
      { node: "rebuilt hourly from query logs", note: "The trie is built offline and swapped in, so reads never wait on writes." },
    ],
  },
  docs: {
    title: "Two people typing at once",
    steps: [
      { node: "Asha inserts 'X' at position 0", note: "Applied to her own copy instantly, then sent to the server." },
      { node: "Ben deletes position 3, same moment", note: "Also applied locally first. Their copies now differ." },
      { node: "server orders: Asha, then Ben", note: "The server decides one order of operations per document.", tone: "hot" },
      { node: "transform: delete moves to 4", note: "Asha's insert shifted everything right by one, so Ben's delete is adjusted.", tone: "warn" },
      { node: "broadcast to every editor", note: "Each client transforms incoming operations against its own unsent ones." },
      { node: "both copies read the same", note: "Convergence without locks: nobody waited for anybody.", tone: "ok" },
    ],
  },
  storage: {
    title: "Syncing an edited file",
    steps: [
      { node: "edit 1 paragraph of a 100 MB file", note: "The desktop client notices the change." },
      { node: "split into chunks, hash each", note: "About 25 chunks of 4 MB, each named by its SHA-256." },
      { node: "ask: which hashes are new?", note: "The server already has 24 of the 25 chunks.", tone: "hot" },
      { node: "upload 1 chunk", note: "4 MB instead of 100 MB.", tone: "ok" },
      { node: "metadata: file v2 = 25 hashes", note: "A small transactional write; the blocks themselves are immutable." },
      { node: "other devices get notified", note: "A long poll says 'your journal moved'; they fetch the change and download 1 chunk." },
    ],
  },
  payments: {
    title: "A payment that survives a timeout",
    steps: [
      { node: "checkout: pay 500, key k-123", note: "The client makes one idempotency key per checkout attempt." },
      { node: "payment row: pending", note: "Recorded before calling anyone, in the same transaction as the key." },
      { node: "charge card at the provider", note: "The provider is called with the same key." },
      { node: "timeout: result unknown", note: "It may or may not have charged. Never guess.", tone: "warn" },
      { node: "retry with key k-123", note: "The provider sees the key and returns the original result: no second charge.", tone: "hot" },
      { node: "ledger: debit asha, credit shop", note: "Two entries that sum to zero; reconciled with the provider's report every day.", tone: "ok" },
    ],
  },
  hotkey: {
    title: "Taming a hot key",
    steps: [
      { node: "celebrity posts", note: "500,000 reads a second for one key." },
      { node: "one cache node melts", note: "Adding nodes does not help: the key hashes to a single node.", tone: "bad" },
      { node: "copy as post#0 to post#9", note: "The hot key is written under 10 names that hash to different nodes.", tone: "hot" },
      { node: "each read picks a random copy", note: "Load spreads across 10 nodes." },
      { node: "plus a 1-second in-process cache", note: "Most reads never leave the app server at all.", tone: "ok" },
    ],
  },
};
