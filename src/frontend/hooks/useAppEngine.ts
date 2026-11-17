/**
 * ASCII Architecture Flowchart: useAppEngine
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize useAppEngine     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │       Sync State & Backend       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │   Return Engine State & Handlers │
 *   └──────────────────────────────────┘
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, ProviderId, RotationStrategy } from '../types/app.js';
import { apiClient } from '../../libraries/apiClient.js';
import type { IntelligenceSpecPreset, PreferencesSpecPreset } from '../../libraries/intelligenceContracts.js';
import { saveCachedUserKey, removeCachedUserKeyByLabel, restoreKeysIfEmpty } from './keyCache.js';
import { DEFAULT_DARK_THEME_PACK, DEFAULT_LIGHT_THEME_PACK, applyThemePack } from '@ultrst-armada/floks';

// ════ HOOK IMPLEMENTATION ═════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export function useAppEngine(enabled = true) {
  const [appState, setAppState] = useState<AppState>({
    theme: 'light',
    activeTab: 'spec',
    keys: [],
    usageStats: [],
    strategy: 'lowest-latency',
    catalog: [],
    logs: [],
    metricsSummary: { totalRequests: 0, successRatePercent: 100, averageLatencyMs: 0, totalFailovers: 0 },
    activeTrafficPulse: null
  });

  const [presets, setPresets] = useState<IntelligenceSpecPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [preferencesPresets, setPreferencesPresets] = useState<PreferencesSpecPreset[]>([]);
  const [activePreferencesPresetId, setActivePreferencesPresetId] = useState<string | null>(null);

  const [selectedChatModel, setSelectedChatModel] = useState<string | undefined>(undefined);
  const [selectedChatProvider, setSelectedChatProvider] = useState<ProviderId | undefined>(undefined);
  const [targetKeyProvider, setTargetKeyProvider] = useState<ProviderId | undefined>(undefined);
  const [targetKeyId, setTargetKeyId] = useState<string | undefined>(undefined);
  const [keyManagerNonce, setKeyManagerNonce] = useState<number>(0);

  const handleOpenKeyManager = (providerId?: ProviderId, keyId?: string) => {
    setTargetKeyProvider(providerId);
    setTargetKeyId(keyId);
    setKeyManagerNonce(Date.now());
    setAppState(s => ({ ...s, activeTab: 'keys' }));
  };

  const loadAllData = useCallback(async () => {
    try {
      const [keyData, catalogResult, metricsData, presetsResult, prefPresetsResult] = await Promise.all([
        apiClient.getKeys(),
        apiClient.getCatalog(),
        apiClient.getMetrics(),
        apiClient.getPresets(),
        apiClient.getPreferencesPresets()
      ]);

      if (presetsResult.success && presetsResult.presets) {
        setPresets(presetsResult.presets);
        if (!activePresetId && presetsResult.presets.length > 0) {
          setActivePresetId(presetsResult.presets[0].id);
        }
      }

      if (prefPresetsResult.success && prefPresetsResult.presets) {
        setPreferencesPresets(prefPresetsResult.presets);
        if (!activePreferencesPresetId && prefPresetsResult.presets.length > 0) {
          setActivePreferencesPresetId(prefPresetsResult.presets[0].id);
        }
      }

      const didRestore = await restoreKeysIfEmpty(keyData.keys || []);
      const activeKeyData = didRestore ? await apiClient.getKeys() : keyData;

      setAppState((prev) => ({
        ...prev,
        keys: activeKeyData.keys,
        usageStats: activeKeyData.usageStats || [],
        strategy: activeKeyData.strategy,
        catalog: catalogResult.catalog,
        providerStatuses: catalogResult.providerStatuses,
        logs: metricsData.logs,
        metricsSummary: metricsData.summary
      }));
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [activePresetId]);

  useEffect(() => {
    if (enabled) void loadAllData();
  }, [loadAllData, enabled]);

  useEffect(() => {
    applyThemePack(appState.theme === 'dark' ? DEFAULT_DARK_THEME_PACK : DEFAULT_LIGHT_THEME_PACK);
  }, [appState.theme]);

  const toggleTheme = () => {
    setAppState((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleAddKey = async (payload: { providerId: ProviderId; label: string; key: string; weight?: number }) => {
    await apiClient.addKey(payload);
    saveCachedUserKey(payload);
    loadAllData();
  };

  const handleDeleteKey = async (id: string) => {
    const keyToDelete = appState.keys.find(k => k.id === id);
    await apiClient.deleteKey(id);
    if (keyToDelete) {
      removeCachedUserKeyByLabel(keyToDelete.label);
    }
    loadAllData();
  };

  const handleSetStrategy = async (strat: RotationStrategy) => {
    await apiClient.setStrategy(strat);
    setAppState((prev) => ({ ...prev, strategy: strat }));
  };

  const handleOpenChatWithModel = (modelId: string, providerId: ProviderId) => {
    setSelectedChatModel(modelId);
    setSelectedChatProvider(providerId);
    setAppState(s => ({ ...s, activeTab: 'chat' }));
  };

  const handleSavePreset = async (preset: IntelligenceSpecPreset) => {
    const existing = presets.find(p => p.id === preset.id);
    if (existing) {
      const res = await apiClient.updatePreset(preset.id, preset);
      if (res.success && res.preset) {
        setPresets(prev => prev.map(p => p.id === preset.id ? res.preset! : p));
        setActivePresetId(preset.id);
      }
    } else {
      const res = await apiClient.createPreset(preset);
      if (res.success && res.preset) {
        setPresets(prev => [...prev, res.preset!]);
        setActivePresetId(res.preset.id);
      }
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    const res = await apiClient.deletePreset(presetId);
    if (res.success) {
      setPresets(prev => prev.filter(p => p.id !== presetId));
      if (activePresetId === presetId) {
        const remaining = presets.filter(p => p.id !== presetId);
        setActivePresetId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  return {
    appState,
    setAppState,
    presets,
    setPresets,
    activePresetId,
    setActivePresetId,
    preferencesPresets,
    setPreferencesPresets,
    activePreferencesPresetId,
    setActivePreferencesPresetId,
    selectedChatModel,
    selectedChatProvider,
    targetKeyProvider,
    targetKeyId,
    keyManagerNonce,
    handleOpenKeyManager,
    loadAllData,
    toggleTheme,
    handleAddKey,
    handleDeleteKey,
    handleVerifyKey: (id: string) => apiClient.verifyKey(id),
    handleUpdateKeyLabel: async (id: string, label: string) => { await apiClient.updateKeyLabel(id, label); loadAllData(); },
    handleSetStrategy,
    handleOpenChatWithModel,
    handleSavePreset,
    handleDeletePreset,
    navigateToDefault: () => setAppState(s => ({ ...s, activeTab: 'spec' })),
    openSpecWindow: () => setAppState(s => ({ ...s, activeTab: 'spec' }))
  };
}