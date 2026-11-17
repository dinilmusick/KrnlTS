import {defineApi} from "../../api/define-api.js";

export const smolLM2Metadata = {
  id: "model.smollm2-135m-instruct",
  name: "SmolLM2-135M-Instruct",
  provider: "Hugging Face",
  version: "135M",
  description: "Compact instruction-tuned language model for general text generation.",
  examples: ["summarize text", "rewrite text", "draft a short response"],
  avoidWhen: "Avoid for high-stakes reasoning, broad factual knowledge, or tasks requiring large context.",
  whenToUse: "Use for short general-purpose text generation when a local model is preferred.",
  size: {value: 105, unit: "MB", qualifier: "artifact"},
  capabilities: ["text-generation", "instruction-following"],
  input: "Natural-language prompt",
  output: "Generated natural-language text",
  runtime: "ModelRuntime adapter",
  modelUri: "HuggingFaceTB/SmolLM2-135M-Instruct",
  license: "Apache-2.0",
} as const;

export const smolLM2GenerateApi = defineApi({
  id: "model.smollm2-135m-instruct.generate",
  name: "SmolLM2-135M-Instruct.generate",
  category: "models",
  description: "Generate natural-language text with SmolLM2-135M-Instruct.",
  parameters: [
    {name: "prompt", description: "Prompt supplied to the model.", required: true, schema: {type: "string"}},
    {name: "maxNewTokens", description: "Maximum number of new tokens.", required: false, schema: {type: "number"}},
  ],
  output: {type: "string", description: "Generated natural-language text."},
  semantics: {deterministic: false, pure: false, sideEffects: false},
  errors: ["Model load failure", "Inference failure"],
});
