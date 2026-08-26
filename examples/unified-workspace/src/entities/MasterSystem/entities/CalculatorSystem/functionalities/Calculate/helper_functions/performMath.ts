import { MathConcepts } from '../../../../../../../libraries/MathConcepts.js';

export function performMath(op: string, a: number, b: number): { result: number; formatted: string } {
  const result = MathConcepts.compute(op, a, b);
  const formatted = MathConcepts.formatResult(result);
  return { result, formatted };
}
