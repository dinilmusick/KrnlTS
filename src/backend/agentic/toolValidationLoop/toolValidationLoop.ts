/**
 * ASCII Architecture Flowchart: toolValidationLoop
 *
 *   ┌──────────────────────────────────┐
 *   │  Initialize toolValidationLoop   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     runAgentReliabilityLoop      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            startTime             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            maxRetries            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { ZodType } from 'zod';
import { failoverExecutionEngine } from '../../failoverEngine.js';
import { DEFAULT_AIKO_TOOLS } from '../../inferenceExecutor.js';
import { McpToolDefinition } from '../../types.js';
import { AgentReliabilityResult, AgentReliabilityRequest, AgentReliabilityAttempt, ZodValidationErrorDetail } from '../types.js';
import { jsonSchemaToZod, executeBuiltInTool } from './helpers.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════


// ════ AGENT RELIABILITY LOOP IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export async function runAgentReliabilityLoop(
  req: AgentReliabilityRequest
): Promise<AgentReliabilityResult> {
  const startTime = Date.now();
  const maxRetries = Math.min(Math.max(req.maxRetries || 3, 1), 5);

  const mergedTools: McpToolDefinition[] = [
    ...(req.tools || []),
    ...DEFAULT_AIKO_TOOLS.map(t => ({
      name: t.function.name, description: t.function.description, parameters: t.function.parameters
    }))
  ];

  const toolSchemas = new Map<string, ZodType<any>>();
  for (const t of mergedTools) {
    toolSchemas.set(t.name, jsonSchemaToZod(t.parameters));
  }

  const attempts: AgentReliabilityAttempt[] = [];
  const conversationMessages = [...(req.messages || [{ role: 'user', content: req.prompt }])];

  let currentAttemptIndex = 0;
  let finalOutput = '';
  let validatedCalls: Array<{ id: string; name: string; parsedArguments: any; result?: any }> = [];
  let isSuccessful = false;
  let lastContractId = `contract-agent-${Date.now()}`;
  let lastModelUsed = 'gemini-3.7-flash';
  let lastProviderUsed: any = 'google';

  while (currentAttemptIndex < maxRetries && !isSuccessful) {
    currentAttemptIndex++;
    const currentPromptText = conversationMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    let execResult;
    try {
      execResult = await failoverExecutionEngine.executeProfileRequest(
        { requiredContext: req.requiredContext || 16000, intelligenceSpec: req.intelligenceSpec },
        currentPromptText, '127.0.0.1',
        {
          enableDefaultTools: true,
          tools: mergedTools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }))
        }
      );
    } catch (err: any) {
      attempts.push({
        attemptIndex: currentAttemptIndex, timestamp: new Date().toISOString(), modelUsed: lastModelUsed, providerUsed: lastProviderUsed,
        isValid: false, validationErrors: [{ path: 'inference', message: err.message || String(err), code: 'INFERENCE_ERROR' }], executionOutput: `Execution error: ${err.message}`
      });
      break;
    }

    lastContractId = execResult.contractId;
    lastModelUsed = execResult.modelUsed;
    lastProviderUsed = execResult.providerUsed;

    const toolCalls = execResult.toolCalls || [];

    if (toolCalls.length === 0) {
      attempts.push({
        attemptIndex: currentAttemptIndex, timestamp: new Date().toISOString(), modelUsed: execResult.modelUsed, providerUsed: execResult.providerUsed,
        isValid: true, executionOutput: execResult.content
      });
      finalOutput = execResult.content;
      isSuccessful = true;
      break;
    }

    let attemptHasValidationError = false;
    const attemptErrors: ZodValidationErrorDetail[] = [];
    const currentValidatedCallsInAttempt: Array<{ id: string; name: string; parsedArguments: any; result?: any }> = [];

    for (const tc of toolCalls) {
      const toolName = tc.function.name;
      const rawArgsStr = tc.function.arguments || '{}';
      let parsedArgs: any = {};

      try {
        parsedArgs = JSON.parse(rawArgsStr);
      } catch (pErr: any) {
        attemptHasValidationError = true;
        attemptErrors.push({ path: `${toolName}.arguments`, message: `JSON Syntax Error: ${pErr.message}`, code: 'JSON_PARSE_ERROR' });
        continue;
      }

      const schema = toolSchemas.get(toolName);
      if (schema) {
        const parseResult = schema.safeParse(parsedArgs);
        if (!parseResult.success) {
          attemptHasValidationError = true;
          for (const issue of parseResult.error.issues) {
            attemptErrors.push({ path: `${toolName}.${issue.path.join('.')}`, message: issue.message, code: issue.code });
          }
        }
      }

      if (!attemptHasValidationError) {
        const toolRes = await executeBuiltInTool(toolName, parsedArgs);
        currentValidatedCallsInAttempt.push({ id: tc.id, name: toolName, parsedArguments: parsedArgs, result: toolRes });
      }
    }

    if (attemptHasValidationError) {
      const correctionPrompt = `A validation error occurred on attempt ${currentAttemptIndex}:\n${JSON.stringify(attemptErrors, null, 2)}\nPlease fix the parameters and retry.`;
      conversationMessages.push({ role: 'user', content: correctionPrompt });
      attempts.push({
        attemptIndex: currentAttemptIndex, timestamp: new Date().toISOString(), modelUsed: execResult.modelUsed, providerUsed: execResult.providerUsed,
        isValid: false, validationErrors: attemptErrors, executionOutput: correctionPrompt
      });
    } else {
      validatedCalls = currentValidatedCallsInAttempt;
      finalOutput = execResult.content || `Executed ${validatedCalls.length} tool(s) successfully.`;
      isSuccessful = true;
      attempts.push({
        attemptIndex: currentAttemptIndex, timestamp: new Date().toISOString(), modelUsed: execResult.modelUsed, providerUsed: execResult.providerUsed,
        isValid: true, executionOutput: finalOutput
      });
    }
  }

  return {
    success: isSuccessful,
    contractId: lastContractId,
    totalAttempts: attempts.length,
    finalOutput,
    validatedToolCalls: validatedCalls,
    attempts,
    totalLatencyMs: Date.now() - startTime
  };
}

export default runAgentReliabilityLoop;