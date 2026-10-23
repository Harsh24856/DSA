// Supabase cloud sync. See supabase/schema.sql for the dsa_sync RPC.
import type { State } from "./logic";

const SB_URL = "https://dmiiflynxamcooowyhps.supabase.co";
const SB_KEY = "sb_publishable_wMRDwIm-ju-tXe8XvOoxJg_AnHYcIyd"; // publishable: safe in the browser, the RPC checks the sync key

export type Diff = { set: State["done"]; del: string[]; quota: State["quota"] | null };
const J = JSON.stringify;

/** Changes that turn `from` into `to`. */
export function diff(from: State, to: State): Diff {
  const set: State["done"] = {}, del: string[] = [];
  for (const [k, v] of Object.entries(to.done)) if (J(v) !== J(from.done[k])) set[k] = v;
  for (const k of Object.keys(from.done)) if (!(k in to.done)) del.push(k);
  return { set, del, quota: J(to.quota) !== J(from.quota) ? to.quota : null };
}

export function applyDiff(s: State, d: Diff): State {
  const done = { ...s.done, ...d.set };
  d.del.forEach((k) => delete done[k]);
  return { done, quota: d.quota || s.quota };
}

export const same = (a: State, b: State) => J(a.done) === J(b.done) && J(a.quota) === J(b.quota);

export async function pushDiff(key: string, d: Diff): Promise<State> {
  const r = await fetch(SB_URL + "/rest/v1/rpc/dsa_sync", {
    method: "POST",
    headers: { apikey: SB_KEY, "Content-Type": "application/json" },
    body: J({ p_key: key, p_set: d.set, p_del: d.del, p_quota: d.quota }),
  });
  const res = await r.json();
  if (!r.ok) throw new Error(res.message || String(r.status));
  return { done: res.done, quota: res.quota };
}
