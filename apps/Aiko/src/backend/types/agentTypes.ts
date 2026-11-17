import type { IntelligenceSpec } from '../intelligence/types.js';

export type SubAgentRole = 'router' | 'enhancer' | 'generative' | 'custom' | string;

export interface SubAgentSkill {
  id: string;
  name: string;
  description: string;
  workflowIds?: string[];
  endpointRefs?: string[];
  endpoint?: { method?: string; url?: string; path?: string; headers?: Record<string,string>; payload?: any; rawCurl?: string };
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

export interface AgentIntelligenceSpecs {
  router?: string;
  enhancer?: string;
  generative?: string;
  default?: string;
  [role: string]: string | undefined;
}

export interface AgentSubAgents {
  router?: SubAgentDefinition;
  enhancer?: SubAgentDefinition;
  generative?: SubAgentDefinition;
  [role: string]: SubAgentDefinition | undefined;
}

export interface AgentDefinition {
  schemaVersion?: string;
  id?: string;
  name?: string;
  description?: string;
  intelligenceSpec?: IntelligenceSpec;
  agentType: 'AIKO';
  intelligenceSpecId?: string;
  intelligenceSpecs?: AgentIntelligenceSpecs;
  subAgents: AgentSubAgents;
}

export function createDefaultAgentDefinition(name: string, defaultSpecId?: string): AgentDefinition {
  const routerSpec = defaultSpecId || 'preset-agent';
  const enhancerSpec = defaultSpecId || 'preset-agent';
  return {
    schemaVersion: '1.0.0',
    id: 'agent-' + name.toLowerCase().replace(/\s+/g, '-'),
    name: name + 'Agent',
    description: 'Semantic workflow orchestration agent for ' + name,
    agentType: 'AIKO',
    intelligenceSpecId: defaultSpecId || 'preset-agent',
    intelligenceSpecs: { router: routerSpec, enhancer: enhancerSpec, generative: enhancerSpec, default: defaultSpecId || 'preset-agent' },
    subAgents: {
      router: { id: 'subagent-' + name.toLowerCase() + '-router', name: name + 'Router', role: 'router', description: 'Semantic workflow intent router', intelligenceSpecId: routerSpec, prioritiseReasoning: true },
      enhancer: { id: 'subagent-' + name.toLowerCase() + '-enhancer', name: name + 'Enhancer', role: 'enhancer', description: 'Workflow input and context resolver', intelligenceSpecId: enhancerSpec, prioritiseDeterminism: true },
      generative: { id: 'subagent-' + name.toLowerCase() + '-generative', name: name + 'Generative', role: 'generative', description: 'Workflow result synthesis subagent', intelligenceSpecId: enhancerSpec, prioritiseDeterminism: true }
    }
  };
}

export function validateAgentDefinition(agent: any): { valid: boolean; errors: string[] } {
  if (!agent || typeof agent !== 'object') return { valid: false, errors: ['Agent definition must be an object'] };
  const errors: string[] = [];
  if (agent.agentType && agent.agentType !== 'AIKO') errors.push('Invalid agentType: expected AIKO');
  if (agent.subAgents && typeof agent.subAgents !== 'object') errors.push('subAgents property must be an object collection');
  if (agent.intelligenceSpecs && typeof agent.intelligenceSpecs !== 'object') errors.push('intelligenceSpecs property must be an object collection');
  return { valid: errors.length === 0, errors };
}

export function hydrateAgentDefinition(existingAgent?: AgentDefinition, name = 'Aiko', defaultSpecId?: string): AgentDefinition {
  if (!existingAgent) return createDefaultAgentDefinition(name, defaultSpecId);
  const base = createDefaultAgentDefinition(name, defaultSpecId);
  return {
    ...base,
    ...existingAgent,
    agentType: 'AIKO',
    intelligenceSpecId: existingAgent.intelligenceSpecId || defaultSpecId || base.intelligenceSpecId,
    intelligenceSpecs: { ...base.intelligenceSpecs, ...(existingAgent.intelligenceSpecs || {}) },
    subAgents: { ...base.subAgents, ...(existingAgent.subAgents || {}) }
  };
}
