import { AikoAgent } from '../aikoAgent/AikoAgent.js';
const sanitizeErrorMessage = (message: string) => message.replace(/(?:api[_ -]?key|token|secret)\s*[:=]\s*[^\s,;]+/gi, '[redacted]');
import type { ChatAgentRequest, ChatAgentResponse, ChatMessage, AgentExecutionState } from './types.js';

export class ChatExecutionBridge {
  constructor(private readonly aikoAgent: AikoAgent) {}

  public async executeChat(req: ChatAgentRequest): Promise<ChatAgentResponse> {
    const start = Date.now();
    const result = await this.aikoAgent.execute({
      query: req.query,
      workspace: req.workspace,
      selectedProvider: req.selectedProvider,
      selectedModel: req.selectedModel,
      customInference: req.customInference,
    });

    const agentExecution: AgentExecutionState = {
      phase: 'RESULT',
      workflows: result.workflowExecutions.map(w => ({
        workflowId: w.workflowId,
        workflowName: w.workflowName,
        status: w.status.toLowerCase() as 'success' | 'failed' | 'blocked',
        output: w.output,
        durationMs: w.durationMs,
      })),
      totalDurationMs: result.durationMs,
    };

    const botMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: sanitizeErrorMessage(result.response || (result.success ? 'Request processed successfully.' : result.error?.message || 'Execution failed.')),
      timestamp: new Date().toLocaleTimeString(),
      workflowMentions: result.workflowExecutions.map(w => ({ workflowId: w.workflowId, workflowName: w.workflowName })),
      agentExecution,
      finalResult: result.finalResult,
      error: !result.success,
      errorMessage: result.error ? sanitizeErrorMessage(result.error.message) : undefined,
      providerId: req.selectedProvider,
      modelId: req.selectedModel || result.resolvedModelId,
      latencyMs: result.durationMs || Date.now() - start,
    };

    return { success: result.success, message: botMessage, error: result.error };
  }
}
