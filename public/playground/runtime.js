// Runs inside the code playground's sandboxed iframe (no same-origin access to the app, its cookies or storage).
// A small emulation of Node's core modules and Express, plus console capture and an error boundary for React.
// It is a teaching tool: `npm run check:other` runs the Node samples through it and compares with real Node and
// real Express, but it is not Node. Written as a plain script so the same file runs in the iframe and in the check.
(function () {
  "use strict";

  /* ---------- util.inspect / console formatting, close to Node's output ---------- */
  function quote(s) {
    const q = !s.includes("'") ? "'" : !s.includes('"') ? '"' : !s.includes("`") ? "`" : "'";
    return q + s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(q === "'" ? /'/g : /$^/g, "\\'") + q;
  }
  const IDENT = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

  function inspect(value, opts) {
    const ctx = { depth: opts && opts.depth !== undefined ? (opts.depth === null ? Infinity : opts.depth) : 2, seen: [], indent: 0, currentDepth: 0 };
    return fmt(ctx, value, 0, true);
  }
  function fmt(ctx, v, level, top) {
    switch (typeof v) {
      case "string": return top === "raw" ? v : quote(v);
      case "number": return Object.is(v, -0) ? "-0" : String(v);
      case "bigint": return v + "n";
      case "boolean": case "undefined": return String(v);
      case "symbol": return v.toString();
    }
    if (v === null) return "null";
    return fmtObject(ctx, v, level);
  }
  function fmtObject(ctx, v, level) {
    if (ctx.seen.includes(v)) return "[Circular *1]";
    const ctor = (() => { try { return Object.getPrototypeOf(v) === null ? null : v.constructor && v.constructor.name; } catch { return "Object"; } })();
    const keys = Object.keys(v).filter((k) => !(Array.isArray(v) && /^\d+$/.test(k)));
    let braces = ["{", "}"], prefix = "", items = null;
    if (Array.isArray(v)) { braces = ["[", "]"]; if (ctor && ctor !== "Array") prefix = `${ctor}(${v.length}) `; }
    else if (v instanceof Map) prefix = `${ctor}(${v.size}) `;
    else if (v instanceof Set) prefix = `${ctor}(${v.size}) `;
    else if (typeof Buffer_ !== "undefined" && v instanceof Buffer_) return `<Buffer${Array.from(v.subarray(0, 50), (b) => " " + b.toString(16).padStart(2, "0")).join("")}${v.length > 50 ? ` ... ${v.length - 50} more bytes` : ""}>`;
    else if (ArrayBuffer.isView(v)) { braces = ["[", "]"]; prefix = `${ctor}(${v.length}) `; }
    else if (typeof v === "function") {
      const isClass = /^class\b/.test(Function.prototype.toString.call(v));
      const base = isClass ? `[class ${v.name || "(anonymous)"}]` : `[${/^async/.test(Function.prototype.toString.call(v)) ? "AsyncFunction" : "Function"}${v.name ? ": " + v.name : " (anonymous)"}]`;
      if (!keys.length) return base;
      prefix = base + " ";
    }
    else if (v instanceof Date) { const d = isNaN(v) ? "Invalid Date" : v.toISOString(); if (!keys.length) return d; prefix = d + " "; }
    else if (v instanceof RegExp) { if (!keys.length) return String(v); prefix = String(v) + " "; }
    else if (v instanceof Error) {
      const base = v.stack && String(v.stack).split("\n").length > 1 ? `${v.name}: ${v.message}` : String(v.stack || `${v.name}: ${v.message}`);
      if (!keys.length) return `[${base}]`.replace(/^\[(.*)\]$/s, "$1");
      prefix = base + " ";
    }
    else if (v instanceof Promise) return "Promise { <pending> }";
    else if (ctor === null) prefix = "[Object: null prototype] ";
    else if (ctor && ctor !== "Object") prefix = ctor + " ";

    if (level > ctx.depth) return Array.isArray(v) ? "[Array]" : `[${ctor || "Object"}]`;

    ctx.seen.push(v);
    ctx.currentDepth = level;
    items = [];
    ctx.indent += 2;
    if (Array.isArray(v) || ArrayBuffer.isView(v)) {
      const n = Math.min(v.length, 100);
      let holes = 0;
      for (let i = 0; i < n; i++) {
        if (!(i in v)) { holes++; continue; }
        if (holes) { items.push(`<${holes} empty item${holes > 1 ? "s" : ""}>`); holes = 0; }
        items.push(fmt(ctx, v[i], level + 1));
      }
      if (holes) items.push(`<${holes} empty item${holes > 1 ? "s" : ""}>`);
      if (v.length > 100) items.push(`... ${v.length - 100} more item${v.length > 101 ? "s" : ""}`);
    } else if (v instanceof Map) {
      for (const [k, x] of v) items.push(`${fmt(ctx, k, level + 1)} => ${fmt(ctx, x, level + 1)}`);
    } else if (v instanceof Set) {
      for (const x of v) items.push(fmt(ctx, x, level + 1));
    }
    for (const k of keys) {
      const label = IDENT.test(k) ? k : quote(k);
      let d;
      try { d = Object.getOwnPropertyDescriptor(v, k); } catch { d = null; }
      if (d && d.get) items.push(`${label}: ${d.set ? "[Getter/Setter]" : "[Getter]"}`);
      else if (d && d.set) items.push(`${label}: [Setter]`);
      else items.push(`${label}: ${fmt(ctx, v[k], level + 1)}`);
    }
    ctx.indent -= 2;
    ctx.seen.pop();

    if (!items.length) return prefix.trim() && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set) && ctor !== null && typeof v !== "object" ? prefix.trim() : `${prefix}${braces[0]}${braces[1]}`;
    // Node's rule: stay on one line if this object holds at most 3 inner levels and fits in 72 columns or so
    const start = items.length + ctx.indent + braces[0].length + prefix.length + 10;
    if (ctx.currentDepth - level < 3) {
      const total = items.reduce((a, s) => a + s.length, items.length + start);
      if (total <= 80 && !items.some((s) => s.includes("\n"))) return `${prefix}${braces[0]} ${items.join(", ")} ${braces[1]}`;
    }
    const pad = " ".repeat(ctx.indent);
    return `${prefix}${braces[0]}\n${pad}  ${items.join(`,\n${pad}  `)}\n${pad}${braces[1]}`;
  }
  function format(...args) {
    const out = [];
    let i = 0;
    if (typeof args[0] === "string" && args[0].includes("%")) {
      i = 1;
      out.push(args[0].replace(/%([sdifjoOc%])/g, (m, c) => {
        if (c === "%") return "%";
        if (i >= args.length) return m;
        const a = args[i++];
        switch (c) {
          case "s": return typeof a === "string" ? a : typeof a === "object" && a !== null ? inspect(a, { depth: 0 }) : String(a);
          case "d": return typeof a === "object" ? "NaN" : String(Number(a));
          case "i": return String(parseInt(a, 10));
          case "f": return String(parseFloat(a));
          case "j": try { return JSON.stringify(a); } catch { return "[Circular]"; }
          case "c": return "";
          default: return inspect(a, { depth: c === "o" ? 4 : 2 });
        }
      }));
    }
    for (; i < args.length; i++) out.push(typeof args[i] === "string" ? args[i] : inspect(args[i]));
    return out.join(" ");
  }

  /* ---------- Buffer ---------- */
  let Buffer_;
  const toBytes = (s, enc) => {
    enc = (enc || "utf8").toLowerCase();
    if (enc === "hex") { const n = s.length >> 1, b = new Uint8Array(n); for (let i = 0; i < n; i++) b[i] = parseInt(s.substr(i * 2, 2), 16); return b; }
    if (enc === "base64" || enc === "base64url") { const t = atob(s.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "")); return Uint8Array.from(t, (c) => c.charCodeAt(0)); }
    if (enc === "latin1" || enc === "binary" || enc === "ascii") return Uint8Array.from(s, (c) => c.charCodeAt(0) & 255);
    return new TextEncoder().encode(s);
  };
  Buffer_ = class Buffer extends Uint8Array {
    static from(x, enc, len) {
      if (typeof x === "string") { const b = toBytes(x, enc), o = new Buffer_(b.length); o.set(b); return o; }
      if (x instanceof ArrayBuffer) return new Buffer_(x, enc, len);
      const o = new Buffer_(x.length); o.set(x); return o;
    }
    static alloc(n, fill) { const b = new Buffer_(n); if (fill !== undefined) b.fill(typeof fill === "string" ? fill.charCodeAt(0) : fill); return b; }
    static allocUnsafe(n) { return new Buffer_(n); }
    static isBuffer(b) { return b instanceof Buffer_; }
    static byteLength(s, enc) { return typeof s === "string" ? toBytes(s, enc).length : s.byteLength; }
    static concat(list) { const o = new Buffer_(list.reduce((a, b) => a + b.length, 0)); let p = 0; for (const b of list) { o.set(b, p); p += b.length; } return o; }
    toString(enc, a, b) {
      const v = a !== undefined || b !== undefined ? this.subarray(a, b) : this;
      enc = (enc || "utf8").toLowerCase();
      if (enc === "hex") return Array.from(v, (x) => x.toString(16).padStart(2, "0")).join("");
      if (enc === "base64") return btoa(String.fromCharCode(...v));
      if (enc === "base64url") return btoa(String.fromCharCode(...v)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      if (enc === "latin1" || enc === "binary" || enc === "ascii") return String.fromCharCode(...v);
      return new TextDecoder().decode(v);
    }
    equals(o) { return this.length === o.length && this.every((x, i) => x === o[i]); }
    toJSON() { return { type: "Buffer", data: Array.from(this) }; }
    slice(a, b) { return this.subarray(a, b); }
  };

  /* ---------- crypto: real SHA-256, HMAC, PBKDF2 and scrypt, checked against Node in check:other ---------- */
  const K = new Uint32Array(64);
  { let n = 0; for (let p = 2; n < 64; p++) { let prime = true; for (let d = 2; d * d <= p; d++) if (p % d === 0) { prime = false; break; } if (prime) K[n++] = Math.floor((Math.cbrt(p) % 1) * 2 ** 32); } }
  const INIT = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  function sha256(bytes) {
    const len = bytes.length, padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    padded.set(bytes); padded[len] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, len * 8 >>> 0); dv.setUint32(padded.length - 8, Math.floor(len / 2 ** 29));
    const h = Uint32Array.from(INIT), w = new Uint32Array(64);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < padded.length; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) w[i] = (w[i - 16] + (rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) + w[i - 7] + (rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10))) | 0;
      let [a, b, c, d, e, f, g, x] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (x + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        x = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += x;
    }
    const out = new Uint8Array(32), od = new DataView(out.buffer);
    h.forEach((v, i) => od.setUint32(i * 4, v));
    return out;
  }
  const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
  const asBytes = (x, enc) => (typeof x === "string" ? toBytes(x, enc) : x);
  function hmac(key, msg) {
    if (key.length > 64) key = sha256(key);
    const ipad = new Uint8Array(64).fill(0x36), opad = new Uint8Array(64).fill(0x5c);
    key.forEach((b, i) => { ipad[i] ^= b; opad[i] ^= b; });
    return sha256(cat(opad, sha256(cat(ipad, msg))));
  }
  function pbkdf2(pw, salt, iters, len) {
    const out = new Uint8Array(len);
    for (let block = 1, off = 0; off < len; block++, off += 32) {
      let u = hmac(pw, cat(salt, Uint8Array.of(block >>> 24, block >>> 16, block >>> 8, block)));
      const t = u.slice();
      for (let i = 1; i < iters; i++) { u = hmac(pw, u); for (let j = 0; j < 32; j++) t[j] ^= u[j]; }
      out.set(t.subarray(0, Math.min(32, len - off)), off);
    }
    return out;
  }
  function salsa8(B) {
    const x = B.slice(), R = (a, b) => (a << b) | (a >>> (32 - b));
    for (let i = 0; i < 8; i += 2) {
      x[4] ^= R(x[0] + x[12], 7); x[8] ^= R(x[4] + x[0], 9); x[12] ^= R(x[8] + x[4], 13); x[0] ^= R(x[12] + x[8], 18);
      x[9] ^= R(x[5] + x[1], 7); x[13] ^= R(x[9] + x[5], 9); x[1] ^= R(x[13] + x[9], 13); x[5] ^= R(x[1] + x[13], 18);
      x[14] ^= R(x[10] + x[6], 7); x[2] ^= R(x[14] + x[10], 9); x[6] ^= R(x[2] + x[14], 13); x[10] ^= R(x[6] + x[2], 18);
      x[3] ^= R(x[15] + x[11], 7); x[7] ^= R(x[3] + x[15], 9); x[11] ^= R(x[7] + x[3], 13); x[15] ^= R(x[11] + x[7], 18);
      x[1] ^= R(x[0] + x[3], 7); x[2] ^= R(x[1] + x[0], 9); x[3] ^= R(x[2] + x[1], 13); x[0] ^= R(x[3] + x[2], 18);
      x[6] ^= R(x[5] + x[4], 7); x[7] ^= R(x[6] + x[5], 9); x[4] ^= R(x[7] + x[6], 13); x[5] ^= R(x[4] + x[7], 18);
      x[11] ^= R(x[10] + x[9], 7); x[8] ^= R(x[11] + x[10], 9); x[9] ^= R(x[8] + x[11], 13); x[10] ^= R(x[9] + x[8], 18);
      x[12] ^= R(x[15] + x[14], 7); x[13] ^= R(x[12] + x[15], 9); x[14] ^= R(x[13] + x[12], 13); x[15] ^= R(x[14] + x[13], 18);
    }
    for (let i = 0; i < 16; i++) B[i] = (B[i] + x[i]) | 0;
  }
  function blockMix(B, Y, r) {
    const X = B.slice((2 * r - 1) * 16, 2 * r * 16);
    for (let i = 0; i < 2 * r; i++) {
      for (let j = 0; j < 16; j++) X[j] ^= B[i * 16 + j];
      salsa8(X);
      Y.set(X, i * 16);
    }
    for (let i = 0; i < r; i++) B.set(Y.subarray(i * 2 * 16, (i * 2 + 1) * 16), i * 16);
    for (let i = 0; i < r; i++) B.set(Y.subarray((i * 2 + 1) * 16, (i * 2 + 2) * 16), (i + r) * 16);
  }
  function scryptRaw(pw, salt, N, r, p, len) {
    const B = pbkdf2(pw, salt, 1, p * 128 * r), words = 32 * r;
    for (let i = 0; i < p; i++) {
      const off = i * 128 * r, X = new Int32Array(words), V = new Int32Array(words * N), Y = new Int32Array(words), dv = new DataView(B.buffer, B.byteOffset + off, 128 * r);
      for (let j = 0; j < words; j++) X[j] = dv.getInt32(j * 4, true);
      for (let n = 0; n < N; n++) { V.set(X, n * words); blockMix(X, Y, r); }
      for (let n = 0; n < N; n++) {
        const j = X[(2 * r - 1) * 16] & (N - 1);
        for (let k = 0; k < words; k++) X[k] ^= V[j * words + k];
        blockMix(X, Y, r);
      }
      for (let j = 0; j < words; j++) dv.setInt32(j * 4, X[j], true);
    }
    return pbkdf2(pw, B, 1, len);
  }

  /* ---------- EventEmitter ---------- */
  class EventEmitter {
    _l(n) { this._ev ??= new Map(); if (!this._ev.has(n)) this._ev.set(n, []); return this._ev.get(n); }
    on(n, f) { this._l(n).push(f); return this; }
    addListener(n, f) { return this.on(n, f); }
    prependListener(n, f) { this._l(n).unshift(f); return this; }
    once(n, f) { const w = (...a) => { this.off(n, w); f.apply(this, a); }; w.orig = f; return this.on(n, w); }
    off(n, f) { const l = this._l(n), i = l.findIndex((x) => x === f || x.orig === f); if (i >= 0) l.splice(i, 1); return this; }
    removeListener(n, f) { return this.off(n, f); }
    removeAllListeners(n) { if (this._ev) { if (n) this._ev.delete(n); else this._ev.clear(); } return this; }
    listenerCount(n) { return this._l(n).length; }
    listeners(n) { return this._l(n).map((x) => x.orig || x); }
    setMaxListeners() { return this; }
    emit(n, ...a) {
      const l = this._l(n).slice();
      if (!l.length && n === "error") throw a[0] instanceof Error ? a[0] : new Error("Unhandled error. " + a[0]);
      for (const f of l) f.apply(this, a);
      return l.length > 0;
    }
  }
  const once = (em, n) => new Promise((res, rej) => { const onErr = (e) => { em.off(n, onOk); rej(e); }; const onOk = (...a) => { em.off("error", onErr); res(a); }; em.once(n, onOk); if (n !== "error") em.once("error", onErr); });

  /* ---------- the Node world, one per run ---------- */
  function createNode(write) {
    let pending = 0, topLevel = true;
    const pendingTimers = new Set();
    // like Node: once nothing is left to wait for, the process emits "exit" (listeners set with process.on("exit"))
    let exited = false, exiting = false;
    const maybeExit = () => { if (!topLevel && !exited && !exiting && !pendingTimers.size) { exiting = true; macro(() => { exiting = false; if (!exited && !pendingTimers.size) { exited = true; process_.emit("exit", process_.exitCode ?? 0); } }); } };
    const del = pendingTimers.delete.bind(pendingTimers);
    pendingTimers.delete = (x) => { const r = del(x); if (!pendingTimers.size) maybeExit(); return r; };
    // after every callback Node drains the nextTick queue before any promise callback
    const after = (f, a) => { f(...a); if (ticks.length) flushTicks(); };
    const realST = globalThis.setTimeout, realCT = globalThis.clearTimeout, realSI = globalThis.setInterval, realCI = globalThis.clearInterval;

    /* timers */
    class Timeout {
      constructor(id, repeat) { this.id = id; this.repeat = repeat; this.refed = true; }
      ref() { this.refed = true; return this; }
      unref() { this.refed = false; pendingTimers.delete(this); return this; }
      hasRef() { return this.refed; }
      refresh() { return this; }
      [Symbol.toPrimitive]() { return this.id; }
    }
    // host timers and the host message queue race, so a timer that fires while the check phase is owed runs it first
    const setTimeout_ = (f, ms, ...a) => { const t = new Timeout(realST(() => { pendingTimers.delete(t); if (immOwed) flushImm(); after(f, a); }, ms)); pendingTimers.add(t); return t; };
    const setInterval_ = (f, ms, ...a) => { const t = new Timeout(realSI(() => { if (immOwed) flushImm(); after(f, a); }, ms), true); return t; };
    const clear = (t) => { if (t == null) return; pendingTimers.delete(t); const id = typeof t === "object" ? t.id : t; if (t && t.repeat) realCI(id); else realCT(id); };
    const immediates = [];
    // immOwed: an immediate was queued from a callback outside the check phase, so Node runs it before the next timers phase.
    // ponytail: microtasks queued by those immediates run after the timer that forced them; a phase-ordered loop would fix that.
    let immScheduled = false, immOwed = false, inCheck = false;
    const flushImm = () => { immScheduled = false; immOwed = false; inCheck = true; const q = immediates.splice(0); try { for (const x of q) if (!x.gone) { pendingTimers.delete(x); after(x.f, x.a); } } finally { inCheck = false; } };
    const macro = (fn) => {
      if (typeof MessageChannel !== "undefined") { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); fn(); }; c.port2.postMessage(0); }
      else realST(fn, 0);
    };
    const setImmediate_ = (f, ...a) => { const x = { f, a, gone: false }; immediates.push(x); pendingTimers.add(x); if (!topLevel && !inCheck) immOwed = true; if (!immScheduled) { immScheduled = true; macro(flushImm); } return x; };
    const clearImmediate_ = (x) => { if (x) { x.gone = true; pendingTimers.delete(x); } };

    /* process */
    const ticks = [];
    let tickScheduled = false;
    const flushTicks = () => { tickScheduled = false; for (const t of ticks.splice(0)) t(); };
    const pstart = Date.now();
    class ExitSignal extends Error {}
    const process_ = Object.assign(new EventEmitter(), {
      version: "v22.0.0", versions: { node: "22.0.0" }, platform: "browser", arch: "wasm", pid: 1, title: "node", execPath: "/usr/bin/node",
      argv: ["/usr/bin/node", "/playground/main.mjs"], env: {}, exitCode: undefined,
      cwd: () => "/playground", uptime: () => (Date.now() - pstart) / 1000,
      // in ES modules the promise queue drains before nextTick at the top level; inside callbacks nextTick goes first
      nextTick(f, ...a) { ticks.push(() => f(...a)); if (!tickScheduled) { tickScheduled = true; if (topLevel) macro(flushTicks); else queueMicrotask(flushTicks); } },
      hrtime: Object.assign((prev) => { const n = performance.now(), s = Math.floor(n / 1e3), ns = Math.floor((n % 1e3) * 1e6); if (!prev) return [s, ns]; let ds = s - prev[0], dn = ns - prev[1]; if (dn < 0) { ds--; dn += 1e9; } return [ds, dn]; }, { bigint: () => BigInt(Math.floor(performance.now() * 1e6)) }),
      memoryUsage: () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 }),
      exit(code) { write("log", `process exited with code ${code ?? process_.exitCode ?? 0}`); throw new ExitSignal("process.exit"); },
      stdout: { write(s) { write("raw", String(s)); return true; }, isTTY: false, columns: 80 },
      stderr: { write(s) { write("rawerr", String(s)); return true; }, isTTY: false },
    });

    /* path (POSIX) */
    const normalizeArr = (parts, abs) => { const o = []; for (const p of parts) { if (!p || p === ".") continue; if (p === "..") { if (o.length && o[o.length - 1] !== "..") o.pop(); else if (!abs) o.push(".."); } else o.push(p); } return o; };
    const path = {
      sep: "/", delimiter: ":",
      normalize(p) { const abs = p.startsWith("/"), tr = p.endsWith("/"); let s = normalizeArr(p.split("/"), abs).join("/"); if (!s && !abs) s = "."; if (s && tr) s += "/"; return (abs ? "/" : "") + s; },
      join(...a) { const j = a.filter(Boolean).join("/"); return j ? path.normalize(j) : "."; },
      resolve(...a) { let r = ""; for (let i = a.length - 1; i >= 0 && !r.startsWith("/"); i--) if (a[i]) r = a[i] + (r ? "/" + r : ""); if (!r.startsWith("/")) r = process_.cwd() + (r ? "/" + r : ""); return "/" + normalizeArr(r.split("/"), true).join("/"); },
      isAbsolute: (p) => p.startsWith("/"),
      dirname(p) { const s = p.replace(/\/+$/, ""), i = s.lastIndexOf("/"); return i < 0 ? "." : i === 0 ? "/" : s.slice(0, i); },
      basename(p, ext) { let b = p.replace(/\/+$/, ""); b = b.slice(b.lastIndexOf("/") + 1); return ext && b.endsWith(ext) && b !== ext ? b.slice(0, -ext.length) : b; },
      extname(p) { const b = path.basename(p), i = b.lastIndexOf("."); return i <= 0 ? "" : b.slice(i); },
      relative(a, b) { const x = path.resolve(a).split("/").filter(Boolean), y = path.resolve(b).split("/").filter(Boolean); let i = 0; while (i < x.length && x[i] === y[i]) i++; return [...x.slice(i).map(() => ".."), ...y.slice(i)].join("/"); },
      parse(p) { const base = path.basename(p), ext = path.extname(p); return { root: p.startsWith("/") ? "/" : "", dir: path.dirname(p) === "." && !p.includes("/") ? "" : path.dirname(p), base, ext, name: ext ? base.slice(0, -ext.length) : base }; },
      format(o) { const d = o.dir || o.root || "", b = o.base || (o.name || "") + (o.ext || ""); return d ? (d === o.root ? d + b : d + "/" + b) : b; },
    };
    path.posix = path;

    /* streams */
    const toChunk = (c, enc, obj) => (obj ? c : typeof c === "string" ? Buffer_.from(c, enc) : c);
    class Stream extends EventEmitter {
      pipe(dest) {
        (async () => {
          try { for await (const c of this) { if (dest.write(c) === false) await once(dest, "drain"); } dest.end(); }
          catch (e) { dest.destroy ? dest.destroy(e) : dest.emit("error", e); }
        })();
        return dest;
      }
    }
    class Readable extends Stream {
      constructor(o = {}) {
        super();
        this._q = []; this._ended = false; this._wait = null; this.destroyed = false; this.readable = true;
        this._obj = !!(o.objectMode || o.readableObjectMode); this._enc = o.encoding || null;
        if (o.read) this._read = o.read;
        if (o.destroy) this._destroy = o.destroy;
      }
      _read() {}
      setEncoding(e) { this._enc = e; return this; }
      push(c) {
        if (c === null) this._ended = true;
        else this._q.push(this._enc && !this._obj ? toChunk(c, undefined, false).toString(this._enc) : toChunk(c, undefined, this._obj));
        if (this._wait) { const w = this._wait; this._wait = null; w(); }
        return true;
      }
      destroy(e) { this.destroyed = true; this._ended = true; if (e) this.emit("error", e); this.emit("close"); if (this._wait) { const w = this._wait; this._wait = null; w(); } return this; }
      async *[Symbol.asyncIterator]() {
        for (;;) {
          if (this._err) throw this._err;
          if (this._q.length) { yield this._q.shift(); continue; }
          if (this._ended) { this.readable = false; this.emit("end"); this.emit("close"); return; }
          const w = new Promise((r) => { this._wait = r; });
          this._read(16384);
          await w;
        }
      }
      on(n, f) {
        super.on(n, f);
        if (n === "data" && !this._flow) { this._flow = true; setImmediate_(async () => { try { for await (const c of this) this.emit("data", c); } catch (e) { this.emit("error", e); } }); }
        return this;
      }
      static from(it, o) {
        const r = new Readable({ objectMode: true, ...o });
        (async () => { try { for await (const x of it) r.push(x); r.push(null); } catch (e) { r._err = e; r.push(null); } })();
        return r;
      }
    }
    class Writable extends Stream {
      constructor(o = {}) {
        super();
        this._wq = []; this._busy = false; this._hwm = o.highWaterMark ?? 16384; this._size = 0; this._ending = false; this.writable = true; this.writableFinished = false;
        this._objW = !!(o.objectMode || o.writableObjectMode);
        if (o.write) this._write = o.write;
        if (o.final) this._final = o.final;
        if (o.destroy) this._destroy = o.destroy;
      }
      _write(c, e, cb) { cb(); }
      _final(cb) { cb(); }
      _next() {
        if (this._busy) return;
        const it = this._wq.shift();
        if (!it) {
          if (this._ending && !this.writableFinished) { this._busy = true; this._final((e) => { this._busy = false; if (e) return this.destroy(e); this.writableFinished = true; this.emit("finish"); this.emit("close"); }); }
          return;
        }
        this._busy = true;
        this._write(it.c, it.e, (err) => {
          this._busy = false; this._size -= it.n;
          if (err) { if (it.cb) it.cb(err); this.destroy(err); return; }
          if (it.cb) it.cb();
          if (this._needDrain && this._size < this._hwm) { this._needDrain = false; this.emit("drain"); }
          queueMicrotask(() => this._next());
        });
      }
      write(c, e, cb) {
        if (typeof e === "function") { cb = e; e = undefined; }
        const chunk = toChunk(c, e, this._objW), n = this._objW ? 1 : chunk.length;
        this._size += n; this._wq.push({ c: chunk, e: this._objW ? e : "buffer", cb, n });
        queueMicrotask(() => this._next());
        const ok = this._size < this._hwm; if (!ok) this._needDrain = true;
        return ok;
      }
      end(c, e, cb) {
        if (typeof c === "function") { cb = c; c = undefined; }
        if (typeof e === "function") { cb = e; e = undefined; }
        if (c !== undefined && c !== null) this.write(c, e);
        if (cb) this.once("finish", cb);
        this._ending = true; queueMicrotask(() => this._next());
        return this;
      }
      destroy(e) { this.destroyed = true; if (e) this.emit("error", e); this.emit("close"); return this; }
    }
    // Duplex: a Readable that also has Writable's methods
    class Duplex extends Readable {
      constructor(o = {}) {
        super(o);
        this._wq = []; this._busy = false; this._hwm = o.highWaterMark ?? 16384; this._size = 0; this._ending = false; this.writable = true; this.writableFinished = false;
        this._objW = !!(o.objectMode || o.writableObjectMode);
        if (o.write) this._write = o.write;
        if (o.final) this._final = o.final;
      }
    }
    for (const m of ["_write", "_final", "_next", "write", "end"]) Duplex.prototype[m] = Writable.prototype[m];
    class Transform extends Duplex {
      constructor(o = {}) {
        super(o);
        if (o.transform) this._transform = o.transform;
        if (o.flush) this._flush = o.flush;
      }
      _transform(c, e, cb) { cb(null, c); }
      _flush(cb) { cb(); }
      _write(c, e, cb) { this._transform(c, e, (err, d) => { if (err) return cb(err); if (d !== undefined && d !== null) this.push(d); cb(); }); }
      _final(cb) { this._flush((err, d) => { if (err) return cb(err); if (d !== undefined && d !== null) this.push(d); this.push(null); cb(); }); }
    }
    class PassThrough extends Transform {}
    async function pipelineP(...stages) {
      const list = stages.flat();
      let src = list[0];
      if (typeof src === "function") src = Readable.from(src());
      else if (!(src instanceof Stream) && src && (src[Symbol.asyncIterator] || src[Symbol.iterator])) src = Readable.from(src);
      for (let i = 1; i < list.length; i++) {
        let st = list[i];
        if (typeof st === "function") { const out = st(src); if (i === list.length - 1) { await out; return; } src = Readable.from(out); continue; }
        const from = src, to = st, last = i === list.length - 1;
        const pump = (async () => { for await (const c of from) { if (to.write(c) === false) await once(to, "drain"); } to.end(); })();
        if (last) { await Promise.all([pump, new Promise((res, rej) => { if (to.writableFinished) res(); to.once("finish", res); to.once("error", rej); })]); return; }
        pump.catch((e) => { src && src.destroy && src.destroy(e); });
        src = to;
      }
    }
    const pipeline = (...a) => { const cb = typeof a[a.length - 1] === "function" ? a.pop() : null; const p = pipelineP(...a); if (cb) p.then(() => cb(), cb); return a[a.length - 1]; };
    const stream = Object.assign(Stream, { Stream, Readable, Writable, Duplex, Transform, PassThrough, pipeline, promises: { pipeline: pipelineP } });

    /* fs: in memory, starts with the program itself and an empty /tmp */
    const files = new Map(), dirs = new Set(["/", "/tmp", "/playground"]);
    const norm = (p) => path.resolve(String(p instanceof URL ? p.pathname : p));
    const fsErr = (code, sys, p) => { const msg = { ENOENT: "no such file or directory", EEXIST: "file already exists", EISDIR: "illegal operation on a directory", ENOTDIR: "not a directory", ENOTEMPTY: "directory not empty" }[code]; return Object.assign(new Error(`${code}: ${msg}, ${sys} '${p}'`), { code, syscall: sys, path: p, errno: -2 }); };
    const syncFs = {
      readFileSync(p, o) { const n = norm(p); if (dirs.has(n)) throw fsErr("EISDIR", "read", n); if (!files.has(n)) throw fsErr("ENOENT", "open", p); const b = files.get(n), enc = typeof o === "string" ? o : o && o.encoding; return enc ? b.toString(enc) : Buffer_.from(b); },
      writeFileSync(p, d, o) { const n = norm(p); if (!dirs.has(path.dirname(n))) throw fsErr("ENOENT", "open", p); files.set(n, typeof d === "string" ? Buffer_.from(d, typeof o === "string" ? o : o && o.encoding) : Buffer_.from(d)); },
      appendFileSync(p, d) { const n = norm(p); syncFs.writeFileSync(p, Buffer_.concat([files.get(n) || Buffer_.alloc(0), typeof d === "string" ? Buffer_.from(d) : d])); },
      existsSync(p) { const n = norm(p); return files.has(n) || dirs.has(n); },
      mkdirSync(p, o) { const n = norm(p); if (dirs.has(n)) { if (o && o.recursive) return undefined; throw fsErr("EEXIST", "mkdir", p); } if (o && o.recursive) { let c = ""; for (const s of n.split("/").filter(Boolean)) { c += "/" + s; dirs.add(c); } return n; } if (!dirs.has(path.dirname(n))) throw fsErr("ENOENT", "mkdir", p); dirs.add(n); return undefined; },
      mkdtempSync(prefix) { const n = norm(prefix + Math.random().toString(36).slice(2, 8)); dirs.add(n); return n; },
      readdirSync(p) { const n = norm(p); if (!dirs.has(n)) throw fsErr("ENOENT", "scandir", p); const pre = n === "/" ? "/" : n + "/", out = new Set(); for (const f of [...files.keys(), ...dirs]) if (f !== n && f.startsWith(pre)) out.add(f.slice(pre.length).split("/")[0]); return [...out].sort(); },
      statSync(p) { const n = norm(p), isD = dirs.has(n); if (!isD && !files.has(n)) throw fsErr("ENOENT", "stat", p); return { size: isD ? 0 : files.get(n).length, isFile: () => !isD, isDirectory: () => isD, mtime: new Date(), mtimeMs: Date.now() }; },
      unlinkSync(p) { const n = norm(p); if (!files.delete(n)) throw fsErr("ENOENT", "unlink", p); },
      rmSync(p, o) { const n = norm(p); if (files.delete(n)) return; if (!dirs.has(n)) { if (o && o.force) return; throw fsErr("ENOENT", "rm", p); } for (const f of [...files.keys()]) if (f.startsWith(n + "/")) files.delete(f); for (const d of [...dirs]) if (d === n || d.startsWith(n + "/")) dirs.delete(d); },
      rmdirSync(p) { syncFs.rmSync(p); },
      renameSync(a, b) { const x = norm(a); if (!files.has(x)) throw fsErr("ENOENT", "rename", a); files.set(norm(b), files.get(x)); files.delete(x); },
      copyFileSync(a, b) { syncFs.writeFileSync(b, syncFs.readFileSync(a)); },
      accessSync(p) { if (!syncFs.existsSync(p)) throw fsErr("ENOENT", "access", p); },
    };
    const fsPromises = {}, fs = { ...syncFs };
    for (const [k, f] of Object.entries(syncFs)) {
      const name = k.replace(/Sync$/, "");
      if (name === "exists") continue;
      fsPromises[name] = async (...a) => { await new Promise((r) => realST(r, 0)); return f(...a); };
      fs[name] = (...a) => { const cb = a.pop(); pending++; const t = {}; pendingTimers.add(t); macro(() => { pendingTimers.delete(t); pending--; let r, err = null; try { r = f(...a); } catch (e) { err = e; } after(cb, [err, r]); }); };
    }
    fs.promises = fsPromises;
    fs.createReadStream = (p, o) => {
      const r = new Readable({ encoding: typeof o === "string" ? o : o && o.encoding });
      fsPromises.readFile(p).then((b) => { for (let i = 0; i < b.length; i += 65536) r.push(Buffer_.from(b.subarray(i, i + 65536))); r.push(null); }, (e) => { r._err = e; r.push(null); r.emit("error", e); });
      return r;
    };
    fs.createWriteStream = (p) => {
      let opened = false;
      return new Writable({
        write(c, e, cb) { try { if (!opened) { syncFs.writeFileSync(p, ""); opened = true; } syncFs.appendFileSync(p, c); cb(); } catch (err) { cb(err); } },
        final(cb) { try { if (!opened) syncFs.writeFileSync(p, ""); cb(); } catch (err) { cb(err); } },
      });
    };

    /* assert */
    class AssertionError extends Error {
      constructor(m, actual, expected, operator) { super(m); this.name = "AssertionError"; this.code = "ERR_ASSERTION"; this.actual = actual; this.expected = expected; this.operator = operator; }
    }
    function deepEq(a, b, strict) {
      if (strict ? Object.is(a, b) : a == b) return true;   // eslint-disable-line eqeqeq
      if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
      if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
      if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
      if (a instanceof Map && b instanceof Map) { if (a.size !== b.size) return false; for (const [k, v] of a) if (!b.has(k) || !deepEq(v, b.get(k), strict)) return false; return true; }
      if (a instanceof Set && b instanceof Set) { if (a.size !== b.size) return false; outer: for (const x of a) { if (b.has(x)) continue; for (const y of b) if (deepEq(x, y, strict)) continue outer; return false; } return true; }
      const ka = Object.keys(a), kb = Object.keys(b);
      return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEq(a[k], b[k], strict));
    }
    function makeAssert(strict) {
      const fail = (m, dflt, a, e, op) => { if (m instanceof Error) throw m; throw new AssertionError(m ?? dflt, a, e, op); };
      const assert = (v, m) => { if (!v) fail(m, `The expression evaluated to a falsy value:\n\n  assert(${inspect(v)})`, v, true, "=="); };
      const strictEqual = (a, e, m) => { if (!Object.is(a, e)) fail(m, `Expected values to be strictly equal:\n\n${inspect(a)} !== ${inspect(e)}\n`, a, e, "strictEqual"); };
      const notStrictEqual = (a, e, m) => { if (Object.is(a, e)) fail(m, `Expected "actual" to be strictly unequal to: ${inspect(e)}`, a, e, "notStrictEqual"); };
      const deepStrictEqual = (a, e, m) => { if (!deepEq(a, e, true)) fail(m, `Expected values to be strictly deep-equal:\n${inspect(a)}\n\nshould loosely deep-equal\n\n${inspect(e)}`, a, e, "deepStrictEqual"); };
      const notDeepStrictEqual = (a, e, m) => { if (deepEq(a, e, true)) fail(m, `Expected "actual" not to be strictly deep-equal to: ${inspect(e)}`, a, e, "notDeepStrictEqual"); };
      const checkErr = (err, exp, m) => {
        if (!exp || typeof exp === "string") return;
        if (exp instanceof RegExp) { if (!exp.test(String(err))) throw err; return; }
        if (typeof exp === "function") { if (exp.prototype !== undefined && err instanceof exp) return; if (Error.isPrototypeOf(exp)) throw err; if (exp.call({}, err) === true) return; fail(m, "The validation function is expected to return \"true\"", err, exp, "throws"); return; }
        for (const k of Object.keys(exp)) if (exp[k] instanceof RegExp ? !exp[k].test(err[k]) : !deepEq(err[k], exp[k], true)) fail(m, `Expected error property ${k} to match`, err, exp, "throws");
      };
      Object.assign(assert, {
        ok: assert, AssertionError, strictEqual, notStrictEqual, deepStrictEqual, notDeepStrictEqual,
        equal: strict ? strictEqual : (a, e, m) => { if (!(a == e || (a !== a && e !== e))) fail(m, `${inspect(a)} == ${inspect(e)}`, a, e, "=="); },   // eslint-disable-line eqeqeq
        notEqual: strict ? notStrictEqual : (a, e, m) => { if (a == e) fail(m, `${inspect(a)} != ${inspect(e)}`, a, e, "!="); },   // eslint-disable-line eqeqeq
        deepEqual: strict ? deepStrictEqual : (a, e, m) => { if (!deepEq(a, e, false)) fail(m, `Expected values to be loosely deep-equal:\n\n${inspect(a)}\n\nshould loosely deep-equal\n\n${inspect(e)}`, a, e, "deepEqual"); },
        notDeepEqual: strict ? notDeepStrictEqual : (a, e, m) => { if (deepEq(a, e, false)) fail(m, "Expected \"actual\" not to be loosely deep-equal", a, e, "notDeepEqual"); },
        fail: (m) => fail(m, "Failed", undefined, undefined, "fail"),
        match: (s, r, m) => { if (!r.test(s)) fail(m, `The input did not match the regular expression ${r}. Input:\n\n${inspect(s)}\n`, s, r, "match"); },
        throws: (f, exp, m) => { let threw = false, err; try { f(); } catch (e) { threw = true; err = e; } if (!threw) fail(typeof exp === "string" ? exp : m, "Missing expected exception.", undefined, exp, "throws"); checkErr(err, exp, m); },
        doesNotThrow: (f) => { f(); },
        rejects: async (p, exp, m) => { let threw = false, err; try { await (typeof p === "function" ? p() : p); } catch (e) { threw = true; err = e; } if (!threw) fail(typeof exp === "string" ? exp : m, "Missing expected rejection.", undefined, exp, "rejects"); checkErr(err, exp, m); },
        doesNotReject: async (p) => { await (typeof p === "function" ? p() : p); },
      });
      if (strict) assert.strict = assert;
      return assert;
    }
    const assert = makeAssert(false);
    assert.strict = makeAssert(true);

    /* http + a request dispatcher instead of a network */
    const servers = new Map();
    let nextPort = 49152;
    const STATUS = { 200: "OK", 201: "Created", 202: "Accepted", 204: "No Content", 301: "Moved Permanently", 302: "Found", 304: "Not Modified", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed", 409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests", 500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable" };
    class IncomingMessage extends Readable {
      constructor(method, url, headers, body) {
        super();
        Object.assign(this, { method, url, headers, httpVersion: "1.1", socket: { remoteAddress: "127.0.0.1" }, connection: { remoteAddress: "127.0.0.1" } });
        this.rawHeaders = Object.entries(headers).flat();
        if (body) this.push(Buffer_.from(body));
        this.push(null);
      }
    }
    class ServerResponse extends EventEmitter {
      constructor(done) { super(); this.statusCode = 200; this.statusMessage = undefined; this.headersSent = false; this.finished = false; this.writableEnded = false; this._h = new Map(); this._b = []; this._done = done; }
      setHeader(k, v) { this._h.set(String(k).toLowerCase(), v); return this; }
      getHeader(k) { return this._h.get(String(k).toLowerCase()); }
      getHeaders() { return Object.fromEntries(this._h); }
      getHeaderNames() { return [...this._h.keys()]; }
      hasHeader(k) { return this._h.has(String(k).toLowerCase()); }
      removeHeader(k) { this._h.delete(String(k).toLowerCase()); }
      writeHead(code, msg, hd) { if (typeof msg === "object") { hd = msg; msg = undefined; } this.statusCode = code; if (msg) this.statusMessage = msg; if (hd) for (const [k, v] of Object.entries(hd)) this.setHeader(k, v); this.headersSent = true; return this; }
      write(c, e, cb) { this.headersSent = true; if (c !== undefined && c !== null) this._b.push(typeof c === "string" ? Buffer_.from(c, typeof e === "string" ? e : undefined) : c); if (typeof e === "function") e(); else if (cb) cb(); return true; }
      end(c, e, cb) {
        if (this.writableEnded) return this;
        if (typeof c === "function") { cb = c; c = undefined; }
        if (c !== undefined && c !== null) this.write(c, e);
        this.writableEnded = this.finished = this.headersSent = true;
        const body = Buffer_.concat(this._b);
        this._done({ status: this.statusCode, statusText: this.statusMessage || STATUS[this.statusCode] || "", headers: Object.fromEntries([...this._h].map(([k, v]) => [k, String(v)])), body });
        queueMicrotask(() => { this.emit("finish"); this.emit("close"); if (typeof cb === "function") cb(); });
        return this;
      }
    }
    class Server extends EventEmitter {
      constructor(h) { super(); if (h) this.on("request", h); this.listening = false; this._port = null; }
      listen(...a) {
        const cb = typeof a[a.length - 1] === "function" ? a.pop() : null;
        let port = typeof a[0] === "object" && a[0] ? a[0].port : a[0];
        port = port ? Number(port) : nextPort++;
        if (servers.has(port)) { const e = Object.assign(new Error(`listen EADDRINUSE: address already in use :::${port}`), { code: "EADDRINUSE" }); macro(() => this.emit("error", e)); return this; }
        servers.set(port, this); this._port = port; this.listening = true;
        write("server", port);
        macro(() => { this.emit("listening"); if (cb) cb(); });
        return this;
      }
      close(cb) { servers.delete(this._port); this.listening = false; write("server-closed", this._port); macro(() => { this.emit("close"); if (cb) cb(); }); return this; }
      closeAllConnections() {} closeIdleConnections() {}
      address() { return this._port ? { address: "::", family: "IPv6", port: this._port } : null; }
      ref() { return this; } unref() { return this; }
      setTimeout() { return this; }
    }
    function dispatch(port, method, url, headers, body) {
      return new Promise((resolve, reject) => {
        const s = servers.get(port);
        if (!s) return reject(Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error(`connect ECONNREFUSED 127.0.0.1:${port}`), { code: "ECONNREFUSED" }) }));
        const h = { host: `localhost:${port}` };
        for (const [k, v] of Object.entries(headers || {})) h[k.toLowerCase()] = String(v);
        if (body && !h["content-length"]) h["content-length"] = String(Buffer_.byteLength(body));
        const req = new IncomingMessage(method.toUpperCase(), url, h, body);
        const res = new ServerResponse(resolve);
        try { s.emit("request", req, res); } catch (e) { reject(e); }
      });
    }
    const realFetch = globalThis.fetch;
    const fetch_ = async (input, init = {}) => {
      const href = typeof input === "string" ? input : input.href || input.url;
      const u = new URL(href, "http://localhost");
      if (["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(u.hostname)) {
        const headers = new Headers(init.headers), hd = {};
        headers.forEach((v, k) => { hd[k] = v; });
        const r = await dispatch(Number(u.port) || 80, init.method || "GET", u.pathname + u.search, hd, init.body);
        const nullBody = [101, 204, 205, 304].includes(r.status);
        return new Response(nullBody ? null : r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
      }
      return realFetch(input, init);
    };
    const http = { createServer: (a, b) => new Server(typeof a === "function" ? a : b), Server, IncomingMessage, ServerResponse, STATUS_CODES: STATUS, METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] };

    /* Express: routing, middleware, async error forwarding and the common req and res helpers */
    function compilePath(p, end) {
      if (p instanceof RegExp) return { re: p, keys: [] };
      const keys = [];
      const src = String(p).replace(/\/+$/, "").replace(/[.+^$()|[\]\\]/g, "\\$&")
        .replace(/\{([^}]*)\}/g, "(?:$1)?")
        .replace(/\*(\w+)?/g, (_, n) => { keys.push(n || "0"); return "(.*)"; })
        .replace(/:(\w+)/g, (_, n) => { keys.push(n); return "([^/]+)"; });
      return { re: new RegExp(`^${src}${end ? "/?$" : "(?=/|$)"}`, "i"), keys };
    }
    const matchLayer = (l, pathname) => {
      const m = l.re.exec(pathname);
      if (!m) return null;
      const params = {};
      l.keys.forEach((k, i) => { if (m[i + 1] !== undefined) params[k] = decodeURIComponent(m[i + 1]); });
      return { matched: m[0], params };
    };
    function handleStack(stack, req, res, done) {
      let i = 0;
      const url = req.url, baseUrl = req.baseUrl || "";
      const next = (err) => {
        req.url = url; req.baseUrl = baseUrl;
        if (err === "route") err = undefined;
        if (err === "router") return done();
        const l = stack[i++];
        if (!l) return done(err);
        const pathname = url.split("?")[0] || "/";
        const m = matchLayer(l, pathname);
        if (!m || (l.method && l.method !== req.method && !(l.method === "GET" && req.method === "HEAD"))) return next(err);
        if (l.method || !l.mount) req.params = { ...(l.keepParams ? req.params : {}), ...m.params };
        else req.params = { ...req.params, ...m.params };
        if (!l.method) { const prefix = m.matched.replace(/\/$/, ""); if (prefix) { req.url = url.slice(prefix.length) || "/"; if (!req.url.startsWith("/")) req.url = "/" + req.url; req.baseUrl = baseUrl + prefix; } }
        const fn = l.fn;
        const isErr = fn.length === 4;
        if (err ? !isErr : isErr) return next(err);
        try {
          const r = err ? fn(err, req, res, next) : fn(req, res, next);
          if (r && typeof r.then === "function") r.then(undefined, (e) => next(e ?? new Error("Rejected promise")));
        } catch (e) { next(e); }
      };
      next();
    }
    function makeRouter() {
      const stack = [];
      const router = function (req, res, next) { handleStack(stack, req, res, next); };
      const addRoute = (method, p, fns) => { const c = compilePath(p, true); for (const fn of fns.flat(Infinity)) stack.push({ ...c, method, fn, mount: false }); };
      for (const m of ["get", "post", "put", "patch", "delete", "head", "options"]) router[m] = (p, ...fns) => { addRoute(m.toUpperCase(), p, fns); return router; };
      router.all = (p, ...fns) => { addRoute(null, p, fns); stack.slice(-fns.flat(Infinity).length).forEach((l) => { l.mount = false; l.route = true; }); return router; };
      router.use = (p, ...fns) => {
        if (typeof p !== "string" && !(p instanceof RegExp) && !Array.isArray(p)) { fns.unshift(p); p = "/"; }
        for (const one of [p].flat()) { const c = compilePath(one === "/" ? "" : one, false); for (const fn of fns.flat(Infinity)) stack.push({ ...c, method: null, fn, mount: true, keepParams: true }); }
        return router;
      };
      router.route = (p) => { const r = {}; for (const m of ["get", "post", "put", "patch", "delete", "all"]) r[m] = (...fns) => { router[m](p, ...fns); return r; }; return r; };
      router.param = () => router;
      router._stack = stack;
      return router;
    }
    function parseQuery(search) {
      const q = {};
      for (const [k, v] of new URLSearchParams(search)) { if (k in q) q[k] = [].concat(q[k], v); else q[k] = v; }
      return q;
    }
    function expressFactory() {
      const router = makeRouter(), settings = new Map([["x-powered-by", true]]);
      const app = function (req, res, finish) {
        const originalUrl = req.url, qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?") + 1) : "";
        decorate(req, res, app);
        req.originalUrl = originalUrl; req.baseUrl = ""; req.query = parseQuery(qs); req.path = req.url.split("?")[0]; req.params = {};
        if (settings.get("x-powered-by")) res.setHeader("x-powered-by", "Express");
        handleStack(router._stack, req, res, (err) => {
          if (finish) return finish(err);
          if (err) {
            const status = err.status || err.statusCode || 500;
            res.statusCode = status >= 400 && status < 600 ? status : 500;
            write("rawerr", (err.stack || String(err)) + "\n");
            res.setHeader("content-type", "text/html; charset=utf-8");
            res.end(`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>${err.message}</pre>\n</body>\n</html>\n`);
          } else {
            res.statusCode = 404;
            res.setHeader("content-type", "text/html; charset=utf-8");
            res.end(`<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot ${req.method} ${req.path}</pre>\n</body>\n</html>\n`);
          }
        });
      };
      for (const k of ["post", "put", "patch", "delete", "head", "options", "all", "use", "route", "param"]) app[k] = (...a) => { const r = router[k](...a); return k === "route" ? r : app; };
      app.get = (...a) => { if (a.length === 1) return settings.get(a[0]); router.get(...a); return app; };
      app.set = (k, v) => { settings.set(k, v); return app; };
      app.enable = (k) => app.set(k, true); app.disable = (k) => app.set(k, false);
      app.enabled = (k) => !!settings.get(k); app.disabled = (k) => !settings.get(k);
      app.locals = {}; app.settings = settings;
      app.listen = (...a) => http.createServer(app).listen(...a);
      return app;
    }
    function decorate(req, res, app) {
      req.app = app; res.app = app; req.res = res; res.req = req;
      req.get = req.header = (n) => { const k = String(n).toLowerCase(); return k === "referer" || k === "referrer" ? req.headers.referrer || req.headers.referer : req.headers[k]; };
      req.is = (t) => { const c = req.headers["content-type"] || ""; return c.includes(t) ? t : false; };
      req.ip = "127.0.0.1"; req.protocol = "http"; req.secure = false; req.hostname = "localhost"; req.xhr = false; req.cookies = req.cookies || undefined;
      res.status = (c) => { res.statusCode = c; return res; };
      res.set = res.header = (k, v) => { if (typeof k === "object") { for (const [a, b] of Object.entries(k)) res.setHeader(a, b); } else res.setHeader(k, v); return res; };
      res.get = (k) => res.getHeader(k);
      res.type = (t) => { res.setHeader("content-type", t.includes("/") ? t : { json: "application/json; charset=utf-8", html: "text/html; charset=utf-8", text: "text/plain; charset=utf-8" }[t] || t); return res; };
      res.location = (u) => { res.setHeader("location", u); return res; };
      res.redirect = (a, b) => { const code = typeof a === "number" ? a : 302, u = typeof a === "number" ? b : a; res.statusCode = code; res.setHeader("location", u); res.setHeader("content-type", "text/plain; charset=utf-8"); res.end(`${STATUS[code]}. Redirecting to ${u}`); return res; };
      res.json = (o) => { if (!res.hasHeader("content-type")) res.setHeader("content-type", "application/json; charset=utf-8"); return res.send(JSON.stringify(o)); };
      res.send = (b) => {
        if (b !== null && typeof b === "object" && !(b instanceof Uint8Array)) return res.json(b);
        if (typeof b === "number" || typeof b === "boolean") return res.json(b);
        if (typeof b === "string" && !res.hasHeader("content-type")) res.setHeader("content-type", "text/html; charset=utf-8");
        if (b instanceof Uint8Array && !res.hasHeader("content-type")) res.setHeader("content-type", "application/octet-stream");
        if ([204, 304].includes(res.statusCode)) { res.removeHeader("content-type"); b = ""; }
        if (b !== undefined && b !== null && !res.hasHeader("content-length")) res.setHeader("content-length", String(Buffer_.byteLength(typeof b === "string" ? b : b)));
        res.end(req.method === "HEAD" ? undefined : b);
        return res;
      };
      res.sendStatus = (c) => { res.statusCode = c; res.type("text"); return res.send(STATUS[c] || String(c)); };
      res.cookie = (n, v, o = {}) => { const parts = [`${n}=${encodeURIComponent(v)}`, `Path=${o.path || "/"}`]; if (o.maxAge) parts.push(`Max-Age=${Math.floor(o.maxAge / 1000)}`); if (o.httpOnly) parts.push("HttpOnly"); if (o.secure) parts.push("Secure"); if (o.sameSite) parts.push(`SameSite=${o.sameSite === true ? "Strict" : o.sameSite[0].toUpperCase() + o.sameSite.slice(1)}`); res.setHeader("set-cookie", parts.join("; ")); return res; };
      res.clearCookie = (n) => { res.setHeader("set-cookie", `${n}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`); return res; };
    }
    const readBody = (req) => new Promise((res, rej) => { const parts = []; (async () => { for await (const c of req) parts.push(c); res(Buffer_.concat(parts)); })().catch(rej); });
    const bodyParser = (match, parse) => () => async (req, res, next) => {
      try {
        const ct = req.headers["content-type"] || "";
        if (req._body || !match(ct)) return next();
        const raw = await readBody(req);
        req._body = true;
        if (!raw.length) return next();
        req.body = parse(raw);
        next();
      } catch (e) { e.status = e.statusCode = 400; e.type = "entity.parse.failed"; next(e); }
    };
    const express = Object.assign(expressFactory, {
      Router: makeRouter,
      json: bodyParser((c) => c.includes("json"), (b) => JSON.parse(b.toString())),
      text: bodyParser((c) => c.startsWith("text/"), (b) => b.toString()),
      raw: bodyParser((c) => c.includes("octet-stream"), (b) => b),
      urlencoded: bodyParser((c) => c.includes("urlencoded"), (b) => parseQuery(b.toString())),
      static: () => (req, res, next) => next(),
    });

    /* node:test */
    const suite = { tests: [], before: [], after: [], beforeEach: [], afterEach: [], started: false };
    const runTests = async () => {
      let pass = 0, failed = 0;
      const t0 = performance.now();
      for (const f of suite.before) await f();
      for (const t of suite.tests) {
        if (t.skip) { write("log", `﹣ ${t.name} # SKIP`); continue; }
        const s = performance.now();
        try {
          for (const f of suite.beforeEach) await f();
          await t.fn({ name: t.name, test: async (n, f) => { await f({ name: n }); }, diagnostic: (m) => write("log", "# " + m) });
          for (const f of suite.afterEach) await f();
          pass++; write("log", `✔ ${t.name} (${(performance.now() - s).toFixed(1)}ms)`);
        } catch (e) {
          if (e instanceof ExitSignal) throw e;
          failed++; write("error", `✖ ${t.name}\n  ${e.message}`);
        }
      }
      for (const f of suite.after) await f();
      write("log", `\ntests ${pass + failed}\npass ${pass}\nfail ${failed}\nduration_ms ${(performance.now() - t0).toFixed(1)}`);
    };
    const startTests = () => { if (!suite.started) { suite.started = true; const t = {}; pendingTimers.add(t); realST(() => runTests().finally(() => pendingTimers.delete(t)).catch((e) => write("error", String(e))), 0); } };
    const test = (name, o, fn) => { if (typeof name === "function") { fn = name; name = fn.name || "<anonymous>"; } if (typeof o === "function") { fn = o; o = {}; } suite.tests.push({ name, fn, skip: o && o.skip }); startTests(); };
    test.skip = (name, fn) => test(name, { skip: true }, fn);
    test.only = test; test.test = test; test.it = test;
    const describe = (name, fn) => { const before = suite.tests.length; fn(); for (const t of suite.tests.slice(before)) t.name = `${name} > ${t.name}`; };
    const nodeTest = Object.assign(test, { test, it: test, describe, suite: describe, before: (f) => suite.before.push(f), after: (f) => suite.after.push(f), beforeEach: (f) => suite.beforeEach.push(f), afterEach: (f) => suite.afterEach.push(f) });

    /* util, os, url, crypto, events */
    const promisify = (f) => (...a) => new Promise((res, rej) => f(...a, (e, v) => (e ? rej(e) : res(v))));
    const util = { promisify, format, inspect, isDeepStrictEqual: (a, b) => deepEq(a, b, true), TextEncoder, TextDecoder, types: { isPromise: (p) => p instanceof Promise, isDate: (d) => d instanceof Date, isRegExp: (r) => r instanceof RegExp }, inherits(c, s) { Object.setPrototypeOf(c.prototype, s.prototype); }, deprecate: (f) => f, callbackify: (f) => (...a) => { const cb = a.pop(); f(...a).then((v) => cb(null, v), cb); } };
    const os = { platform: () => "browser", arch: () => "wasm", type: () => "Browser", release: () => "1.0", hostname: () => "playground", homedir: () => "/playground", tmpdir: () => "/tmp", EOL: "\n", uptime: () => (Date.now() - pstart) / 1000, totalmem: () => 2 ** 32, freemem: () => 2 ** 31, loadavg: () => [0, 0, 0], networkInterfaces: () => ({}), userInfo: () => ({ username: "you", homedir: "/playground" }), cpus: () => Array.from({ length: (globalThis.navigator && navigator.hardwareConcurrency) || 4 }, () => ({ model: "browser", speed: 0, times: {} })) };
    const url = { URL, URLSearchParams, fileURLToPath: (u) => decodeURIComponent(new URL(u).pathname), pathToFileURL: (p) => new URL("file://" + path.resolve(p)) };
    const cb2 = (args, run) => { const cb = args.pop(); const t = {}; pendingTimers.add(t); macro(() => { pendingTimers.delete(t); let r, err = null; try { r = run(...args); } catch (e) { err = e; } after(cb, [err, r]); }); };
    const scryptArgs = (pw, salt, len, o) => { const c = o || {}; return [asBytes(pw), asBytes(salt), c.N ?? c.cost ?? 16384, c.r ?? c.blockSize ?? 8, c.p ?? c.parallelization ?? 1, len]; };
    const crypto_ = {
      randomBytes(n, cb) { const b = new Buffer_(n); for (let i = 0; i < n; i += 65536) globalThis.crypto.getRandomValues(b.subarray(i, i + 65536)); if (cb) { macro(() => cb(null, b)); return undefined; } return b; },
      randomUUID: () => globalThis.crypto.randomUUID(),
      randomInt(a, b, cb) { const lo = b === undefined || typeof b === "function" ? 0 : a, hi = b === undefined || typeof b === "function" ? a : b, v = lo + Math.floor(Math.random() * (hi - lo)); const f = typeof b === "function" ? b : cb; if (f) { macro(() => f(null, v)); return undefined; } return v; },
      createHash(alg) { if (String(alg).toLowerCase() !== "sha256") throw new Error(`The playground only has sha256 (asked for ${alg}).`); const parts = []; const h = { update(d, e) { parts.push(asBytes(d, e)); return h; }, digest(e) { const b = Buffer_.from(sha256(cat(...parts))); return e ? b.toString(e) : b; } }; return h; },
      createHmac(alg, key) { if (String(alg).toLowerCase() !== "sha256") throw new Error(`The playground only has sha256 (asked for ${alg}).`); const parts = []; const h = { update(d, e) { parts.push(asBytes(d, e)); return h; }, digest(e) { const b = Buffer_.from(hmac(asBytes(key), cat(...parts))); return e ? b.toString(e) : b; } }; return h; },
      pbkdf2Sync: (pw, salt, it, len) => Buffer_.from(pbkdf2(asBytes(pw), asBytes(salt), it, len)),
      pbkdf2(pw, salt, it, len, dig, cb) { cb2([cb], () => crypto_.pbkdf2Sync(pw, salt, it, len)); },
      scryptSync: (pw, salt, len, o) => Buffer_.from(scryptRaw(...scryptArgs(pw, salt, len, o))),
      scrypt(pw, salt, len, o, cb) { if (typeof o === "function") { cb = o; o = undefined; } cb2([cb], () => crypto_.scryptSync(pw, salt, len, o)); },
      timingSafeEqual(a, b) { if (a.length !== b.length) throw new RangeError("Input buffers must have the same byte length"); let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; },
      webcrypto: globalThis.crypto,
    };
    const eventsMod = Object.assign(EventEmitter, { EventEmitter, once });
    const timers = { setTimeout: setTimeout_, setInterval: setInterval_, setImmediate: setImmediate_, clearTimeout: clear, clearInterval: clear, clearImmediate: clearImmediate_ };
    const timersP = { setTimeout: (ms, v) => new Promise((r) => setTimeout_(() => r(v), ms)), setImmediate: (v) => new Promise((r) => setImmediate_(() => r(v))) };

    const mods = {
      assert, "assert/strict": assert.strict, buffer: { Buffer: Buffer_ }, crypto: crypto_, events: eventsMod, express, fs, "fs/promises": fsPromises, http, https: http, os, path, "path/posix": path, process: process_,
      stream, "stream/promises": stream.promises, test: nodeTest, timers, "timers/promises": timersP, url, util,
    };
    if (globalThis.React) Object.assign(mods, { react: globalThis.React, "react-dom": globalThis.ReactDOM, "react-dom/client": globalThis.ReactDOMClient });
    const require_ = (name) => {
      const id = String(name).replace(/^node:/, "");
      if (id in mods) return mods[id];
      if (["cluster", "worker_threads", "child_process", "net", "dns", "tls", "dgram", "http2", "zlib", "readline", "vm", "v8", "sqlite"].includes(id))
        throw new Error(`node:${id} is not available in this browser playground. Run this one with real Node on your machine.`);
      throw new Error(`Cannot find package '${name}'. The playground has Node's common core modules and express, but cannot install npm packages.`);
    };
    return { require: require_, process: process_, Buffer: Buffer_, setTimeout: setTimeout_, setInterval: setInterval_, setImmediate: setImmediate_, clearTimeout: clear, clearInterval: clear, clearImmediate: clearImmediate_, fetch: fetch_, global: globalThis,
      dispatch, ExitSignal, files, endTopLevel() { topLevel = false; maybeExit(); }, busy: () => pendingTimers.size > 0 || exiting };
  }

  /* ---------- running a program ---------- */
  const PARAMS = ["require", "module", "exports", "process", "Buffer", "console", "setTimeout", "setInterval", "setImmediate", "clearTimeout", "clearInterval", "clearImmediate", "fetch", "global", "__filename", "__dirname", "__g"];

  function makeConsole(write) {
    let groupPad = "";
    const line = (kind, args) => write(kind, (groupPad + format(...args)).replace(/\n/g, "\n" + groupPad));
    const counts = new Map(), times = new Map();
    return {
      log: (...a) => line("log", a), info: (...a) => line("log", a), debug: (...a) => line("log", a),
      warn: (...a) => line("warn", a), error: (...a) => line("error", a), trace: (...a) => line("error", ["Trace:", ...a]),
      dir: (o, opts) => write("log", groupPad + inspect(o, opts)),
      table: (d) => write("log", groupPad + inspect(d)),
      group: (...a) => { if (a.length) line("log", a); groupPad += "  "; }, groupEnd: () => { groupPad = groupPad.slice(2); },
      count: (l = "default") => { const c = (counts.get(l) || 0) + 1; counts.set(l, c); line("log", [`${l}: ${c}`]); },
      time: (l = "default") => times.set(l, performance.now()),
      timeEnd: (l = "default") => { line("log", [`${l}: ${(performance.now() - (times.get(l) ?? performance.now())).toFixed(3)}ms`]); times.delete(l); },
      assert: (ok, ...a) => { if (!ok) line("error", ["Assertion failed", ...a]); },
    };
  }

  // A loop that never yields would freeze the tab: compile adds __g() to every loop, and a heartbeat proves the page is alive.
  function makeGuard(limit, heartbeat) {
    let last = Date.now(), n = 0;
    heartbeat(() => { last = Date.now(); });
    return () => { if (++n % 2048 === 0 && Date.now() - last > limit) { n = 0; last = Date.now(); throw new Error(`Stopped: a loop ran for over ${limit / 1000} s without finishing.`); } };
  }

  /** Runs compiled code against a fresh Node world; `write(kind, text)` receives every line. */
  function run(js, write, source) {
    const node = createNode(write);
    node.files.set("/playground/main.mjs", Buffer_.from(source || js));
    const con = makeConsole(write);
    const guard = makeGuard(1500, (beat) => { const t = globalThis.setInterval(beat, 100); if (t && t.unref) t.unref(); });
    const module_ = { exports: {} };
    const args = [node.require, module_, module_.exports, node.process, node.Buffer, con, node.setTimeout, node.setInterval, node.setImmediate, node.clearTimeout, node.clearInterval, node.clearImmediate, node.fetch, node.global, "/playground/main.mjs", "/playground", guard];
    const report = (e) => { if (e instanceof node.ExitSignal) return; write("error", e && e.stack && e.name !== "AssertionError" ? cleanStack(e) : e && e.message ? `${e.name}: ${e.message}` : `Uncaught ${inspect(e)}`); };
    let f;
    try { f = new Function(...PARAMS, `"use strict"; return (async () => {\n${js}\n})();`); }
    catch (e) { write("error", `${e.name}: ${e.message}`); return { node, module: module_, done: Promise.resolve() }; }
    const done = Promise.resolve(f(...args)).catch(report).finally(() => node.endTopLevel());
    return { node, module: module_, done, report };
  }
  const cleanStack = (e) => { const lines = String(e.stack).split("\n"), head = `${e.name}: ${e.message}`; return lines[0].startsWith(e.name) ? head : head; };

  /* ---------- browser boot: posts everything to the parent page ---------- */
  function boot({ runId, mode, js, source }) {
    const post = (type, data) => parent.postMessage({ pg: true, runId, type, ...data }, "*");
    let lines = 0;
    const write = (kind, text) => {
      if (kind === "server") return post("server", { port: text });
      if (kind === "server-closed") return post("server-closed", { port: text });
      if (++lines > 1000) { if (lines === 1001) post("log", { kind: "warn", text: "Output stopped after 1,000 lines." }); return; }
      post("log", { kind, text });
    };
    // sandboxed frames have no storage: give code an in-memory one, so localStorage examples work during a run
    try { void globalThis.localStorage; } catch {
      const mem = new Map();
      const storage = { getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null), setItem: (k, v) => void mem.set(String(k), String(v)), removeItem: (k) => void mem.delete(String(k)), clear: () => mem.clear(), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
      Object.defineProperty(globalThis, "localStorage", { value: storage });
      Object.defineProperty(globalThis, "sessionStorage", { value: { ...storage } });
    }
    const r = run(js, write, source);
    addEventListener("error", (e) => { e.preventDefault(); r.report ? r.report(e.error || new Error(e.message)) : write("error", e.message); });
    addEventListener("unhandledrejection", (e) => { e.preventDefault(); r.report ? r.report(e.reason) : write("error", String(e.reason)); });
    addEventListener("message", async (e) => {
      if (e.source !== parent || !e.data || e.data.pg !== true || e.data.type !== "request") return;
      const { id, port, method, url, headers, body } = e.data;
      try {
        const res = await r.node.dispatch(port, method, url, headers, body);
        post("response", { id, status: res.status, statusText: res.statusText, headers: res.headers, body: res.body.toString() });
      } catch (err) { post("response", { id, error: err.message }); }
    });
    if (mode === "react") r.done.then(() => mountReact(r, write, post));
    else post("ready", {});
    if (mode === "react") {
      const ro = new ResizeObserver(() => post("height", { height: document.documentElement.scrollHeight }));
      ro.observe(document.documentElement);
    }
  }
  function mountReact(r, write, post) {
    const ex = r.module.exports;
    const candidates = ["default", "App", ...Object.keys(ex).reverse()];
    const key = candidates.find((k) => typeof ex[k] === "function" && (k === "default" || /^[A-Z]/.test(k)));
    if (!key) { post("no-component", {}); post("ready", {}); return; }
    const React = globalThis.React;
    class Boundary extends React.Component {
      constructor(p) { super(p); this.state = { error: null }; }
      static getDerivedStateFromError(error) { return { error }; }
      componentDidCatch(error) { write("error", `${error.name}: ${error.message}`); }
      render() { return this.state.error ? React.createElement("p", { className: "pg-error" }, `This component crashed: ${this.state.error.message}`) : this.props.children; }
    }
    globalThis.ReactDOMClient.createRoot(document.getElementById("root")).render(React.createElement(Boundary, null, React.createElement(ex[key])));
    post("component", { name: key === "default" ? (ex.default.name || "default export") : key });
    post("ready", {});
  }

  globalThis.__pg = { boot, run, createNode, inspect, format };
})();
