export interface UpdateStockInput {
  sku: string;
  delta: number;
}

export interface UpdateStockOutput {
  sku: string;
  newQuantity: number;
  inStock: boolean;
}
