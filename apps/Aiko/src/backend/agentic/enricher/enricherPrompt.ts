/**
 * ASCII Architecture Flowchart: enricherPrompt
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize enricherPrompt     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     buildAikoEnricherPrompt      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           instruction            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             context              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: ENRICHER PROMPT BUILDERS ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { EnricherInput } from '../types.js';

export function buildAikoEnricherPrompt(input: EnricherInput): string {
  const instruction = input.task?.description || input.instruction || '';
  const context = input.context;
  const toolsSummary = (context.availableTools || []).map(t =>
    `- Tool "${t.name}": ${t.description} (features: ${(t.features || []).map((f: any) => f.name).join(', ')})`
  ).join('\n');

  const learnings = (context.scopedLearnings || []).map(l => `- Learning: ${l}`).join('\n');
  const memories = (context.memories || []).map(m => `- Memory: ${m}`).join('\n');

  return `You are the AIKO Enricher Sub-Agent.
Normalize and clarify the natural-language user input into structured natural-language tasks for tool agents.

RULES:
1. Preserve the user's original intent, requirements, and constraints.
2. Produce a clear normalized description.
3. Decompose into tasks with natural language description, goals, and target tool names.
4. Output valid JSON ONLY.

AVAILABLE TOOLS:
${toolsSummary || 'None'}

LEARNINGS:
${learnings || 'None'}

MEMORIES:
${memories || 'None'}

USER INPUT:
"${instruction}"

Output format:
\`\`\`json
{
  "normalizedInstruction": "Normalized intent here",
  "tasks": [
    {
      "id": "task-1",
      "description": "Natural language what must be accomplished",
      "instruction": "Natural language instruction for tool",
      "goals": [
        { "description": "What information/result must be produced", "expectedOutput": "Expected result" }
      ],
      "target": "ToolName",
      "dependsOn": []
    }
  ]
}
\`\`\``;
}

export function buildToolEnricherPrompt(input: EnricherInput): string {
  const taskDesc = input.task?.description || input.instruction || '';
  const taskGoals = (input.task?.goals || []).map(g => `- Goal: ${g.description}`).join('\n');
  const tool = input.context.toolDefinition;
  const featuresList = (tool?.features || []).map((f: any) =>
    `- Feature "${f.name}": ${f.description}\n  Endpoint: ${f.endpoint?.method} ${f.endpoint?.path}\n  Input Schema: ${JSON.stringify(f.input?.schema || {})}`
  ).join('\n');

  const depResults = input.context.dependencyResults
    ? `RESOLVED PRIOR DEPENDENCY DATA:\n${JSON.stringify(input.context.dependencyResults, null, 2)}`
    : '';

  return `You are the Tool Enricher Sub-Agent for Tool "${tool?.name || 'Unknown'}".
Decompose the validated Task into endpoint-level work.

TOOL FEATURES:
${featuresList}

${depResults}

INCOMING TASK:
Description: "${taskDesc}"
${taskGoals}

RULES:
1. Preserve Task intent and constraints.
2. Decompose into EndpointTasks with description, goals, and target feature.
3. Preserve dependencies and reference inputFromTasks if sequential data is consumed.
4. Output valid JSON ONLY.

Output format:
\`\`\`json
{
  "normalizedInstruction": "Refined tool task",
  "tasks": [
    {
      "id": "ep-task-1",
      "description": "Endpoint work description",
      "instruction": "Endpoint instruction",
      "goals": [
        { "description": "Expected data to retrieve/update" }
      ],
      "target": "FeatureName",
      "dependsOn": [],
      "inputFromTasks": []
    }
  ]
}
\`\`\``;
}

export function buildEndpointEnricherPrompt(input: EnricherInput): string {
  const taskDesc = input.task?.description || input.instruction || '';
  const taskGoals = (input.task?.goals || []).map(g => `- Goal: ${g.description}`).join('\n');
  const feature = input.context.featureDefinition;
  const tool = input.context.toolDefinition;

  const depResults = input.context.dependencyResults
    ? `AVAILABLE RESOLVED CONTEXT / DEPENDENCIES:\n${JSON.stringify(input.context.dependencyResults, null, 2)}`
    : '';

  const examples = (feature?.examples || []).map((ex: any) => JSON.stringify(ex.payload || ex)).join('\n');

  return `You are the Endpoint Enricher Sub-Agent for Feature "${feature?.name}" in Tool "${tool?.name}".
Transform the natural language EndpointTask into a structured JSON payload candidate matching the input schema.

ENDPOINT:
${feature?.endpoint?.method || 'POST'} ${feature?.endpoint?.path || '/'}
DESCRIPTION: ${feature?.description || ''}

INPUT SCHEMA:
${JSON.stringify(feature?.input?.schema || {}, null, 2)}

EXAMPLES:
${examples || 'None'}

${depResults}

ENDPOINT TASK:
Description: "${taskDesc}"
${taskGoals}

RULES:
1. Transform natural language into structured JSON payload.
2. Use EndpointDefinition + examples + context.
3. Preserve requested intent. Do NOT invent unavailable required values.
4. Output valid JSON ONLY.

Output format:
\`\`\`json
{
  "normalizedInstruction": "Refined endpoint task",
  "structuredPayload": { ... }
}
\`\`\``;
}