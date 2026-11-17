import type { ToolDefinition } from './toolContracts.js';
import type { IntelligenceSpec } from './intelligenceContracts.js';

export type SubAgentRole = 'router' | 'enhancer' | 'generative' | 'custom' | string;

export interface SubAgentSkill {
  id: string;
  name: string;
  description: string;
  endpointRefs?: string[];
  endpoint?: {
    method?: string;
    url?: string;
    path?: string;
    headers?: Record<string, string>;
    payload?: any;
    payloadDescription?: string;
    rawCurl?: string;
  };
}

export interface SubAgentDefinition {
  id?: string;
  name?: string;
  role: SubAgentRole;
  description?: string;
  systemPrompt?: string;
  iconName?: string;
  skills?: SubAgentSkill[];
  learnings?: Array<{ id: string; content: string }>;
  isCustom?: boolean;
  canPromptOtherSubAgents?: boolean;
  intelligenceSpecId?: string;
  preferenceSpecId?: string;
  overrideModel?: boolean;
  manualModels?: string[];
  prioritiseReasoning?: boolean;
  prioritiseDeterminism?: boolean;
  avoidPaidProviders?: boolean;
  selectedProvider?: string;
  selectedModel?: string;
}

export interface AgentDefinition {
  schemaVersion?: string;
  id?: string;
  name?: string;
  description?: string;
  tool?: Partial<ToolDefinition>;
  intelligenceSpec?: IntelligenceSpec;
  agentType: 'TOOL' | 'ENDPOINT' | 'AIKO';
  intelligenceSpecId?: string;
  intelligenceSpecs?: Record<string, string | undefined>;
  subAgents: Record<string, SubAgentDefinition | undefined>;
}
