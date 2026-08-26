export interface ProcessPaymentInput {
  amount: number;
  currency?: string;
  paymentMethodId?: string;
}

export interface ProcessPaymentOutput {
  status: 'APPROVED' | 'DECLINED';
  transactionId: string;
  chargedAmount: number;
}
