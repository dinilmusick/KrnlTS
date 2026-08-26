import { CalculateInput, CalculateOutput } from '../CalculateAtom.js';
import { performMath } from '../helper_functions/performMath.js';

export const main = async (input: CalculateInput, { state, entity }: any): Promise<CalculateOutput> => {
  const op = input.op || 'add';
  const a = input.a ?? 10;
  const b = input.b ?? 5;

  const { result, formatted } = performMath(op, a, b);
  return {
    result,
    formatted,
    timestamp: Date.now()
  };
};
