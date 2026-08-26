export interface CalculateInput {
  op?: 'add' | 'subtract' | 'multiply' | 'divide' | 'power';
  a?: number;
  b?: number;
}

export interface CalculateOutput {
  result: number;
  formatted: string;
  timestamp: number;
}
