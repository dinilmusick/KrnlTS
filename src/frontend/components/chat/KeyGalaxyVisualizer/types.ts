import { ApiKeyEntry, RotationStrategy, ProviderId } from '../../../../backend/types.js';

export interface KeyGalaxyVisualizerProps {
  selectedModel?: string;
  selectedProvider?: string;
  keys?: ApiKeyEntry[];
  nextKeyId?: string;
  permanentKeyId?: string;
  activeInFlightKeyId?: string;
  failedKeyIds?: string[];
  strategy?: RotationStrategy;
  onSetStrategy?: (strategy: RotationStrategy) => void;
  onRefreshKeys?: () => Promise<void>;
  onSelectModelNode?: (modelId: string) => void;
  onSetNextKey?: (keyId: string) => void;
  onSetPermanentKey?: (keyId: string | null) => void;
  onExploreKey?: (keyId: string) => void;
  onToggleKeyStatus?: (keyId: string) => void;
  messages?: any[];
  loading?: boolean;
}