import { KrnlPolicy } from "./K_LIB_Krnl_Base_Concepts.js";
import { KrnlEndpointAccessPolicy } from "./types.js";

export interface KrnlIntelligenceSpec {
  reasoning: number;         // 0-10
  planning: number;          // 0-10
  toolUsage: number;         // 0-10
  structuredOutput: number;  // 0-10
  jsonStrictness: number;    // 0-10
  coding: number;            // 0-10
  extraction: number;        // 0-10
  classification: number;    // 0-10
  summarization: number;     // 0-10
  creativity: number;        // 0-10
  determinism: number;       // 0-10
  context: number;           // 0-10
  vision: number;            // 0-10
  multimodal: number;        // 0-10
  outputComplexity: number;  // 0-10
}

export interface KrnlEndpointDefinition {
  // ── Identity ────────────────────────────────
  id: string;
  category: 'krnl_system' | 'app';   // system endpoints vs. user app endpoints

  // ── Protocol ────────────────────────────────
  method: 'GET' | 'POST';
  visibility: 'public' | 'private';

  // ── Schemas ─────────────────────────────────
  inputSchema: any;    // zodToJsonSchema serialized, or {} if none
  outputSchema: any;

  // ── Natural Language Metadata ────────────────
  description: string;            // NL: when/why/what this endpoint does
  systemInstructions: string;     // Prompt override injected into EP agent

  // ── Examples ────────────────────────────────
  examples: Array<{ label?: string; input: any; output?: any }>;
  examplePayload: any;            // Quick-fill single example for the frontend

  // ── Agent Configuration ─────────────────────
  intelligenceSpec: KrnlIntelligenceSpec;
  agentTools: string[];           // Tool IDs available to this EP's agent
                                  // (built-ins always injected; this adds app-specific)
  retryConfig: KrnlPolicy;

  // ── Context / Watch Variables ────────────────
  staticWatchVars: string[];
  dynamicWatchVars: string[];

  // ── Access Control ───────────────────────────
  accessPolicy: KrnlEndpointAccessPolicy | null;

  // ── Emitters / Events ────────────────────────
  emitters: string[];             // emitter IDs registered on this endpoint
  sourcePath: string | null;

  // ── Persistent Memory ────────────────────────
  memory: string;                 // Orchestrator-written learnings for this EP
                                  // (freeform text; injected into EP agent context)

  // ── Runtime State ────────────────────────────
  runtimeEdited: boolean;         // true if any field has been overridden in KrnlRuntimeStore
}

export interface KrnlOrchestratorMemory {
  memory: string;         // Freeform learnings written by the orchestrator
  lastUpdated: number;    // timestamp
}

export interface KrnlAiExecutionTrace {
  traceId: string;
  parentTraceId?: string;
  timestamp: number;
  appName: string;
  endpointId: string;
  intelligenceSpec: KrnlIntelligenceSpec;
  promptHash: string;
  retryCount: number;
  validationFailures: string[];
  payload: any;
  executionResult: any;
  latencyMs: number;
  aiLatencyMs: number;
  failureReason?: string;
}

export interface KrnlWatchVariable {
  key: string;
  functionalityId: string;
  isStatic: boolean;
  currentValue: any;
}

export type KrnlTaskStatus = 'pending' | 'running' | 'done' | 'skipped';

export interface KrnlTask {
  id: string;
  endpointId: string;
  prompt: string;
  status: KrnlTaskStatus;
  parentTaskId?: string;
  nestingDepth: number;
  result?: any;
}

export interface KrnlLearning {
  id: string;
  concernedEndpoint: string;
  problemDescription: string;
  tags: string[];
  solution: string;
  createdAt: number;
}

export const KrnlPlannerSpec: KrnlIntelligenceSpec = {
  reasoning: 9,
  planning: 10,
  toolUsage: 8,
  structuredOutput: 9,
  jsonStrictness: 8,
  coding: 2,
  extraction: 6,
  classification: 5,
  summarization: 5,
  creativity: 3,
  determinism: 7,
  context: 8,
  vision: 1,
  multimodal: 1,
  outputComplexity: 6
};


