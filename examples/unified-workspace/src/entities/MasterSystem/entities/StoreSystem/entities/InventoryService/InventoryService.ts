import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class InventoryService extends Entity {
  constructor() {
    super({ id: 'InventoryService', version: '1.0.0', description: 'Inventory stock management' });
  }
  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default InventoryService;
