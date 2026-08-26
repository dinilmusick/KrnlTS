export interface UpdateStockInput {
  sku: string;
  delta: number;
}
export interface UpdateStockOutput {
  sku: string;
  newStock: number;
  inStock: boolean;
}
