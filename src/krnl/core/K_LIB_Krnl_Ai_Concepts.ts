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

export interface KrnlAiEndpointConfig {
  enabled: boolean;
  intelligenceSpec?: KrnlIntelligenceSpec;
  description?: string;
  systemInstructions?: string;
  staticWatchVars?: string[];
  dynamicWatchVars?: string[];
  retryConfig?: Partial<KrnlPolicy>;
  examples?: any[];
}

export interface KrnlEndpointAgentSchema {
  functionalityId: string;
  description: string;
  inputSchema: any;           // JSON Schema resolved from Zod via zodToJsonSchema
  outputSchema: any;
  examples: any[];
  systemInstructions: string;
  intelligenceSpec: KrnlIntelligenceSpec;
  retryConfig: KrnlPolicy;
  staticWatchVars: string[];
  dynamicWatchVars: string[];
  permissions: KrnlEndpointAccessPolicy | null;
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

