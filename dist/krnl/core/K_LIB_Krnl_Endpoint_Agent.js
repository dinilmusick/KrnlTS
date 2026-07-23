export class KrnlEndpointAgent {
    definition;
    aikoClient;
    tracker;
    system;
    tools;
    constructor(definition, aikoClient, tracker, system, tools = {}) {
        this.definition = definition;
        this.aikoClient = aikoClient;
        this.tracker = tracker;
        this.system = system;
        this.tools = tools;
    }
    async executeFromNaturalLanguage(naturalLanguageRequest) {
        const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const timestamp = Date.now();
        const liveVars = this.tracker.readLiveVars(this.definition.id);
        const startTime = Date.now();
        let aiStartTime = Date.now();
        let aiEndTime = Date.now();
        try {
            const { payload, retryCount, failures, aiTimeMs } = await this.repairLoop(naturalLanguageRequest, liveVars);
            aiEndTime = Date.now();
            const executionStart = Date.now();
            // system.call triggers Zod input/output validation and the execute() pipeline cleanly
            const result = await this.system.call(this.definition.id, payload, {
                unwrap: false
            });
            const totalLatency = Date.now() - startTime;
            const trace = {
                traceId,
                timestamp,
                appName: this.system.entityName,
                endpointId: this.definition.id,
                intelligenceSpec: this.definition.intelligenceSpec,
                promptHash: this.getPromptHash(this.buildSystemPrompt(liveVars), naturalLanguageRequest),
                retryCount,
                validationFailures: failures,
                payload,
                executionResult: result,
                latencyMs: totalLatency,
                aiLatencyMs: aiTimeMs
            };
            return { result, trace };
        }
        catch (error) {
            const totalLatency = Date.now() - startTime;
            const trace = {
                traceId,
                timestamp,
                appName: this.system.entityName,
                endpointId: this.definition.id,
                intelligenceSpec: this.definition.intelligenceSpec,
                promptHash: this.getPromptHash(this.buildSystemPrompt(liveVars), naturalLanguageRequest),
                retryCount: this.definition.retryConfig?.maxRetries || 4,
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
    buildSystemPrompt(liveVars) {
        const toolsDesc = Object.entries(this.tools)
            .map(([name, tool]) => {
            const schemaStr = tool.schema ? `\n  Schema: ${JSON.stringify(tool.schema)}` : "";
            const examplesStr = tool.examples ? `\n  Examples: ${JSON.stringify(tool.examples)}` : "";
            return `- ${name}: ${tool.description || "Agent helper tool"}${schemaStr}${examplesStr}`;
        })
            .join("\n");
        return `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (→,∩,≥,|). output=json unless signal.
You are an endpoint agent representing the raw endpoint "${this.definition.id}".
Purpose: ${this.definition.description}
Instructions: ${this.definition.systemInstructions}
Intelligence Capability Spec: ${JSON.stringify(this.definition.intelligenceSpec)}

Input Schema (JSON Schema format):
${JSON.stringify(this.definition.inputSchema, null, 2)}

Examples:
${JSON.stringify(this.definition.examples, null, 2)}

Current live state variables:
${JSON.stringify(liveVars, null, 2)}

Endpoint Memory (learned experiences from prior executions):
${this.definition.memory || "No prior memories recorded yet."}

Available Tools (you can call these internally if needed):
${toolsDesc}

Your primary job is to extract, convert, or infer parameters from user requests to produce a valid JSON payload matching the input schema.
Output ONLY raw, pure JSON. Do not write explanations, markdown blocks, formatting or wrapping.`;
    }
    parsePayload(aiResponse) {
        let cleaned = aiResponse.trim();
        // Strip markdown code fences if present at boundary
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
        }
        cleaned = cleaned.trim();
        try {
            return JSON.parse(cleaned);
        }
        catch (err) {
            const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                try {
                    return JSON.parse(match[0].trim());
                }
                catch (e) {
                    // ignore, throw original
                }
            }
            throw err;
        }
    }
    validatePayload(payload) {
        const functionality = this.system.localFunctionalities.get(this.definition.id);
        if (!functionality || !functionality.schema || !functionality.schema.input) {
            return { valid: true };
        }
        try {
            const schemaInput = functionality.schema.input;
            if (typeof schemaInput.verify === 'function') {
                const verifyError = schemaInput.verify(payload);
                if (verifyError) {
                    throw new Error(`Protobuf verification failed: ${verifyError}`);
                }
            }
            else if (typeof schemaInput.parse === 'function') {
                schemaInput.parse(payload);
            }
            else if (typeof schemaInput === 'function') {
                if (!schemaInput(payload))
                    throw new Error("Input validation check returned false.");
            }
            return { valid: true };
        }
        catch (e) {
            return { valid: false, error: e.message };
        }
    }
    async repairLoop(request, liveVars) {
        const maxRetries = this.definition.retryConfig?.maxRetries || 4;
        const failures = [];
        let systemPrompt = this.buildSystemPrompt(liveVars);
        let userPrompt = request;
        let aiTimeAccumulator = 0;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const aiCallStart = Date.now();
            let aiResponse = "";
            try {
                aiResponse = await this.aikoClient.infer(this.definition.intelligenceSpec, systemPrompt, userPrompt);
            }
            catch (err) {
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
                }
                else {
                    failures.push(`Validation attempt ${attempt} failed: ${valResult.error}`);
                    userPrompt = `${request}\n\nValidation error from previous output:\n${valResult.error}\n\nPlease generate a corrected payload.`;
                }
            }
            catch (e) {
                failures.push(`JSON Parse attempt ${attempt} failed: ${e.message}`);
                userPrompt = `${request}\n\nInvalid JSON from previous output:\n${e.message}\n\nPlease output clean, valid JSON matching the schema.`;
            }
            if (attempt === maxRetries) {
                throw new Error(`Endpoint agent validation failed after ${maxRetries} retries: ${failures.join(" | ")}`);
            }
        }
        throw new Error("Validation retries exhausted");
    }
    getPromptHash(system, user) {
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
//# sourceMappingURL=K_LIB_Krnl_Endpoint_Agent.js.map