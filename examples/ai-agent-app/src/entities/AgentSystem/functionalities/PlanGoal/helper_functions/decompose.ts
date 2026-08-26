import { AiConcepts } from '../../../../../libraries/AiConcepts.js';

export function decompose(goal: string): { steps: string[]; confidence: number } {
  const steps = AiConcepts.decomposeGoal(goal);
  const confidence = AiConcepts.scoreConfidence(steps.length);
  return { steps, confidence };
}
