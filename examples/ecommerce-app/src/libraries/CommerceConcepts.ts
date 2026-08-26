/**
 * @file CommerceConcepts.ts
 * @role component
 * @description Layer 0 Pure domain concept library for commercial calculations.
 */

export class CommerceConcepts {
  static calculateTax(subtotal: number, taxRate: number = 0.08): number {
    return subtotal * taxRate;
  }

  static calculateTotal(subtotal: number, tax: number, shipping: number = 5.0): number {
    return subtotal + tax + shipping;
  }
}
