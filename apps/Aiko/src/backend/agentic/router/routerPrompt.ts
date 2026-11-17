/**
 * ASCII Architecture Flowchart: routerPrompt
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize routerPrompt      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │    buildCapabilityGatePrompt     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            isEndpoint            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              defStr              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: ROUTER PROMPT BUILDERS ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { RouterInput } from '../types.js';

export function buildCapabilityGatePrompt(input: RouterInput): string {
  const { task, level, definitions, examples, context } = input;
  const isEndpoint = level === 'ENDPOINT';
  const defStr = definitions ? JSON.stringify(definitions, null, 2) : 'None';
  const exStr = examples ? JSON.stringify(examples, null, 2) : 'None';
  const ctxStr = context.dependencyResults ? JSON.stringify(context.dependencyResults, null, 2) : 'None';
  const goalsStr = (task.goals || []).map(g => `- ${g.description}`).join('\n');

  const targetLabel = definitions?.name
    ? (isEndpoint ? `Feature "${definitions.name}" in Tool "${context.toolDefinition?.name || ''}"` : `Tool "${definitions.name}"`)
    : '';

  return `You are the AIKO ${level} Router (Semantic & Capability Gate).
Target: ${targetLabel}
Your job is to determine whether this task can be meaningfully fulfilled with available information and capabilities.

RULES:
1. Inspect the natural-language task description and goals.
2. Inspect definitions, examples, and available context.
3. Determine decision: "SUFFICIENT" or "INSUFFICIENT".
4. If missing essential information, decision MUST be "INSUFFICIENT" with list of missing items.
5. Do NOT construct final endpoint payload. Do NOT perform Zod validation.
6. Output valid JSON ONLY.

TARGET DEFINITIONS:
${defStr}

EXAMPLES:
${exStr}

AVAILABLE CONTEXT / DEPENDENCY DATA:
${ctxStr}

TASK:
Description: "${task.description}"
Goals:
${goalsStr}

Output format:
\`\`\`json
{
  "decision": "SUFFICIENT" | "INSUFFICIENT",
  "reasoning": "Explanation of feasibility",
  "missing": [
    { "key": "field", "description": "What is missing", "expectedType": "string", "required": true }
  ]
}
\`\`\``;
}

export function buildToolRouterPrompt(input: RouterInput): string {
  const { message, availableTargets } = input;
  const targetsSummary = (availableTargets || []).map(t =>
    `- Feature: "${t.name}" (Description: ${t.description})`
  ).join('\n');

  return `You are the Tool Router Sub-Agent.
Analyze the incoming AgentMessage and determine if any sibling endpoint in this tool can resolve the issue, or if it must be escalated to the AIKO Agent.

INCOMING MESSAGE:
- Status: ${message?.status}
- Task: "${message?.task.instruction}"
- Target Feature: "${message?.task.target || ''}"
${message?.error ? `- Error: [${message.error.code}] ${message.error.message}` : ''}
${message?.insufficiency ? `- Insufficiency: ${message.insufficiency.reason}\n- Missing fields: ${JSON.stringify(message.insufficiency.missing)}` : ''}

AVAILABLE ENDPOINTS IN THIS TOOL:
${targetsSummary}

DECISION RULES:
1. If status is SUCCESS, action is "COMPLETE".
2. If another endpoint in this tool can retrieve the missing information:
   action is "ROUTE", specify recovery tasks targeting that endpoint.
3. If this tool cannot resolve it locally, action MUST be "ESCALATE".

Output valid JSON:
\`\`\`json
{
  "action": "ROUTE" | "ESCALATE" | "RETRY" | "COMPLETE",
  "reasoning": "Reason for choice",
  "tasks": [
    { "id": "rec-1", "instruction": "Fetch missing info", "target": "FeatureName", "dependsOn": [] }
  ]
}
\`\`\``;
}

export function buildAikoRouterPrompt(input: RouterInput): string {
  const { message, availableTargets } = input;
  const targetsSummary = (availableTargets || []).map(t =>
    `- Tool: "${t.name}" (Description: ${t.description})`
  ).join('\n');

  return `You are the AIKO Router Sub-Agent.
Analyze the escalated AgentMessage and determine if another tool in the workspace can resolve the issue, or if we must ask the user for clarification.

INCOMING MESSAGE:
- Level: ${message?.source.level} (Tool: ${message?.source.toolName || 'N/A'})
- Status: ${message?.status}
- Task: "${message?.task.instruction}"
${message?.error ? `- Error: [${message.error.code}] ${message.error.message}` : ''}
${message?.insufficiency ? `- Insufficiency: ${message.insufficiency.reason}\n- Missing: ${JSON.stringify(message.insufficiency.missing)}` : ''}

AVAILABLE WORKSPACE TOOLS:
${targetsSummary}

DECISION RULES:
1. If status is SUCCESS, action is "COMPLETE".
2. If another tool in workspace can provide missing information:
   action is "ROUTE", specify recovery tasks targeting that Tool.
3. If no available tool can resolve the missing information:
   action is "ASK_USER", specifying missing details for clarification.

Output valid JSON:
\`\`\`json
{
  "action": "ROUTE" | "ASK_USER" | "RETRY" | "COMPLETE",
  "reasoning": "Reason for decision",
  "missing": [
    { "key": "fieldName", "description": "Please provide your field", "required": true }
  ],
  "tasks": [
    { "id": "rec-tool-1", "instruction": "Instruction for tool", "target": "ToolName" }
  ]
}
\`\`\``;
}