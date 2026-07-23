import { KrnlPolicy } from "./K_LIB_Krnl_Base_Concepts.js";
import { KrnlEndpointAccessPolicy } from "./types.js";
export interface KrnlIntelligenceSpec {
    reasoning: number;
    planning: number;
    toolUsage: number;
    structuredOutput: number;
    jsonStrictness: number;
    coding: number;
    extraction: number;
    classification: number;
    summarization: number;
    creativity: number;
    determinism: number;
    context: number;
    vision: number;
    multimodal: number;
    outputComplexity: number;
}
export interface KrnlEndpointDefinition {
    id: string;
    category: 'krnl_system' | 'app';
    method: 'GET' | 'POST';
    visibility: 'public' | 'private';
    inputSchema: any;
    outputSchema: any;
    description: string;
    systemInstructions: string;
    examples: Array<{
        label?: string;
        input: any;
        output?: any;
    }>;
    examplePayload: any;
    intelligenceSpec: KrnlIntelligenceSpec;
    agentTools: string[];
    retryConfig: KrnlPolicy;
    staticWatchVars: string[];
    dynamicWatchVars: string[];
    accessPolicy: KrnlEndpointAccessPolicy | null;
    emitters: string[];
    sourcePath: string | null;
    memory: string;
    runtimeEdited: boolean;
}
export interface KrnlOrchestratorMemory {
    memory: string;
    lastUpdated: number;
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
export declare const KrnlPlannerSpec: KrnlIntelligenceSpec;
//# sourceMappingURL=K_LIB_Krnl_Ai_Concepts.d.ts.map