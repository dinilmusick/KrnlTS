import { AddToCartInput, AddToCartOutput } from '../AddToCartAtom.js';
import { validateParams } from '../helper_functions/validateParams.js';

export const main = async (input: AddToCartInput): Promise<AddToCartOutput> => {
  const pid = input.productId || 'prod-001';
  const qty = input.quantity || 1;
  const price = input.price || 49.99;
  validateParams(pid, qty);

  return {
    success: true,
    itemCount: qty,
    subtotal: price * qty
  };
};
