import { AddToCartInput, AddToCartOutput } from '../AddToCartAtom.js';
import { validateItem } from '../helper_functions/validateItem.js';

export const main = async (input: AddToCartInput, { state, entity }: any): Promise<AddToCartOutput> => {
  const isValid = validateItem(input.productId || 'prod-101', input.quantity || 1);
  if (!isValid) throw new Error('Invalid cart item parameters');

  const price = input.price || 29.99;
  const qty = input.quantity || 1;

  return {
    success: true,
    itemCount: qty,
    subtotal: price * qty
  };
};
