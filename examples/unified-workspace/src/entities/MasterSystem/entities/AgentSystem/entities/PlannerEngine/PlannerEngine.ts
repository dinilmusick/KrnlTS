import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class PlannerEngine extends Entity {
  constructor() {
    super({ id: 'PlannerEngine', version: '1.0.0', description: 'Autonomous Step Planner' });
  }
  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default PlannerEngine;
