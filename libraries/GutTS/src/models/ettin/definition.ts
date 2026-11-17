import {defineApi} from "../../api/define-api.js";

const defineEttin = (id: string, name: string, parameters: number, description: string) => ({
  id, name, provider: "Hugging Face", version: String(parameters),
  description,
  examples: ["rank search results", "order retrieved documents by relevance"],
  whenToUse: "Use for cross-encoder reranking when candidate texts must be sorted by semantic relevance.",
  avoidWhen: "Avoid for text generation, embeddings, or transcription.",
  size: {value: parameters * 1_000_000, unit: "parameters" as const, qualifier: "parameters" as const},
  capabilities: ["reranking", "relevance-scoring"],
  input: "Query and candidate texts", output: "Candidate relevance scores",
  runtime: "ModelRuntime adapter", modelUri: `cross-encoder/ettin-reranker-${parameters}m-v1`,
  license: "Apache-2.0",
});

export const ettinReranker17MMetadata = defineEttin("model.ettin-reranker-17m", "Ettin-Reranker-17M", 17, "Very small relevance model for ranking candidate text.");
export const ettinReranker32MMetadata = defineEttin("model.ettin-reranker-32m", "Ettin-Reranker-32M", 32, "Small relevance model for ranking candidate text.");
export const ettinReranker68MMetadata = defineEttin("model.ettin-reranker-68m", "Ettin-Reranker-68M", 68, "Compact relevance model for higher-quality candidate ranking.");
export const ettinReranker150MMetadata = defineEttin("model.ettin-reranker-150m", "Ettin-Reranker-150M", 150, "Larger compact relevance model for candidate ranking.");

export const ettinRerankApi = defineApi({
  id: "model.ettin-reranker.rerank",
  name: "EttinReranker.rerank",
  category: "models",
  description: "Rank candidate texts by relevance to a query.",
  parameters: [
    {name: "query", description: "Query text.", required: true, schema: {type: "string"}},
    {name: "candidates", description: "Candidate texts to rank.", required: true, schema: {type: "array", items: {type: "string"}}},
  ],
  output: {type: "array", description: "Relevance scores in candidate order.", items: {type: "number"}},
  semantics: {deterministic: true, pure: false, sideEffects: false},
});
