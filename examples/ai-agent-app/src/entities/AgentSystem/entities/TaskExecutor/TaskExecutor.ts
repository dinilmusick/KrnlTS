import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class TaskExecutor extends Entity {
  constructor() {
    super({
      id: 'TaskExecutor',
      version: '1.0.0',
      description: 'Task runtime execution and telemetry logging entity'
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default TaskExecutor;
