import { KrnlEndpointAgentSchema, KrnlAiExecutionTrace } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";

export class KrnlEndpointAgent {
  readonly schema: KrnlEndpointAgentSchema;
  private aikoClient: KrnlAikoClient;
  private tracker: KrnlWatchVariablesTracker;
  private system: krnlSystemEntityBase;

  constructor(
    schema: KrnlEndpointAgentSchema,
    aikoClient: KrnlAikoClient,
    tracker: KrnlWatchVariablesTracker,
    system: krnlSystemEntityBase
  ) {
    this.schema = schema;
    this.aikoClient = aikoClient;
    this.tracker = tracker;
    this.system = system;
  }

  async executeFromNaturalLanguage(
    naturalLanguageRequest: string
  ): Promise<{ result: any; trace: KrnlAiExecutionTrace }> {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();
    const liveVars = this.tracker.readLiveVars(this.schema.functionalityId);

    const startTime = Date.now();
    let aiStartTime = Date.now();
    let aiEndTime = Date.now();

    try {
      const { payload, retryCount, failures, aiTimeMs } = await this.repairLoop(
        naturalLanguageRequest,
        liveVars
      );

      aiEndTime = Date.now();
      const executionStart = Date.now();

      // system.call triggers Zod input/output validation and the execute() pipeline cleanly
      const result = await this.system.call(this.schema.functionalityId, payload, {
        unwrap: false
      });

      const totalLatency = Date.now() - startTime;

      const trace: KrnlAiExecutionTrace = {
        traceId,
        timestamp,
        appName: this.system.entityName,
        endpointId: this.schema.functionalityId,
        endpointGrade: this.schema.grade,
        orchestratorGrade: "orchestrator-standard",
        promptHash: this.getPromptHash(this.buildSystemPrompt(liveVars), naturalLanguageRequest),
        retryCount,
        validationFailures: failures,
        payload,
        executionResult: result,
        latencyMs: totalLatency,
        aiLatencyMs: aiTimeMs
      };

      return { result, trace };

    } catch (error: any) {
      const totalLatency = Date.now() - startTime;
      const trace: KrnlAiExecutionTrace = {
        traceId,
        timestamp,
        appName: this.system.entityName,
        endpointId: this.schema.functionalityId,
        endpointGrade: this.schema.grade,
        orchestratorGrade: "orchestrator-standard",
        promptHash: this.getPromptHash(this.buildSystemPrompt(liveVars), naturalLanguageRequest),
        retryCount: this.schema.retryConfig?.maxRetries || 4,
        validationFailures: [error.message],
        payload: null,
        executionResult: null,
        latencyMs: totalLatency,
        aiLatencyMs: aiEndTime - aiStartTime,
        failureReason: error.message
      };

      throw { error, trace };
    }
  }

  private buildSystemPrompt(liveVars: Record<string, any>): string {
    return `You are an endpoint agent representing the raw endpoint "${this.schema.functionalityId}".
Purpose: ${this.schema.description}
Instructions: ${this.schema.systemInstructions}

Input Schema (JSON Schema format):
${JSON.stringify(this.schema.inputSchema, null, 2)}

Examples:
${JSON.stringify(this.schema.examples, null, 2)}

Current live state variables:
${JSON.stringify(liveVars, null, 2)}

Your primary job is to extract, convert, or infer parameters from user requests to produce a valid JSON payload matching the input schema.
Output ONLY raw, pure JSON. Do not write explanations, markdown blocks, formatting or wrapping.`;
  }

  private parsePayload(aiResponse: string): any {
    let cleaned = aiResponse.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
    }
    return JSON.parse(cleaned.trim());
  }

  private validatePayload(payload: any): { valid: boolean; error?: string } {
    const functionality = this.system.localFunctionalities.get(this.schema.functionalityId);
    if (!functionality || !functionality.schema || !functionality.schema.input) {
      return { valid: true };
    }

    try {
      const schemaInput = functionality.schema.input;
      if (typeof schemaInput.parse === 'function') {
        schemaInput.parse(payload);
      } else if (typeof schemaInput === 'function') {
        if (!schemaInput(payload)) throw new Error("Input validation check returned false.");
      }
      return { valid: true };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  private async repairLoop(
    request: string,
    liveVars: Record<string, any>
  ): Promise<{ payload: any; retryCount: number; failures: string[]; aiTimeMs: number }> {
    const maxRetries = this.schema.retryConfig?.maxRetries || 4;
    const failures: string[] = [];
    let systemPrompt = this.buildSystemPrompt(liveVars);
    let userPrompt = request;
    let aiTimeAccumulator = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const aiCallStart = Date.now();
      let aiResponse = "";
      try {
        aiResponse = await this.aikoClient.infer(this.schema.grade, systemPrompt, userPrompt);
      } catch (err: any) {
        aiTimeAccumulator += Date.now() - aiCallStart;
        failures.push(`Aiko connection failure: ${err.message}`);
        if (attempt === maxRetries) {
          throw new Error(`Endpoint agent execution failed after connection errors. Last: ${err.message}`);
        }
        continue;
      }
      aiTimeAccumulator += Date.now() - aiCallStart;

      try {
        const payload = this.parsePayload(aiResponse);
        const valResult = this.validatePayload(payload);
        if (valResult.valid) {
          return { payload, retryCount: attempt, failures, aiTimeMs: aiTimeAccumulator };
        } else {
          failures.push(`Validation attempt ${attempt} failed: ${valResult.error}`);
          userPrompt = `${request}\n\nValidation error from previous output:\n${valResult.error}\n\nPlease generate a corrected payload.`;
        }
      } catch (e: any) {
        failures.push(`JSON Parse attempt ${attempt} failed: ${e.message}`);
        userPrompt = `${request}\n\nInvalid JSON from previous output:\n${e.message}\n\nPlease output clean, valid JSON matching the schema.`;
      }

      if (attempt === maxRetries) {
        throw new Error(`Endpoint agent validation failed after ${maxRetries} retries: ${failures.join(" | ")}`);
      }
    }

    throw new Error("Validation retries exhausted");
  }

  private getPromptHash(system: string, user: string): string {
    let hash = 0;
    const combined = system + user;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash)}`;
  }
}
