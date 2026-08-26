import { ExecuteTaskInput, ExecuteTaskOutput } from '../ExecuteTaskAtom.js';
import { runTask } from '../helper_functions/runTask.js';

export const main = async (input: ExecuteTaskInput): Promise<ExecuteTaskOutput> => {
  const task = input.task || 'Default Autonomous Task';
  const idx = input.stepIndex ?? 0;
  const taskResult = runTask(task, idx);

  return {
    taskResult,
    status: 'COMPLETED',
    durationMs: 3.8
  };
};
