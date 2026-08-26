import { PlanGoalInput, PlanGoalOutput } from '../PlanGoalAtom.js';
import { decompose } from '../helper_functions/decompose.js';

export const main = async (input: PlanGoalInput, { state, entity }: any): Promise<PlanGoalOutput> => {
  const goal = input.goal || 'Build Full Stack Autonomous Application';
  const { steps, confidence } = decompose(goal);

  return {
    goal,
    steps,
    confidence
  };
};
