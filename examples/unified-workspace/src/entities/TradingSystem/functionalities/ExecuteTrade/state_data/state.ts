export interface TradingState {
  totalTrades: number;
  cumulativeVolume: number;
}

export const initialState: TradingState = {
  totalTrades: 0,
  cumulativeVolume: 0
};
