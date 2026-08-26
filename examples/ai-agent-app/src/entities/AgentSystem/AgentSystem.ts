import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class AgentSystem extends Entity {
  constructor() {
    super({
      id: 'AgentSystem',
      version: '1.0.0',
      description: 'Autonomous AI Multi-Agent System'
    });
  }

  async boot(): Promise<void> {
    // Flow: PlanGoal -> PlannerEngine.ExecuteTask -> TaskExecutor.StreamTelemetry
    this.flow('AgentLoop')
      .then('PlanGoal')
      .then('PlannerEngine.ExecuteTask')
      .then('TaskExecutor.StreamTelemetry')
      .register({ visibility: 'public' });

    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default AgentSystem;
