import { AiConcepts } from '../../../../../../../libraries/AiConcepts.js';

export function decomposeGoal(goal: string) {
  const steps = AiConcepts.decomposeGoal(goal);
  const confidence = AiConcepts.scoreConfidence(steps.length);
  return { steps, confidence };
}
