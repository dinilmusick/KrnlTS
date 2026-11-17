import { ModelCatalogEntry, ProviderId } from '../../../../backend/types.js';

export interface ProviderStatus {
  providerId: ProviderId;
  status: 'online' | 'missing-key' | 'error';
  error?: string;
  modelsCount: number;
}

export interface ModelsBrowserViewProps {
  onCloseToGraph: () => void;
  catalog: ModelCatalogEntry[];
  onOpenSpecWindow?: () => void;
  onOpenKeyManager?: (providerId?: ProviderId) => void;
  providerStatuses?: ProviderStatus[];
  onRefreshEndpoints?: () => Promise<void>;
  onOpenChatWithModel?: (modelId: string, providerId: ProviderId) => void;
}
