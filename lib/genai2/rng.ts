// No imports: lib/genai2/stages/*.play.ts reach the browser through flows-play.ts, so it must not pull in module text via index.ts.
// Deterministic rng from a string (FNV-1a hash into mulberry32), so server and client shuffle alike.
export const seededRng = (seed: string): (() => number) => {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
