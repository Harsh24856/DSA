import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyState, type State } from "./schedule.ts";
import { batches, diff, eventFor, fromRow, merge, toRow, type Op } from "./sync.ts";

const withDone = (s: State, done: State["done"]): State => ({ ...s, done: { ...s.done, ...done } });

test("rows round-trip without losing anything", () => {
  const d = { d: "2026-10-26", h: "h" as const, r: 1, n: "two pointers", t: Date.parse("2026-10-26T08:30:00Z") };
  assert.deepEqual(fromRow(toRow(5, d)), d);
  const bare = fromRow(toRow(7, { d: "2026-10-26" }));
  assert.deepEqual([bare.h, bare.r, bare.n], ["s", 0, undefined]);
  assert.equal(toRow(1, { d: "2026-10-26", n: "x".repeat(300) }).note!.length, 200);
});

test("diff turns each kind of change into the right op", () => {
  const a = withDone(emptyState(), { 1: { d: "2026-10-26", h: "s", r: 0, t: 1 }, 2: { d: "2026-10-26", h: "h", r: 0, t: 2 } });
  const b = withDone({ ...a, done: { 2: { ...a.done[2], r: 1 } } }, { 3: { d: "2026-10-27", h: "s", r: 0, t: 3 } });
  const ops = diff(a, b);
  const kinds = ops.map(o => o.kind + ":" + ("i" in o ? o.i : "") + (o.kind === "upsert" ? ":" + o.action : ""));
  assert.deepEqual(kinds.sort(), ["delete:1", "upsert:2:revisited", "upsert:3:solved"]);
  const note = diff(b, { ...b, done: { ...b.done, 3: { ...b.done[3], n: "hash map" } } });
  assert.equal(note.length, 1);
  assert.equal(note[0].kind === "upsert" && note[0].action, "updated");
  assert.deepEqual(diff(b, b), []);
  const q = diff(b, { ...b, quota: { ...b.quota, wL: 4 } });
  assert.equal(q.length, 1);
  assert.equal(q[0].kind, "settings");
});

test("first sign-in keeps local solves and uploads the ones the cloud is missing", () => {
  const local = withDone(emptyState(), { 1: { d: "2026-10-20", h: "s", r: 0, t: 1 }, 2: { d: "2026-10-21", h: "e", r: 0, t: 2 } });
  local.seen = { 9: "2026-10-22" };
  const remoteRow = toRow(2, { d: "2026-10-25", h: "h", r: 1, t: 5 });
  const { state, upload } = merge(local, [remoteRow], { quota: { L: 3, S: 1, wL: 3, wS: 2, C: 1 }, seen: {} }, true);
  assert.deepEqual(Object.keys(state.done).sort(), ["1", "2"]);
  assert.equal(state.done[2].h, "h", "the cloud wins when both have a problem");
  assert.equal(state.quota.L, 3, "cloud settings win");
  assert.equal(state.seen[9], "2026-10-22");
  assert.deepEqual(upload.map(o => o.kind).sort(), ["settings", "upsert"]);
});

test("later syncs mirror the cloud and upload nothing", () => {
  const local = withDone(emptyState(), { 1: { d: "2026-10-20" } });
  const { state, upload } = merge(local, [toRow(4, { d: "2026-10-24" })], { quota: emptyState().quota, seen: {} }, false);
  assert.deepEqual(Object.keys(state.done), ["4"]);
  assert.deepEqual(upload, []);
});

test("a brand-new account gets this browser's settings", () => {
  const { upload } = merge(emptyState(), [], null, true);
  assert.deepEqual(upload.map(o => o.kind), ["settings"]);
});

test("batches group runs of the same kind and keep order", () => {
  const up = (i: number): Op => ({ id: "u" + i, kind: "upsert", i, action: "solved", row: toRow(i, { d: "2026-10-26" }) });
  const del = (i: number): Op => ({ id: "d" + i, kind: "delete", i });
  const set: Op = { id: "s", kind: "settings", settings: { quota: emptyState().quota, seen: {} } };
  const b = batches([up(1), up(2), del(3), set, set, up(4)]);
  assert.deepEqual(b.map(x => x.map(o => o.id)), [["u1", "u2"], ["d3"], ["s"], ["s"], ["u4"]]);
  assert.equal(batches(Array.from({ length: 450 }, (_, i) => up(i)), 200).length, 3);
  assert.deepEqual(eventFor(del(3)), { problem_index: 3, action: "unsolved", details: {} });
  assert.equal(eventFor(set), null);
});
