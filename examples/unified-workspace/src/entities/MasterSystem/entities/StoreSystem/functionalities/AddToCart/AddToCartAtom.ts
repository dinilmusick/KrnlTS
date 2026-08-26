export interface AddToCartInput {
  productId: string;
  quantity: number;
  price: number;
}
export interface AddToCartOutput {
  success: boolean;
  itemCount: number;
  subtotal: number;
}
