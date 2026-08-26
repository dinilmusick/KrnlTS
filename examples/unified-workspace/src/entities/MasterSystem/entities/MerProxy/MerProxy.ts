import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class MerProxy extends Entity {
  constructor() {
    super({
      id: 'MerProxy',
      version: '1.0.0',
      description: 'Mer Provider Proxy Subsystem'
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default MerProxy;
