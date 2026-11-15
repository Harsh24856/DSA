// Interactive walk-throughs for System Design chapters (see flows-play.ts): the learner sets the load or the design knob and
// every number in the walk-through is computed from it. Chapters that already have a lab (estimation, hashing, quorum,
// rate limiting, availability) are not repeated here.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { BarStep, ChainStep, Flow, GridStep, GridTable } from "./flows.ts";
import { geohashCell, geohashFor, ndcg, RANK_BUDGET } from "./design-calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const n1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("en-US");
const n2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
const big = (x: number) => (x >= 1e12 ? `${n1(x / 1e12)} trillion` : x >= 1e9 ? `${n1(x / 1e9)} billion` : x >= 1e6 ? `${n1(x / 1e6)} million` : n0(x));
const km = (x: number) => (x >= 1 ? `${n1(x)} km` : `${n0(x * 1000)} m`);
const pct = (x: number) => `${n1(x * 100)}%`;

/* ---------- caching: how the hit rate decides database load ---------- */
function caching(v: Record<string, number>): Flow {
  const R = v.reads, h = v.hit / 100, cap = v.cap, hits = R * h, miss = R - hits, need = 1 - cap / R;
  const bars = (a: number, b: number, c: number, tone?: BarStep["tone"]) => [
    { label: "reads", value: R }, { label: "cache hits", value: a, tone: a ? "ok" as const : undefined }, { label: "to database", value: b, tone }, { label: "database limit", value: c },
  ];
  const lower = Math.max(0, v.hit - 5) / 100, missLower = R * (1 - lower);
  return { kind: "bars", title: `${n0(R)}k reads per second at a ${v.hit}% hit rate`, max: Math.max(R, cap), format: (x) => `${n1(x)}k`, steps: [
    { note: `${n0(R)} thousand reads arrive every second. The database alone can serve ${n0(cap)} thousand.`, bars: bars(0, 0, cap) },
    { note: `${v.hit}% of reads find their key in the cache: ${n1(hits)} thousand per second never touch the database.`, tone: "ok", bars: bars(hits, 0, cap) },
    { note: `The other ${n1(miss)} thousand per second miss and go to the database, which ${miss <= cap ? `copes, at ${pct(miss / cap)} of its limit` : `is overloaded by ${n1(miss - cap)} thousand per second`}.`, tone: miss <= cap ? "ok" : "bad", bars: bars(hits, miss, cap, miss <= cap ? "ok" : "bad") },
    { note: need <= 0 ? `The database could serve every read alone, so here the cache buys speed, not survival.` : `To stay under the limit the hit rate must be at least ${pct(need)}: 1 - ${n0(cap)} / ${n0(R)}.`, tone: "warn", bars: bars(hits, miss, cap, miss <= cap ? "ok" : "bad") },
    { note: `Drop the hit rate to ${n0(lower * 100)}% (a cold start, an evicted hot key) and the database load becomes ${n1(missLower)} thousand per second, ${n1(missLower / Math.max(miss, 0.001))} times as much. Near the top, every percent of hit rate matters.`, tone: missLower <= cap ? "warn" : "bad", bars: bars(R - missLower, missLower, cap, missLower <= cap ? "warn" : "bad") },
  ] };
}

/* ---------- queues: does the backlog drain? ---------- */
const BACKLOG = 20_000;
function queues(v: Record<string, number>): Flow {
  const inR = v.rate, out = v.consumers * v.per, net = out - inR, head = ["minute", "arrived", "processed", "backlog"];
  const rows: string[][] = [];
  let backlog = BACKLOG;
  const steps: GridStep[] = [{ note: `After an outage ${n0(BACKLOG)} jobs are waiting. New jobs arrive at ${n0(inR)} per second; ${v.consumers} consumers each process ${v.per} per second, ${n0(out)} in all.`, tables: [{ label: "per minute", head, rows: [["0", "-", "-", n0(BACKLOG)]] }] }];
  for (let m = 1; m <= 4; m++) {
    const arrived = inR * 60, can = out * 60, done = Math.min(can, backlog + arrived);
    backlog = backlog + arrived - done;
    rows.push([String(m), n0(arrived), n0(done), n0(backlog)]);
    steps.push({ note: `Minute ${m}: ${n0(arrived)} arrive, ${n0(done)} are processed, so ${n0(backlog)} are left waiting.`, tone: net > 0 ? "ok" : "bad", tables: [{ label: "per minute", head, rows: [["0", "-", "-", n0(BACKLOG)], ...rows], tones: { [`${m}:3`]: net > 0 ? "ok" : "bad" } }] });
  }
  const need = Math.ceil((inR + 1) / v.per);
  steps.push(net > 0
    ? { note: `Consumers are ${n0(net)} per second faster than arrivals, so the backlog clears in about ${n0(BACKLOG / net)} seconds. Queues absorb bursts as long as consumers are faster on average.`, tone: "ok", tables: [{ label: "per minute", head, rows: [["0", "-", "-", n0(BACKLOG)], ...rows] }] }
    : { note: `Arrivals beat consumers by ${n0(-net)} per second, so the backlog never drains and only grows. Add consumers: at least ${need} are needed, and the topic needs that many partitions.`, tone: "bad", tables: [{ label: "per minute", head, rows: [["0", "-", "-", n0(BACKLOG)], ...rows] }] });
  return { kind: "grid", title: `${n0(inR)} jobs/s in, ${v.consumers} x ${v.per} jobs/s out`, steps };
}

/* ---------- ids: splitting 64 bits like Snowflake ---------- */
function ids(v: Record<string, number>): Flow {
  const m = v.machine, s = v.seq, t = 63 - m - s, years = 2 ** t / (365.25 * 86_400_000);
  const head = ["part", "bits", "gives"];
  const all = [["sign", "1", "always 0"], ["time (ms)", String(t), years >= 1 ? `${n1(years)} years` : `${n0(years * 365.25)} days`], ["machine", String(m), `${n0(2 ** m)} machines`], ["sequence", String(s), `${n0(2 ** s)} per ms`]];
  const tab = (k: number, hot?: number): GridTable => ({ label: "a 64-bit ID", head, rows: all.slice(0, k), tones: hot === undefined ? {} : { [String(hot)]: "hot" } });
  const steps: GridStep[] = [
    { note: "A Snowflake-style ID packs a timestamp, a machine number and a counter into 64 bits, so any machine can make IDs alone and they still sort by time. The top bit stays 0 so IDs are positive.", tables: [tab(1, 0)] },
    { note: `The time field gets what is left: 63 - ${m} - ${s} = ${t} bits of milliseconds, which lasts ${years >= 1 ? `${n1(years)} years` : `only ${n0(years * 365.25)} days`}.`, tone: years >= 30 ? "ok" : years >= 5 ? "warn" : "bad", tables: [tab(2, 1)] },
    { note: `${m} machine bits allow ${n0(2 ** m)} ID generators running at once.`, tables: [tab(3, 2)] },
    { note: `${s} sequence bits allow ${n0(2 ** s)} IDs per millisecond on one machine, about ${big(2 ** s * 1000)} per second.`, tables: [tab(4, 3)] },
    { note: years < 5 ? `The trade-off bites: more machine or sequence bits shorten the time range. ${n1(years * 365.25)} days is far too short; give the clock more bits.` : `Every bit is a trade: more machines or more IDs per millisecond means fewer years before the clock field runs out. In all, ${big(2 ** (m + s) * 1000)} IDs per second across the fleet.`, tone: years < 5 ? "bad" : "ok", tables: [tab(4)] },
  ];
  return { kind: "grid", title: `${t} time bits, ${m} machine bits, ${s} sequence bits`, steps };
}

/* ---------- url: how long must a short code be? ---------- */
function url(v: Record<string, number>): Flow {
  const total = v.perDay * 1e6 * 365 * v.years, cap = 62 ** v.len, fill = total / cap, need = Math.ceil(Math.log(total) / Math.log(62));
  const steps: ChainStep[] = [
    { node: `${n0(v.perDay)} million URLs a day`, note: `Each new long URL gets a short code. Over ${v.years} years that is ${n0(v.perDay)} million x 365 x ${v.years} = ${big(total)} codes.` },
    { node: `62 characters per position`, note: "Codes use a to z, A to Z and 0 to 9: 62 choices per character, so each extra character multiplies the space by 62." },
    { node: `62^${v.len} = ${big(cap)} codes`, note: `${v.len} characters give ${big(cap)} possible codes.`, tone: "hot" },
    { node: `${pct(fill)} of the space used`, note: fill <= 1 ? `The codes fill ${pct(fill)} of the space.${fill > 0.5 ? " Over half full, random codes collide often, so retries pile up." : " Plenty of room, so random codes rarely collide."}` : `${big(total)} codes do not fit in ${big(cap)}: the space runs out after about ${n1(cap / (v.perDay * 1e6 * 365))} years.`, tone: fill <= 0.5 ? "ok" : fill <= 1 ? "warn" : "bad" },
    { node: `shortest that fits: ${need} characters`, note: `The shortest length that holds all ${big(total)} codes is ${need}, since 62^${need} = ${big(62 ** need)}. Pick one more for headroom.`, tone: "ok" },
  ];
  return { title: `${big(total)} short codes in ${v.len} characters`, steps };
}

/* ---------- feed: fan-out on write, and the celebrity exception ---------- */
function feed(v: Record<string, number>): Flow {
  const f = v.followers * 1000, perDay = f * v.posts, celeb = v.followers > v.limit, hybrid = celeb ? 0 : perDay;
  const bars = (a: number, b: number, c: number, tone?: BarStep["tone"]) => [{ label: "per post", value: a }, { label: "push / day", value: b, tone }, { label: "hybrid / day", value: c, tone: c === 0 && b ? "ok" as const : undefined }];
  return { kind: "bars", title: `${n0(f)} followers, ${v.posts} posts a day, pull above ${n0(v.limit)}k`, max: perDay, format: big, steps: [
    { note: `An account with ${n0(f)} followers posts ${v.posts} times a day. With fan-out on write, each post is copied into every follower's feed inbox.`, bars: bars(0, 0, 0) },
    { note: `One post means ${n0(f)} inbox writes, done by background workers.`, tone: "hot", bars: bars(f, 0, 0) },
    { note: `${v.posts} posts a day means ${big(perDay)} inbox writes a day for this one account.`, tone: perDay > 5e7 ? "bad" : "warn", bars: bars(f, perDay, 0, perDay > 5e7 ? "bad" : "warn") },
    { note: celeb ? `${n0(f)} is above the ${n0(v.limit * 1000)} follower limit, so the hybrid design skips fan-out: followers pull this account's recent posts when they open their feed and merge them in.` : `${n0(f)} is below the ${n0(v.limit * 1000)} follower limit, so the hybrid design still pushes: fan-out keeps feed reads cheap.`, tone: celeb ? "ok" : "hot", bars: bars(f, perDay, hybrid, perDay > 5e7 ? "bad" : "warn") },
    { note: celeb ? `Hybrid saves ${big(perDay)} writes a day for this account, at the cost of one extra read per feed load for its followers.` : "Most accounts are small, so push serves them well; only the few huge accounts switch to pull.", tone: "ok", bars: bars(f, perDay, hybrid, perDay > 5e7 ? "bad" : "warn") },
  ] };
}

/* ---------- video: storage per day across renditions ---------- */
const RENDITIONS: [name: string, mbPerMin: number][] = [["240p", 2.5], ["360p", 5], ["480p", 9], ["720p", 20], ["1080p", 40], ["4K", 150]];   // assumed bitrates
function video(v: Record<string, number>): Flow {
  const r = RENDITIONS.slice(0, v.renditions), minutes = v.uploads * 1000 * v.minutes, tb = r.map(([, mb]) => (minutes * mb) / 1e6);
  const total = tb.reduce((a, b) => a + b, 0), steps: BarStep[] = [
    { note: `${n0(v.uploads)} thousand videos a day at ${v.minutes} minutes each is ${big(minutes)} minutes of video to store, in ${r.length} versions so each device gets one that fits its screen and network.`, bars: r.map(([name]) => ({ label: name, value: 0 })) },
  ];
  r.forEach(([name, mb], i) => steps.push({ note: `${name} at an assumed ${mb} MB per minute: ${n1(tb[i])} TB a day.`, tone: "hot", bars: r.map(([nm], j) => ({ label: nm, value: j <= i ? tb[j] : 0, tone: j === i ? "hot" as const : undefined })) }));
  const top = tb.indexOf(Math.max(...tb));
  steps.push({ note: `${n1(total)} TB a day in all, about ${n1(total * 365 / 1000)} PB a year before replication. The biggest version, ${r[top][0]}, is ${pct(tb[top] / total)} of it, so rarely watched videos often skip it.`, tone: "warn", bars: r.map(([nm], j) => ({ label: nm, value: tb[j], tone: j === top ? "warn" as const : undefined })) });
  return { kind: "bars", title: `${n0(v.uploads)}k uploads a day in ${r.length} versions`, format: (x) => `${n1(x)} TB`, steps };
}

/* ---------- storage: sending only the changed chunks ---------- */
function chunks(v: Record<string, number>): Flow {
  const size = v.size, c = v.chunk, start = Math.floor(size * 0.3), n = Math.ceil(size / c);
  if (start + v.edit > size) throw new PlayError(`An edit of ${v.edit} MB starting ${start} MB into a ${size} MB file runs past its end. Make the file bigger or the edit smaller.`);
  const first = Math.floor(start / c), last = Math.floor((start + v.edit - 1e-9) / c), touched = last - first + 1, sent = Math.min(size, touched * c);
  const bars = (a: number, b: number) => [{ label: "whole file", value: a }, { label: "changed", value: b, tone: b ? "ok" as const : undefined }];
  return { kind: "bars", title: `${v.edit} MB edited in a ${size} MB file`, max: size, format: (x) => `${n0(x)} MB`, steps: [
    { note: `The client splits the ${size} MB file into ${n} chunks of ${c} MB and keeps a hash of each.`, bars: bars(size, 0) },
    { note: `The user edits ${v.edit} MB starting ${start} MB in. That touches chunk${touched > 1 ? `s ${first + 1} to ${last + 1}` : ` ${first + 1}`}: ${touched} of ${n}.`, tone: "hot", bars: bars(size, 0) },
    { note: `Only chunks whose hash changed are uploaded: ${n0(sent)} MB instead of ${n0(size)} MB.`, tone: "ok", bars: bars(size, sent) },
    { note: `That saves ${pct(1 - sent / size)} of the upload. Smaller chunks save more on small edits but mean more hashes and more metadata rows; ${c} MB is the trade chosen here.`, tone: "warn", bars: bars(size, sent) },
  ] };
}

/* ---------- mq: partitions limit consumer parallelism ---------- */
function partitions(v: Record<string, number>): Flow {
  const p = v.partitions, c = v.consumers, per = Math.floor(p / c), extra = p % c;
  const assign: string[] = [];
  let next = 0;
  for (let i = 0; i < c; i++) { const k = per + (i < extra ? 1 : 0); assign.push(k === 0 ? "idle" : k === 1 ? `P${next}` : `P${next} to P${next + k - 1}`); next += k; }
  const head = ["consumer", "partitions"], rows = assign.map((a, i) => [`C${i + 1}`, a]), idle = assign.filter((a) => a === "idle").length;
  const steps: GridStep[] = [{ note: `A topic with ${p} partitions is read by a consumer group of ${c}. Each partition goes to exactly one consumer in the group, so its messages stay in order.`, tables: [{ label: "assignment", head, rows: rows.map((r) => [r[0], ""]) }] }];
  rows.forEach((_, i) => steps.push({ note: assign[i] === "idle" ? `C${i + 1} gets nothing: every partition is taken, so it sits idle.` : `C${i + 1} reads ${assign[i]}.`, tone: assign[i] === "idle" ? "bad" : "hot",
    tables: [{ label: "assignment", head, rows: rows.map((r, j) => [r[0], j <= i ? r[1] : ""]), tones: { [`${i}:1`]: assign[i] === "idle" ? "bad" : "hot" } }] }));
  steps.push({ note: idle ? `${idle} consumer${idle > 1 ? "s are" : " is"} idle: at most ${p} can work at once. To scale reads, add partitions, not just consumers.` : `All ${c} consumers work${extra ? `, but ${extra} carr${extra > 1 ? "y" : "ies"} one extra partition, so load is uneven` : ", each with the same share"}. Parallelism is min(${p}, ${c}) = ${Math.min(p, c)}.`, tone: idle ? "bad" : "ok", tables: [{ label: "assignment", head, rows }] });
  return { kind: "grid", title: `${p} partitions, ${c} consumers`, steps };
}

/* ---------- proximity: geohash length for a search radius ---------- */
function geohash(v: Record<string, number>): Flow {
  const r = v.radius, chosen = geohashFor(r), lens = [4, 5, 6, 7], head = ["length", "cell width", "cell height", "big enough?"];
  const row = (len: number) => { const c = geohashCell(len); return [String(len), km(c.w), km(c.h), Math.min(c.w, c.h) >= r ? "yes" : "no"]; };
  const steps: GridStep[] = [{ note: `Find places within ${km(r)}. Each geohash character makes cells smaller; the search reads one cell and its 8 neighbours, so the cell must be at least as big as the radius.`, tables: [{ label: "cell size at the equator", head, rows: lens.map((l) => [String(l), "", "", ""]) }] }];
  const shown: string[][] = lens.map((l) => [String(l), "", "", ""]);
  [...lens].reverse().forEach((len) => {
    const i = lens.indexOf(len); shown[i] = row(len);
    const ok = shown[i][3] === "yes";
    steps.push({ note: `Length ${len}: cells of ${shown[i][1]} by ${shown[i][2]}. ${ok ? `Big enough for ${km(r)}.` : `Smaller than ${km(r)}, so a nearby place could sit two cells away. Try shorter.`}`, tone: ok ? "ok" : "warn",
      tables: [{ label: "cell size at the equator", head, rows: shown.map((x) => [...x]), tones: { [`${i}:3`]: ok ? "ok" : "warn" } }] });
  });
  const c = geohashCell(chosen);
  steps.push({ note: `Use length ${chosen}, the longest that is big enough. The 9 cells cover about ${km(3 * c.w)} by ${km(3 * c.h)}; filter the businesses in them by true distance.`, tone: "ok",
    tables: [{ label: "cell size at the equator", head, rows: lens.map(row), tones: lens.includes(chosen) ? { [String(lens.indexOf(chosen))]: "ok" } : {} }] });
  return { kind: "grid", title: `Searching within ${km(r)}: geohash length ${chosen}`, steps };
}

/* ---------- object storage: erasure coding against copies ---------- */
function erasure(v: Record<string, number>): Flow {
  const k = v.k, m = v.m, ec = (k + m) / k;
  const bars = (b: number) => [{ label: "3 full copies", value: 3 }, { label: `${k} + ${m} code`, value: b, tone: b ? (b < 3 ? "ok" as const : "warn" as const) : undefined }];
  return { kind: "bars", title: `Storing 1 GB: 3 copies or a ${k} + ${m} code`, max: Math.max(3, ec), format: (x) => `${n2(x)} GB`, steps: [
    { note: "Three full copies on three machines use 3 GB per GB stored and survive losing any 2 of them.", bars: bars(0) },
    { note: `Erasure coding splits the object into ${k} data pieces and computes ${m} parity pieces, ${k + m} pieces on ${k + m} different machines.`, tone: "hot", bars: bars(0) },
    { note: `Each piece is 1/${k} GB, so the code stores ${k + m}/${k} = ${n2(ec)} GB per GB.`, tone: ec < 3 ? "ok" : "warn", bars: bars(ec) },
    { note: `Any ${k} of the ${k + m} pieces rebuild the object, so it survives losing any ${m} machine${m > 1 ? "s" : ""}${m > 2 ? `, more than the 2 that copies survive` : m === 2 ? ", the same as 3 copies" : ", fewer than 3 copies"}.`, tone: m >= 2 ? "ok" : "bad", bars: bars(ec) },
    { note: `The price: reading needs ${k} machines instead of 1, and a lost piece is rebuilt by reading ${k} others. So hot data often keeps copies and cold data gets the code.`, tone: "warn", bars: bars(ec) },
  ] };
}

/* ---------- metrics: why rollups exist ---------- */
function rollups(v: Record<string, number>): Flow {
  const S = v.series * 1000, raw = (S * v.days * 86_400) / v.interval, minute = S * 30 * 1440, hour = S * 365 * 24, rawYear = (S * 365 * 86_400) / v.interval;
  const label = ["raw", "1-min", "1-hour", "raw 1 year"];
  const bars = (vals: number[], hot?: number, tone: BarStep["tone"] = "hot") => label.map((l, i) => ({ label: l, value: vals[i] ?? 0, tone: i === hot ? tone : undefined }));
  const tiered = raw + minute + hour;
  return { kind: "bars", title: `${n0(S)} series every ${v.interval} s, raw kept ${v.days} d`, max: Math.max(rawYear, tiered), format: big, steps: [
    { note: `${n0(S)} time series (one per metric per host) each get a point every ${v.interval} seconds.`, bars: bars([]) },
    { note: `Keep raw points for ${v.days} day${v.days > 1 ? "s" : ""}: ${big(raw)} points.`, tone: "hot", bars: bars([raw], 0) },
    { note: `Then keep one averaged point per minute for 30 days: ${big(minute)} points.`, tone: "hot", bars: bars([raw, minute], 1) },
    { note: `Then one point per hour for a year: ${big(hour)} points.`, tone: "hot", bars: bars([raw, minute, hour], 2) },
    { note: `Keeping raw points for the whole year instead would be ${big(rawYear)} points, ${n1(rawYear / tiered)} times the ${big(tiered)} of the tiered plan. Old data is read at low resolution anyway.`, tone: rawYear > tiered ? "bad" : "warn", bars: bars([raw, minute, hour, rawYear], 3, rawYear > tiered ? "bad" : "warn") },
  ] };
}

/* ---------- recommendations: does ranking fit the latency budget? ---------- */
function rankBudget(v: Record<string, number>): Flow {
  const rank = (v.candidates * v.us) / v.workers / 1000, budget = RANK_BUDGET.reduce((s, [, ms]) => s + ms, 0);
  const SHORT = ["user features", "candidates", "ranking", "re-ranking", "network"];
  const stages = RANK_BUDGET.map(([s, ms], i) => [SHORT[i], s.startsWith("Ranking") ? rank : ms] as [string, number]);
  const total = stages.reduce((s, [, ms]) => s + ms, 0), steps: BarStep[] = [
    { note: `The feed has a ${budget} ms budget. Ranking scores ${n0(v.candidates)} candidates at ${v.us} microseconds each, split across ${v.workers} parallel workers.`, bars: stages.map(([s]) => ({ label: s, value: 0 })) },
  ];
  stages.forEach(([s, ms], i) => steps.push({ note: s === "ranking" ? `Ranking takes ${n0(v.candidates)} x ${v.us} us / ${v.workers} = ${n1(ms)} ms.` : `${RANK_BUDGET[i][0]}: ${n0(ms)} ms.`, tone: s === "ranking" ? (ms <= 60 ? "ok" : "bad") : undefined,
    bars: stages.map(([nm, x], j) => ({ label: nm, value: j <= i ? x : 0, tone: j === i ? "hot" as const : undefined })) }));
  steps.push({ note: total <= budget ? `${n1(total)} ms in all, inside the ${budget} ms budget with ${n1(budget - total)} ms to spare.` : `${n1(total)} ms in all, ${n1(total - budget)} ms over budget. Score fewer candidates, use a lighter model, or add workers.`, tone: total <= budget ? "ok" : "bad",
    bars: stages.map(([nm, x]) => ({ label: nm, value: x, tone: nm === "ranking" ? (total <= budget ? "ok" as const : "bad" as const) : undefined })) });
  return { kind: "bars", title: `Ranking ${n0(v.candidates)} candidates: ${n1(total)} ms of ${budget}`, format: (x) => `${n1(x)} ms`, steps };
}

/* ---------- search: NDCG when the best result moves ---------- */
const OTHERS = [2, 2, 1, 0, 0];
function ndcgPlay(v: Record<string, number>): Flow {
  const k = v.k, rels = [...OTHERS]; rels.splice(v.pos - 1, 0, 3);
  const top = rels.slice(0, k), head = ["pos", "grade", "gain", "discount", "adds"];
  const row = (g: number, i: number) => [String(i + 1), String(g), String(2 ** g - 1), n2(Math.log2(i + 2)), n2((2 ** g - 1) / Math.log2(i + 2))];
  const score = ndcg(rels, k), steps: GridStep[] = [{ note: `The perfect result (grade 3) sits at position ${v.pos}; the others are graded ${OTHERS.join(", ")}. NDCG@${k} scores the first ${k} positions.`, tables: [{ label: "result page", head, rows: top.map((g, i) => [String(i + 1), String(g), "", "", ""]) }] }];
  top.forEach((g, i) => steps.push({ note: `Position ${i + 1}, grade ${g}: gain 2^${g} - 1 = ${2 ** g - 1}, divided by log2(${i + 2}) = ${n2(Math.log2(i + 2))}, adds ${n2((2 ** g - 1) / Math.log2(i + 2))}.`, tone: g === 3 ? "hot" : undefined,
    tables: [{ label: "result page", head, rows: top.map((x, j) => (j <= i ? row(x, j) : [String(j + 1), String(x), "", "", ""])), tones: { [String(i)]: "hot" } }] }));
  steps.push({ note: `Divide by the score of the best order to get NDCG@${k} = ${n2(score)}.${v.pos === 1 ? " The best result is already on top." : v.pos > k ? ` The best result is below position ${k}, so it counts for nothing.` : ` Moving the best result from 1 to ${v.pos} cost ${n2(1 - score)}.`}`, tone: score >= 0.9 ? "ok" : score >= 0.7 ? "warn" : "bad",
    tables: [{ label: "result page", head, rows: top.map(row) }] });
  return { kind: "grid", title: `NDCG@${k} with the best result at position ${v.pos}`, steps };
}

/* ---------- ads: the auction ---------- */
function auction(v: Record<string, number>): Flow {
  const ads = [{ ad: "Shoes", bid: 2, pctr: v.ctr / 1000 }, { ad: "Laptop", bid: v.bid, pctr: 0.01 }, { ad: "Course", bid: 1, pctr: 0.04 }];
  const e = (a: (typeof ads)[number]) => a.bid * a.pctr * 1000, order = [...ads].sort((a, b) => e(b) - e(a)), w = order[0], r = order[1];
  const price = (r.bid * r.pctr) / w.pctr, head = ["ad", "bid", "pCTR", "eCPM"];
  const fmtRow = (a: (typeof ads)[number], show: boolean) => [a.ad, n2(a.bid), a.pctr.toFixed(3), show ? n2(e(a)) : ""];
  const steps: GridStep[] = [{ note: "Three ads compete for one slot. Each has a bid per click and a predicted click-through rate from the model.", tables: [{ label: "bids", head, rows: ads.map((a) => fmtRow(a, false)) }] }];
  ads.forEach((a, i) => steps.push({ note: `${a.ad}: ${n2(a.bid)} x ${a.pctr.toFixed(3)} x 1,000 = ${n2(e(a))} expected per 1,000 views.`, tone: "hot", tables: [{ label: "bids", head, rows: ads.map((x, j) => fmtRow(x, j <= i)), tones: { [String(i)]: "hot" } }] }));
  steps.push({ note: `Rank by eCPM: ${order.map((a) => a.ad).join(", ")}. ${w.ad} wins${w.bid < Math.max(...ads.map((a) => a.bid)) ? " without the highest bid, because users click it more" : ""}.`, tone: "ok", tables: [{ label: "ranked", head, rows: order.map((a) => fmtRow(a, true)), tones: { "0": "ok" } }] });
  steps.push({ note: `Second price: ${w.ad} pays just enough to stay ahead of ${r.ad}: ${n2(r.bid * r.pctr * 1000)} / 1,000 / ${w.pctr.toFixed(3)} = ${n2(price)} per click, not its bid of ${n2(w.bid)}.`, tone: "ok", tables: [{ label: "ranked", head, rows: order.map((a) => fmtRow(a, true)), tones: { "0": "ok" } }] });
  return { kind: "grid", title: `Ad auction: Laptop bids ${n2(v.bid)}, Shoes pCTR ${(v.ctr / 1000).toFixed(3)}`, steps };
}

/* ---------- ML platform: population stability index ---------- */
const TRAIN = [0.25, 0.25, 0.25, 0.25];
function drift(v: Record<string, number>): Flow {
  const d = v.shift / 100, live = TRAIN.map((e, i) => e + (i - 1.5) * d), parts = TRAIN.map((e, i) => (live[i] - e) * Math.log(live[i] / e)), total = parts.reduce((a, b) => a + b, 0);
  const head = ["bucket", "training", "live", "adds"];
  const row = (i: number, done: boolean) => [`B${i + 1}`, pct(TRAIN[i]), pct(live[i]), done ? parts[i].toFixed(4) : ""];
  const steps: GridStep[] = [{ note: `A feature is cut into 4 buckets that each held 25% of training rows. Live traffic has shifted toward the high buckets by ${v.shift} points per step.`, tables: [{ label: "share of rows", head, rows: TRAIN.map((_, i) => row(i, false)) }] }];
  TRAIN.forEach((e, i) => steps.push({ note: `${`B${i + 1}`}: (${pct(live[i])} - ${pct(e)}) x ln(${pct(live[i])} / ${pct(e)}) = ${parts[i].toFixed(4)}.`, tone: "hot", tables: [{ label: "share of rows", head, rows: TRAIN.map((_, j) => row(j, j <= i)), tones: { [String(i)]: "hot" } }] }));
  const verdict = total < 0.1 ? ["stable", "ok"] : total <= 0.25 ? ["worth watching", "warn"] : ["a real shift: check the pipeline and consider retraining", "bad"];
  steps.push({ note: `PSI = ${total.toFixed(3)}. By the common rule of thumb (under 0.1 stable, over 0.25 shifted) this is ${verdict[0]}.`, tone: verdict[1] as BarStep["tone"], tables: [{ label: "share of rows", head, rows: TRAIN.map((_, i) => row(i, true)) }] });
  return { kind: "grid", title: `Drift check: PSI ${total.toFixed(3)}`, steps };
}

/* ---------- LLM app: what a RAG answer costs ---------- */
function ragCost(v: Record<string, number>): Flow {
  const SYS = 400, CH = 300, Q = 100, OUT = 300, PIN = 1, POUT = 4;          // tokens; assumed prices per million tokens
  const inTok = SYS + v.chunks * CH + Q, per = v.perDay * 1000, cin = (per * inTok * PIN) / 1e6, cout = (per * OUT * POUT) / 1e6, total = cin + cout, after = total * (1 - v.cache / 100);
  const bars = (a: number, b: number, c: number) => [{ label: "input tokens", value: a }, { label: "output tokens", value: b }, { label: "with cache", value: c, tone: c ? "ok" as const : undefined }];
  return { kind: "bars", title: `${n0(per)} questions a day, ${v.chunks} chunks, ${v.cache}% cached`, max: total, format: (x) => n0(x), steps: [
    { note: `Each answer sends a ${SYS}-token instruction, ${v.chunks} retrieved chunks of ${CH} tokens and a ${Q}-token question: ${n0(inTok)} input tokens, plus about ${OUT} output tokens.`, bars: bars(0, 0, 0) },
    { note: `At an assumed ${PIN} per million input tokens, ${n0(per)} questions cost ${n0(cin)} a day for input.`, tone: "hot", bars: bars(cin, 0, 0) },
    { note: `At an assumed ${POUT} per million output tokens, output costs ${n0(cout)} a day: ${n0(total)} in all.`, tone: "hot", bars: bars(cin, cout, 0) },
    { note: `A cache that answers ${v.cache}% of questions without the model brings it to ${n0(after)} a day.`, tone: "ok", bars: bars(cin, cout, after) },
    { note: `Input is ${pct(cin / total)} of the bill, so ${cin > cout ? "fewer, better chunks save the most" : "shorter answers save the most"}. Each chunk you drop saves ${n0((per * CH * PIN) / 1e6)} a day.`, tone: "warn", bars: bars(cin, cout, after) },
  ] };
}

export const PLAY: Record<string, PlayFlow> = {
  "sd-play-cache": { title: "Cache hit rate and database load", knobs: [{ key: "reads", label: "reads (thousand/s)", min: 10, max: 200, step: 10, value: 50 }, { key: "hit", label: "hit rate", min: 0, max: 99, value: 90, unit: "%" }, { key: "cap", label: "database limit (thousand/s)", min: 2, max: 30, value: 10 }], make: caching },
  "sd-play-queue": { title: "Does the backlog drain?", knobs: [{ key: "rate", label: "jobs arriving per second", min: 50, max: 500, step: 50, value: 300 }, { key: "consumers", label: "consumers", min: 1, max: 10, value: 4 }, { key: "per", label: "jobs per consumer per second", min: 20, max: 150, step: 10, value: 90 }], make: queues },
  "sd-play-ids": { title: "Splitting 64 bits for IDs", knobs: [{ key: "machine", label: "machine bits", min: 5, max: 14, value: 10 }, { key: "seq", label: "sequence bits", min: 6, max: 16, value: 12 }], make: ids },
  "sd-play-url": { title: "How long must a short code be?", knobs: [{ key: "perDay", label: "new URLs a day (millions)", min: 1, max: 500, value: 100 }, { key: "years", label: "years", min: 1, max: 20, value: 10 }, { key: "len", label: "code length", min: 5, max: 9, value: 7 }], make: url },
  "sd-play-feed": { title: "Fan-out and the celebrity limit", knobs: [{ key: "followers", label: "followers (thousands)", min: 1, max: 2000, value: 50 }, { key: "posts", label: "posts a day", min: 1, max: 20, value: 5 }, { key: "limit", label: "pull above (thousand followers)", min: 10, max: 1000, step: 10, value: 100 }], make: feed },
  "sd-play-video": { title: "Video storage per day", knobs: [{ key: "uploads", label: "uploads a day (thousands)", min: 10, max: 1000, step: 10, value: 500 }, { key: "minutes", label: "average minutes", min: 1, max: 30, value: 8 }, { key: "renditions", label: "versions kept", min: 1, max: 6, value: 5 }], make: video },
  "sd-play-chunks": { title: "Syncing only the changed chunks", knobs: [{ key: "size", label: "file size", min: 10, max: 1000, step: 10, value: 200, unit: " MB" }, { key: "chunk", label: "chunk size", min: 1, max: 16, value: 4, unit: " MB" }, { key: "edit", label: "edit size", min: 1, max: 50, value: 2, unit: " MB" }], make: chunks },
  "sd-play-partitions": { title: "Partitions and consumers", knobs: [{ key: "partitions", label: "partitions", min: 1, max: 12, value: 6 }, { key: "consumers", label: "consumers in the group", min: 1, max: 8, value: 4 }], make: partitions },
  "sd-play-geohash": { title: "Geohash length for a radius", knobs: [{ key: "radius", label: "search radius", min: 0.5, max: 20, step: 0.5, value: 2, unit: " km" }], make: geohash },
  "sd-play-erasure": { title: "Erasure coding against copies", knobs: [{ key: "k", label: "data pieces", min: 2, max: 12, value: 8 }, { key: "m", label: "parity pieces", min: 1, max: 6, value: 4 }], make: erasure },
  "sd-play-rollups": { title: "Why metrics are rolled up", knobs: [{ key: "series", label: "time series (thousands)", min: 10, max: 1000, step: 10, value: 100 }, { key: "interval", label: "sample every", min: 1, max: 60, value: 10, unit: " s" }, { key: "days", label: "raw kept for", min: 1, max: 30, value: 7, unit: " days" }], make: rollups },
  "sd-play-rank": { title: "Ranking inside the latency budget", knobs: [{ key: "candidates", label: "candidates scored", min: 200, max: 3000, step: 100, value: 1000 }, { key: "us", label: "microseconds per item", min: 10, max: 200, step: 10, value: 50 }, { key: "workers", label: "parallel workers", min: 1, max: 16, value: 1 }], make: rankBudget },
  "sd-play-ndcg": { title: "NDCG when the best result moves", knobs: [{ key: "pos", label: "best result at position", min: 1, max: 6, value: 3 }, { key: "k", label: "positions scored (k)", min: 3, max: 6, value: 5 }], make: ndcgPlay },
  "sd-play-auction": { title: "The ad auction", knobs: [{ key: "bid", label: "Laptop bid per click", min: 1, max: 10, step: 0.5, value: 5 }, { key: "ctr", label: "Shoes pCTR (per 1,000 views)", min: 5, max: 60, step: 5, value: 30 }], make: auction },
  "sd-play-drift": { title: "Measuring drift with PSI", knobs: [{ key: "shift", label: "live shift (points)", min: 0, max: 10, value: 6 }], make: drift },
  "sd-play-rag": { title: "What a RAG answer costs", knobs: [{ key: "chunks", label: "chunks per question", min: 1, max: 10, value: 5 }, { key: "cache", label: "cache hit rate", min: 0, max: 80, step: 10, value: 30, unit: "%" }, { key: "perDay", label: "questions a day (thousands)", min: 100, max: 5000, step: 100, value: 1000 }], make: ragCost },
};

/** System Design chapter id to its interactive walk-through, merged into the chapters by design.ts. */
export const DESIGN_PLAY: Record<string, string> = {
  caching: "sd-play-cache", queues: "sd-play-queue", ids: "sd-play-ids", url: "sd-play-url", feed: "sd-play-feed", video: "sd-play-video",
  storage: "sd-play-chunks", mq: "sd-play-partitions", proximity: "sd-play-geohash", objectstore: "sd-play-erasure", metrics: "sd-play-rollups",
  mlrecs: "sd-play-rank", mlsearch: "sd-play-ndcg", mlads: "sd-play-auction", mlplatform: "sd-play-drift", mlllm: "sd-play-rag",
};
