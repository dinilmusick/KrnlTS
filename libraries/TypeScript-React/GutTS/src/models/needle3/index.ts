import {ModelLibrary} from "../model-library.js";
import type {ModelRuntime} from "../model-types.js";
import {cactusNeedle3Runtime} from "../runtimes/cactus-browser.js";

export type Needle3Model = {
  complete(input: {prompt: string; tools?: readonly unknown[]; schema?: unknown}): Promise<unknown>;
  embed(input: string): Promise<readonly number[] | Float32Array>;
  close?: () => Promise<void>;
};

export * from "./definition.js";
import {needle3Metadata} from "./definition.js";

export class Needle3 extends ModelLibrary<Needle3Model> {
  constructor(runtime: ModelRuntime<Needle3Model> = cactusNeedle3Runtime) {
    super(needle3Metadata, runtime);
  }

  complete(input: {prompt: string; tools?: readonly unknown[]; schema?: unknown}): Promise<unknown> {
    return this.withModel((model) => model.complete(input));
  }

  embed(input: string): Promise<readonly number[] | Float32Array> {
    return this.withModel((model) => model.embed(input));
  }
}
