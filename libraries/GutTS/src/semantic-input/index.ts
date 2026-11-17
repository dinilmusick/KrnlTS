import {EttinReranker17M, EttinReranker32M, EttinReranker68M} from "../models/ettin/index.js";
import {MiniLM} from "../models/minilm/index.js";
import {Needle3} from "../models/needle3/index.js";

export type SemanticInputSchema = {
  type: string;
  properties?: Record<string, SemanticInputSchema>;
  required?: readonly string[];
  enum?: readonly unknown[];
  items?: SemanticInputSchema;
  description?: string;
  [key: string]: unknown;
};

export type SemanticInputContext = {
  application?: string;
  workspace?: string;
  page?: string;
  section?: string;
  form?: string;
  field?: string;
  label?: string;
  description?: string;
  semanticType?: string;
  vocabulary?: readonly string[];
  examples?: readonly string[];
  aliases?: readonly string[];
  constraints?: readonly string[];
  locale?: string;
  relatedFields?: readonly string[];
};

export type SemanticInputErrorCode =
  | "EMPTY_INPUT"
  | "MODEL_FAILURE"
  | "MODEL_OUTPUT_EMPTY"
  | "SCHEMA_MISMATCH"
  | "AMBIGUOUS_CANDIDATE"
  | "UNSUPPORTED_TYPE"
  | "ABORTED";

export type SemanticInputRisk = "low" | "medium" | "high";

export type SemanticInputProgress = {
  phase: "started" | "deterministic" | "ranking" | "structured" | "completed";
  detail?: string;
};

export type SemanticInputEvent =
  | {type: "semantic.started"; input: string}
  | {type: "semantic.deterministic"; value: unknown}
  | {type: "semantic.resolved"; value: unknown}
  | {type: "semantic.ambiguous"; candidates: readonly string[]}
  | {type: "semantic.clarification.required"; question: string}
  | {type: "semantic.invalid"; code: SemanticInputErrorCode}
  | {type: "semantic.failed"; code: SemanticInputErrorCode};

export type SemanticInputModelPolicy = "fast" | "balanced" | "accurate";

export type SemanticInputPolicy = {
  risk?: SemanticInputRisk;
  requireConfirmation?: boolean;
  modelPolicy?: SemanticInputModelPolicy;
};

export type SemanticInputProvenanceStore = {
  append(record: SemanticInputProvenanceRecord): void | Promise<void>;
};

export type SemanticInputProvenanceRecord = {
  provenance: SemanticInputProvenance;
  status: SemanticInputResolution["status"];
  timestamp: string;
};

export type SemanticInputProvenance = {
  requestFingerprint: string;
  resolver: "GutTS.semantic-input";
  modelPolicy: SemanticInputModelPolicy;
  models: readonly ["Needle3", "MiniLM", "EttinReranker17M" | "EttinReranker32M" | "EttinReranker68M"];
  deterministic: boolean;
};

export type SemanticInputCandidate = {
  value: string;
  similarity?: number | undefined;
  relevance?: number | undefined;
};

export type SemanticInputEvidence = {
  needleOutput?: unknown;
  candidates: readonly SemanticInputCandidate[];
  selectedCandidate?: string;
  similarityThreshold?: number;
  relevanceMarginThreshold?: number;
};

export type SemanticInputClarification = {
  question: string;
  candidates: readonly string[];
};

export type SemanticInputResolution<T = unknown> = {
  status: "resolved" | "ambiguous" | "invalid" | "unsupported" | "unresolved" | "failed";
  value?: T;
  rawInput?: string;
  candidates: readonly SemanticInputCandidate[];
  modelOutput: unknown;
  evidence?: SemanticInputEvidence;
  clarification?: SemanticInputClarification;
  error?: {
    code: SemanticInputErrorCode;
    message: string;
  };
  requiresConfirmation?: boolean;
  provenance?: SemanticInputProvenance;
};

export type SemanticInputCacheKey = string;

export class SemanticInputCache {
  private readonly entries = new Map<SemanticInputCacheKey, SemanticInputResolution>();

  constructor(private readonly maxEntries = 128) {}

  get<T>(key: SemanticInputCacheKey): SemanticInputResolution<T> | undefined {
    const value = this.entries.get(key);
    if (!value) return undefined;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value as SemanticInputResolution<T>;
  }

  set<T>(key: SemanticInputCacheKey, value: SemanticInputResolution<T>): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

export type SemanticInputRequest = {
  input: string;
  schema: SemanticInputSchema;
  context?: SemanticInputContext;
  candidates?: readonly string[];
  preserveRawInput?: boolean;
  minCandidateSimilarity?: number;
  minCandidateMargin?: number;
  policy?: SemanticInputPolicy;
  cache?: SemanticInputCache;
  signal?: AbortSignal;
  onEvent?: (event: SemanticInputEvent) => void;
  onProgress?: (progress: SemanticInputProgress) => void;
  provenanceStore?: SemanticInputProvenanceStore;
};

function unwrapModelOutput(output: unknown): unknown {
  if (!output || typeof output !== "object") return output;
  const record = output as Record<string, unknown>;
  for (const key of ["output", "result", "data", "structuredOutput"]) {
    if (key in record) return record[key];
  }
  return output;
}

function buildPrompt(request: SemanticInputRequest): string {
  return [
    "Convert the natural-language input into the supplied target schema.",
    "Return only data conforming to the target schema. Never invent information.",
    request.context?.application ? `Application: ${request.context.application}` : "",
    request.context?.workspace ? `Workspace: ${request.context.workspace}` : "",
    request.context?.page ? `Page: ${request.context.page}` : "",
    request.context?.section ? `Section: ${request.context.section}` : "",
    request.context?.form ? `Form: ${request.context.form}` : "",
    request.context?.field ? `Field: ${request.context.field}` : "",
    request.context?.label ? `Label: ${request.context.label}` : "",
    request.context?.description ? `Description: ${request.context.description}` : "",
    request.context?.semanticType ? `Semantic type: ${request.context.semanticType}` : "",
    request.context?.vocabulary?.length ? `Vocabulary: ${request.context.vocabulary.join(", ")}` : "",
    request.context?.examples?.length ? `Examples: ${request.context.examples.join(" | ")}` : "",
    request.context?.aliases?.length ? `Aliases: ${request.context.aliases.join(", ")}` : "",
    request.context?.constraints?.length ? `Constraints: ${request.context.constraints.join("; ")}` : "",
    request.context?.relatedFields?.length ? `Related fields: ${request.context.relatedFields.join(", ")}` : "",
    request.context?.locale ? `Locale: ${request.context.locale}` : "",
    request.candidates?.length ? `Candidate values: ${request.candidates.join(" | ")}` : "",
    `Target schema: ${JSON.stringify(request.schema)}`,
    `Input: ${request.input}`,
  ].filter(Boolean).join("\n");
}

function cacheKey(request: SemanticInputRequest): SemanticInputCacheKey {
  return JSON.stringify({
    input: request.input,
    schema: request.schema,
    context: request.context,
    candidates: request.candidates,
    preserveRawInput: request.preserveRawInput ?? false,
    minCandidateSimilarity: request.minCandidateSimilarity ?? 0.65,
    minCandidateMargin: request.minCandidateMargin ?? 0.15,
    policy: request.policy,
  });
}

function modelPolicy(policy?: SemanticInputPolicy): SemanticInputModelPolicy {
  return policy?.modelPolicy ?? "balanced";
}

function fingerprint(request: SemanticInputRequest): string {
  const source = JSON.stringify({
    input: request.input,
    schema: request.schema,
    context: request.context,
    candidates: request.candidates,
    modelPolicy: modelPolicy(request.policy),
  });
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function provenance(request: SemanticInputRequest, deterministic: boolean): SemanticInputProvenance {
  return {
    requestFingerprint: fingerprint(request),
    resolver: "GutTS.semantic-input",
    modelPolicy: modelPolicy(request.policy),
    models: ["Needle3", "MiniLM", modelPolicy(request.policy) === "fast" ? "EttinReranker17M" : modelPolicy(request.policy) === "accurate" ? "EttinReranker68M" : "EttinReranker32M"],
    deterministic,
  };
}

function recordProvenance(
  request: SemanticInputRequest,
  resolution: SemanticInputResolution,
): void {
  const provenance = resolution.provenance;
  if (!provenance || !request.provenanceStore) return;
  void request.provenanceStore.append({
    provenance,
    status: resolution.status,
    timestamp: new Date().toISOString(),
  });
}

function confirmationRequired(policy?: SemanticInputPolicy): boolean {
  return policy?.requireConfirmation === true || policy?.risk === "high";
}

function deterministicValue(input: string, schema: SemanticInputSchema): unknown {
  const trimmed = input.trim();
  if (schema.enum?.some((candidate) => candidate === trimmed)) return trimmed;
  if (schema.type === "string") {
    if (schema.format === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
    if (schema.format === "uri" && /^https?:\/\//i.test(trimmed)) return trimmed;
    if (schema.format === "date" && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (schema.format === "date-time" && /^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed;
    if (schema.pattern && new RegExp(String(schema.pattern)).test(trimmed)) return trimmed;
  }
  if (schema.type === "number") {
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : undefined;
  }
  if (schema.type === "integer") {
    const value = Number(trimmed);
    return Number.isInteger(value) ? value : undefined;
  }
  if (schema.type === "boolean") {
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;
  }
  return undefined;
}

export function resolveDeterministicSemanticInput<T = unknown>(
  input: string,
  schema: SemanticInputSchema,
): SemanticInputResolution<T> | undefined {
  if (!input.trim()) return undefined;
  const value = deterministicValue(input, schema);
  if (value === undefined) return undefined;
  return {
    status: "resolved",
    value: value as T,
    candidates: [],
    modelOutput: value,
  };
}

export async function rankSemanticInputCandidates(
  input: string,
  candidates: readonly string[],
  policy: SemanticInputModelPolicy = "balanced",
): Promise<readonly SemanticInputCandidate[]> {
  if (candidates.length === 0) return [];
  const similarityModel = new MiniLM();
  const reranker = policy === "fast"
    ? new EttinReranker17M()
    : policy === "accurate"
      ? new EttinReranker68M()
      : new EttinReranker32M();
  const similarities = await Promise.all(
    candidates.map((candidate) => similarityModel.similarity({left: input, right: candidate})),
  );
  const relevance = await reranker.rerank({query: input, candidates});
  return candidates
    .map((value, index) => ({value, similarity: similarities[index], relevance: relevance[index]}))
    .sort((a, b) => {
      const relDiff = (b.relevance ?? -Infinity) - (a.relevance ?? -Infinity);
      if (relDiff !== 0) return relDiff;
      const simDiff = (b.similarity ?? -Infinity) - (a.similarity ?? -Infinity);
      if (simDiff !== 0) return simDiff;
      return a.value.localeCompare(b.value);
    });
}

function clarificationFor(candidates: readonly SemanticInputCandidate[], context?: SemanticInputContext): SemanticInputClarification | undefined {
  const values = candidates.slice(0, 3).map((candidate) => candidate.value);
  if (values.length < 2) return undefined;
  const label = context?.label ?? context?.field ?? "this field";
  return {
    question: `Which value did you mean for ${label}: ${values.join(", ")}?`,
    candidates: values,
  };
}

export async function resolveSemanticInput<T = unknown>(
  request: SemanticInputRequest,
): Promise<SemanticInputResolution<T>> {
  const preserveRaw = request.preserveRawInput ?? false;
  const confirmed = confirmationRequired(request.policy);
  request.onProgress?.({phase: "started"});
  request.onEvent?.({type: "semantic.started", input: request.input});
  if (request.signal?.aborted) {
    request.onEvent?.({type: "semantic.failed", code: "ABORTED"});
    return {
      status: "failed",
      ...(preserveRaw ? {rawInput: request.input} : {}),
      candidates: [],
      modelOutput: undefined,
      error: {code: "ABORTED", message: "Semantic resolution was aborted."},
      provenance: provenance(request, false),
    };
  }

  const cached = request.cache?.get<T>(cacheKey(request));
  if (cached) return cached;

  if (!request.input || !request.input.trim()) {
    const result: SemanticInputResolution<T> = {
      status: "invalid",
      ...(preserveRaw ? {rawInput: request.input} : {}),
      candidates: [],
      modelOutput: undefined,
      error: {code: "EMPTY_INPUT", message: "Semantic input is empty."},
    };
    request.cache?.set(cacheKey(request), result);
    request.onEvent?.({type: "semantic.invalid", code: "EMPTY_INPUT"});
    return result;
  }

  const deterministic = resolveDeterministicSemanticInput<T>(request.input, request.schema);
  if (deterministic) {
    request.onProgress?.({phase: "deterministic"});
    const result = {...deterministic, ...(confirmed ? {requiresConfirmation: true} : {}), provenance: provenance(request, true)};
    request.cache?.set(cacheKey(request), result);
    request.onEvent?.({type: "semantic.deterministic", value: result.value});
    request.onEvent?.({type: "semantic.resolved", value: result.value});
    recordProvenance(request, result);
    return result;
  }

  request.onProgress?.({phase: "ranking", detail: "Ranking contextual candidates"});
  const candidateList = request.candidates?.length ? request.candidates : (request.context?.vocabulary ?? []);
  const candidates = candidateList.length ? await rankSemanticInputCandidates(request.input, candidateList, modelPolicy(request.policy)) : [];

  if (request.signal?.aborted) {
    request.onEvent?.({type: "semantic.failed", code: "ABORTED"});
    return {
      status: "failed",
      ...(preserveRaw ? {rawInput: request.input} : {}),
      candidates,
      modelOutput: undefined,
      error: {code: "ABORTED", message: "Semantic resolution was aborted."},
    };
  }

  request.onProgress?.({phase: "structured", detail: "Resolving target schema"});
  const needle = new Needle3();
  let rawOutput: unknown;
  try {
    rawOutput = await needle.complete({
      prompt: buildPrompt(request),
      schema: request.schema,
    });
  } catch {
    request.onEvent?.({type: "semantic.failed", code: "MODEL_FAILURE"});
    return {
      status: "failed",
      ...(preserveRaw ? {rawInput: request.input} : {}),
      candidates,
      modelOutput: undefined,
      error: {code: "MODEL_FAILURE", message: "Needle structured resolution failed."},
      provenance: provenance(request, false),
    };
  }

  const modelOutput = unwrapModelOutput(rawOutput);
  if (modelOutput === undefined || modelOutput === null || modelOutput === "") {
    return {
      status: "unresolved",
      ...(preserveRaw ? {rawInput: request.input} : {}),
      candidates,
      modelOutput,
      error: {code: "MODEL_OUTPUT_EMPTY", message: "Needle returned no usable semantic value."},
      provenance: provenance(request, false),
    };
  }

  let value: T | undefined;
  let selectedCandidate: string | undefined;

  if (candidates.length && typeof modelOutput === "string") {
    const exact = candidates.find((candidate) => candidate.value === modelOutput);
    if (exact) {
      value = exact.value as T;
      selectedCandidate = exact.value;
    } else {
      const top = candidates[0];
      const second = candidates[1];
      const minSimilarity = request.minCandidateSimilarity ?? 0.65;
      const minMargin = request.minCandidateMargin ?? 0.15;
      const similarityPass = (top?.similarity ?? -Infinity) >= minSimilarity;
      const margin = second ? (top?.relevance ?? -Infinity) - (second.relevance ?? -Infinity) : Infinity;
      if (top && similarityPass && margin >= minMargin) {
        value = top.value as T;
        selectedCandidate = top.value;
      }
    }
  } else {
    value = modelOutput as T;
  }

  const evidence: SemanticInputEvidence = {
    needleOutput: modelOutput,
    candidates,
    ...(selectedCandidate ? {selectedCandidate} : {}),
    ...(candidates.length ? {
      similarityThreshold: request.minCandidateSimilarity ?? 0.65,
      relevanceMarginThreshold: request.minCandidateMargin ?? 0.15,
    } : {}),
  };

  if (value === undefined || value === null) {
    const result: SemanticInputResolution<T> = {
      status: candidates.length > 0 ? "ambiguous" : "invalid",
      ...(preserveRaw ? {rawInput: request.input} : {}),
      candidates,
      modelOutput,
      evidence,
      ...(() => {
        const clarification = candidates.length > 1 ? clarificationFor(candidates, request.context) : undefined;
        return clarification ? {clarification} : {};
      })(),
      error: candidates.length
        ? {code: "AMBIGUOUS_CANDIDATE", message: "Semantic evidence did not uniquely identify a candidate."}
        : {code: "SCHEMA_MISMATCH", message: "The model output could not be resolved to the target schema."},
      provenance: provenance(request, false),
    };
    request.cache?.set(cacheKey(request), result);
    if (result.status === "ambiguous") {
      request.onEvent?.({type: "semantic.ambiguous", candidates: candidates.map((candidate) => candidate.value)});
      if (result.clarification) request.onEvent?.({type: "semantic.clarification.required", question: result.clarification.question});
    } else {
      request.onEvent?.({type: "semantic.invalid", code: result.error?.code ?? "SCHEMA_MISMATCH"});
    }
    recordProvenance(request, result);
    return result;
  }

  const result: SemanticInputResolution<T> = {
    status: "resolved",
    value,
    ...(preserveRaw ? {rawInput: request.input} : {}),
    candidates,
    modelOutput,
    evidence,
    provenance: provenance(request, false),
    ...(confirmed ? {requiresConfirmation: true} : {}),
  };
  request.cache?.set(cacheKey(request), result);
  request.onProgress?.({phase: "completed"});
  request.onEvent?.({type: "semantic.resolved", value: result.value});
  recordProvenance(request, result);
  return result;
}
