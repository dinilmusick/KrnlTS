/**
 * @file CommerceConcepts.ts
 * @role component
 * @description Layer 0 Pure commerce domain concept library.
 */
export class CommerceConcepts {
  static calculateTax(subtotal: number, taxRate: number = 0.08): number {
    return subtotal * taxRate;
  }

  static calculateTotal(subtotal: number, tax: number, shipping: number = 5.0): number {
    return subtotal + tax + shipping;
  }

  static applyDiscount(total: number, code?: string): { finalTotal: number; discount: number } {
    if (code === 'KRNL20') {
      const discount = total * 0.2;
      return { finalTotal: total - discount, discount };
    }
    return { finalTotal: total, discount: 0 };
  }
}
