import { UpdateStockInput, UpdateStockOutput } from '../UpdateStockAtom.js';
import { applyStockDelta } from '../helper_functions/applyStockDelta.js';

export const main = async (input: UpdateStockInput): Promise<UpdateStockOutput> => {
  const sku = input.sku || 'SKU-KRNL-01';
  const delta = input.delta || -1;
  const newStock = applyStockDelta(100, delta);

  return {
    sku,
    newStock,
    inStock: newStock > 0
  };
};
