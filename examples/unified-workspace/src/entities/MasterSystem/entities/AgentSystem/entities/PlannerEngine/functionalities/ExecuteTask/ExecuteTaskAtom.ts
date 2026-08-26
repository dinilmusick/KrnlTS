export interface ExecuteTaskInput {
  task: string;
  stepIndex?: number;
}
export interface ExecuteTaskOutput {
  taskResult: string;
  status: 'COMPLETED';
  durationMs: number;
}
