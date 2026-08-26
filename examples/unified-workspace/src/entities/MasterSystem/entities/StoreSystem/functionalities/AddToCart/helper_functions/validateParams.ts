export function validateParams(productId: string, quantity: number): boolean {
  return productId.length > 0 && quantity > 0;
}
