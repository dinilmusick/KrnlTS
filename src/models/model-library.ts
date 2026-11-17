import {ModelResidency} from "./model-residency.js";
import type {ModelMetadata, ModelRuntime} from "./model-types.js";

export abstract class ModelLibrary<TModel> {
  readonly residency = new ModelResidency<TModel>();

  protected constructor(
    readonly metadata: ModelMetadata,
    readonly runtime: ModelRuntime<TModel>,
  ) {}

  withModel<T>(operation: (model: TModel) => Promise<T>): Promise<T> {
    return this.residency.run(
      () => this.runtime.load(this.metadata),
      (model) => this.runtime.unload(model),
      operation,
    );
  }
}
