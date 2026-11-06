// Animated walk-throughs for the System Design chapters added from the topic list in lib/other/design-coverage.ts.
// Values in grids and bars come from the small real implementations below (geohash, Snowflake, order matching, ranking).
import type { Flow } from "./flows.ts";

/* ---------- geohash ---------- */
const B32 = "0123456789bcdefghjkmnpqrstuvwxyz";
export function geohash(lat: number, lng: number, len: number) {
  let lat0 = -90, lat1 = 90, lng0 = -180, lng1 = 180, even = true, bit = 0, n = 0, out = "";
  while (out.length < len) {
    if (even) { const m = (lng0 + lng1) / 2; if (lng >= m) { bit = bit * 2 + 1; lng0 = m; } else { bit *= 2; lng1 = m; } }
    else { const m = (lat0 + lat1) / 2; if (lat >= m) { bit = bit * 2 + 1; lat0 = m; } else { bit *= 2; lat1 = m; } }
    even = !even;
    if (++n === 5) { out += B32[bit]; n = 0; bit = 0; }
  }
  return out;
}
const HOME = { lat: 28.6129, lng: 77.2295 }, CAFE = { lat: 28.6139, lng: 77.2307 };
const homeHash = geohash(HOME.lat, HOME.lng, 6), cafeHash = geohash(CAFE.lat, CAFE.lng, 6);
const shared = [...homeHash].findIndex((c, i) => c !== cafeHash[i]);

/* ---------- Snowflake ---------- */
const EPOCH = Date.UTC(2024, 0, 1), AT = Date.UTC(2026, 10, 6, 9, 30), DC = 3n, MACHINE = 17n, SEQ = 5n;
export const snowflake = (ms: number, dc: bigint, machine: bigint, seq: bigint) => (BigInt(ms - EPOCH) << 22n) | (dc << 17n) | (machine << 12n) | seq;
const SID = snowflake(AT, DC, MACHINE, SEQ);
const decode = (id: bigint) => ({ ms: Number(id >> 22n), dc: Number((id >> 17n) & 31n), machine: Number((id >> 12n) & 31n), seq: Number(id & 4095n) });
const days = (ms: number) => `${Math.floor(ms / 86_400_000)} days`;   // the time field, short enough for a phone cell

/* ---------- order matching (price-time priority) ---------- */
type Order = { id: string; px: number; qty: number };
export function matchBuy(asks: Order[], px: number, qty: number) {
  const book = asks.map((o) => ({ ...o })).sort((a, b) => a.px - b.px), fills: [string, number, number][] = [];
  for (const o of book) {
    if (!qty || o.px > px) break;
    const q = Math.min(qty, o.qty);
    fills.push([o.id, o.px, q]); o.qty -= q; qty -= q;
  }
  return { fills, book: book.filter((o) => o.qty > 0), left: qty };
}
const ASKS: Order[] = [{ id: "S1", px: 100.1, qty: 300 }, { id: "S2", px: 100.2, qty: 200 }, { id: "S3", px: 100.2, qty: 150 }, { id: "S4", px: 100.4, qty: 500 }];
const BUY = { px: 100.2, qty: 400 };
const m = matchBuy(ASKS, BUY.px, BUY.qty);
const askRows = (os: Order[]) => os.map((o) => [o.id, o.px.toFixed(2), o.qty]);

/* ---------- leaderboard ranks ---------- */
const PLAYERS: [string, number][] = [["Asha", 120], ["Ben", 95], ["Chen", 90], ["Dia", 70], ["Eli", 60]];
const ranked = (ps: [string, number][]) => [...ps].sort((a, b) => b[1] - a[1]).map(([n, s], i) => [i + 1, n, s] as (string | number)[]);
const after = PLAYERS.map(([n, s]): [string, number] => [n, n === "Dia" ? s + 30 : s]);
const rankOf = (ps: [string, number][], who: string) => ranked(ps).find((r) => r[1] === who)![0];

/* ---------- ad clicks per minute, event time ---------- */
// [event minute, arrival second after 12:00:00]
const CLICKS: [string, number][] = [["12:00", 10], ["12:00", 30], ["12:00", 55], ["12:01", 62], ["12:00", 64], ["12:01", 80], ["12:00", 79]];
const WATERMARK = 15;   // keep the 12:00 window open until 12:01:15
const count = (min: string, until: number) => CLICKS.filter(([e, a]) => e === min && a <= until).length;
const onTime = count("12:00", 60 + WATERMARK), late = CLICKS.filter(([e, a]) => e === "12:00" && a > 60 + WATERMARK).length;

export const DESIGN_FLOWS: Record<string, Flow> = {
  "sd-growth": { title: "Growing one server into a fleet", steps: [
    { node: "one box: app + database", note: "Day one: everything on one machine. Cheap and simple, and one failure takes the whole product down.", tone: "warn" },
    { node: "database on its own server", note: "The web tier and the data tier can now be sized separately." },
    { node: "load balancer + 3 web servers", note: "Traffic spreads out, and a dead server simply stops getting requests.", tone: "ok" },
    { node: "primary + read replicas", note: "Reads move to replicas; if the primary dies, a replica is promoted." },
    { node: "cache + CDN", note: "Hot data comes from memory and static files from the edge, so the database sees a fraction of the load.", tone: "hot" },
    { node: "sessions in a shared store", note: "The web tier is stateless, so autoscaling can add or remove servers freely." },
    { node: "second data centre", note: "GeoDNS routes users to the nearest site and fails over if one goes down." },
    { node: "shard the database", note: "Writes outgrow one primary, so rows are split by a shard key. Now hot keys and resharding are the new problems.", tone: "warn" },
  ] },
  "sd-kvstore": { kind: "lanes", title: "A conflict caught by vector clocks", lanes: ["Client", "Server X", "Server Y", "Server Z"], steps: [
    { from: 0, to: 1, label: "write D1 [X:1]", note: "The first write is handled by server X, so its clock becomes [X:1]." },
    { from: 0, to: 1, label: "write D2 [X:2]", note: "An update also goes through X: [X:2] clearly descends from [X:1], so D1 can be discarded.", tone: "ok" },
    { from: 0, to: 2, label: "write D3 [X:2,Y:1]", note: "Two clients read D2 and both update it. One write lands on Y.", tone: "hot" },
    { from: 0, to: 3, label: "write D4 [X:2,Z:1]", note: "The other lands on Z. Neither clock is greater in every entry, so D3 and D4 are concurrent.", tone: "warn" },
    { from: 2, to: 0, label: "read: D3 and D4", note: "A read returns both versions. The client merges them (for a cart, the union of items).", tone: "warn" },
    { from: 0, to: 1, label: "write D5 [X:3,Y:1,Z:1]", note: "The merged version covers both clocks, so it supersedes D3 and D4 everywhere.", tone: "ok" },
  ] },
  "sd-ids": { kind: "grid", title: "Inside one Snowflake ID", steps: [
    { note: `One real ID made by this code: ${SID}. As a number it looks random, but it is five fields packed into 64 bits.`, tables: [{ label: "ID", head: ["decimal"], rows: [[SID.toString()]], tones: { "0": "hot" } }] },
    { note: "The top bit is always 0, so the ID is a positive signed 64-bit number in every language.", tables: [{ label: "Fields", head: ["field", "bits", "value"], rows: [["sign", 1, 0], ["time", 41, days(decode(SID).ms)], ["data centre", 5, decode(SID).dc], ["machine", 5, decode(SID).machine], ["sequence", 12, decode(SID).seq]], tones: { "0": "hot" } }] },
    { note: `The next 41 bits are milliseconds since a custom epoch (1 Jan 2024 here): ${decode(SID).ms.toLocaleString("en-US")} ms. Time comes first, so larger IDs are newer.`, tone: "ok", tables: [{ label: "Fields", head: ["field", "bits", "value"], rows: [["sign", 1, 0], ["time", 41, days(decode(SID).ms)], ["data centre", 5, decode(SID).dc], ["machine", 5, decode(SID).machine], ["sequence", 12, decode(SID).seq]], tones: { "1": "ok" } }] },
    { note: `Data centre ${decode(SID).dc} and machine ${decode(SID).machine} say who made it, so two generators can never clash, with no coordination.`, tables: [{ label: "Fields", head: ["field", "bits", "value"], rows: [["sign", 1, 0], ["time", 41, days(decode(SID).ms)], ["data centre", 5, decode(SID).dc], ["machine", 5, decode(SID).machine], ["sequence", 12, decode(SID).seq]], tones: { "2": "hot", "3": "hot" } }] },
    { note: `The last 12 bits count IDs made in the same millisecond: this was number ${decode(SID).seq}. At 4,096 the generator waits for the next millisecond.`, tone: "warn", tables: [{ label: "Fields", head: ["field", "bits", "value"], rows: [["sign", 1, 0], ["time", 41, days(decode(SID).ms)], ["data centre", 5, decode(SID).dc], ["machine", 5, decode(SID).machine], ["sequence", 12, decode(SID).seq]], tones: { "4": "warn" } }] },
  ] },
  "sd-crawler": { title: "One URL through the crawler", steps: [
    { node: "frontier: example.com/news", note: "The URL waits in the back queue for its host, behind the politeness delay." },
    { node: "robots.txt allows it", note: "Cached per host, so the crawler asks once, not before every page.", tone: "ok" },
    { node: "DNS from cache, then download", note: "DNS lookups are slow and repetitive, so the crawler keeps its own cache." },
    { node: "content hash already seen", note: "The same article is published under another URL too. Skip storing it again.", tone: "warn" },
    { node: "extract 42 links, filter", note: "Drop blocked file types, oversized URLs and known trap patterns." },
    { node: "Bloom filter: 30 new URLs", note: "URLs already seen are dropped in a few bits each; the new ones join the frontier.", tone: "hot" },
  ] },
  "sd-mq": { kind: "lanes", title: "A message with acks = all", lanes: ["Producer", "Leader", "Follower", "Consumer"], steps: [
    { from: 0, to: 1, label: "append key=order 42", note: "The key hashes to partition 3, so the producer sends straight to that partition's leader." },
    { from: 1, to: 1, label: "offset 1,207", note: "The leader appends to its log segment on disk. Sequential writes are cheap." },
    { from: 2, to: 1, label: "fetch from 1,207", note: "Followers pull new entries from the leader to stay in sync.", tone: "hot" },
    { from: 1, to: 0, label: "ack: all in-sync", note: "Only when every in-sync replica has it does the producer get its ack. A leader crash now loses nothing.", tone: "ok" },
    { from: 3, to: 1, label: "poll from 1,207", note: "The consumer pulls at its own pace, in batches." },
    { from: 3, to: 1, label: "commit offset 1,208", note: "Commit after processing: a crash before this line means the message is read again (at least once).", tone: "warn" },
  ] },
  "sd-metrics": { title: "From a slow request to a page", steps: [
    { node: "api: p99 latency 1.8 s", note: "Every service exports latency and error metrics with a few labels, such as service and region." },
    { node: "scraped every 10 s", note: "The collector pulls each target's metrics endpoint, found through service discovery." },
    { node: "Kafka, then time-series DB", note: "The buffer absorbs bursts; the database compresses each point to a couple of bytes.", tone: "hot" },
    { node: "rule: p99 > 1 s for 5 min", note: "The condition must hold for 5 minutes, so a single blip does not wake anyone.", tone: "warn" },
    { node: "alert manager groups 40 alerts", note: "Forty instances failing together become one notification, not forty." },
    { node: "page the on-call engineer", note: "The page links to the dashboard showing the same metric.", tone: "ok" },
  ] },
  "sd-proximity": { title: "Finding cafes near you with a geohash", steps: [
    { node: `you: ${HOME.lat}, ${HOME.lng}`, note: "The app sends your position and a radius of 1 km." },
    { node: `geohash: ${homeHash}`, note: "Halve longitude, then latitude, over and over, and write each 5 bits as one base32 character.", tone: "hot" },
    { node: `cafe ${cafeHash}: ${shared < 0 ? 6 : shared} shared chars`, note: "Nearby places usually share a long prefix, so a prefix lookup on an ordinary index finds them." },
    { node: "search your cell + 8 neighbours", note: "A cafe just across a cell edge can have a different prefix, so the neighbours are always included.", tone: "warn" },
    { node: "filter by exact distance, rank", note: "The cells return a superset; exact distance and rating decide the final list.", tone: "ok" },
  ] },
  "sd-nearby": { kind: "lanes", title: "Asha moves; Ben's screen updates", lanes: ["Asha", "WS server", "Pub/sub", "Ben"], steps: [
    { from: 0, to: 1, label: "location update", note: "Asha's phone sends her position over its WebSocket, as it does every 30 seconds." },
    { from: 1, to: 1, label: "cache + history", note: "The server stores the latest position with a TTL, and appends to the history database." },
    { from: 1, to: 2, label: "publish to Asha's channel", note: "One publish, whatever the number of friends.", tone: "hot" },
    { from: 2, to: 3, label: "deliver to subscriber", note: "Ben's connection handler is subscribed to Asha's channel because they are friends." },
    { from: 3, to: 3, label: "1.2 km: show her", note: "The handler checks the distance against Ben's radius and pushes the update to his phone.", tone: "ok" },
  ] },
  "sd-maps": { title: "Asking for directions", steps: [
    { node: "route from home to the airport", note: "The app sends start, end and options such as avoiding tolls." },
    { node: "geocode addresses to points", note: "Text addresses become latitude and longitude." },
    { node: "load routing tiles on demand", note: "Local street tiles near both ends, highway-only tiles in between, so the graph stays small.", tone: "hot" },
    { node: "A* finds 3 candidate routes", note: "A shortest-path search over the tiles' road graph." },
    { node: "ETA model + ranker", note: "Live and historical traffic predict times; the ranker applies your filters." },
    { node: "jam ahead: reroute pushed", note: "Later, traffic data shows a jam on your route, and the server pushes a new ETA and route.", tone: "warn" },
  ] },
  "sd-adclick": { kind: "bars", title: "Counting clicks by event time", format: (v) => String(Math.round(v)), steps: [
    { note: `Clicks for ad 7 that happened in 12:00 arrive during and after that minute. By 12:01:00, ${count("12:00", 60)} have arrived.`, bars: [{ label: "12:00 window", value: count("12:00", 60) }, { label: "12:01 window", value: count("12:01", 60) }] },
    { note: `Some 12:00 clicks arrive a few seconds late. A ${WATERMARK} s watermark keeps the window open until 12:01:${WATERMARK}.`, tone: "hot", bars: [{ label: "12:00 window", value: count("12:00", 60 + WATERMARK), tone: "hot" }, { label: "12:01 window", value: count("12:01", 60 + WATERMARK) }] },
    { note: `The 12:00 window closes with ${onTime} clicks and is written out with its Kafka offset, so a restart cannot count it twice.`, tone: "ok", bars: [{ label: "12:00 window", value: onTime, tone: "ok" }, { label: "12:01 window", value: count("12:01", 80) }] },
    { note: `${late} click for 12:00 still arrives after the watermark. It is kept in raw data and fixed by the daily reconciliation, not dropped.`, tone: "warn", bars: [{ label: "12:00 window", value: onTime, tone: "ok" }, { label: "late", value: late, tone: "warn" }] },
  ] },
  "sd-hotel": { kind: "lanes", title: "Two guests, one room left", lanes: ["Guest A", "Inventory row", "Guest B"], steps: [
    { from: 1, to: 0, label: "1 free, version 7", note: "Guest A checks the double rooms for 12 Dec: one left, row version 7." },
    { from: 1, to: 2, label: "1 free, version 7", note: "Guest B checks a moment later and sees the same.", tone: "warn" },
    { from: 0, to: 1, label: "reserve if version 7", note: "A's update adds one reservation only if the version is still 7. It is, so it succeeds and the version becomes 8.", tone: "ok" },
    { from: 2, to: 1, label: "reserve if version 7", note: "B's update matches no row, because the version is now 8.", tone: "bad" },
    { from: 1, to: 2, label: "sold out, sorry", note: "B is told the room just sold out. No double booking, and no lock was held while either guest was thinking.", tone: "ok" },
  ] },
  "sd-email": { kind: "lanes", title: "Sending one email", lanes: ["Sender app", "SMTP out", "Receiver MX", "Inbox"], steps: [
    { from: 0, to: 1, label: "queue outgoing mail", note: "The web server validates the mail, stores it in Sent, and puts it on the outgoing queue." },
    { from: 1, to: 1, label: "spam + virus check", note: "Outgoing checks protect the service's sending reputation." },
    { from: 1, to: 2, label: "SMTP via MX record", note: "DNS says which server accepts mail for the domain. The receiver checks SPF, DKIM and DMARC.", tone: "hot" },
    { from: 2, to: 1, label: "busy: try later", note: "The receiver is overloaded, so the worker retries with backoff instead of failing.", tone: "warn" },
    { from: 2, to: 3, label: "filter, store, push", note: "Accepted: spam filtering, store metadata and attachment, then push to the open app.", tone: "ok" },
  ] },
  "sd-objectstore": { title: "Uploading one object", steps: [
    { node: "PUT /photos/cat.jpg", note: "The API service authenticates the user and checks write permission on the bucket." },
    { node: "placement picks 3 zones", note: "The placement service's cluster map chooses data nodes in different availability zones.", tone: "hot" },
    { node: "append to a large data file", note: "Small objects are packed into big files; a lookup table records file, offset and size." },
    { node: "checksum stored with the bytes", note: "Every read recomputes it, so silent disk corruption is caught.", tone: "ok" },
    { node: "metadata: key to object ID", note: "Only now does the object become visible under its key." },
  ] },
  "sd-leaderboard": { kind: "grid", title: "A Redis sorted set keeps ranks live", steps: [
    { note: "The board for this month, kept ordered by score.", tables: [{ label: "leaderboard_2026_11", head: ["rank", "player", "score"], rows: ranked(PLAYERS) }] },
    { note: "Dia wins a match worth 30 points. The game server calls ZINCRBY leaderboard_2026_11 30 Dia.", tone: "hot", tables: [{ label: "leaderboard_2026_11", head: ["rank", "player", "score"], rows: ranked(PLAYERS), tones: { [String(Number(rankOf(PLAYERS, "Dia")) - 1)]: "hot" } }] },
    { note: `The skip list moves her in about log n steps: rank ${rankOf(PLAYERS, "Dia")} to rank ${rankOf(after, "Dia")}. Nothing else is rescanned.`, tone: "ok", tables: [{ label: "leaderboard_2026_11", head: ["rank", "player", "score"], rows: ranked(after), tones: { [String(Number(rankOf(after, "Dia")) - 1)]: "ok" } }] },
    { note: "ZREVRANGE 0 2 gives the top 3; ZREVRANK gives any player's rank. Both stay fast with millions of players.", tables: [{ label: "Top 3", head: ["rank", "player", "score"], rows: ranked(after).slice(0, 3), tones: { ":1": "ok" } }] },
  ] },
  "sd-wallet": { kind: "lanes", title: "A transfer with Try-Confirm/Cancel", lanes: ["Coordinator", "Wallet A", "Wallet B"], steps: [
    { from: 0, to: 0, label: "log: transfer 91 started", note: "The coordinator records the transfer and each phase, so it can recover after a crash." },
    { from: 0, to: 1, label: "try: hold 5 from A", note: "A's own local transaction moves 5 into a held state. No lock stays open afterwards.", tone: "hot" },
    { from: 0, to: 2, label: "try: nothing to do", note: "B only receives, so its try is a no-op. Both tries succeeded." },
    { from: 0, to: 1, label: "confirm: remove hold", note: "Phase two: A's held 5 is taken for good.", tone: "ok" },
    { from: 0, to: 2, label: "confirm: add 5 to B", note: "B is credited. Had any try failed, the coordinator would send cancel instead and A's hold would be released.", tone: "ok" },
  ] },
  "sd-exchange": { kind: "grid", title: "Matching a buy order", steps: [
    { note: "The ask side of the book: sell orders sorted by price, and at each price by arrival time.", tables: [{ label: "Asks", head: ["order", "price", "quantity"], rows: askRows(ASKS) }] },
    { note: `A limit order arrives: buy ${BUY.qty} at up to ${BUY.px.toFixed(2)}. The sequencer stamps it before it reaches the matching engine.`, tone: "hot", tables: [{ label: "Asks", head: ["order", "price", "quantity"], rows: askRows(ASKS), tones: Object.fromEntries(ASKS.map((o, i) => [String(i), o.px <= BUY.px ? "hot" : "ok"]).filter(([, t]) => t === "hot")) }] },
    { note: `Best price first, then earliest first: ${m.fills.map(([id, px, q]) => `${q} from ${id} at ${px.toFixed(2)}`).join(", ")}.`, tone: "ok", tables: [{ label: "Executions", head: ["from", "price", "quantity"], rows: m.fills.map(([id, px, q]) => [id, px.toFixed(2), q]), tones: { ":2": "ok" } }] },
    { note: `The buy is ${m.left ? `left with ${m.left} unfilled, which rests on the bid side` : "completely filled"}. What remains of the asks is the new book, and every change is published as market data.`, tables: [{ label: "Asks after", head: ["order", "price", "quantity"], rows: askRows(m.book), tones: { "0": "warn" } }] },
  ] },
};
