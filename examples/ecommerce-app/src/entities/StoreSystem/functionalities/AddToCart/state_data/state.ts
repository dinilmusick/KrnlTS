export interface CartState {
  items: Array<{ id: string; qty: number; price: number }>;
}

export const initialState: CartState = {
  items: []
};
