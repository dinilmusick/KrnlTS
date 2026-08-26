export interface CalculateState {
  lastResult: number;
  totalCalculations: number;
}

export const initialState: CalculateState = {
  lastResult: 0,
  totalCalculations: 0
};
