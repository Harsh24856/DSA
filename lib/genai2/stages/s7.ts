import type { GModule } from "../types.ts";
import { RAG_INGEST } from "../modules/s7/rag-ingest.ts";
import { EMBEDDING_MODELS } from "../modules/s7/embedding-models.ts";
import { VECTOR_SEARCH } from "../modules/s7/vector-search.ts";
import { HYBRID_RERANK } from "../modules/s7/hybrid-rerank.ts";
import { ADVANCED_RAG } from "../modules/s7/advanced-rag.ts";
import { RAG_EVALS } from "../modules/s7/rag-evals.ts";

export const MODULES_7: Record<string, GModule> = {
  "rag-ingest": RAG_INGEST,
  "embedding-models": EMBEDDING_MODELS,
  "vector-search": VECTOR_SEARCH,
  "hybrid-rerank": HYBRID_RERANK,
  "advanced-rag": ADVANCED_RAG,
  "rag-evals": RAG_EVALS,
};
