import {ModelLibrary} from "../model-library.js";
import type {ModelRuntime} from "../model-types.js";
import {miniLMRuntime} from "../runtimes/transformers.js";

export type MiniLMModel = {
  similarity(input: {left: string; right: string}): Promise<number>;
  dispose?: () => Promise<void>;
};

export * from "./definition.js";
import {miniLML6Metadata} from "./definition.js";

export class MiniLM extends ModelLibrary<MiniLMModel> {
  constructor(runtime: ModelRuntime<MiniLMModel> = miniLMRuntime) {
    super(miniLML6Metadata, runtime);
  }

  similarity(input: {left: string; right: string}): Promise<number> {
    return this.withModel((model) => model.similarity(input));
  }
}
