import { KrnlPlannerSpec } from "./K_LIB_Krnl_Ai_Concepts.js";
import { createTaskListTool } from "./K_LIB_Krnl_Task_Runner.js";
export class KrnlPlannerAgent {
    aikoClient;
    system;
    runner;
    tool;
    constructor(aikoClient, system, runner) {
        this.aikoClient = aikoClient;
        this.system = system;
        this.runner = runner;
        this.tool = createTaskListTool(runner);
    }
    async plan(naturalLanguageRequest, contextData = "") {
        const endpoints = this.system._aiOrchestrator.getAgentSummaries().map((s) => {
            return `- ${s.endpointId}: ${s.description}`;
        }).join("\n");
        const systemPrompt = `respond: caveman/pseudo-code/math only. no NL filler. use symbols for flow (→,∩,≥,|). output=json unless signal.
You are a task planner agent. Your spec: reasoning=9, planning=10.
Goal: produce a sequential list of steps/tasks needed to fulfill the request.

Available endpoints:
${endpoints}

Available tools:
- ${this.tool.id}: ${this.tool.description}
  Schema: ${JSON.stringify(this.tool.schema)}
  Examples: ${JSON.stringify(this.tool.examples)}

Rules:
1. Output ONLY tool calls or structured plans.
2. If you need more information or context from the host entity/orchestrator before planning, emit:
   {"_krnlSignal": "QUERY_ORCHESTRATOR", "query": "caveman query for info"}
3. Otherwise, use taskListTool to create the task list. Call it via a JSON payload.

Current Context:
${contextData || "None"}
`;
        const userPrompt = `Request: "${naturalLanguageRequest}"
Generate the plan or query context.`;
        const response = await this.aikoClient.infer(KrnlPlannerSpec, systemPrompt, userPrompt);
        let parsed = response.trim();
        if (parsed.startsWith("```")) {
            parsed = parsed.replace(/^```(json)?\n/, "").replace(/\n```$/, "").trim();
        }
        try {
            const data = JSON.parse(parsed);
            // Check query signal
            if (data && typeof data === 'object' && data._krnlSignal === 'QUERY_ORCHESTRATOR') {
                // Return this query signal directly
                return data;
            }
            // Execute the taskListTool action
            if (data && data.action === 'create' && data.tasks) {
                await this.tool.execute(data);
                const list = this.runner.getTaskList();
                if (list)
                    return list;
            }
        }
        catch (e) {
            console.warn("[PlannerAgent] Failed to parse response as JSON tool call. Parsing list manually from string.");
        }
        // Fallback: If AI returned a raw JSON list instead of calling the tool
        try {
            const data = JSON.parse(parsed);
            if (Array.isArray(data)) {
                await this.tool.execute({ action: 'create', tasks: data });
                const list = this.runner.getTaskList();
                if (list)
                    return list;
            }
        }
        catch (e) { }
        throw new Error(`Planner Agent failed to generate a valid plan. Raw output: ${response}`);
    }
}
//# sourceMappingURL=K_LIB_Krnl_Planner_Agent.js.map