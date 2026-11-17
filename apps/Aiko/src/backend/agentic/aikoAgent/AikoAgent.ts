import { WorkspaceRepository } from '../../storage/workspaceRepository.js';
import { workspaceFS } from '../../storage/workspaceFileSystem.js';
import { MemoryStore } from '../../storage/memoryStore.js';
import { LearningStore } from '../../storage/learningStore.js';
import { LearningEngine } from '../learning/learningEngine.js';
import { WorkflowAgent } from './WorkflowAgent.js';
import type { AikoAgentInput, AikoAgentResult } from './types.js';

export class AikoAgent {
  public readonly workflowAgent: WorkflowAgent;
  public readonly workspaceRepo: WorkspaceRepository;
  public readonly learningEngine: LearningEngine;

  constructor(_unused?: unknown, workspaceRepo?: WorkspaceRepository) {
    this.workflowAgent = new WorkflowAgent();
    this.workspaceRepo = workspaceRepo || new WorkspaceRepository(workspaceFS);
    const memStore = new MemoryStore(workspaceFS);
    const learnStore = new LearningStore(this.workspaceRepo);
    this.learningEngine = new LearningEngine(memStore, learnStore);
  }

  public async execute(input: AikoAgentInput): Promise<AikoAgentResult> {
    const memories = await this.workspaceRepo.loadMemories(input.workspace);
    return this.workflowAgent.execute(input, memories);
  }
}

export default AikoAgent;
