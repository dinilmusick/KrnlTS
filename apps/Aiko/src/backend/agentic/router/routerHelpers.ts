/**
 * ASCII Architecture Flowchart: routerHelpers
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize routerHelpers     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          VALID_ACTIONS           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │   parseCapabilityGateResponse    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              parsed              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: ROUTER HELPER UTILITIES ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { RouterOutput, RouterAction, RouterInput, RouterDecision } from '../types.js';
import { extractJsonFromResponse } from '../enricher/enricherHelpers.js';
import { MissingInformation } from '../message/agentMessageTypes.js';

const VALID_ACTIONS: Set<RouterAction> = new Set(['ROUTE', 'ESCALATE', 'ASK_USER', 'RETRY', 'COMPLETE']);

export function parseCapabilityGateResponse(
  raw: string,
  input: RouterInput
): RouterOutput {
  const parsed = extractJsonFromResponse(raw);

  if (parsed && typeof parsed === 'object' && parsed.decision) {
    const decision: RouterDecision =
      parsed.decision === 'INSUFFICIENT' ? 'INSUFFICIENT' : 'SUFFICIENT';

    let missing: MissingInformation[] | undefined = undefined;
    if (Array.isArray(parsed.missing)) {
      missing = parsed.missing.map((m: any) => ({
        key: typeof m.key === 'string' ? m.key : 'unspecified',
        description: typeof m.description === 'string' ? m.description : 'Missing information',
        expectedType: typeof m.expectedType === 'string' ? m.expectedType : undefined,
        required: typeof m.required === 'boolean' ? m.required : true
      }));
    }

    return {
      decision,
      missing,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined
    };
  }

  // Capability Gate Semantic Inspection: inspect natural language task + definitions
  const def = input.definitions;
  const reqFields: string[] = Array.isArray(def?.input?.schema?.required)
    ? def.input.schema.required
    : (Array.isArray(def?.parameters) ? def.parameters.filter((p: any) => p.required).map((p: any) => p.name) : []);

  if (reqFields.length > 0) {
    const textToInspect = `${input.task?.description || ''} ${input.task?.instruction || ''}`.toLowerCase();
    const deps = input.context?.dependencyResults || {};
    const candidateObj = (parsed && typeof parsed === 'object' && typeof parsed.structuredPayload === 'object' && parsed.structuredPayload !== null)
      ? parsed.structuredPayload
      : {};
    const missingFields: MissingInformation[] = [];

    for (const req of reqFields) {
      const lowerReq = req.toLowerCase();
      const hasInCandidate = candidateObj[req] !== undefined;
      const hasInDeps = deps[req] !== undefined || Object.keys(deps).some(k => k.toLowerCase() === lowerReq);
      const hasInText = textToInspect.includes(lowerReq) || (lowerReq.includes('email') && textToInspect.includes('@'));
      if (!hasInCandidate && !hasInDeps && !hasInText) {
        missingFields.push({
          key: req,
          description: `Required parameter "${req}" is not present in task instruction or dependencies`,
          required: true
        });
      }
    }

    if (missingFields.length > 0) {
      return {
        decision: 'INSUFFICIENT',
        missing: missingFields,
        reasoning: `Capability gate detected missing required parameters: ${missingFields.map(m => m.key).join(', ')}`
      };
    }
  }

  return {
    decision: 'SUFFICIENT',
    reasoning: 'Capability gate verified task feasibility against available definitions'
  };
}

export function parseRouterResponse(
  raw: string,
  input: RouterInput
): RouterOutput {
  const parsed = extractJsonFromResponse(raw);

  if (!parsed || typeof parsed !== 'object') {
    if (input.message?.status === 'SUCCESS') {
      return { decision: 'SUFFICIENT', action: 'COMPLETE', reasoning: 'Message succeeded' };
    }
    if (input.level === 'TOOL') {
      return { decision: 'INSUFFICIENT', action: 'ESCALATE', reasoning: 'Could not resolve locally; escalating to AIKO' };
    }
    return {
      decision: 'INSUFFICIENT',
      action: 'ASK_USER',
      reasoning: 'Could not resolve automatically across tools; asking user',
      missing: input.message?.insufficiency?.missing || [
        { key: 'input', description: 'Additional clarification needed', required: true }
      ]
    };
  }

  let action: RouterAction = 'ESCALATE';
  if (typeof parsed.action === 'string' && VALID_ACTIONS.has(parsed.action as RouterAction)) {
    action = parsed.action as RouterAction;
  } else if (input.message?.status === 'SUCCESS') {
    action = 'COMPLETE';
  } else if (input.level === 'AIKO') {
    action = 'ASK_USER';
  }

  const decision: RouterDecision = parsed.decision === 'INSUFFICIENT' || action === 'ESCALATE' || action === 'ASK_USER'
    ? 'INSUFFICIENT'
    : 'SUFFICIENT';

  const tasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.map((t: any, idx: number) => ({
        id: typeof t.id === 'string' ? t.id : `task-${idx + 1}`,
        description: typeof t.description === 'string' ? t.description : (typeof t.instruction === 'string' ? t.instruction : String(t)),
        instruction: typeof t.instruction === 'string' ? t.instruction : String(t),
        target: t.target || t.toolName || t.featureName || '',
        toolName: t.toolName || t.target,
        featureName: t.featureName || t.target,
        dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
        inputFromTasks: Array.isArray(t.inputFromTasks) ? t.inputFromTasks : []
      }))
    : undefined;

  let missing: MissingInformation[] | undefined = undefined;
  if (Array.isArray(parsed.missing)) {
    missing = parsed.missing.map((m: any) => ({
      key: typeof m.key === 'string' ? m.key : 'unspecified',
      description: typeof m.description === 'string' ? m.description : 'Missing value',
      expectedType: typeof m.expectedType === 'string' ? m.expectedType : undefined,
      required: typeof m.required === 'boolean' ? m.required : true
    }));
  } else if (action === 'ASK_USER' && input.message?.insufficiency?.missing) {
    missing = input.message.insufficiency.missing;
  }

  return {
    decision,
    action,
    tasks,
    missing,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined
  };
}