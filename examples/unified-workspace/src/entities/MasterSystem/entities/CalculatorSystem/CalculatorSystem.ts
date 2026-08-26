import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class CalculatorSystem extends Entity {
  constructor() {
    super({
      id: 'CalculatorSystem',
      version: '1.0.0',
      description: 'Calculator Subsystem with Display and Logger'
    });
  }

  async boot(): Promise<void> {
    this.flow('ComputeDisplayAudit')
      .then('Calculate')
      .then('Display.Show')
      .then('Logger.Audit')
      .register({ visibility: 'public' });

    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default CalculatorSystem;
