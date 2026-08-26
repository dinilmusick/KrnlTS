import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class Logger extends Entity {
  constructor() {
    super({
      id: 'Logger',
      version: '1.0.0',
      description: 'Calculator Audit logging component entity'
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default Logger;
