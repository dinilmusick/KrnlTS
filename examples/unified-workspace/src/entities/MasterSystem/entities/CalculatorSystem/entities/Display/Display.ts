import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class Display extends Entity {
  constructor() {
    super({ id: 'Display', version: '1.0.0', description: 'Screen Display Component' });
  }
  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default Display;
