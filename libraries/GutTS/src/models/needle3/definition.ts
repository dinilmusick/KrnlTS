import {defineApi} from "../../api/define-api.js";

export const needle3Metadata = {
  id: "model.cactus-needle3",
  name: "Needle 3",
  provider: "Cactus Compute",
  version: "3",
  description: "Tiny structured inference model for tool selection, argument extraction, classification, and embeddings.",
  examples: ["select a tool", "extract fields", "classify an intent"],
  avoidWhen: "Avoid for open-ended long-form generation or complex multi-step reasoning.",
  whenToUse: "Use when natural language must be mapped to a small tool set or structured schema.",
  size: {min: 8, max: 29, unit: "MB", qualifier: "range"},
  capabilities: ["tool-selection", "argument-extraction", "classification", "structured-output", "embeddings"],
  input: "Natural-language text with optional tools or extraction schema",
  output: "Structured JSON or embedding vector",
  runtime: "Cactus Needle runtime adapter",
  modelUri: "Cactus-Compute/needle3",
} as const;

export const needle3CompleteApi = defineApi({
  id: "model.cactus-needle3.complete",
  name: "Needle3.complete",
  category: "models",
  description: "Select tools or extract structured data from natural-language input.",
  parameters: [
    {name: "prompt", description: "Natural-language input.", required: true, schema: {type: "string"}},
    {name: "tools", description: "Optional tool definitions.", required: false, schema: {type: "array"}},
    {name: "schema", description: "Optional extraction schema.", required: false, schema: {type: "object"}},
  ],
  output: {type: "object", description: "Structured model result."},
  semantics: {deterministic: false, pure: false, sideEffects: false},
});
