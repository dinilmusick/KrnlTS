export type ModelSize =
  | {value: number; unit: "MB" | "GB"; qualifier: "artifact"}
  | {value: number; unit: "parameters"; qualifier: "parameters"}
  | {min: number; max: number; unit: "MB" | "GB"; qualifier: "range"};

export type ModelMetadata = {
  id: string;
  name: string;
  provider: string;
  version: string;
  description: string;
  examples: readonly string[];
  whenToUse: string;
  avoidWhen: string;
  size: ModelSize;
  capabilities: readonly string[];
  input: string;
  output: string;
  runtime: string;
  modelUri?: string;
  license?: string;
};

export type ModelLoadContext = {
  signal?: AbortSignal;
};

export type ModelRuntime<TModel> = {
  load(metadata: ModelMetadata, context?: ModelLoadContext): Promise<TModel>;
  unload(model: TModel): Promise<void>;
};

export type ModelLease<TModel> = {
  model: TModel;
  release(): Promise<void>;
};

export type ModelLoader<TModel> = () => Promise<TModel>;
export type ModelUnloader<TModel> = (model: TModel) => Promise<void>;
