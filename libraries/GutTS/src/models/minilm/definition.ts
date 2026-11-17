import {defineApi} from "../../api/define-api.js";

export const miniLML6Metadata = {
  id: "model.minilm-l6-v2",
  name: "MiniLM-L6-v2",
  provider: "Sentence Transformers",
  version: "L6-v2",
  description: "Compact sentence embedding model for semantic similarity.",
  examples: ["compare two texts", "match a query to a short description"],
  avoidWhen: "Avoid when generation, extraction, or tool calling is required.",
  whenToUse: "Use for lightweight semantic similarity and embedding-based matching.",
  size: {value: 22_700_000, unit: "parameters" as const, qualifier: "parameters" as const},
  capabilities: ["embeddings", "semantic-similarity"],
  input: "Two text strings",
  output: "Similarity score",
  runtime: "ModelRuntime adapter",
  modelUri: "sentence-transformers/all-MiniLM-L6-v2",
  license: "Apache-2.0",
} as const;

export const miniLMSimilarityApi = defineApi({
  id: "model.minilm-l6-v2.similarity",
  name: "MiniLM-L6-v2.similarity",
  category: "models",
  description: "Compute semantic similarity between two texts.",
  parameters: [
    {name: "left", description: "First text.", required: true, schema: {type: "string"}},
    {name: "right", description: "Second text.", required: true, schema: {type: "string"}},
  ],
  output: {type: "number", description: "Semantic similarity score."},
  semantics: {deterministic: true, pure: false, sideEffects: false},
});
