import { UpdateStockInput, UpdateStockOutput } from '../UpdateStockAtom.js';
import { computeStock } from '../helper_functions/computeStock.js';

export const main = async (input: UpdateStockInput, { state, entity }: any): Promise<UpdateStockOutput> => {
  const sku = input.sku || 'SKU-001';
  const delta = input.delta || -1;
  const newQuantity = computeStock(100, delta);

  return {
    sku,
    newQuantity,
    inStock: newQuantity > 0
  };
};
