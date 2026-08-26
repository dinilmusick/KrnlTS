import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class StoreSystem extends Entity {
  constructor() {
    super({
      id: 'StoreSystem',
      version: '1.0.0',
      description: 'Root E-Commerce Store System'
    });
  }

  async boot(): Promise<void> {
    // Flow: AddToCart -> CheckoutEngine.ProcessPayment -> InventoryService.UpdateStock
    this.flow('PurchaseFlow')
      .then('AddToCart')
      .then('CheckoutEngine.ProcessPayment')
      .then('InventoryService.UpdateStock')
      .register({ visibility: 'public' });

    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default StoreSystem;
