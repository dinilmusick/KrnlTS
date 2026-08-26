export interface QuotePriceInput {
  symbol: string;
}

export interface QuotePriceOutput {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: number;
}
