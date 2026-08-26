import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class AikoGateway extends Entity {
  constructor() {
    super({
      id: 'AikoGateway',
      version: '1.0.0',
      description: 'Aiko Gateway Router and Matching Engine Subsystem'
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default AikoGateway;
