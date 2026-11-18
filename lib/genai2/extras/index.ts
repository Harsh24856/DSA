// Server only: the reference pages' text. Pages import this; the browser gets one page as props.
import type { ExtraPage } from "./types.ts";
import { CAPSTONE, DESIGN, GLOSSARY, INTERVIEW, RESOURCES } from "./data.ts";

export const EXTRAS: ExtraPage[] = [INTERVIEW, DESIGN, CAPSTONE, GLOSSARY, RESOURCES];
export const EXTRA = Object.fromEntries(EXTRAS.map((p) => [p.id, p])) as Record<string, ExtraPage>;
export type { ExtraPage } from "./types.ts";
