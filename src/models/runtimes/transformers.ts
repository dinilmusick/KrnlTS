import type {ModelRuntime} from "../model-types.js";
import type {SmolLM2Model} from "../smollm2/index.js";
import type {MiniLMModel} from "../minilm/index.js";
import type {EttinRerankerModel} from "../ettin/index.js";
import {loadEttinHeadWeights, computeEttinHeadScores} from "./ettin-head.js";

type DisposablePipeline = {
  (input: unknown, options?: Record<string, unknown>): Promise<unknown>;
  dispose?: () => Promise<void> | void;
};

export const smolLM2Runtime: ModelRuntime<SmolLM2Model> = {
  async load() {
    const {pipeline} = await import("@huggingface/transformers");
    const pipe = (await pipeline("text-generation", "HuggingFaceTB/SmolLM2-135M-Instruct", {
      dtype: "q4",
    })) as unknown as DisposablePipeline;
    return {
      generate: async (input) => {
        const output = await pipe(input.prompt, {
          max_new_tokens: input.maxNewTokens ?? 32,
        });
        const first = Array.isArray(output) ? output[0] : output;
        if (!first || typeof first !== "object" || !("generated_text" in first)) {
          throw new Error("SmolLM2 runtime returned an invalid generation result.");
        }
        return String((first as {generated_text: unknown}).generated_text);
      },
      dispose: async () => pipe.dispose?.(),
    };
  },
  async unload(model) {
    await model.dispose?.();
  },
};

export const miniLMRuntime: ModelRuntime<MiniLMModel> = {
  async load() {
    const {pipeline} = await import("@huggingface/transformers");
    const pipe = (await pipeline("feature-extraction", "sentence-transformers/all-MiniLM-L6-v2")) as unknown as DisposablePipeline;
    return {
      similarity: async ({left, right}) => {
        const output = await pipe([left, right], {pooling: "mean", normalize: true});
        const data = tensorData(output);
        const half = Math.floor(data.length / 2);
        if (half === 0 || data.length % 2 !== 0) throw new Error("MiniLM runtime returned invalid embeddings.");
        return cosine(data.subarray(0, half), data.subarray(half));
      },
      dispose: async () => pipe.dispose?.(),
    };
  },
  async unload(model) {
    await model.dispose?.();
  },
};

export const ettinRuntime: ModelRuntime<EttinRerankerModel> = {
  async load(metadata) {
    const {AutoTokenizer, AutoModel} = await import("@huggingface/transformers");
    const targetModel = metadata.modelUri ?? "cross-encoder/ettin-reranker-17m-v1";
    const [tokenizer, model, headWeights] = await Promise.all([
      AutoTokenizer.from_pretrained(targetModel),
      AutoModel.from_pretrained(targetModel),
      loadEttinHeadWeights(targetModel),
    ]);
    return {
      rerank: async ({query, candidates}) => {
        if (candidates.length === 0) return [];
        const inputs = await tokenizer(Array(candidates.length).fill(query), {
          text_pair: candidates as string[],
          padding: true,
          truncation: true,
        });
        const outputs = await model(inputs);
        const lastHidden = (outputs as {last_hidden_state?: {dims: readonly number[]; data: Float32Array}}).last_hidden_state;
        if (!lastHidden) throw new Error(`Ettin runtime returned an invalid result for ${targetModel}.`);
        return computeEttinHeadScores(lastHidden, headWeights);
      },
      dispose: async () => {
        await model.dispose?.();
      },
    };
  },
  async unload(model) {
    await model.dispose?.();
  },
};

function tensorData(output: unknown): Float32Array {
  if (!output || typeof output !== "object" || !("data" in output)) {
    throw new Error("Embedding runtime returned an invalid tensor.");
  }
  const data = (output as {data: unknown}).data;
  if (!(data instanceof Float32Array)) throw new Error("Embedding runtime returned invalid tensor data.");
  return data;
}

function cosine(left: Float32Array, right: Float32Array): number {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let i = 0; i < left.length; i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }
  return dot / Math.sqrt(leftNorm * rightNorm);
}
