import {ModelLibrary} from "../model-library.js";
import type {ModelRuntime} from "../model-types.js";
import {cactusWhistleRuntime} from "../runtimes/cactus-browser.js";

export type WhistleModel = {
  transcribe(input: {audio: Uint8Array; language?: string}): Promise<string>;
  close?: () => Promise<void>;
};

export * from "./definition.js";
import {whistleMetadata} from "./definition.js";

export class Whistle extends ModelLibrary<WhistleModel> {
  constructor(runtime: ModelRuntime<WhistleModel> = cactusWhistleRuntime) {
    super(whistleMetadata, runtime);
  }

  transcribe(input: {audio: Uint8Array; language?: string}): Promise<string> {
    return this.withModel((model) => model.transcribe(input));
  }
}
