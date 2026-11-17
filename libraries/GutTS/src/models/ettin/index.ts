import {ModelLibrary} from "../model-library.js";
import type {ModelRuntime} from "../model-types.js";
import {ettinRuntime} from "../runtimes/transformers.js";

export type EttinRerankerModel = {
  rerank(input: {query: string; candidates: readonly string[]}): Promise<readonly number[]>;
  dispose?: () => Promise<void>;
};

export * from "./definition.js";
import {
  ettinReranker17MMetadata,
  ettinReranker32MMetadata,
  ettinReranker68MMetadata,
  ettinReranker150MMetadata,
} from "./definition.js";

export class EttinReranker extends ModelLibrary<EttinRerankerModel> {
  constructor(readonly modelMetadata: typeof ettinReranker17MMetadata | typeof ettinReranker32MMetadata | typeof ettinReranker68MMetadata | typeof ettinReranker150MMetadata = ettinReranker17MMetadata, runtime: ModelRuntime<EttinRerankerModel> = ettinRuntime) {
    super(modelMetadata, runtime);
  }

  rerank(input: {query: string; candidates: readonly string[]}): Promise<readonly number[]> {
    return this.withModel((model) => model.rerank(input));
  }
}

export class EttinReranker17M extends EttinReranker {
  constructor(runtime: ModelRuntime<EttinRerankerModel> = ettinRuntime) {
    super(ettinReranker17MMetadata, runtime);
  }
}

export class EttinReranker32M extends EttinReranker {
  constructor(runtime: ModelRuntime<EttinRerankerModel> = ettinRuntime) {
    super(ettinReranker32MMetadata, runtime);
  }
}

export class EttinReranker68M extends EttinReranker {
  constructor(runtime: ModelRuntime<EttinRerankerModel> = ettinRuntime) {
    super(ettinReranker68MMetadata, runtime);
  }
}

export class EttinReranker150M extends EttinReranker {
  constructor(runtime: ModelRuntime<EttinRerankerModel> = ettinRuntime) {
    super(ettinReranker150MMetadata, runtime);
  }
}
