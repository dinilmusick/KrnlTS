import React, { useMemo } from 'react';
import { ApiKeyEntry, RotationStrategy } from '../../../../backend/types.js';
import { SolarSystemVisualizer } from '../../solarSystem/SolarSystemVisualizer.js';
import { buildAgentSolarSystem } from '../../../lib/agentNetworkBuilder.js';

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

export const KeyGalaxyVisualizer: React.FC<KeyGalaxyVisualizerProps> = ({
  selectedModel = '',
  selectedProvider = 'google',
  keys = [],
  onSelectModelNode
}) => {
  const solarData = useMemo(() => {
    return buildAgentSolarSystem({
      keys,
      catalog: selectedModel ? [{ id: selectedModel, name: selectedModel, providerId: (selectedProvider as any) || 'google', intelligenceSpec: {} as any }] : [],
      rootName: 'Aiko Agent',
      rootIcon: 'Brain',
      rootDescription: 'Aiko Central Orchestration Agent'
    });
  }, [keys, selectedModel, selectedProvider]);

  return (
    <div className="w-full h-full select-none">
      <SolarSystemVisualizer
        data={solarData}
        height={320}
        onSelectEntity={(entity) => {
          if (entity.kind === 'model' && entity.modelId && onSelectModelNode) {
            onSelectModelNode(entity.modelId);
          }
        }}
      />
    </div>
  );
};

export default KeyGalaxyVisualizer;
