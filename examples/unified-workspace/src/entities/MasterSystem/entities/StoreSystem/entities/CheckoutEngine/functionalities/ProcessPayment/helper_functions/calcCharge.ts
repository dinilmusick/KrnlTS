import { CommerceConcepts } from '../../../../../../../libraries/CommerceConcepts.js';

export function calcCharge(subtotal: number, discountCode?: string) {
  const tax = CommerceConcepts.calculateTax(subtotal);
  const total = CommerceConcepts.calculateTotal(subtotal, tax);
  const { finalTotal, discount } = CommerceConcepts.applyDiscount(total, discountCode);
  return {
    transactionId: `TX-${Date.now()}`,
    finalTotal,
    discount
  };
}
