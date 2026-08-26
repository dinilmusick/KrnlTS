/**
 * Layer 0: Pure Domain Concept Library for Financial & Algorithmic Trading
 */
export class TradingConcepts {
  static calculateSlippage(orderSize: number, basePrice: number): number {
    const impactRate = orderSize > 1000 ? 0.0025 : 0.0005;
    return basePrice * impactRate;
  }

  static calculateFee(notional: number): number {
    return notional * 0.001; // 10 bps
  }

  static computeExecution(symbol: string, side: 'BUY' | 'SELL', size: number, price: number) {
    const slippage = this.calculateSlippage(size, price);
    const effectivePrice = side === 'BUY' ? price + slippage : price - slippage;
    const notional = size * effectivePrice;
    const fee = this.calculateFee(notional);
    const netTotal = side === 'BUY' ? notional + fee : notional - fee;

    return {
      symbol,
      side,
      size,
      fillPrice: parseFloat(effectivePrice.toFixed(4)),
      fee: parseFloat(fee.toFixed(2)),
      netTotal: parseFloat(netTotal.toFixed(2)),
      executedAt: Date.now()
    };
  }
}
