import { ProcessPaymentInput, ProcessPaymentOutput } from '../ProcessPaymentAtom.js';
import { authorizeCharge } from '../helper_functions/authorizeCharge.js';

export const main = async (input: ProcessPaymentInput, { state, entity }: any): Promise<ProcessPaymentOutput> => {
  const amount = input.amount || 49.99;
  const { transactionId, total } = authorizeCharge(amount);

  return {
    status: 'APPROVED',
    transactionId,
    chargedAmount: total
  };
};
