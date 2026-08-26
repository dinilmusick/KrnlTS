import { ProcessPaymentInput, ProcessPaymentOutput } from '../ProcessPaymentAtom.js';
import { calcCharge } from '../helper_functions/calcCharge.js';

export const main = async (input: ProcessPaymentInput): Promise<ProcessPaymentOutput> => {
  const subtotal = input.subtotal || 49.99;
  const { transactionId, finalTotal, discount } = calcCharge(subtotal, input.discountCode);

  return {
    status: 'APPROVED',
    transactionId,
    chargedAmount: finalTotal,
    discountApplied: discount
  };
};
