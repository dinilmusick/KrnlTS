export interface ExecuteTaskInput {
  task: string;
  stepIndex: number;
}

export interface ExecuteTaskOutput {
  task: string;
  status: 'COMPLETED';
  durationMs: number;
}
