import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class TradingSystem extends Entity {
  constructor() {
    super({
      id: 'TradingSystem',
      version: '1.0.0',
      description: 'High-Frequency Algorithmic Order Execution Engine'
    });
  }

  async boot(): Promise<void> {
    this.flow('TradeExecutionFlow')
      .then('QuotePrice')
      .then('ExecuteTrade')
      .register({ visibility: 'public' });

    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default TradingSystem;
