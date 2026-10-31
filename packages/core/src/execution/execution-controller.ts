import type {ExecutionController, ExecutionProvider, ExecutionRequest, ExecutionResult} from "./execution-types.js";

export class DefaultExecutionController implements ExecutionController {
  private readonly providers = new Map<string, ExecutionProvider>();
  private readonly executions = new Map<string, ExecutionProvider>();

  register(provider: ExecutionProvider): void {
    this.providers.set(provider.id, provider);
  }

  async execute(request: ExecutionRequest, providerId?: string): Promise<ExecutionResult> {
    const provider = providerId ? this.providers.get(providerId) : this.providers.values().next().value;
    if (!provider) throw new Error("No execution provider is registered.");
    const result = await provider.execute(request);
    this.executions.set(result.executionId, provider);
    return result;
  }

  async cancel(executionId: string): Promise<void> {
    const provider = this.executions.get(executionId);
    if (!provider) throw new Error(`Unknown execution: ${executionId}`);
    await provider.cancel(executionId);
    this.executions.delete(executionId);
  }
}
