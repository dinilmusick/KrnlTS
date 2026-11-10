import type { OrchestrationStep, DAGValidationResult } from './model.types.js';

export function validateOrchestrationDAG(steps: readonly OrchestrationStep[]): DAGValidationResult {
  const errors: string[] = [];
  const stepMap = new Map<string, OrchestrationStep>();

  for (const step of steps) {
    if (!step.id || typeof step.id !== 'string' || step.id.trim() === '') {
      errors.push('Step must have a non-empty string ID.');
      continue;
    }
    if (stepMap.has(step.id)) {
      errors.push(`Duplicate step ID detected: "${step.id}"`);
    }
    stepMap.set(step.id, step);

    // Validate timeouts
    if (step.timeoutPolicy) {
      if (typeof step.timeoutPolicy.timeoutMs !== 'number' || step.timeoutPolicy.timeoutMs <= 0) {
        errors.push(`Step "${step.id}" has invalid timeoutMs: must be a positive number.`);
      }
    }

    // Validate retry policy
    if (step.retryPolicy) {
      if (typeof step.retryPolicy.maxAttempts !== 'number' || step.retryPolicy.maxAttempts < 1) {
        errors.push(`Step "${step.id}" has invalid maxAttempts: must be >= 1.`);
      }
      if (step.retryPolicy.backoffMs !== undefined && step.retryPolicy.backoffMs < 0) {
        errors.push(`Step "${step.id}" has negative backoffMs.`);
      }
      if (step.retryPolicy.initialDelayMs !== undefined && step.retryPolicy.initialDelayMs < 0) {
        errors.push(`Step "${step.id}" has negative initialDelayMs.`);
      }
    }

    // Validate concurrency
    if (step.concurrency !== undefined && (typeof step.concurrency !== 'number' || step.concurrency < 1)) {
      errors.push(`Step "${step.id}" has invalid concurrency: must be >= 1.`);
    }

    // Validate step target
    if (step.type === 'task' || step.type === 'sequential') {
      if (!step.target && !step.handler) {
        errors.push(`Step "${step.id}" requires a non-empty target or handler.`);
      }
    }
  }

  // Check dependencies exist
  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        if (!stepMap.has(dep)) {
          errors.push(`Step "${step.id}" depends on unknown step "${dep}".`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, order: [], errors };
  }

  // Topological sort with cycle detection (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    graph.set(step.id, []);
  }

  for (const step of steps) {
    if (step.dependsOn) {
      for (const dep of step.dependsOn) {
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        graph.get(dep)?.push(step.id);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== steps.length) {
    errors.push('Circular dependency cycle detected in orchestration DAG.');
    return { valid: false, order: [], errors };
  }

  return { valid: true, order, errors: [] };
}
