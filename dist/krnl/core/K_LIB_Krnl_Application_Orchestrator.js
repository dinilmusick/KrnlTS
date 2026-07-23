import { KrnlTaskRunner } from "./K_LIB_Krnl_Task_Runner.js";
import { KrnlPlannerAgent } from "./K_LIB_Krnl_Planner_Agent.js";
export class KrnlApplicationOrchestrator {
    system;
    aikoClient;
    tracker;
    scheduler;
    routingSpec;
    escalationSpec;
    endpointAgents = new Map();
    store;
    taskRunner;
    plannerAgent;
    constructor(system, aikoClient, tracker, scheduler, routingSpec, escalationSpec, store) {
        this.system = system;
        this.aikoClient = aikoClient;
        this.tracker = tracker;
        this.scheduler = scheduler;
        this.routingSpec = routingSpec;
        this.escalationSpec = escalationSpec;
        this.store = store;
        this.taskRunner = new KrnlTaskRunner(system);
        this.plannerAgent = new KrnlPlannerAgent(aikoClient, system, this.taskRunner);
    }
    registerAgent(endpointId, agent) {
        this.endpointAgents.set(endpointId, agent);
    }
    getAgentSummaries() {
        const list = [];
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
    async handle(naturalLanguageRequest) {
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
            if (this.system.telemetry && this.system.telemetry.recordAiTrace) {
                this.system.telemetry.recordAiTrace(trace);
            }
            return {
                status: "success",
                result,
                endpointId,
                trace
            };
        }
        catch (escalationObj) {
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
    async selectEndpoint(request) {
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
        }
        catch (e) {
            console.error("[Orchestrator] Aiko routing call failed:", e);
        }
        return null;
    }
    buildRoutingPrompt(orchestratorMemory) {
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
    async escalate(failedEndpointId, request, reason, failedTrace) {
        console.log(`[Orchestrator Escalation] Escalating to escalationSpec model to bypass endpoint failure...`);
        const agent = this.endpointAgents.get(failedEndpointId);
        if (!agent)
            throw new Error("Agent not found for escalation");
        const liveVars = this.tracker.readLiveVars(failedEndpointId);
        // Feature 2: Structured learnings search
        const inferredTags = this._inferTagsFromError(reason);
        const priorLearnings = await this.store.searchLearnings(failedEndpointId, inferredTags);
        const learningsPrompt = priorLearnings.map(l => `prior-learning: prob="${l.problemDescription}" tags=${l.tags.join(",")} sol="${l.solution}"`).join("\n");
        const systemPrompt = `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (→,∩,≥,|). output=json unless signal.
You are the system orchestrator resolving a failure.
Endpoint: ${failedEndpointId}
Purpose: ${agent.definition.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.definition.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

Prior learnings on failures:
${learningsPrompt || "none"}

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
            // Save a learning memory in structured format
            const learning = {
                id: `learn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                concernedEndpoint: failedEndpointId,
                problemDescription: this._compressToLearningField(reason),
                tags: inferredTags,
                solution: this._compressToLearningField(`corrected payload: ${JSON.stringify(payload)}`),
                createdAt: Date.now()
            };
            await this.store.appendLearning(learning);
            // Self-Optimization: Auto-upgrade endpoint intelligence spec to prevent future regressions
            const currentSpec = agent.definition.intelligenceSpec;
            const upgradedSpec = { ...currentSpec };
            // Boost core metrics to increase capability for subsequent runs
            if (upgradedSpec.reasoning < 10)
                upgradedSpec.reasoning += 1;
            if (upgradedSpec.planning < 10)
                upgradedSpec.planning += 1;
            if (upgradedSpec.jsonStrictness < 10)
                upgradedSpec.jsonStrictness += 1;
            console.log(`[Orchestrator Self-Optimization] Upgrading endpoint "${failedEndpointId}" intelligence requirements to prevent regression.`);
            const defOverride = await this.store.getEndpointDefinition(failedEndpointId) || {};
            defOverride.intelligenceSpec = upgradedSpec;
            await this.store.setEndpointDefinition(failedEndpointId, defOverride);
            // Trigger reload of AI layers in system
            if (typeof this.system.initializeAiLayer === "function") {
                await this.system.initializeAiLayer(this.system._entityDataDir);
            }
            const totalLatency = Date.now() - startTime;
            const upgradedTrace = {
                ...failedTrace,
                traceId: `esc_${failedTrace.traceId}`,
                retryCount: failedTrace.retryCount + 1,
                payload,
                executionResult: result,
                latencyMs: totalLatency,
                intelligenceSpec: upgradedSpec,
                failureReason: undefined
            };
            if (this.system.telemetry && this.system.telemetry.recordAiTrace) {
                this.system.telemetry.recordAiTrace(upgradedTrace);
            }
            return {
                status: "success",
                result,
                endpointId: failedEndpointId,
                trace: upgradedTrace
            };
        }
        catch (e) {
            console.error("[Orchestrator Escalation] Escalation failed:", e.message);
            throw e;
        }
    }
    // Feature 1: Orchestration Entrypoints
    async orchestrate(naturalLanguageRequest) {
        console.log(`[Orchestrator] Planning autonomous task execution for: "${naturalLanguageRequest}"`);
        const taskList = await this.plannerAgent.plan(naturalLanguageRequest);
        if (this.store) {
            await taskList.persist(this.store);
        }
        await this.taskRunner.run(taskList);
    }
    async handleQuery(query, context) {
        console.log(`[Orchestrator] Endpoint agent requested data query: "${query}"`);
        // Ask planner to plan nested tasks
        const nestedList = await this.plannerAgent.plan(query, `Context: Parent task ${context.taskId} (${context.endpointId})`);
        await this.taskRunner.receiveNest(nestedList.tasks.map(t => ({ endpointId: t.endpointId, prompt: t.prompt })), context.taskId);
    }
    _inferTagsFromError(reason) {
        const clean = reason.toLowerCase();
        const tags = [];
        if (clean.includes("validation") || clean.includes("zod"))
            tags.push("validation");
        if (clean.includes("json") || clean.includes("parse"))
            tags.push("json-parse");
        if (clean.includes("missing") || clean.includes("required"))
            tags.push("missing-field");
        if (clean.includes("type"))
            tags.push("type-mismatch");
        if (clean.includes("network") || clean.includes("fetch") || clean.includes("http"))
            tags.push("network");
        return tags;
    }
    _compressToLearningField(text) {
        return text
            .toLowerCase()
            .replace(/\b(the|a|an|and|or|but|is|are|was|were|be|been|being|to|from|by|for|with|about|against|between|into|through|during|before|after|above|below|to|of|at|by|under|over|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|s|t|can|will|just|don|should|now)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async escalateTaskFailure(taskId, errorReason) {
        const list = this.taskRunner.getTaskList();
        if (!list)
            return;
        const task = list.tasks.find(t => t.id === taskId);
        if (!task)
            return;
        console.warn(`[Orchestrator] Task ${taskId} failed. Attempting automated resolution...`);
        const agent = this.endpointAgents.get(task.endpointId);
        if (!agent) {
            this.escalateToHuman(taskId, `Agent not found for ${task.endpointId}`);
            return;
        }
        const inferredTags = this._inferTagsFromError(errorReason);
        const priorLearnings = await this.store.searchLearnings(task.endpointId, inferredTags);
        const liveVars = this.tracker.readLiveVars(task.endpointId);
        // Inject prior learnings in caveman format into prompt
        const learningsPrompt = priorLearnings.map(l => `prior-learning: prob="${l.problemDescription}" tags=${l.tags.join(",")} sol="${l.solution}"`).join("\n");
        const systemPrompt = `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (→,∩,≥,|). output=json unless signal.
You are the system orchestrator resolving a failure.
Endpoint: ${task.endpointId}
Purpose: ${agent.definition.description}
Input Schema (JSON Schema):
${JSON.stringify(agent.definition.inputSchema)}
Live state variables:
${JSON.stringify(liveVars)}

Prior learnings on failures:
${learningsPrompt || "none"}

The previous attempt failed with reason: "${errorReason}".
Your job is to override this, inspect the error, and generate a valid JSON payload matching the input schema.
Output ONLY raw JSON.`;
        const userPrompt = `Task Prompt: "${task.prompt}"\n\nGenerate corrected JSON payload.`;
        try {
            const response = await this.aikoClient.infer(this.escalationSpec, systemPrompt, userPrompt);
            let parsedPayload = response.trim();
            if (parsedPayload.startsWith("```")) {
                parsedPayload = parsedPayload.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
            }
            const payload = JSON.parse(parsedPayload);
            // Trigger standard API call
            const result = await this.system.call(task.endpointId, payload, { unwrap: false });
            // Save a learning memory in structured format
            const learning = {
                id: `learn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                concernedEndpoint: task.endpointId,
                problemDescription: this._compressToLearningField(errorReason),
                tags: inferredTags,
                solution: this._compressToLearningField(`corrected payload: ${JSON.stringify(payload)}`),
                createdAt: Date.now()
            };
            await this.store.appendLearning(learning);
            // Auto-upgrade spec
            const currentSpec = agent.definition.intelligenceSpec;
            const upgradedSpec = { ...currentSpec };
            if (upgradedSpec.reasoning < 10)
                upgradedSpec.reasoning += 1;
            if (upgradedSpec.planning < 10)
                upgradedSpec.planning += 1;
            if (upgradedSpec.jsonStrictness < 10)
                upgradedSpec.jsonStrictness += 1;
            const defOverride = await this.store.getEndpointDefinition(task.endpointId) || {};
            defOverride.intelligenceSpec = upgradedSpec;
            await this.store.setEndpointDefinition(task.endpointId, defOverride);
            if (typeof this.system.initializeAiLayer === "function") {
                await this.system.initializeAiLayer(this.system._entityDataDir);
            }
            console.log(`[Orchestrator] Automated resolution succeeded for task ${taskId}.`);
            await this.taskRunner.onSuccess(taskId, result);
        }
        catch (e) {
            console.error(`[Orchestrator] Automated resolution failed: ${e.message}. Escalating to human...`);
            await this.escalateToHuman(taskId, errorReason);
        }
    }
    async escalateToHuman(taskId, errorReason) {
        console.warn(`[HUMAN_ESCALATION] Task ${taskId} cannot be resolved automatically. Reason: ${errorReason}`);
        // Emit event on entity so external hosts/tests can capture and supply input
        this.system.interface.getEmitter('system-events')?.pushDataStreamToEmitter({
            type: 'needs-human',
            taskId,
            error: errorReason
        });
    }
    async handleHumanResolution(taskId, resolution) {
        console.log(`[Orchestrator] Human resolution received for task ${taskId}: ${resolution.action}`);
        if (resolution.action === 'skip') {
            await this.taskRunner.receiveSkip(taskId);
        }
        else if (resolution.action === 'nest' && resolution.tasks) {
            await this.taskRunner.receiveNest(resolution.tasks, taskId);
        }
        else {
            const list = this.taskRunner.getTaskList();
            if (list) {
                await this.taskRunner.run(list);
            }
        }
    }
}
//# sourceMappingURL=K_LIB_Krnl_Application_Orchestrator.js.map