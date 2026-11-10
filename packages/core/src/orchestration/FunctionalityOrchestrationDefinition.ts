import type {
  OrchestrationDefinition,
  OrchestrationDescriptor,
  OrchestrationStep,
} from './canonical/model.js';

export function createFunctionalityOrchestrationDefinition(
  descriptor: OrchestrationDescriptor,
  steps: readonly OrchestrationStep[],
): OrchestrationDefinition {
  return {
    id: descriptor.id,
    name: descriptor.name || descriptor.id,
    version: descriptor.version || '1.0.0',
    description: descriptor.description || '',
    timeoutMs: descriptor.timeoutMs,
    scope: 'functionality',
    bubbleEvents: descriptor.bubbleEvents ?? true,
    dependencies: [],
    steps: steps.map((step) => ({
      id: step.id,
      name: step.name,
      type: step.type,
      target: step.target,
      dependsOn: step.dependsOn ? [...step.dependsOn] : undefined,
      retryPolicy: step.retryPolicy ? { ...step.retryPolicy } : undefined,
      timeoutPolicy: step.timeoutPolicy ? { ...step.timeoutPolicy } : undefined,
      compensationTarget: step.compensation?.target ?? step.compensation?.name,
      compensationOperation: step.compensation?.operation ?? step.compensation?.name,
      nestedOrchestrationId: step.nestedOrchestrationId,
      concurrency: step.concurrency,
    })),
  };
}
