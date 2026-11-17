import React, { useState } from 'react';
import { DirectChatViewProps } from './types.js';
import { useDirectChatState } from './useDirectChatState.js';
import { DirectChatHeader, ChatMode } from './DirectChatHeader.js';
import { DirectChatMessageList } from './DirectChatMessageList.js';
import { DirectChatInput } from './DirectChatInput.js';

export const DirectChatView: React.FC<DirectChatViewProps> = ({
  onCloseToGraph,
  catalog = [],
  keys = [],
  initialProviderId = 'google',
  initialModelId = 'gemini-2.5-flash',
  onOpenKeyManager,
  strategy = 'lowest-latency',
  onRefresh,
  onSetStrategy,
  activeWorkspace
}) => {
  const [chatMode, setChatMode] = useState<ChatMode>('agent');
  const [showGalaxy, setShowGalaxy] = useState(false);
  const {
    messages,
    inputPrompt,
    setInputPrompt,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    loading,
    availableWorkflows,
    handleSend
  } = useDirectChatState({ keys, initialProviderId, initialModelId, strategy, activeWorkspace, onRefresh, onSetStrategy });

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-3 flex flex-col h-[88vh]">
      <DirectChatHeader
        onCloseToGraph={onCloseToGraph}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        catalog={catalog}
        showGalaxy={showGalaxy}
        setShowGalaxy={setShowGalaxy}
        chatMode={chatMode}
        setChatMode={setChatMode}
        onOpenKeyManager={onOpenKeyManager}
      />
      <div className="text-[10px] text-[var(--skipo-text-muted)] px-1">
        {availableWorkflows.length} workflow{availableWorkflows.length === 1 ? '' : 's'} available in this workspace.
      </div>
      <DirectChatMessageList messages={messages} />
      <DirectChatInput inputPrompt={inputPrompt} setInputPrompt={setInputPrompt} onSend={handleSend} loading={loading} availableWorkflows={availableWorkflows} />
    </div>
  );
};

export default DirectChatView;
