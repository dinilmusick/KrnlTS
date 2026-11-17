import { ProviderId, RotationStrategy, ModelCatalogEntry, ApiKeyEntry } from '../../../../backend/types.js';
import { IntelligenceSpecPreset, PreferencesSpecPreset } from '../../../../backend/intelligence/types.js';
import type { WorkflowMention, AgentExecutionState } from '../../../../backend/agentic/chat/types.js';
import type { AikoWorkflow } from '../../../../libraries/workflowContracts.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  workflowMentions?: WorkflowMention[];
  toolMentions?: Array<{ toolName: string; featureName?: string }>;
  agentExecution?: AgentExecutionState;
  finalResult?: any;
  error?: boolean;
  errorMessage?: string;
  providerId?: ProviderId;
  modelId?: string;
  keyUsedId?: string;
  keyLabel?: string;
  latencyMs?: number;
}

export interface DirectChatViewProps {
  onCloseToGraph: () => void;
  catalog: ModelCatalogEntry[];
  keys?: ApiKeyEntry[];
  presets?: IntelligenceSpecPreset[];
  activePresetId?: string | null;
  onSelectPreset?: (preset: IntelligenceSpecPreset) => void;
  preferencesPresets?: PreferencesSpecPreset[];
  activePreferencesPresetId?: string | null;
  onSelectPreferencesPreset?: (preset: PreferencesSpecPreset) => void;
  onOpenSpecWindow?: () => void;
  onOpenKeyManager?: (providerId?: ProviderId, keyId?: string) => void;
  strategy?: RotationStrategy;
  initialProviderId?: ProviderId;
  initialModelId?: string;
  onRefresh?: () => Promise<void>;
  onSetStrategy?: (st: RotationStrategy) => void;
  onAddKey?: (payload: { providerId: ProviderId; label: string; key: string; weight?: number }) => void;
  activeWorkspace?: string | null;
  activeWorkspaceName?: string | null;
  availableWorkflows?: AikoWorkflow[];
}