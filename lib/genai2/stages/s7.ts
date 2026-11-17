import type { GModule } from "../types.ts";
import { RAG_INGEST } from "../modules/s7/rag-ingest.ts";
import { VECTOR_SEARCH } from "../modules/s7/vector-search.ts";
import { HYBRID_RERANK } from "../modules/s7/hybrid-rerank.ts";
import { ADVANCED_RAG } from "../modules/s7/advanced-rag.ts";

export const MODULES_7: Record<string, GModule> = {
  "rag-ingest": RAG_INGEST,
  "vector-search": VECTOR_SEARCH,
  "hybrid-rerank": HYBRID_RERANK,
  "advanced-rag": ADVANCED_RAG,
};
