import {ModelLibrary} from "../model-library.js";
import type {ModelRuntime} from "../model-types.js";
import {smolLM2Runtime} from "../runtimes/transformers.js";

export type SmolLM2Model = {
  generate(input: {prompt: string; maxNewTokens?: number}): Promise<string>;
  dispose?: () => Promise<void>;
};

export * from "./definition.js";
import {smolLM2Metadata} from "./definition.js";

export class SmolLM2 extends ModelLibrary<SmolLM2Model> {
  constructor(runtime: ModelRuntime<SmolLM2Model> = smolLM2Runtime) {
    super(smolLM2Metadata, runtime);
  }

  generate(input: {prompt: string; maxNewTokens?: number}): Promise<string> {
    return this.withModel((model) => model.generate(input));
  }
}
