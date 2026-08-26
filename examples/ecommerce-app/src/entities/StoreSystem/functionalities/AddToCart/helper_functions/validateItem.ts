export function validateItem(productId: string, qty: number): boolean {
  return productId.length > 0 && qty > 0;
}
