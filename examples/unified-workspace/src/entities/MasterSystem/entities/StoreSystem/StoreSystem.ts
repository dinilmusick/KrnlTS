import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class StoreSystem extends Entity {
  constructor() {
    super({
      id: 'StoreSystem',
      version: '1.0.0',
      description: 'E-Commerce Store Subsystem'
    });
  }

  async boot(): Promise<void> {
    this.flow('PurchaseFlow')
      .then('AddToCart')
      .then('CheckoutEngine.ProcessPayment')
      .then('InventoryService.UpdateStock')
      .register({ visibility: 'public' });

    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default StoreSystem;
