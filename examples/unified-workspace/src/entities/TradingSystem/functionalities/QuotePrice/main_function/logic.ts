import { QuotePriceInput, QuotePriceOutput } from '../QuotePriceAtom.js';
import { executeStep } from '../helper_functions/executeStep.js';

export const main = async (input: QuotePriceInput): Promise<QuotePriceOutput> => {
  const sym = input.symbol || 'BTC/USDT';
  const q = executeStep(sym);

  return {
    symbol: q.symbol,
    bid: q.bid,
    ask: q.ask,
    spread: q.spread,
    timestamp: Date.now()
  };
};
