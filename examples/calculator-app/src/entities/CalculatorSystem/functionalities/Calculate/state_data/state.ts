export interface CalculateState {
  lastCalculated: number;
  totalOps: number;
}

export const initialState: CalculateState = {
  lastCalculated: 0,
  totalOps: 0
};
