import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class CalculatorSystem extends Entity {
  constructor() {
    super({
      id: 'CalculatorSystem',
      version: '1.0.0',
      description: 'Root Calculator Application Entity orchestrating Display and Logger'
    });
  }

  async boot(): Promise<void> {
    // Flow definition connecting Calculate -> Display.Show -> Logger.Audit
    this.flow('ComputeAndDisplay')
      .then('Calculate')
      .then('Display.Show')
      .then('Logger.Audit')
      .register({ visibility: 'public' });

    // Auto-discover child entities and quad-units
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default CalculatorSystem;
