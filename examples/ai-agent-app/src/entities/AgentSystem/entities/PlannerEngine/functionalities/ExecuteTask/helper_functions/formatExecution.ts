export function formatExecution(task: string, idx: number): string {
  return `[STEP ${idx + 1}] Completed: ${task}`;
}
