import type {ModelRuntime} from "../model-types.js";
import type {Needle3Model} from "../needle3/index.js";
import type {WhistleModel} from "../whistle/index.js";

type CactusNeedle = {
  complete(input?: string, options?: {tools?: unknown}): Promise<unknown>;
  extract(text: string, schema: unknown): Promise<unknown>;
  embed(input?: string): Promise<Float32Array>;
  close(): Promise<void>;
};

type CactusWhistle = {
  transcribe(audio: Uint8Array, options?: {language?: string}): Promise<{text: string}>;
  close(): Promise<void>;
};

export const cactusNeedle3Runtime: ModelRuntime<Needle3Model> = {
  async load() {
    const {createNeedle, downloadModel} = await import("cactus-needle");
    await downloadModel({model: "needle3"});
    const session = await createNeedle();
    const needle = session as unknown as CactusNeedle;
    return {
      complete: async (input) => {
        if (input.schema !== undefined) return needle.extract(input.prompt, input.schema);
        return needle.complete(input.prompt, {tools: input.tools});
      },
      embed: async (input) => needle.embed(input),
      close: () => needle.close(),
    };
  },
  async unload(model) {
    await model.close?.();
  },
};

export const cactusWhistleRuntime: ModelRuntime<WhistleModel> = {
  async load() {
    const {createWhistle, downloadModel} = await import("cactus-needle");
    await downloadModel({model: "whistle"});
    const session = await createWhistle();
    const whistle = session as unknown as CactusWhistle;
    return {
      transcribe: async (input) => {
        const result = await whistle.transcribe(input.audio, {
          ...(input.language === undefined ? {} : {language: input.language}),
        });
        return typeof result === "string" ? result : result?.text ?? "";
      },
      close: () => whistle.close(),
    };
  },
  async unload(model) {
    await model.close?.();
  },
};
