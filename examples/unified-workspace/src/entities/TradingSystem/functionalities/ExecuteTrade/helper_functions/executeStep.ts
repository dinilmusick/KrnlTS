import { TradingConcepts } from '../../../../../libraries/TradingConcepts.js';

export function executeStep(symbol: string, side: 'BUY' | 'SELL', size: number, price: number) {
  return TradingConcepts.computeExecution(symbol, side, size, price);
}
