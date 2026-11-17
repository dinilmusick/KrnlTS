import {ettinReranker150MMetadata, ettinReranker17MMetadata, ettinReranker32MMetadata, ettinReranker68MMetadata} from "./ettin/index.js";
import {miniLML6Metadata} from "./minilm/index.js";
import {needle3Metadata} from "./needle3/index.js";
import {smolLM2Metadata} from "./smollm2/index.js";
import {whistleMetadata} from "./whistle/index.js";
import type {ModelMetadata} from "./model-types.js";

export const guttsModelDefinitions: readonly ModelMetadata[] = Object.freeze([
  smolLM2Metadata,
  needle3Metadata,
  whistleMetadata,
  ettinReranker17MMetadata,
  ettinReranker32MMetadata,
  ettinReranker68MMetadata,
  ettinReranker150MMetadata,
  miniLML6Metadata,
]);

export const guttsModelById: Readonly<Record<string, ModelMetadata>> = Object.freeze(
  Object.fromEntries(guttsModelDefinitions.map((model) => [model.id, model])),
);
