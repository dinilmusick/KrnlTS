export interface ExecuteTradeInput {
  symbol?: string;
  side?: 'BUY' | 'SELL';
  size?: number;
  limitPrice?: number;
}

export interface ExecuteTradeOutput {
  status: 'FILLED' | 'REJECTED';
  tradeId: string;
  symbol: string;
  fillPrice: number;
  netTotal: number;
  fee: number;
}
