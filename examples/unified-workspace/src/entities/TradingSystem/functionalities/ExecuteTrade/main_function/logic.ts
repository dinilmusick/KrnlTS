import { ExecuteTradeInput, ExecuteTradeOutput } from '../ExecuteTradeAtom.js';
import { executeStep } from '../helper_functions/executeStep.js';

export const main = async (input: ExecuteTradeInput, { state }: any): Promise<ExecuteTradeOutput> => {
  const sym = input.symbol || 'BTC/USDT';
  const side = input.side || 'BUY';
  const size = input.size || 2.5;
  const price = input.limitPrice || 64500;

  const execution = executeStep(sym, side, size, price);

  return {
    status: 'FILLED',
    tradeId: `TRD-${Date.now()}`,
    symbol: execution.symbol,
    fillPrice: execution.fillPrice,
    netTotal: execution.netTotal,
    fee: execution.fee
  };
};
