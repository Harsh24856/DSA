// Cloud sync rules, kept free of Supabase and React so they can be tested with `npm test`.
// The browser copy (localStorage) stays the working copy; changes are queued as ops and pushed to Supabase.
import { normalize, type Done, type How, type Quota, type State } from "./schedule.ts";

export type SolveRow = { problem_index: number; solved_on: string; how: How; revisits: number; note: string | null; solved_at: string };
export type SettingsRow = { quota: Quota; seen: Record<string, string> };
export type Action = "solved" | "unsolved" | "revisited" | "updated";

export type Op =
  | { id: string; kind: "upsert"; i: number; action: Exclude<Action, "unsolved">; row: SolveRow }
  | { id: string; kind: "delete"; i: number }
  | { id: string; kind: "settings"; settings: SettingsRow };

let counter = 0;
const opId = () => Date.now().toString(36) + "-" + (counter++).toString(36) + "-" + Math.random().toString(36).slice(2, 7);

export function toRow(i: number, d: Done): SolveRow {
  return {
    problem_index: i,
    solved_on: d.d,
    how: d.h === "h" || d.h === "e" ? d.h : "s",
    revisits: Math.max(0, Math.min(3, d.r || 0)),
    note: d.n ? d.n.slice(0, 200) : null,
    solved_at: new Date(d.t || `${d.d}T12:00:00`).toISOString(),
  };
}

export function fromRow(r: SolveRow): Done {
  const d: Done = { d: r.solved_on, h: r.how, r: r.revisits, t: Date.parse(r.solved_at) };
  if (r.note) d.n = r.note;
  return d;
}

const same = (a: Done, b: Done) => a.d === b.d && (a.h || "s") === (b.h || "s") && (a.r || 0) === (b.r || 0) && (a.n || "") === (b.n || "");
const settingsOf = (s: State): SettingsRow => ({ quota: s.quota, seen: s.seen });

// What changed between two versions of the state, as ops for the outbox.
export function diff(prev: State, next: State): Op[] {
  const ops: Op[] = [];
  for (const [k, d] of Object.entries(next.done)) {
    const before = prev.done[k], i = +k;
    if (!before) ops.push({ id: opId(), kind: "upsert", i, action: "solved", row: toRow(i, d) });
    else if (!same(before, d)) ops.push({ id: opId(), kind: "upsert", i, action: (d.r || 0) > (before.r || 0) ? "revisited" : "updated", row: toRow(i, d) });
  }
  for (const k of Object.keys(prev.done)) if (!next.done[k]) ops.push({ id: opId(), kind: "delete", i: +k });
  if (JSON.stringify(settingsOf(prev)) !== JSON.stringify(settingsOf(next))) ops.push({ id: opId(), kind: "settings", settings: settingsOf(next) });
  return ops;
}

// Builds the state from the cloud copy. On the first sync from this browser, problems solved here
// but missing from the cloud are kept and uploaded, so signing in never loses local progress.
export function merge(local: State, rows: SolveRow[], settings: SettingsRow | null, firstSync: boolean): { state: State; upload: Op[] } {
  const done: Record<string, Done> = {};
  for (const r of rows) done[r.problem_index] = fromRow(r);
  const upload: Op[] = [];
  if (firstSync) {
    for (const [k, d] of Object.entries(local.done)) {
      if (done[k]) continue;
      done[k] = d;
      upload.push({ id: opId(), kind: "upsert", i: +k, action: "solved", row: toRow(+k, d) });
    }
  }
  const seen: Record<string, string> = { ...(settings?.seen || {}) };
  if (firstSync) for (const [k, v] of Object.entries(local.seen)) if (!seen[k] || v < seen[k]) seen[k] = v;
  const state = normalize({ done, quota: settings ? settings.quota : local.quota, seen });
  if (!settings || (firstSync && JSON.stringify(seen) !== JSON.stringify(settings.seen))) upload.push({ id: opId(), kind: "settings", settings: settingsOf(state) });
  return { state, upload };
}

// Splits the outbox into runs that can each go to Supabase in one request, keeping their order.
export function batches(ops: Op[], max = 200): Op[][] {
  const out: Op[][] = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (last && last[0].kind === op.kind && op.kind !== "settings" && last.length < max) last.push(op);
    else out.push([op]);
  }
  return out;
}

export function eventFor(op: Op): { problem_index: number; action: Action; details: Record<string, unknown> } | null {
  if (op.kind === "upsert") {
    const { solved_on, how, revisits, note } = op.row;
    return { problem_index: op.i, action: op.action, details: { solved_on, how, revisits, ...(note ? { note } : {}) } };
  }
  if (op.kind === "delete") return { problem_index: op.i, action: "unsolved", details: {} };
  return null;
}
