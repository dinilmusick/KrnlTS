export function runTask(task: string, idx: number): string {
  return `[STEP ${idx + 1}] Executed: ${task}`;
}
