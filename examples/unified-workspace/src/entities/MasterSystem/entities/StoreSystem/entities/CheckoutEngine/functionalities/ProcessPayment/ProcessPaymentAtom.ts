export interface ProcessPaymentInput {
  subtotal: number;
  discountCode?: string;
}
export interface ProcessPaymentOutput {
  status: 'APPROVED' | 'DECLINED';
  transactionId: string;
  chargedAmount: number;
  discountApplied: number;
}
