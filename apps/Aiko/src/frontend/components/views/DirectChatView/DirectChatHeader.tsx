import React from 'react';
import { BaseButton, BaseSelect } from '@ultrst-armada/floks';
import { MessageSquare, Key } from 'lucide-react';
import { ProviderId, ModelCatalogEntry } from '../../../../backend/types.js';

export type ChatMode = 'direct' | 'agent';

export interface DirectChatHeaderProps {
  onCloseToGraph?: () => void;
  selectedProvider: ProviderId;
  setSelectedProvider: (p: ProviderId) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  catalog: ModelCatalogEntry[];
  showGalaxy: boolean;
  setShowGalaxy: (s: boolean) => void;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  onOpenKeyManager?: (providerId?: ProviderId) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'cerebras', label: 'Cerebras' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'together', label: 'Together AI' },
  { value: 'nvidia', label: 'NVIDIA NIM' },
  { value: 'huggingface', label: 'HuggingFace' }
];

export const DirectChatHeader: React.FC<DirectChatHeaderProps> = ({
  selectedProvider,
  setSelectedProvider,
  selectedModel,
  setSelectedModel,
  catalog,
  showGalaxy,
  setShowGalaxy,
  chatMode,
  setChatMode,
  onOpenKeyManager
}) => {
  const modelOptions = catalog
    .filter(m => m.providerId === selectedProvider)
    .map(m => ({ value: m.id, label: m.name }));

  return (
    <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--skipo-border-color,#334155)] gap-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-[var(--skipo-accent,#6366f1)] text-[var(--skipo-accent-fg,#ffffff)] flex items-center justify-center font-black shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
          <MessageSquare size={15} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black tracking-wider uppercase font-mono" style={{ color: 'var(--skipo-text)' }}>
              Aiko Chat
            </h2>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border"
              style={{
                backgroundColor: 'var(--skipo-matte-bg, var(--skipo-surface-hover))',
                borderColor: chatMode === 'agent' ? 'var(--skipo-accent)' : 'var(--skipo-info)',
                color: chatMode === 'agent' ? 'var(--skipo-accent)' : 'var(--skipo-info)'
              }}
            >
              {chatMode === 'agent' ? 'AIKO AGENT NETWORK' : 'DIRECT MODEL CHAT'}
            </span>
          </div>
          <p className="text-[10px] font-mono" style={{ color: 'var(--skipo-text-muted)' }}>
            {chatMode === 'agent'
              ? 'Multi-agent orchestration hierarchy with tool & endpoint subagents'
              : 'Direct model prompt invocation with key rotation'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Mode Switcher */}
        <div className="flex items-center p-0.5 bg-[var(--skipo-surface)] rounded-lg border border-[var(--skipo-border-color)]">
          <button
            type="button"
            onClick={() => setChatMode('direct')}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              chatMode === 'direct'
                ? 'bg-[var(--skipo-accent)] text-white shadow-sm'
                : 'text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)]'
            }`}
          >
            Direct Chat
          </button>
          <button
            type="button"
            onClick={() => setChatMode('agent')}
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              chatMode === 'agent'
                ? 'bg-[var(--skipo-accent)] text-white shadow-sm'
                : 'text-[var(--skipo-text-muted)] hover:text-[var(--skipo-text)]'
            }`}
          >
            Aiko Agent Chat
          </button>
        </div>

        {/* Direct Mode Dropdowns */}
        {chatMode === 'direct' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[var(--skipo-text-muted,#94a3b8)]">
                Provider:
              </span>
              <div className="w-32 min-w-[120px]">
                <BaseSelect
                  className="w-full text-xs font-mono py-1 px-2 h-7"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as ProviderId)}
                  options={PROVIDER_OPTIONS}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[var(--skipo-text-muted,#94a3b8)]">
                Model:
              </span>
              <div className="w-44 min-w-[160px]">
                <BaseSelect
                  className="w-full text-xs font-mono py-1 px-2 h-7"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  options={modelOptions.length ? modelOptions : [{ value: selectedModel, label: selectedModel }]}
                />
              </div>
            </div>
          </>
        )}

        {/* Global Key Manager Shortcut */}
        {onOpenKeyManager && (
          <BaseButton
            variant="secondary"
            size="sm"
            className="text-[10px] h-7 px-2"
            onClick={() => onOpenKeyManager(selectedProvider)}
            icon={<Key size={12} />}
          >
            Keys
          </BaseButton>
        )}
      </div>
    </div>
  );
};

export default DirectChatHeader;
