// Types for interactive walk-throughs (flows-play.ts), apart from the registry so content files never import it back.
import type { Flow } from "./flows.ts";

export type Knob = { key: string; label: string; min: number; max: number; step?: number; value: number; unit?: string };
export type PlayFlow = { title: string; knobs: Knob[]; make: (v: Record<string, number>) => Flow };
/** Thrown by `make` when a combination has no clean answer; its message is shown to the learner. */
export class PlayError extends Error {}
