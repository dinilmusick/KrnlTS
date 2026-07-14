import { KrnlIntelligenceSpec, KrnlAiExecutionTrace } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "./K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlEndpointAgent } from "./K_LIB_Krnl_Endpoint_Agent.js";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
import { KrnlRuntimeStore } from "./K_LIB_Krnl_Runtime_Store.js";

export class KrnlApplicationOrchestrator {
  private system: krnlSystemEntityBase;
  private aikoClient: KrnlAikoClient;
  private tracker: KrnlWatchVariablesTracker;
  private scheduler: KrnlEndpointScheduler;
  private routingSpec: KrnlIntelligenceSpec;
  private escalationSpec: KrnlIntelligenceSpec;
  private endpointAgents: Map<string, KrnlEndpointAgent> = new Map();
  private store: KrnlRuntimeStore;

  constructor(
    system: krnlSystemEntityBase,
    aikoClient: KrnlAikoClient,
    tracker: KrnlWatchVariablesTracker,
    scheduler: KrnlEndpointScheduler,
    routingSpec: KrnlIntelligenceSpec,
    escalationSpec: KrnlIntelligenceSpec,
    store: KrnlRuntimeStore
  ) {
    this.system = system;
    this.aikoClient = aikoClient;
    this.tracker = tracker;
    this.scheduler = scheduler;
    this.routingSpec = routingSpec;
    this.escalationSpec = escalationSpec;
    this.store = store;
  }

  registerAgent(endpointId: string, agent: KrnlEndpointAgent): void {
    this.endpointAgents.set(endpointId, agent);
  }

  getAgentSummaries(): any[] {
    const list: any[] = [];
    for (const [fid, agent] of this.endpointAgents.entries()) {
      list.push({
        endpointId: fid,
        intelligenceSpec: agent.definition.intelligenceSpec,
        description: agent.definition.description,
        dynamicWatchVars: agent.definition.dynamicWatchVars,
        staticWatchVars: agent.definition.staticWatchVars,
        systemInstructions: agent.definition.systemInstructions
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
        const badModelId = this.aikoClient.lastUsedModelId;
        if (badModelId) {
          console.log(`[Orchestrator] Model ${badModelId} failed to satisfy requirements. Submitting downrank report to Aiko...`);
          await this.aikoClient.downrankModel(badModelId);
        }
        return await this.escalate(endpointId, naturalLanguageRequest, escalationObj.error.message, escalationObj.trace);
      }
      throw escalationObj;
    }
  }

  private async selectEndpoint(request: string): Promise<string | null> {
    const orchMem = await this.store.getOrchestratorMemory();
    const systemPrompt = this.buildRoutingPrompt(orchMem.memory);
    const userPrompt = `User Request: "${request}"\n\nWhich endpoint matches?`;

    try {
      const response = await this.aikoClient.infer(this.routingSpec, systemPrompt, userPrompt);
      const selected = response.trim();

      // Record this decision into orchestrator memory
      const logMsg = `Routed request "${request}" to "${selected}" at ${new Date().toISOString()}`;
      const updatedMem = orchMem.memory ? orchMem.memory + "\n" + logMsg : logMsg;
      // Cap memory size to prevent infinite growth (keep last 20 actions)
      const memLines = updatedMem.split("\n").slice(-20).join("\n");
      await this.store.setOrchestratorMemory(memLines);

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

  private buildRoutingPrompt(orchestratorMemory: string): string {
    const summaries = this.getAgentSummaries().map(s => {
      return `- ${s.endpointId}: ${s.description}`;
    }).join("\n");

    return `You are a request router for an application. Your job is to analyze the user's natural language request and select the correct API endpoint name.

Available endpoints:
${summaries}

Orchestrator Memory (recent routing history & learnings):
${orchestratorMemory || "No routing decisions recorded yet."}

Response Rules:
Reply with ONLY the exact endpoint name from the list above. Write nothing else. No punctuation, no wrapping.`;
  }

  private async escalate(
    failedEndpointId: string,
    request: string,
    reason: string,
    failedTrace: KrnlAiExecutionTrace
  ): Promise<any> {
    console.log(`[Orchestrator Escalation] Escalating to escalationSpec model to bypass endpoint failure...`);

    const agent = this.endpointAgents.get(failedEndpointId);
    if (!agent) throw new Error("Agent not found for escalation");

    const liveVars = this.tracker.readLiveVars(failedEndpointId);
    const systemPrompt = `You are the system orchestrator resolving a failure.
Endpoint: ${failedEndpointId}
Purpose: ${agent.definition.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.definition.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

The previous attempt failed with reason: "${reason}".
Your job is to override this, inspect the error, and generate a valid JSON payload matching the input schema.
Output ONLY raw JSON.`;

    const userPrompt = `User Request: "${request}"\n\nGenerate the corrected JSON payload.`;

    try {
      const startTime = Date.now();
      const response = await this.aikoClient.infer(this.escalationSpec, systemPrompt, userPrompt);
      let parsedPayload = response.trim();
      if (parsedPayload.startsWith("```")) {
        parsedPayload = parsedPayload.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
      }
      const payload = JSON.parse(parsedPayload);

      // Trigger standard API call
      const result = await this.system.call(failedEndpointId, payload, { unwrap: false });

      // Save a learning memory to the endpoint memory slot
      const learning = `Request "${request}" failed due to "${reason}". Resolved with payload: ${JSON.stringify(payload)}`;
      await this.store.appendEndpointMemory(failedEndpointId, learning);

      // Self-Optimization: Auto-upgrade endpoint intelligence spec to prevent future regressions
      const currentSpec = agent.definition.intelligenceSpec;
      const upgradedSpec: KrnlIntelligenceSpec = { ...currentSpec };
      // Boost core metrics to increase capability for subsequent runs
      if (upgradedSpec.reasoning < 10) upgradedSpec.reasoning += 1;
      if (upgradedSpec.planning < 10) upgradedSpec.planning += 1;
      if (upgradedSpec.jsonStrictness < 10) upgradedSpec.jsonStrictness += 1;

      console.log(`[Orchestrator Self-Optimization] Upgrading endpoint "${failedEndpointId}" intelligence requirements to prevent regression.`);
      
      const defOverride = await this.store.getEndpointDefinition(failedEndpointId) || {};
      defOverride.intelligenceSpec = upgradedSpec;
      await this.store.setEndpointDefinition(failedEndpointId, defOverride);

      // Trigger reload of AI layers in system
      if (typeof (this.system as any).initializeAiLayer === "function") {
        await (this.system as any).initializeAiLayer(this.system._entityDataDir);
      }

      const totalLatency = Date.now() - startTime;
      const upgradedTrace: KrnlAiExecutionTrace = {
        ...failedTrace,
        traceId: `esc_${failedTrace.traceId}`,
        retryCount: failedTrace.retryCount + 1,
        payload,
        executionResult: result,
        latencyMs: totalLatency,
        intelligenceSpec: upgradedSpec,
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
      const learning = `Request "${request}" failed due to "${reason}". Escalation also failed with "${e.message}".`;
      await this.store.appendEndpointMemory(failedEndpointId, learning);
      throw e;
    }
  }
}
