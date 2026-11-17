import type { GModule } from "../types.ts";
import { RAG_INGEST } from "../modules/s7/rag-ingest.ts";

export const MODULES_7: Record<string, GModule> = {
  "rag-ingest": RAG_INGEST,
};
