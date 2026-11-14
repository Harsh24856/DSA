// Interactive walk-throughs: a flow computed from numbers the learner sets with sliders (components/other/FlowLab.tsx).
// A chapter opts in with `play: "<id>"`. `make` must return a valid Flow for every allowed combination, or throw a
// PlayError when the numbers have no sensible answer (the page then says so and keeps the last good walk-through).
// check:other runs every one at its defaults and on random combinations.
import type { PlayFlow } from "./flows-play-types.ts";
import { PLAY as QUANT } from "./flows-play-quant.ts";
import { PLAY as LOGIC } from "./flows-play-logic.ts";

export { PlayError } from "./flows-play-types.ts";
export type { Knob, PlayFlow } from "./flows-play-types.ts";

export const PLAY_FLOWS: Record<string, PlayFlow> = { ...QUANT, ...LOGIC };
export const knobDefaults = (p: PlayFlow) => Object.fromEntries(p.knobs.map((k) => [k.key, k.value]));
