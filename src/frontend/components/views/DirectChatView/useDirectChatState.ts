/**
 * ASCII Architecture Flowchart: useDirectChatState
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize useDirectChatState │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          handleSend              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiKeyEntry, ProviderId, RotationStrategy } from '../../../../backend/types.js';
import { ChatMessage } from './types.js';
import type { AikoWorkflow } from '../../../../libraries/workflowContracts.js';
import { apiClient } from '../../../../libraries/apiClient.js';

export interface UseDirectChatStateOptions {
  keys?: ApiKeyEntry[];
  initialProviderId?: ProviderId;
  initialModelId?: string;
  strategy?: RotationStrategy;
  activeWorkspace?: string | null;
  onRefresh?: () => Promise<void>;
  onSetStrategy?: (st: RotationStrategy) => void;
}

export function useDirectChatState({
  keys = [],
  initialProviderId = 'google',
  initialModelId = 'gemini-2.5-flash',
  strategy = 'lowest-latency',
  activeWorkspace,
  onRefresh,
  onSetStrategy
}: UseDirectChatStateOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(initialProviderId);
  const [selectedModel, setSelectedModel] = useState<string>(initialModelId);
  const [loading, setLoading] = useState(false);
  const [showGalaxy, setShowGalaxy] = useState(false);

  const [nextKeyId, setNextKeyId] = useState<string | null>(null);
  const [permanentKeyId, setPermanentKeyId] = useState<string | null>(null);
  const [activeInFlightKeyId, setActiveInFlightKeyId] = useState<string | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<RotationStrategy>(strategy);
  const [failedKeyIds] = useState<string[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<AikoWorkflow[]>([]);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await apiClient.getWorkflows(activeWorkspace || 'default');
      setAvailableWorkflows(Array.isArray(res.workflows) ? res.workflows : []);
    } catch {
      setAvailableWorkflows([]);
    }
  }, [activeWorkspace]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const refreshRotationState = async () => {
    if (onRefresh) await onRefresh();
  };

  const handleStrategyChange = (st: RotationStrategy) => {
    setCurrentStrategy(st);
    if (onSetStrategy) onSetStrategy(st);
  };

  const handleSetNextKey = (keyId: string) => setNextKeyId(keyId);
  const handleSetPermanentKey = (keyId: string) => setPermanentKeyId(keyId);
  const handleToggleKeyStatus = (_keyId: string) => { refreshRotationState(); };

  const handleSend = async () => {
    if (!inputPrompt.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputPrompt,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentPrompt = inputPrompt;
    setInputPrompt('');
    setLoading(true);

    try {
      const startTime = Date.now();
      const res = await apiClient.sendDirectAgentChat({
        workspaceId: activeWorkspace || 'default',
        providerId: selectedProvider,
        modelId: selectedModel,
        prompt: currentPrompt
      });

      const latencyMs = Date.now() - startTime;
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: res.text || res.content || 'Response received.',
        timestamp: new Date().toISOString(),
        latencyMs,
        modelId: selectedModel,
        agentExecution: res.agentExecution,
        workflowMentions: res.workflowMentions
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Error processing request',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    inputPrompt,
    setInputPrompt,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    loading,
    showGalaxy,
    setShowGalaxy,
    nextKeyId,
    permanentKeyId,
    activeInFlightKeyId,
    currentStrategy,
    failedKeyIds,
    availableWorkflows,
    setAvailableWorkflows,
    loadWorkflows,
    handleSend,
    handleStrategyChange,
    handleSetNextKey,
    handleSetPermanentKey,
    handleToggleKeyStatus,
    refreshRotationState
  };
}

export default useDirectChatState;
