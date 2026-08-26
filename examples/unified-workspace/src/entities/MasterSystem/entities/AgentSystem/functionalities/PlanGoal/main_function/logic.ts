import { PlanGoalInput, PlanGoalOutput } from '../PlanGoalAtom.js';
import { decomposeGoal } from '../helper_functions/decomposeGoal.js';

export const main = async (input: PlanGoalInput): Promise<PlanGoalOutput> => {
  const goal = input.goal || 'Synthesize Full Stack Application';
  const { steps, confidence } = decomposeGoal(goal);

  return {
    goal,
    steps,
    confidence
  };
};
