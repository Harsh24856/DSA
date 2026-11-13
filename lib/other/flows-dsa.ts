// Remotion walk-throughs for the data structures and techniques of /patterns, shown on each topic's Overview.
import { FLOWS as A, PLACES as PA } from "./flows-dsa-a.ts";
import { FLOWS as B, PLACES as PB } from "./flows-dsa-b.ts";

export const DSA_FLOWS = { ...A, ...B };
export const TOPIC_FLOWS: Record<string, string[]> = { ...PA, ...PB };
