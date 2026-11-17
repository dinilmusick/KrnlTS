import type { SubAgentSkill } from '../../../libraries/agentContracts.js';

export type SolarSystemKind = 'agent' | 'subagent' | 'model' | 'key';

export interface SolarSystemEntity {
  id: string;
  kind: SolarSystemKind;
  name: string;
  label?: string;
  description?: string;
  iconName?: string;
  color: string;
  radius: number;
  weight?: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  x?: number;
  y?: number;
  parentX?: number;
  parentY?: number;
  systemPrompt?: string;
  skills?: SubAgentSkill[];
  status?: string;
  providerId?: string;
  modelId?: string;
  keyId?: string;
  intelligenceSpecId?: string;
  preferenceSpecId?: string;
  overrideModel?: boolean;
  manualModels?: string[];
  selectedModel?: string;
  children?: SolarSystemEntity[];
}

export interface SolarSystemGraphData {
  root: SolarSystemEntity;
  totalSubAgents: number;
  totalModels: number;
  totalKeys: number;
}
