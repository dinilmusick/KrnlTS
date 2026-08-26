/**
 * @file MathConcepts.ts
 * @role component
 * @description Layer 0 Pure mathematical concept library with zero I/O side effects.
 */

export class MathConcepts {
  static compute(op: string, a: number, b: number): number {
    switch (op) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return b !== 0 ? a / b : 0;
      default: return a + b;
    }
  }

  static formatResult(val: number): string {
    return `RESULT: ${val.toFixed(2)}`;
  }
}
