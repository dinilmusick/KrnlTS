import { KrnlOrchestratorGrade, KrnlAiExecutionTrace, KrnlEndpointAgentSchema } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "./K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlEndpointAgent } from "./K_LIB_Krnl_Endpoint_Agent.js";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";

export class KrnlApplicationOrchestrator {
  private system: krnlSystemEntityBase;
  private aikoClient: KrnlAikoClient;
  private tracker: KrnlWatchVariablesTracker;
  private scheduler: KrnlEndpointScheduler;
  private grade: KrnlOrchestratorGrade;
  private endpointAgents: Map<string, KrnlEndpointAgent> = new Map();

  constructor(
    system: krnlSystemEntityBase,
    aikoClient: KrnlAikoClient,
    tracker: KrnlWatchVariablesTracker,
    scheduler: KrnlEndpointScheduler,
    grade: KrnlOrchestratorGrade
  ) {
    this.system = system;
    this.aikoClient = aikoClient;
    this.tracker = tracker;
    this.scheduler = scheduler;
    this.grade = grade;
  }

  registerAgent(endpointId: string, agent: KrnlEndpointAgent): void {
    this.endpointAgents.set(endpointId, agent);
  }

  getAgentSummaries(): any[] {
    const list: any[] = [];
    for (const [fid, agent] of this.endpointAgents.entries()) {
      list.push({
        endpointId: fid,
        grade: agent.schema.grade,
        description: agent.schema.description,
        dynamicWatchVars: agent.schema.dynamicWatchVars,
        staticWatchVars: agent.schema.staticWatchVars,
        systemInstructions: agent.schema.systemInstructions
      });
    }
    return list;
  }

  async handle(naturalLanguageRequest: string): Promise<{
    status: string;
    result: any;
    endpointId: string;
    trace: KrnlAiExecutionTrace;
  }> {
    // 1. Select the matching endpoint
    const endpointId = await this.selectEndpoint(naturalLanguageRequest);
    if (!endpointId) {
      throw new Error(`Orchestrator failed to route request: "${naturalLanguageRequest}"`);
    }

    const agent = this.endpointAgents.get(endpointId);
    if (!agent) {
      throw new Error(`Orchestrator routed request to endpoint "${endpointId}", but no endpoint agent is registered.`);
    }

    // 2. Dispatch tasks to scheduler to verify dynamic watch variable exclusion locks
    try {
      const { result, trace } = await this.scheduler.dispatch(endpointId, async () => {
        return await agent.executeFromNaturalLanguage(naturalLanguageRequest);
      });

      // Update telemetry
      if (this.system.telemetry && (this.system.telemetry as any).recordAiTrace) {
        (this.system.telemetry as any).recordAiTrace(trace);
      }

      return {
        status: "success",
        result,
        endpointId,
        trace
      };
    } catch (escalationObj: any) {
      // If endpoint fails retries, escalate
      if (escalationObj.trace && escalationObj.error) {
        console.warn(`[Orchestrator] Endpoint agent "${endpointId}" failed execution. Initiating orchestrator escalation...`);
        return await this.escalate(endpointId, naturalLanguageRequest, escalationObj.error.message, escalationObj.trace);
      }
      throw escalationObj;
    }
  }

  private async selectEndpoint(request: string): Promise<string | null> {
    const systemPrompt = this.buildRoutingPrompt();
    const userPrompt = `User Request: "${request}"\n\nWhich endpoint matches?`;

    try {
      const response = await this.aikoClient.infer(this.grade, systemPrompt, userPrompt);
      const selected = response.trim();

      if (this.endpointAgents.has(selected)) {
        return selected;
      }
      
      // Fallback substring checks
      for (const key of this.endpointAgents.keys()) {
        if (selected.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(selected.toLowerCase())) {
          return key;
        }
      }
    } catch (e) {
      console.error("[Orchestrator] Aiko routing call failed:", e);
    }
    return null;
  }

  private buildRoutingPrompt(): string {
    const summaries = this.getAgentSummaries().map(s => {
      return `- ${s.endpointId}: ${s.description}`;
    }).join("\n");

    return `You are a request router for an application. Your job is to analyze the user's natural language request and select the correct API endpoint name.

Available endpoints:
${summaries}

Response Rules:
Reply with ONLY the exact endpoint name from the list above. Write nothing else. No punctuation, no wrapping.`;
  }

  private async escalate(
    failedEndpointId: string,
    request: string,
    reason: string,
    failedTrace: KrnlAiExecutionTrace
  ): Promise<any> {
    const upgradedGrade = "orchestrator-pro";
    console.log(`[Orchestrator Escalation] Escalating to ${upgradedGrade} model to bypass endpoint failure...`);

    const agent = this.endpointAgents.get(failedEndpointId);
    if (!agent) throw new Error("Agent not found for escalation");

    const liveVars = this.tracker.readLiveVars(failedEndpointId);
    const systemPrompt = `You are the system orchestrator resolving a failure.
Endpoint: ${failedEndpointId}
Purpose: ${agent.schema.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.schema.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

The previous endpoint grade attempt failed with reason: "${reason}".
Your job is to override this, inspect the error, and generate a valid JSON payload matching the input schema.
Output ONLY raw JSON.`;

    const userPrompt = `User Request: "${request}"\n\nGenerate the corrected JSON payload.`;

    try {
      const startTime = Date.now();
      const response = await this.aikoClient.infer(upgradedGrade, systemPrompt, userPrompt);
      let parsedPayload = response.trim();
      if (parsedPayload.startsWith("```")) {
        parsedPayload = parsedPayload.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
      }
      const payload = JSON.parse(parsedPayload);

      // Trigger standard API call
      const result = await this.system.call(failedEndpointId, payload, { unwrap: false });

      // Self-Optimization: Auto-upgrade endpoint grade profile to prevent future regressions
      const currentGrade = agent.schema.grade;
      const index = Number(currentGrade.split("-").pop() || 2);
      const upgradedEndpointGrade = `endpoint-grade-${Math.min(index + 1, 5)}` as any;

      console.log(`[Orchestrator Self-Optimization] Upgrading endpoint "${failedEndpointId}" from ${currentGrade} to ${upgradedEndpointGrade} to prevent regression.`);
      await this.system.call("setEndpointAgentProfile", {
        endpointId: failedEndpointId,
        config: {
          ...agent.schema,
          enabled: true,
          grade: upgradedEndpointGrade
        }
      });

      const totalLatency = Date.now() - startTime;
      const upgradedTrace: KrnlAiExecutionTrace = {
        ...failedTrace,
        traceId: `esc_${failedTrace.traceId}`,
        retryCount: failedTrace.retryCount + 1,
        payload,
        executionResult: result,
        latencyMs: totalLatency,
        endpointGrade: upgradedEndpointGrade,
        failureReason: undefined
      };

      if (this.system.telemetry && (this.system.telemetry as any).recordAiTrace) {
        (this.system.telemetry as any).recordAiTrace(upgradedTrace);
      }

      return {
        status: "success",
        result,
        endpointId: failedEndpointId,
        trace: upgradedTrace
      };
    } catch (e: any) {
      console.error("[Orchestrator Escalation] Escalation failed:", e.message);
      throw e;
    }
  }
}
