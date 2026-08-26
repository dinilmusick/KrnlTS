import { CommerceConcepts } from '../../../../../../libraries/CommerceConcepts.js';

export function authorizeCharge(amount: number): { transactionId: string; tax: number; total: number } {
  const tax = CommerceConcepts.calculateTax(amount);
  const total = CommerceConcepts.calculateTotal(amount, tax);
  return {
    transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tax,
    total
  };
}
