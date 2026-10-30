import type { Subject } from "./types";

export const NODE: Subject = {
  id: "node",
  name: "Node.js and Express",
  short: "Node",
  blurb: "The Node runtime and its event loop, modules, files and streams, then Express from first route to middleware, REST design, auth, validation, errors, security, testing and production. Every script here runs, and every Express app is started and stopped by the check.",
  chapters: [
    {
      id: "runtime",
      title: "What Node is: runtime, modules and process",
      summary: "Node runs JavaScript outside the browser on Google's V8 engine, with **libuv** providing an event loop and a thread pool for file system, DNS and crypto work. It is single-threaded for your code, which is why it handles many concurrent connections well and CPU-heavy work badly.",
      diagram: `flowchart TB
  JS["your JavaScript"] --> V8["V8: compiles and runs JS"]
  JS --> API["Node APIs: fs, http, crypto, streams"]
  API --> UV["libuv: event loop + thread pool"]
  UV --> OS["operating system: sockets, files, timers"]`,
      caption: "One thread runs your code; slow I/O is handed to the OS or the libuv thread pool.",
      points: [
        "**ES modules** (`import`/`export`, `.mjs` or `\"type\": \"module\"`) are the standard. **CommonJS** (`require`, `module.exports`) is the older system still common in packages.",
        "Import built-ins with the `node:` prefix (`node:fs`, `node:path`) so they can never be confused with npm packages.",
        "`process` gives you `argv`, `env`, `exit`, `cwd()` and events like `uncaughtException`.",
      ],
      code: {
        file: "info.mjs",
        js: `import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));   // ESM has no __dirname
const env = process.env.NODE_ENV ?? "development";           // configuration comes from env vars
console.log({
  node: process.version,
  platform: os.platform(),
  cpus: os.cpus().length,
  here: path.basename(here),
  env,
  args: process.argv.slice(2),                               // node info.mjs --port 4000
});`,
      },
      cards: [
        { id: "single-thread", q: "If Node is single-threaded, how does it handle 10,000 connections?", a: "Your JavaScript runs on one thread, but waiting is not done by that thread. Network sockets are watched by the OS (epoll, kqueue), and file and crypto work goes to libuv's thread pool. When a result is ready its callback is queued, and the event loop runs callbacks one after another. As long as no callback blocks for long, one thread can serve many idle-waiting connections." },
        { id: "cpu-bound", q: "How do you run CPU-heavy work in Node?", a: "Move it off the main thread: `worker_threads` for parallel JS, child processes or a separate service for heavy jobs, or a job queue (BullMQ) processed by workers. A long synchronous loop on the main thread blocks every request." },
        { id: "esm-cjs", q: "ESM vs CommonJS: practical differences?", a: "ESM imports are static and asynchronous, support top-level await and tree-shaking, and use file URLs (`import.meta.url`). CommonJS `require` is synchronous and dynamic, with `__dirname` and `module.exports`. Modern Node can `require()` many ES modules, but new code should be ESM." },
      ],
    },
    {
      id: "event-loop",
      title: "The Node event loop in detail",
      summary: "Node's loop runs in **phases**: timers, pending callbacks, poll (I/O), check (`setImmediate`), close callbacks. Between every callback it drains two queues first: `process.nextTick` callbacks, then promise microtasks.",
      diagram: `flowchart LR
  T["timers<br/>setTimeout, setInterval"] --> PC["pending callbacks"]
  PC --> P["poll<br/>wait for I/O, run its callbacks"]
  P --> C["check<br/>setImmediate"]
  C --> CL["close callbacks"]
  CL --> T
  M["after EVERY callback:<br/>1. process.nextTick queue<br/>2. promise microtasks"] -.-> T`,
      caption: "Inside an I/O callback, setImmediate always runs before a 0 ms setTimeout.",
      lab: "eventloop",
      code: {
        file: "order.mjs",
        js: `import { readFile } from "node:fs";
import { fileURLToPath } from "node:url";

console.log("1 sync");
process.nextTick(() => console.log("3 nextTick"));
Promise.resolve().then(() => console.log("4 promise"));
console.log("2 sync");

readFile(fileURLToPath(import.meta.url), () => {    // inside an I/O callback (poll phase)
  setTimeout(() => console.log("6 timeout"), 0);
  setImmediate(() => console.log("5 immediate"));   // check phase comes right after poll
});`,
      },
      cards: [
        { id: "nexttick-promise", q: "process.nextTick vs Promise.then vs setImmediate?", a: "`nextTick` callbacks run first, before promise microtasks, as soon as the current operation finishes. Promise callbacks run next. `setImmediate` runs in the check phase of the next loop iteration. Recursive nextTick calls can starve I/O, so prefer queueMicrotask or setImmediate for deferring work." },
        { id: "block-loop", q: "How do you detect that something is blocking the event loop?", a: "Measure event-loop delay (`perf_hooks.monitorEventLoopDelay`, or APM tools), watch p99 latency rise under load, and profile with `--cpu-prof` or clinic.js. Typical culprits: synchronous fs or crypto calls, huge JSON.parse, regex backtracking, and big loops." },
      ],
    },
    {
      id: "fs-streams",
      title: "Files, buffers and streams",
      summary: "Read and write files with `node:fs/promises`. For anything large, use **streams**: data flows in chunks, so memory stays flat no matter the file size, and `pipeline` handles backpressure and errors.",
      diagram: `flowchart TB
  F[("10 GB log file")] -->|"64 KB chunks"| R["createReadStream"]
  F -.->|"readFile instead"| X["whole file in memory: crash"]:::bad
  R --> T["transform: gzip"]
  T --> W["createWriteStream: when its buffer fills, the reader pauses"]
  W --> O[("log.gz")]:::ok`,
      caption: "A stream moves the file in small chunks, so memory stays flat. When the writer falls behind, backpressure pauses the reader.",
      code: {
        file: "streams.mjs",
        js: `import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const dir = await mkdtemp(join(tmpdir(), "demo-"));
const file = join(dir, "users.json");
await writeFile(file, JSON.stringify([{ name: "asha" }, { name: "ben" }]));
const users = JSON.parse(await readFile(file, "utf8"));       // small file: read it whole

// big data: stream it through a transform, chunk by chunk
const upper = new Transform({
  transform(chunk, _enc, done) { done(null, chunk.toString().toUpperCase()); },
});
const out = join(dir, "log.txt");
await pipeline(Readable.from(["line one\\n", "line two\\n"]), upper, createWriteStream(out));

let text = "";
for await (const chunk of createReadStream(out)) text += chunk;   // readable streams are async iterable
console.log(users.length, text.trim().split("\\n"), Buffer.from("hi").toString("hex"));`,
      },
      cards: [
        { id: "backpressure", q: "What is backpressure?", a: "When the writer is slower than the reader (disk or network slower than the source), data piles up in memory. Streams signal backpressure: `write()` returns false and the readable pauses until the writable emits `drain`. `pipeline` handles this for you and destroys every stream on error." },
        { id: "sync-fs", q: "Is `fs.readFileSync` ever fine?", a: "At startup, for loading config before the server accepts requests. Inside request handlers it blocks the whole process for every user, so use the promise API there." },
      ],
    },
    {
      id: "http",
      title: "HTTP from scratch, then Express",
      summary: "Node's `node:http` module gives you a raw request and response. **Express** wraps it with routing, middleware, and helpers like `res.json`. Express 5 is the current major version: it forwards errors from async handlers automatically.",
      diagram: `flowchart TB
  N["node:http request"] --> M1["middleware: express.json, cors, logger"]
  M1 --> RT{"router: method + path"}
  RT -->|"GET /users/:id"| H1["handler: res.json(user)"]:::ok
  RT -->|"no match"| NF["404"]:::warn
  H1 -->|"throws or rejects"| EH["error handler: 500 + JSON"]:::bad`,
      caption: "Express sits on top of node:http: middleware first, then the router picks one handler, and errors jump to the error handler.",
      code: {
        file: "server.mjs",
        js: `import express from "express";

const app = express();
app.use(express.json());                                   // parse JSON request bodies

app.get("/", (req, res) => res.send("ok"));
app.get("/users/:id", (req, res) => {                      // route parameter
  const { id } = req.params;
  const { fields } = req.query;                            // /users/7?fields=name
  res.json({ id: Number(id), fields: fields ?? "all" });
});
app.post("/users", (req, res) => {
  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name is required" });
  res.status(201).json({ id: 8, name });
});

app.listen(3000, () => console.log("listening on http://localhost:3000"));`,
      },
      cards: [
        { id: "raw-http", q: "What does Express add over node:http?", a: "Routing by method and path with parameters, a middleware chain, body parsing, helpers (`res.json`, `res.status`, `res.redirect`), static files, and a central error handler. With raw `http` you parse URLs, bodies and headers yourself and write one big if/else on `req.url`.",
          code: { js: `import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404).end();
  }
});
server.listen(3000, () => console.log("raw server up"));` } },
        { id: "params-query-body", q: "req.params vs req.query vs req.body?", a: "`params` come from the path pattern (`/users/:id`), `query` from the query string (`?page=2`), and `body` from the request payload, which is only filled in after a body-parsing middleware like `express.json()`. All of them are user input: validate before use." },
      ],
    },
    {
      id: "middleware",
      title: "Middleware: the request pipeline",
      summary: "Express is a chain of middleware functions `(req, res, next)`. Each can read or change the request, end the response, or call `next()` to pass control on. Order matters: they run in the order you register them. An **error middleware** has four arguments and catches anything passed to `next(err)` or thrown.",
      diagram: `flowchart TB
  H0["request, then logger, then express.json()"]
  subgraph R1[" "]
    direction LR
    Q1(["auth: token ok?"]) --> A1["no: 401"]:::bad
  end
  subgraph R2[" "]
    direction LR
    Q2(["handler throws?"]) --> A2["yes: error handler sends 500"]:::bad
  end
  H0 --> R1
  R1 -->|"next()"| R2
  R2 -->|"no"| T0["200 response"]:::ok`,
      caption: "Each middleware either responds or calls next(). Errors skip ahead to the error handler.",
      code: {
        file: "middleware.mjs",
        js: `import express from "express";

const app = express();

app.use((req, res, next) => {                          // 1. logger: runs for every request
  const start = Date.now();
  res.on("finish", () => console.log(req.method, req.url, res.statusCode, \`\${Date.now() - start}ms\`));
  next();
});
app.use(express.json());                               // 2. body parser

function requireAuth(req, res, next) {                 // 3. route-level middleware
  const token = req.get("authorization")?.replace("Bearer ", "");
  if (token !== "secret-demo-token") return res.status(401).json({ error: "unauthorised" });
  req.user = { id: 1, role: "admin" };
  next();
}

app.get("/", (req, res) => res.json({ ok: true }));
app.get("/me", requireAuth, (req, res) => res.json(req.user));
app.get("/boom", async () => { throw new Error("database down"); });   // Express 5 catches async throws

app.use((req, res) => res.status(404).json({ error: "not found" }));    // no route matched
app.use((err, req, res, next) => {                     // error handler: 4 arguments
  console.error(err.message);
  res.status(err.status ?? 500).json({ error: "something went wrong" });
});

app.listen(3000);`,
      },
      cards: [
        { id: "next-err", q: "What happens if a middleware neither responds nor calls next()?", a: "The request hangs until the client times out. Every path through a middleware must end the response or call `next()` (or `next(err)`)." },
        { id: "express4-async", q: "Express 4 vs 5 with async handlers?", a: "In Express 4, a rejected promise in an async handler was not caught: you needed try/catch with `next(err)` or a wrapper. Express 5 passes rejected promises to the error handler automatically. Express 5 also changed path syntax (named wildcards like `/*splat`) and removed some deprecated methods." },
      ],
    },
    {
      id: "rest",
      title: "Designing a REST API",
      summary: "Resources are nouns in the URL, actions are HTTP methods, and status codes tell the client what happened. Group routes with `express.Router()`, validate input at the edge, and return consistent JSON errors.",
      diagram: `flowchart TB
  H0["POST /users"]:::hot
  subgraph R1[" "]
    direction LR
    Q1(["authenticated?"]) --> A1["no: 401 Unauthorized"]:::bad
  end
  subgraph R2[" "]
    direction LR
    Q2(["body valid?"]) --> A2["no: 400 + error JSON"]:::bad
  end
  subgraph R3[" "]
    direction LR
    Q3(["email free?"]) --> A3["no: 409 Conflict"]:::warn
  end
  H0 --> R1
  R1 -->|"yes"| R2
  R2 -->|"yes"| R3
  R3 --> T0["201 Created + Location: /users/8"]:::ok`,
      caption: "One POST request, and the status code each exit returns.",
      table: { head: ["Action", "Method and path", "Success", "Common errors"], rows: [
        ["List", "GET /api/notes?page=2", "200", "400 bad query"],
        ["Read one", "GET /api/notes/:id", "200", "404"],
        ["Create", "POST /api/notes", "201 + Location", "400 / 422 invalid body"],
        ["Replace", "PUT /api/notes/:id", "200", "404, 400"],
        ["Update part", "PATCH /api/notes/:id", "200", "404, 400"],
        ["Delete", "DELETE /api/notes/:id", "204", "404"],
      ] },
      code: {
        file: "notes-api.mjs",
        js: `import express from "express";

const notes = new Map([[1, { id: 1, text: "revise joins", done: false }]]);
let nextId = 2;

function validateNote(body) {                              // validate at the edge (or use zod)
  if (typeof body?.text !== "string" || body.text.trim() === "") return "text must be a non-empty string";
  if (body.text.length > 500) return "text is too long";
  return null;
}

const router = express.Router();
router.get("/", (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), size = 20;
  const all = [...notes.values()];
  res.json({ items: all.slice((page - 1) * size, page * size), total: all.length, page });
});
router.get("/:id", (req, res) => {
  const note = notes.get(Number(req.params.id));
  return note ? res.json(note) : res.status(404).json({ error: "note not found" });
});
router.post("/", (req, res) => {
  const problem = validateNote(req.body);
  if (problem) return res.status(400).json({ error: problem });
  const note = { id: nextId++, text: req.body.text.trim(), done: false };
  notes.set(note.id, note);
  res.status(201).location(\`/api/notes/\${note.id}\`).json(note);
});
router.patch("/:id", (req, res) => {
  const note = notes.get(Number(req.params.id));
  if (!note) return res.status(404).json({ error: "note not found" });
  if ("done" in (req.body ?? {})) note.done = Boolean(req.body.done);
  res.json(note);
});
router.delete("/:id", (req, res) => (notes.delete(Number(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "note not found" })));

const app = express();
app.use(express.json());
app.use("/api/notes", router);
app.listen(3000);`,
      },
      cards: [
        { id: "put-patch", q: "PUT vs PATCH?", a: "PUT replaces the whole resource with the body you send (missing fields are cleared) and is idempotent. PATCH changes only the fields you send. Both should return 404 for a missing resource unless your API allows PUT to create." },
        { id: "pagination", q: "Offset vs cursor pagination?", a: "Offset (`?page=3&size=20`) is simple but slow on deep pages and skips or repeats rows when data changes. Cursor pagination (`?after=<last id>`) uses an indexed column to continue exactly where the last page ended: fast and stable, but no random page jumps." },
        { id: "idempotency", q: "How do you make a POST safe to retry?", a: "Accept an `Idempotency-Key` header; store the key with the response the first time, and return the stored response for repeats instead of creating a second order or payment." },
      ],
    },
    {
      id: "auth",
      title: "Authentication: passwords, sessions and JWTs",
      summary: "Never store passwords: store a slow, salted hash (scrypt, bcrypt or argon2). After login, the server either keeps a **session** and gives the browser a cookie with its id, or issues a signed **JWT** that the client sends back on each request.",
      diagram: `sequenceDiagram
  participant B as Browser
  participant S as Server
  participant DB as Database
  B->>S: POST /login (email, password)
  S->>DB: fetch user and password hash
  S->>S: verify hash (scrypt / bcrypt)
  S-->>B: Set-Cookie sid=... (HttpOnly, Secure, SameSite)
  B->>S: GET /me (cookie sent automatically)
  S->>S: look up session by sid
  S-->>B: 200 user data`,
      caption: "Session cookies: easy to revoke. JWTs: no lookup per request, harder to revoke before expiry.",
      code: {
        file: "passwords.mjs",
        js: `import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);                       // a unique salt defeats precomputed tables
  const key = await scryptAsync(password, salt, 64);  // deliberately slow to compute
  return \`\${salt.toString("hex")}:\${key.toString("hex")}\`;
}

async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = stored.split(":");
  const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), 64);
  return timingSafeEqual(key, Buffer.from(keyHex, "hex"));   // constant time: no timing leaks
}

const stored = await hashPassword("correct horse");
console.log(stored.length, await verifyPassword("correct horse", stored), await verifyPassword("wrong", stored));   // 161 true false`,
      },
      cards: [
        { id: "jwt", q: "What is inside a JWT, and what is the main risk?", a: "Three base64url parts: a header (algorithm), a payload of claims (user id, roles, expiry) and a signature. The payload is readable by anyone; the signature only proves it was not changed. Risks: putting secrets in the payload, long lifetimes that cannot be revoked, accepting `alg: none` or the wrong algorithm, and storing it in localStorage where XSS can read it. Use short-lived access tokens with refresh tokens, or plain sessions." },
        { id: "cookie-flags", q: "Which cookie flags matter for auth?", a: "`HttpOnly` (JavaScript cannot read it, so XSS cannot steal it), `Secure` (HTTPS only), `SameSite=Lax` or `Strict` (blocks most cross-site request forgery), a sensible `Max-Age`, and a narrow `Path`/`Domain`." },
        { id: "authn-authz", q: "Authentication vs authorization?", a: "Authentication answers who you are (login). Authorization answers what you may do (can this user edit this note?). Check authorization on every request on the server, at the resource level, not just by hiding buttons in the UI." },
      ],
    },
    {
      id: "data",
      title: "Configuration, databases and async patterns",
      summary: "Production apps read configuration from environment variables, open one database connection pool at startup, and keep handlers thin: validate, call a service function, return a response.",
      diagram: `flowchart TB
  S["startup"] --> CFG["config: read env vars, validate once"]:::hot
  CFG --> POOL[("one database pool")]
  POOL --> L["listen: requests arrive"]
  L --> H["handler: validate input"]
  H --> SV["service: business rules"]
  SV --> RP["repository: SQL"]
  RP -.->|"borrows a connection"| POOL
  RP --> RES["response"]:::ok`,
      caption: "Config is read and checked once at startup; handlers stay thin and pass work down the layers.",
      points: [
        "Use a **connection pool** (pg's Pool, Prisma, Drizzle, Mongoose). Opening a connection per request is slow and exhausts the database.",
        "Always use **parameterised queries** (`$1`, `?`) or an ORM; never build SQL with string concatenation.",
        "Layering: routes (HTTP) → services (business rules) → repositories (database). It keeps logic testable without a server.",
      ],
      code: {
        file: "config-and-retry.mjs",
        js: `// Fail fast on bad configuration, and retry transient failures with backoff.
function loadConfig(env) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) throw new Error("PORT must be a positive integer");
  return { port, dbUrl: env.DATABASE_URL ?? "postgres://localhost/dev", isProd: env.NODE_ENV === "production" };
}

async function withRetry(fn, { tries = 3, baseMs = 50 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= tries) throw err;
      const wait = baseMs * 2 ** (attempt - 1) * (0.5 + Math.random());   // exponential backoff with jitter
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

let calls = 0;
const flaky = async () => { calls++; if (calls < 3) throw new Error("ECONNRESET"); return "connected"; };
console.log(loadConfig({ PORT: "4000" }), await withRetry(flaky), "after", calls, "calls");`,
      },
      cards: [
        { id: "sql-injection", q: "Show SQL injection and the fix.", a: "Concatenating input into SQL lets an attacker change the query: `\"SELECT * FROM users WHERE email = '\" + email + \"'\"` with `' OR '1'='1` returns every user. Use placeholders so the value is sent separately from the SQL text: `db.query(\"SELECT * FROM users WHERE email = $1\", [email])`." },
        { id: "n-plus-1", q: "What is the N+1 query problem?", a: "Fetching a list (1 query) and then a related row for each item (N queries). It is invisible with 5 rows and crushing with 5,000. Fix it with a join, an IN query for all ids at once, or the ORM's eager loading." },
      ],
    },
    {
      id: "security",
      title: "Security and production readiness",
      summary: "Most Express incidents come from a short list: missing input validation, overly open CORS, no rate limits, leaked error details, outdated dependencies and secrets in code. Each has a standard fix.",
      diagram: `flowchart TB
  I["internet"] --> RL["rate limit: slow down brute force"]:::hot
  RL --> CO["CORS: only your own origins"]
  CO --> HE["helmet: security headers"]
  HE --> AU["auth: verify the token"]
  AU --> V["validate input"]
  V --> H["handler: parameterized SQL, secrets from env"]:::ok
  H -.->|"on error"| EH["client gets a generic message, logs get the details"]:::warn`,
      caption: "Each layer blocks one common attack before the request reaches your code.",
      table: { head: ["Risk", "Fix"], rows: [
        ["Missing security headers", "helmet() middleware"],
        ["Any site can call your API from a browser", "cors({ origin: [your domains], credentials: true })"],
        ["Brute force and abuse", "rate limiting per IP or user (express-rate-limit, or at the gateway)"],
        ["Bad input reaching the database", "schema validation (zod) on body, params and query"],
        ["Stack traces sent to users", "generic error messages in production; log details server-side"],
        ["Vulnerable packages", "npm audit, Dependabot, lockfiles"],
        ["Secrets in the repo", "environment variables or a secret manager"],
      ] },
      code: {
        file: "graceful.mjs",
        js: `import express from "express";

const app = express();
app.disable("x-powered-by");                         // do not advertise the framework
app.get("/", (req, res) => res.json({ ok: true }));
app.get("/healthz", (req, res) => res.json({ status: "up" }));   // for load balancers and Kubernetes

const server = app.listen(3000);

function shutdown(signal) {                          // finish in-flight requests, then exit
  console.log(\`\${signal}: closing server\`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref(); // force exit if something hangs
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);`,
      },
      cards: [
        { id: "cors", q: "What is CORS, and does it protect your API?", a: "CORS is a browser rule: a page from origin A may read responses from origin B only if B's response headers allow A. It protects users' browsers, not your server: curl or a script ignores it. Restrict origins anyway, and still authenticate every request." },
        { id: "scale", q: "How do you scale a Node API?", a: "Run several processes (one per core with the cluster module or PM2, or several containers) behind a load balancer; keep the app stateless (sessions in Redis or a database, files in object storage); cache hot reads; move slow work to a queue; and scale the database with indexes, read replicas and pooling." },
      ],
    },
    {
      id: "testing",
      title: "Testing an Express API",
      summary: "Start the app on a random port (`listen(0)`) inside the test, call it with `fetch`, and assert on status codes and JSON. Node ships a test runner (`node:test`), so a small API needs no extra libraries.",
      diagram: `flowchart TB
  B["before: app.listen(0)"] --> P["the OS picks a free port"]
  P --> T1["test: POST /sum with a = 2, b = 3"]
  P --> T2["test: POST /sum with a = '2'"]
  T1 --> A1["assert 200 and sum 5"]:::ok
  T2 --> A2["assert 400"]:::ok
  A1 --> AF["after: server.close()"]
  A2 --> AF`,
      caption: "Each test file owns its server: a free port before, real HTTP calls in the tests, close after.",
      code: {
        file: "api.test.mjs",
        js: `import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";

function buildApp() {                                // export a factory so tests get a fresh app
  const app = express();
  app.use(express.json());
  app.post("/sum", (req, res) => {
    const { a, b } = req.body ?? {};
    if (typeof a !== "number" || typeof b !== "number") return res.status(400).json({ error: "a and b must be numbers" });
    res.json({ sum: a + b });
  });
  return app;
}

let server, base;
before(() => new Promise((resolve) => {
  server = buildApp().listen(0, () => { base = \`http://127.0.0.1:\${server.address().port}\`; resolve(); });
}));
after(() => server.close());

test("adds two numbers", async () => {
  const r = await fetch(\`\${base}/sum\`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ a: 2, b: 3 }) });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { sum: 5 });
});

test("rejects bad input", async () => {
  const r = await fetch(\`\${base}/sum\`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ a: "2" }) });
  assert.equal(r.status, 400);
});`,
      },
      cards: [
        { id: "test-pyramid", q: "What should you test in a backend?", a: "Many fast unit tests for business rules (pure functions, services with fake repositories), fewer integration tests that hit the real HTTP layer and a test database, and a handful of end-to-end tests of critical flows. Test error paths and auth, not just the happy path." },
        { id: "supertest", q: "Supertest or fetch?", a: "Supertest wraps an Express app without opening a port and has a fluent assertion API; fetch against `listen(0)` uses only the standard library and exercises the real network stack. Both are fine; be consistent." },
      ],
    },
  ],
};
