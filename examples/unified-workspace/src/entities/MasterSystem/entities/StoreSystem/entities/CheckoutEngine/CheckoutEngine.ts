import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class CheckoutEngine extends Entity {
  constructor() {
    super({ id: 'CheckoutEngine', version: '1.0.0', description: 'Payment Processing Entity' });
  }
  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default CheckoutEngine;
