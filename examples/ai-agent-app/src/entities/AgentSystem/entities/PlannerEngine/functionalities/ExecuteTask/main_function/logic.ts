import { ExecuteTaskInput, ExecuteTaskOutput } from '../ExecuteTaskAtom.js';
import { formatExecution } from '../helper_functions/formatExecution.js';

export const main = async (input: ExecuteTaskInput, { state, entity }: any): Promise<ExecuteTaskOutput> => {
  const task = input.task || 'Default Step Execution';
  const idx = input.stepIndex ?? 0;
  const logStr = formatExecution(task, idx);

  return {
    task: logStr,
    status: 'COMPLETED',
    durationMs: 4.2
  };
};
