import { KrnlPolicy } from "./K_LIB_Krnl_Base_Concepts.js";
import { KrnlEndpointAccessPolicy } from "./types.js";

export type KrnlEndpointGrade =
  | 'endpoint-grade-1'
  | 'endpoint-grade-2'
  | 'endpoint-grade-3'
  | 'endpoint-grade-4'
  | 'endpoint-grade-5';

export type KrnlOrchestratorGrade =
  | 'orchestrator-standard'
  | 'orchestrator-pro';

export interface KrnlAiEndpointConfig {
  enabled: boolean;
  grade?: KrnlEndpointGrade;
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
  grade: KrnlEndpointGrade;
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
  endpointGrade: string;
  orchestratorGrade: string;
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
