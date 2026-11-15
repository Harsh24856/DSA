// Step-by-step versions of the advanced, real-world and ML System Design chapters. "Design X" chapters follow the seven
// steps of a design round (DESIGN_FRAME); ML chapters follow ML_FRAME. Every number is computed here. Merged by design.ts.
import { DESIGN_FRAME, fmt, framed, ML_FRAME, ndcg, perSec } from "./design-calc.ts";
import type { Step } from "./types.ts";

/* ---------- worked numbers ---------- */
const adClicks = 1e9, adRate = perSec(adClicks), adGb = (adClicks * 100) / 1e9;
const hoRooms = 1e6, hoPerDay = (hoRooms * 0.7) / 3, hoRows = 5_000 * 20 * 365;
const emUsers = 1e9, emSends = perSec(emUsers * 10), emMetaPb = (emUsers * 40 * 50e3 * 365) / 1e15, emAttPb = (emUsers * 40 * 0.2 * 500e3 * 365) / 1e15;
const obObjects = 100e15 / 4e6, obMetaTb = (obObjects * 1_000) / 1e12;
const lbRate = perSec(5e6 * 10), lbMb = (25e6 * 26) / 1e6;
const paTx = 10e6, paRate = perSec(paTx);
const waTransfers = 1e6, waNodes = (waTransfers * 2) / 10_000;
const exRate = 1e9 / (6.5 * 3600);
const riDrivers = 1e6, riWrites = riDrivers / 4, riRides = 10e6;
const tiFans = 2e6, tiSeats = 50_000, tiAdmit = 500, tiMinutes = tiFans / tiAdmit / 60;
const doEditors = 2e6, doOps = doEditors * 2;
const liViewers = 20e6, liTbps = (liViewers * 2e6) / 1e12, liLogins = liViewers / 300;
const deOrders = 2e6, deRushRate = (deOrders * 0.25) / 3600, deRiders = 200_000, deGps = deRiders / 5;
const plGb = (200e6 * 50 * 8 * 3) / 1e9;
const llIn = 400 + 5 * 300 + 100, llOut = 300, llQ = 1e6, llCost = (llQ * llIn) / 1e6 * 1 + (llQ * llOut) / 1e6 * 4;
const reDau = 200e6, reRate = perSec(reDau * 8), reGb = (10e6 * 128 * 4) / 1e9;
const srGrades = [3, 2, 3, 0, 1, 2], srNdcg = ndcg(srGrades);
const ADS = [["Shoes", 2, 0.03], ["Laptop", 5, 0.01], ["Course", 1, 0.04]] as const;
const ecpm = ([, bid, ctr]: readonly [string, number, number]) => bid * ctr * 1000;
const adsRanked = [...ADS].sort((a, b) => ecpm(b) - ecpm(a)), adsPay = ecpm(adsRanked[1]) / 1000 / adsRanked[0][2];

export const STEPS_C: Record<string, Step[]> = {
  adclick: framed(DESIGN_FRAME, [
    "Count clicks per ad per minute and find the top N ads in the last M minutes, filterable by country or user group. Results are billed, so: no lost clicks, no double counting, results within minutes, and a way to recompute.",
    `${fmt(adClicks)} clicks a day is about **${fmt(adRate)} per second**, ${fmt(adRate * 5)} at a 5x peak. At 0.1 KB per event the raw log grows about ${fmt(adGb)} GB a day.`,
    "`GET /ads/{id}/clicks?from=&to=&filter=` returns counts per minute. `GET /ads/top?n=&window=` returns the most clicked ads. Clicks arrive as events, not API calls.",
    "Raw events (ad, click time, user, IP, country, event ID) kept for recomputation, and aggregates (ad, minute, filter, count) and top-N lists per minute for fast queries.",
    "Click logs go into **Kafka**. An aggregation service maps events by ad ID, counts per one-minute window in memory, reduces to the top N, and writes results to a second topic, from which a writer fills the aggregation database. Raw events are also stored.",
    "- **Event time:** count a click in the minute it happened; a watermark waits briefly for late events.\n- **Exactly once:** store each result with the Kafka offset it covers, and dedupe events by ID.\n- **Hot ads:** split one ad's clicks over several counters and add them.\n- **Reconciliation:** a daily batch over raw events checks the streaming totals.",
    "One streaming path that can replay history (kappa) instead of separate batch and stream code (lambda). A longer watermark is more accurate but later. Keeping raw data costs storage and buys the ability to fix any bug after the fact.",
  ]),
  hotel: framed(DESIGN_FRAME, [
    "Search hotels and room types, reserve, pay and cancel. **Never sell more rooms than allowed** and never charge twice for one click. A little overbooking is allowed, as hotels really do.",
    `1,000,000 rooms at 70% with 3-night stays is about **${fmt(hoPerDay)} reservations a day**, only a few per second. One inventory row per hotel, room type and date is ${fmt(hoRows)} rows a year. Correctness, not scale, is the hard part.`,
    "`GET /hotels/{id}/availability?from=&to=`; `POST /reservations {reservation_id, hotel_id, room_type, from, to}`; `DELETE /reservations/{id}`. The client gets `reservation_id` when the booking page loads.",
    "Hotels, room types and an **inventory table**: (hotel, room type, date, total inventory, total reserved). Reservations (id, guest, hotel, room type, dates, status). Book by room type; the room number comes at check-in.",
    "A reservation service checks and updates the inventory rows for every night of the stay inside **one database transaction**, then calls the payment service. Search reads availability from a cache that may lag; the database makes the final check.",
    "- **Double click:** the reservation ID is the primary key, so a second insert with it fails.\n- **Last room:** two guests booking the last room at once: lock the rows (`SELECT ... FOR UPDATE`), use a version column, or a check constraint, so only one wins.\n- **Overbooking:** allow `total_reserved` up to 110% of `total_inventory`.\n- **Scale:** shard by hotel ID, since a booking touches only one hotel.",
    "Pessimistic locks suit high contention, optimistic locking suits low contention. A slightly stale search cache is fine because the database decides. Overbooking earns money on no-shows and occasionally costs a guest moved to another hotel.",
  ]),
  email: framed(DESIGN_FRAME, [
    "Send and receive mail, store it, search it and sync folders across devices for a billion users. Mail must not be lost, spam must be filtered, and sent mail must reach inboxes rather than spam folders.",
    `${fmt(emUsers)} users sending 10 mails a day is about **${fmt(emSends)} sends per second**. Receiving 40 a day with 50 KB of metadata each is about ${fmt(emMetaPb)} PB a year; attachments add about ${fmt(emAttPb)} PB.`,
    "HTTPS APIs for apps: `POST /messages` (send), `GET /folders/{id}/messages?cursor=`, `GET /messages/{id}`, `PATCH` to mark read or move, `GET /search?q=`. SMTP talks to other mail servers.",
    "Metadata in a wide-column store **partitioned by user ID** with time-ordered email IDs, because every read is one user's recent mail. Bodies and attachments in object storage. A search index per user.",
    "Sending: API, outgoing queue, SMTP workers that scan for spam and viruses and retry when the receiving server is down. Receiving: SMTP servers (found through DNS MX records), incoming queue, workers that filter, store and notify real-time servers, which push to open apps over WebSockets.",
    "- **Deliverability:** SPF, DKIM and DMARC records; dedicated, slowly warmed IPs; separate IPs for marketing.\n- **Search:** an index per user, updated as mail arrives.\n- **Consistency:** a user's mailbox lives in one partition with a single leader, so folders never disagree.\n- **Spam:** filters on content, sender reputation and user reports.",
    "Partitioning by user makes every common query local, but anything across users (abuse analysis) becomes a batch job. Queues between stages make the system survive slow or failing receivers at the cost of a few seconds' delay.",
  ]),
  objectstore: framed(DESIGN_FRAME, [
    "Store objects of any size in buckets, read them back by bucket and key, list by prefix, and **never lose one**. Objects are immutable; versions optional. Very high durability, high availability, low cost.",
    `100 PB with a median object of 4 MB is about **${fmt(obObjects)} objects**; at 1 KB of metadata each that is ${fmt(obMetaTb)} TB of metadata. Data and metadata need different stores.`,
    "`PUT /{bucket}/{key}` with the bytes; `GET /{bucket}/{key}`; `DELETE`; `GET /{bucket}?prefix=&cursor=` to list. Multipart upload for large objects: start, upload parts in parallel, complete.",
    "Buckets (name, owner, settings); objects (bucket, key, object ID, size, checksum, version); on each data node a table from object ID to file, offset and size, because many small objects are packed into one large file.",
    "A stateless API service authenticates and validates. For a PUT it streams bytes to the data store, which a **placement service** spreads over nodes in different racks and zones, and gets an object ID; then the metadata service records bucket, key and object ID.",
    "- **Durability:** three copies, or erasure coding (8 data + 4 parity chunks survive 4 losses at 1.5x storage).\n- **Corruption:** checksums on every object, verified on read and by background scrubbing.\n- **Listing:** keys are flat; a prefix query over sharded metadata, often helped by a per-bucket listing table.\n- **Deletes:** mark deleted, then compaction copies live objects into new files.",
    "Replication reads fast and repairs simply; erasure coding halves the storage cost but needs computation and several nodes for each read or repair. Packing small objects saves inodes and disk, at the price of compaction.",
  ]),
  leaderboard: framed(DESIGN_FRAME, [
    "Show the top 10 players, a player's own rank and the players around them, updated in real time as games end. A new board each month. Only the game server may report scores.",
    `5,000,000 daily players with 10 games each is about **${fmt(lbRate)} score updates per second**, ${fmt(lbRate * 5)} at peak. 25,000,000 monthly players at about 26 bytes each is about ${fmt(lbMb)} MB.`,
    "`POST /scores {user_id, points}` (from the game server only); `GET /leaderboard/top?n=10`; `GET /leaderboard/users/{id}` returning rank, score and the players just above and below.",
    "A Redis **sorted set** per month, such as `leaderboard_2026_11`, member user ID and score points. Game results and player profiles live in the main database; the sorted set can be rebuilt from them.",
    "When a game ends, the game server updates the database and calls `ZINCRBY` on this month's key. Reads use `ZREVRANGE 0 9` for the top 10 and `ZREVRANK` for a player's rank, then fetch names from a profile cache.",
    "- **Why not SQL:** `ORDER BY` finds the top 10, but a rank means counting everyone above, which gets slower as players grow.\n- **Sorted set:** a skip list keeps members ordered, so updates and rank queries take about log n time.\n- **Ties:** equal scores are ordered by member name; add a timestamp to the score to rank earlier achievers first.\n- **Bigger scale:** shard by score range; a rank is the rank in its shard plus the sizes of the shards above.",
    `A single Redis node of about ${fmt(lbMb)} MB is simple and fast; replicate it for failover and rebuild from the database if needed. Sharding by score range keeps the top 10 in one shard but needs moving players between shards.`,
  ]),
  payments: framed(DESIGN_FRAME, [
    "Take money from buyers (pay-in) and send it to sellers (pay-out) through payment providers. Never charge twice, never lose a payment, keep card numbers away from your servers, and be able to prove every balance.",
    `${fmt(paTx)} payments a day is only about **${fmt(paRate)} per second**. Volume is easy; every failure mode (timeouts, crashes, retries) is where the design effort goes.`,
    "`POST /payments {payment_id, buyer, seller, amount, currency}` where `payment_id` is an **idempotency key** chosen by the caller; `GET /payments/{id}`; webhooks from the provider report final results.",
    "Payment events and payment orders with status (not started, executing, success, failed); a **double-entry ledger** where every movement is a debit and an equal credit; wallets with balances per merchant.",
    "The payment service records the payment, then the executor sends it to the provider (PSP), which charges the card through the card network. Card details are entered on the **provider's hosted page**. On success the wallet and ledger are updated; pay-outs later send money to sellers' banks.",
    "- **Idempotency:** the same key returns the stored result instead of charging again, on your API and towards the provider.\n- **Timeouts:** an unknown result is checked with the provider before any retry.\n- **Retries:** a retry queue with backoff; payments that keep failing go to a dead letter queue.\n- **Reconciliation:** every day, compare the ledger with the provider's and bank's settlement files and fix differences.",
    "Correctness beats latency everywhere here: synchronous writes, strong consistency, and asynchronous steps that are safe to repeat. The hosted page costs some checkout control but keeps your PCI DSS scope small.",
  ]),
  wallet: framed(DESIGN_FRAME, [
    "Transfer money between wallets at very high rates; a transfer either fully happens or not at all; balances never go wrong; and any past balance can be reproduced for auditors.",
    `${fmt(waTransfers)} transfers a second means ${fmt(waTransfers * 2)} balance changes (a debit and a credit). At 10,000 transactional updates per database node that is **${fmt(waNodes)} nodes**, so a transfer usually spans two shards.`,
    "`POST /transfers {transfer_id, from, to, amount}` with the transfer ID as idempotency key; `GET /wallets/{id}/balance`; `GET /wallets/{id}/history?cursor=`.",
    "With event sourcing: an append-only **event log** of validated commands (\"A sent B 5\"), plus balances derived from it and snapshots so restarts do not replay everything. Read views (statements) are built from the events.",
    "Commands are validated against current state and turned into events appended to a log replicated with Raft. State machines apply events in order to update balances. Query services read projected views (CQRS).",
    "- **Two-phase commit:** correct, but locks are held across the network and a stuck coordinator blocks everyone.\n- **TC/C:** try (reserve), then confirm or cancel, each a local transaction.\n- **Saga:** steps in order, compensating steps backwards on failure.\n- **Event sourcing:** the log is the truth; replaying it rebuilds any balance at any time.",
    "2PC gives strong consistency at the cost of availability; TC/C and sagas stay available but are eventually consistent and need an undo for every step. Event sourcing adds complexity and buys a complete audit trail.",
  ]),
  exchange: framed(DESIGN_FRAME, [
    "Accept limit and market orders, match them by **price-time priority**, report executions, and publish market data to everyone at the same time. Latency in microseconds, strict ordering, no lost orders, deterministic replay.",
    `1,000,000,000 orders in a 6.5-hour trading day is about **${fmt(exRate)} orders per second**, ${fmt(exRate * 5)} at a 5x peak. Few machines can match that if the critical path crosses the network many times.`,
    "Brokers connect over FIX or a binary protocol: new order, cancel, replace; execution reports come back. Market data is multicast: L1 best bid and ask, L2 depth per price, L3 every order.",
    "An **order book** per symbol: at each price a doubly linked list of orders in time order, a map from price to level, and a map from order ID to its list node, so add, cancel and match are constant time. The sequenced event log is the source of truth.",
    "Client gateway (authentication, limits, validation), order manager (risk and funds checks), **sequencer** (stamps every order with a sequence number), matching engine (one thread per order book), then executions and market data flow back out.",
    "- **Low latency:** the critical path on one server, each stage a single thread pinned to a core, passing events through shared memory.\n- **Determinism:** the same sequenced events always produce the same book and trades.\n- **Failover:** a warm standby replays the same events and takes over; the log is replicated with Raft.\n- **Fairness:** multicast market data reaches every subscriber at once.",
    "Putting everything on one machine gives microsecond latency but makes that machine critical, so a hot standby is required. Determinism makes recovery and audits simple at the cost of avoiding anything random or time-dependent in matching.",
  ]),
  ride: framed(DESIGN_FRAME, [
    "Riders request trips and are matched to a nearby free driver within seconds; drivers send locations constantly; both see each other on the map; a driver is never given two riders; trips are priced and paid.",
    `${fmt(riDrivers)} active drivers sending a location every 4 s is **${fmt(riWrites)} writes per second**, far more than the ${fmt(perSec(riRides))} trip requests per second from ${fmt(riRides)} rides a day.`,
    "`POST /trips {pickup, dropoff}`; `POST /drivers/location` (or a stream); `POST /trips/{id}/accept`; updates to rider and driver apps over a persistent connection.",
    "Driver locations **in memory** (Redis geo sets or an in-memory grid by cell), with only samples saved for history. Trips as a state machine in a database: requested, matched, arriving, in progress, completed, cancelled.",
    "Locations stream into a location service that updates the cell index. A trip request goes to the matching service, which searches the rider's cell and its neighbours, ranks drivers by ETA, and offers the trip to one driver at a time with a short timeout.",
    "- **No double match:** reserve the driver with an atomic compare-and-set on its state (free to offered).\n- **Hot zones:** an airport cell gets most requests; split cells finer or shard by city.\n- **ETA:** road-network time, not straight-line distance, decides the best driver.\n- **Surge:** price rises when requests exceed free drivers in a zone.",
    "Keeping locations in memory trades durability for speed, which is fine because a new update comes in seconds. Offering trips one driver at a time is fair and simple but slower than broadcasting to several.",
  ]),
  tickets: framed(DESIGN_FRAME, [
    "When sales open, millions arrive in the same minute for a fixed number of seats. Absorb the spike, keep the site up, let people pick seats, and **never sell one seat twice**. Abandoned seats return quickly.",
    `${fmt(tiFans)} people for ${fmt(tiSeats)} seats. If the booking system can admit ${tiAdmit} people a second, letting everyone in takes about **${fmt(tiMinutes)} minutes**; most will find the show sold out, so tell them early.`,
    "`POST /queue/join` returns a position; `GET /queue/status`; once admitted, `GET /events/{id}/seats`, `POST /holds {seat_ids}` and `POST /bookings {hold_id, payment}`.",
    "Seats (event, seat, status free, held or booked, hold expiry, holder); holds; bookings; and a queue of waiting users with an admission token.",
    "A **virtual waiting room** (a cheap, static, CDN-served page) admits users in batches with signed tokens. Admitted users see a seat map from a cache, take a hold, and pay; payment turns the hold into a booking.",
    "- **Atomic hold:** a conditional update succeeds only if the seat is free or its hold expired, in one database or Redis operation.\n- **Expiry:** holds last a few minutes; expired holds free their seats automatically.\n- **Bots:** tokens, rate limits per account and purchase limits.\n- **Seat map:** may lag a little; the conditional update is the truth.",
    "The waiting room makes some users wait but keeps everyone's experience working. Short holds return seats fast but pressure buyers; long holds are kinder but let seats sit idle.",
  ]),
  docs: framed(DESIGN_FRAME, [
    "Several people edit one document at once, each seeing their own typing instantly and others' within moments; everyone ends with the same text; cursors and presence are shown; full version history.",
    `Say ${fmt(doEditors)} people editing at once, each sending about 2 small operations a second after batching keystrokes: **${fmt(doOps)} operations per second**, each only a few bytes.`,
    "A WebSocket per open document: send `op {doc_id, base_version, op}`; receive transformed ops from others and acks; `GET /docs/{id}` loads a snapshot plus later operations; presence messages carry cursors.",
    "Documents as periodic **snapshots plus an operation log**; each operation records author, version and change. Version history is the log grouped into named versions, not a copy per keystroke.",
    "Clients apply their own edits locally at once and send them. One server process per document orders all operations, **transforms** each against the ones it missed, saves it to the log and broadcasts it. Clients transform incoming operations against their own unacknowledged ones.",
    "- **OT:** transform functions adjust positions, for example a delete at 3 becomes 4 after someone inserts before it; needs a central server to order.\n- **CRDTs:** each character has a unique, ordered ID, so replicas merge without a central order; works offline and peer to peer.\n- **Cursors:** sent as positions and transformed like edits.\n- **Snapshots:** taken every N operations so loading is fast.",
    "OT is compact and proven with a central server; CRDTs merge anywhere but carry more metadata per character. One owner process per document keeps ordering simple but must fail over quickly.",
  ]),
  live: framed(DESIGN_FRAME, [
    "Stream a live match to tens of millions at once with a delay of a few seconds, and keep login, home page, ads and payments working when everyone opens the app in the same minute.",
    `Assume ${fmt(liViewers)} concurrent viewers at 2 Mbps: about **${fmt(liTbps)} Tbps** from CDNs. If they all open the app within 5 minutes that is about ${fmt(liLogins)} logins and home page loads per second.`,
    "Video via HLS or DASH playlists and segments from the CDN. Separate APIs for login, home, entitlement (may this user watch?), ads and the live score.",
    "Live segments and playlists at the CDN; user and subscription data in databases with caches; precomputed home pages; feature flags that switch features off under load.",
    "The live encoder produces segments every few seconds at several bitrates, pushed to origin and pulled by CDN edges. App APIs sit behind caches and autoscaled services that are **scaled up hours ahead** of the match.",
    "- **Predictable spikes:** scale ahead using expected concurrency; autoscaling reacts too slowly.\n- **Graceful degradation:** a ranked list of features to switch off (recommendations first, playback last).\n- **Cache everything:** home pages are the same for most users, so serve them from cache.\n- **Delay:** shorter segments mean lower delay but more requests and stalls.",
    "Paying for capacity before the match is cheaper than an outage during it. A few seconds of delay behind TV buys stable playback.",
  ]),
  delivery: framed(DESIGN_FRAME, [
    "Customers order from restaurants; riders pick up and deliver; everyone sees live status and an ETA that holds. Assign riders to keep food hot, riders busy and promises met.",
    `${fmt(deOrders)} orders a day with a quarter of them in the dinner hour is about **${fmt(deRushRate)} orders per second** at peak. ${fmt(deRiders)} riders sending GPS every 5 s is ${fmt(deGps)} location writes per second.`,
    "`POST /orders`; `GET /orders/{id}` with status and ETA; restaurant calls to accept and mark ready; rider calls to accept, pick up and deliver; a live connection for tracking.",
    "Orders as a **state machine** (placed, accepted, preparing, picked up, delivered) with one owning service; events for every change; rider locations in memory; prep-time and travel-time history for the models.",
    "The order service records the order and emits events. A dispatch service collects new orders for a short window, predicts when each will be ready, and assigns riders as a batch. Tracking streams rider location to the customer.",
    "- **Batch assignment:** solving a window of orders together beats giving each order the nearest rider instantly.\n- **Stacking:** one rider carries two orders from nearby restaurants if neither gets cold.\n- **ETA:** prep time plus travel time, learned from history; it drives both dispatch and the promise shown.\n- **Sharding:** by city, since orders never cross cities.",
    "Waiting a few seconds to batch gives better assignments at a small delay. Optimistic ETAs win orders and lose trust. One owner for order status avoids two services disagreeing.",
  ]),
  mlplatform: framed(DESIGN_FRAME, [
    "Let many teams build, train, ship and monitor models without rebuilding the plumbing: the same features online and offline, reproducible training, safe rollout, and alerts when inputs drift.",
    `200,000,000 entities with 50 features of 8 bytes, kept 3 times, is about **${fmt(plGb)} GB** in the online feature store: sharded and served from memory.`,
    "`get_features(entity_ids, feature_names)` online; `get_training_frame(events, features)` offline with point-in-time joins; `register_model(...)`; `predict(model, inputs)`; `deploy(model, stage)`.",
    "Feature definitions (code, owner, freshness); an offline store in columnar files; an online key-value store; a model registry recording data version, code version and metrics for every model.",
    "Events land in Kafka and a data lake. Batch jobs compute daily features, stream jobs real-time ones, both written to the **feature store**. Training pipelines build datasets, train, evaluate and register models. Serving loads models from the registry; monitoring compares live data with training data.",
    "- **Point-in-time joins:** training rows use feature values as they were at the event, never later ones.\n- **Training-serving skew:** one feature definition used in both places.\n- **Rollout:** shadow, canary, A/B test, full rollout, with instant rollback.\n- **Drift:** population stability index per feature; alert above a threshold such as 0.25.",
    "A shared platform costs a team to build and run but saves every model team from repeating the same mistakes. Real-time features improve models and cost streaming infrastructure; use them only where freshness moves the metric.",
  ]),
  mlllm: framed(DESIGN_FRAME, [
    "Answer employees' questions from company documents, with citations, respecting who may see what, refusing when unsure, within a few seconds and a cost budget.",
    `A prompt of ${fmt(llIn)} input tokens and ${llOut} output tokens per answer. ${fmt(llQ)} questions a day (about ${perSec(llQ).toFixed(1)} per second) at assumed prices of 1 per million input and 4 per million output tokens is about **${fmt(llCost)} a day**; a 30% cache hit rate makes it about ${fmt(llCost * 0.7)}.`,
    "`POST /ask {question, conversation_id}` streams back an answer with citations; `POST /feedback {answer_id, rating}`; an ingestion API or connector that receives new and changed documents.",
    "Chunks of a few hundred tokens with overlap, each with its embedding and metadata (source, date, **permissions**); a vector index; a keyword index; logs of questions, retrieved chunks, answers and feedback.",
    "Ingestion splits, embeds and indexes documents. A question is checked by input guardrails, embedded, used for hybrid search with a permission filter, reranked, and the top chunks go into the prompt. The model answers with citations; output guardrails check it; the answer streams to the user.",
    "- **Retrieval quality:** chunk size, hybrid search and a reranker decide most answer quality.\n- **Permissions:** filter at retrieval, before anything reaches the model.\n- **Evaluation:** a fixed question set scored for faithfulness and relevance, by people and an LLM judge checked against them.\n- **Cost and speed:** cache, route easy questions to a smaller model, stream tokens.",
    "More chunks give more context but cost tokens and can distract the model. A bigger model answers better and costs more per token. Refusing when retrieval finds nothing is less helpful and far safer than guessing.",
  ]),
  mlrecs: framed(ML_FRAME, [
    "Goal: more satisfied time on the home feed. Prediction: for a user and a candidate item, the probabilities of click, long watch, like and share, combined into one score. It is a **ranking** problem over a huge corpus, so the system is a funnel.",
    "Implicit feedback from logs: impressions, clicks, watch time, likes, skips, \"not interested\". Labels are biased by what the old system showed, so log the position and keep some exploration traffic. Split train and test by time.",
    "User (history, embeddings, subscriptions), item (topic, creator, age, popularity), context (time, device) and crosses (has this user watched this creator?). Watch history updates within minutes; item stats hourly.",
    "Retrieval: a **two-tower** model maps users and items to embeddings and finds nearest neighbours, merged with other sources (similar to recent watches, trending, subscriptions). Ranking: a deep multi-task model scores about a thousand candidates. Re-ranking applies diversity, freshness and policy rules.",
    "Offline: recall of retrieval, AUC and log loss of each ranking head, NDCG of the final list. Online: an A/B test on watch time, satisfaction surveys and retention, with guardrails such as hides and reports.",
    `${fmt(reDau)} daily users opening the feed 8 times a day is about **${fmt(reRate)} requests per second**. 10,000,000 items with 128-dimension float embeddings is about ${reGb.toFixed(1)} GB, so each retrieval server keeps an approximate nearest neighbour index in memory. The ranker must fit its share of a latency budget of about 140 ms.`,
    "Watch for feedback loops (the model learns only from what it chose to show), popularity bias and cold start. Give new items a small share of impressions, monitor feature drift, and retrain daily.",
  ]),
  mlsearch: framed(ML_FRAME, [
    "Goal: users find what they meant quickly. Prediction: the relevance of each document to a query, used to order results. A **learning to rank** problem where the query states the intent.",
    "Human relevance grades (0 to 3) for a sample of queries are clean and expensive; clicks and purchases at scale are cheap but biased by position, so correct for it (for example by occasionally shuffling the top results).",
    "Query (normalised text, intent, category), document (title, text, quality, freshness, popularity), query-document match (BM25 score, title match, embedding similarity) and user context (location, past purchases).",
    "Query understanding first (spelling, synonyms, intent). Retrieval combines an inverted index with BM25 and embedding search (hybrid). A learning to rank model (pointwise, pairwise or listwise; gradient boosted trees are a strong baseline) reorders the top few hundred.",
    `Offline: **NDCG** rewards relevant results near the top. A page with grades ${srGrades.join(", ")} scores ${srNdcg.toFixed(3)}; the ideal order scores 1.000. Online: click-through on top results, time to first click, reformulated and abandoned queries, purchases.`,
    "The whole query, including retrieval and ranking, must finish in a few hundred milliseconds, so the ranker scores only the top few hundred. New documents must be indexed within seconds to minutes.",
    "Track queries with no results or no clicks, watch rank metrics per query type, refresh models as new content arrives, and keep a human-graded set to catch regressions that clicks hide.",
  ]),
  mlads: framed(ML_FRAME, [
    "Goal: revenue that advertisers and users can live with. Prediction: the probability a user clicks an ad (pCTR). Ads are ranked by **bid x pCTR** (eCPM, per 1,000 views), so the probability must be **calibrated**, not just ordered well.",
    "Labels: was the view clicked? Clicks arrive seconds later, conversions days later, so wait a window before calling a view negative, or model the delay. Traffic is huge and positives rare; downsample negatives and correct the predictions afterwards.",
    "User (interests, history), ad and advertiser (category, creative, past CTR), placement and context (page, position, device, time), plus real-time counters such as this ad's clicks in the last hour, and crosses between them.",
    "Logistic regression on hashed sparse features is the classic baseline; deep models that learn feature crosses (wide and deep, DCN) are the modern answer. A calibration layer maps raw scores to true probabilities.",
    `Offline: log loss and calibration per bucket (AUC alone ignores calibration). The auction then uses the scores: ${adsRanked.map((a) => `${a[0]} ${fmt(ecpm(a))}`).join(", ")} eCPM, so ${adsRanked[0][0]} wins and in a second-price auction pays **${adsPay.toFixed(2)}** per click. Online: revenue, CTR and advertiser return, with user-experience guardrails.`,
    "Every page view scores many candidate ads within tens of milliseconds, so features come from a low-latency store and the model is kept small enough for CPU serving or batched on GPUs.",
    "Ads, users and seasons change daily, so retrain often (even continuously), watch calibration live, and alert when predicted and actual click rates drift apart.",
  ]),
};
