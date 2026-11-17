import {arrayApis} from "./array-apis.js";
import {jsonApis} from "./json-apis.js";
import {numberApis} from "./number-apis.js";
import {objectApis} from "./object-apis.js";
import {stringApis} from "./string-apis.js";
import {urlApis} from "./url-apis.js";
import {needle3CompleteApi} from "../models/needle3/definition.js";
import {smolLM2GenerateApi} from "../models/smollm2/definition.js";
import {whistleTranscribeApi} from "../models/whistle/definition.js";
import {ettinRerankApi} from "../models/ettin/definition.js";
import {miniLMSimilarityApi} from "../models/minilm/definition.js";
import type {ApiDefinition} from "./api-types.js";

export const guttsApiDefinitions: readonly ApiDefinition[] = Object.freeze([
  ...arrayApis,
  ...jsonApis,
  ...numberApis,
  ...objectApis,
  ...stringApis,
  ...urlApis,
  smolLM2GenerateApi,
  needle3CompleteApi,
  whistleTranscribeApi,
  ettinRerankApi,
  miniLMSimilarityApi,
]);

export const guttsApiById: Readonly<Record<string, ApiDefinition>> = Object.freeze(
  Object.fromEntries(guttsApiDefinitions.map((api) => [api.id, api])),
);
