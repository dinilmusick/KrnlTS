export interface StoreCartState {
  items: Array<{ id: string; qty: number; price: number }>;
}
export const initialState: StoreCartState = {
  items: []
};
