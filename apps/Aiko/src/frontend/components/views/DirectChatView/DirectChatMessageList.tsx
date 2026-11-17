import React, { useState } from 'react';
import { Bot, User, AlertCircle, KeyRound, Zap, Workflow, Copy, Check } from 'lucide-react';
import { ChatMessage } from './types.js';
import { AgentExecutionCard } from './AgentExecutionCard.js';
import { BaseButton } from '@ultrst-armada/floks';

export interface DirectChatMessageListProps {
  messages: ChatMessage[];
  onCopyFullChat?: () => void;
}

export const DirectChatMessageList: React.FC<DirectChatMessageListProps> = ({
  messages,
  onCopyFullChat
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySingle = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (content: string, mentions?: ChatMessage['workflowMentions']) => {
    if (!mentions || mentions.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
    }

    const mentionNames = new Set(mentions.map(m => m.workflowName.toLowerCase()));
    const tokens = content.split(/(@[A-Za-z0-9_-]+)/g);

    return (
      <p className="whitespace-pre-wrap leading-relaxed">
        {tokens.map((token, idx) => {
          if (token.startsWith('@')) {
            const name = token.slice(1).toLowerCase();
            if (mentionNames.has(name)) {
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded border text-[11px] mx-0.5"
                  style={{
                    backgroundColor: 'var(--skipo-matte-bg, var(--skipo-surface-hover))',
                    borderColor: 'var(--skipo-info)',
                    color: 'var(--skipo-info)'
                  }}
                >
                  <Workflow className="w-2.5 h-2.5" />
                  <span>{token}</span>
                </span>
              );
            }
          }
          return <span key={idx}>{token}</span>;
        })}
      </p>
    );
  };

  return (
    <div
      className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl border min-h-[160px] transition-colors duration-200 relative"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        color: 'var(--skipo-text)'
      }}
    >
      {/* Top action bar: Copy Full Chat */}
      {messages.length > 0 && onCopyFullChat && (
        <div className="sticky top-0 z-10 flex justify-end pb-2">
          <BaseButton
            size="sm"
            variant="secondary"
            onClick={onCopyFullChat}
            className="text-[10px] h-6 px-2 shadow-sm bg-[var(--skipo-surface)]/90 backdrop-blur-sm border"
            icon={<Copy size={11} />}
          >
            Copy Full Chat
          </BaseButton>
        </div>
      )}

      {messages.length === 0 ? (
        <div
          className="h-full min-h-[140px] flex flex-col items-center justify-center"
          style={{ color: 'var(--skipo-text-muted)' }}
        >
          <Bot className="w-10 h-10 mb-2 opacity-50" style={{ color: 'var(--skipo-accent)' }} />
          <p className="text-xs">
            Type a prompt or mention a workflow (e.g.{' '}
            <span className="font-mono font-bold" style={{ color: 'var(--skipo-info)' }}>
              @DocuStack
            </span>
            ) to start orchestrating.
          </p>
        </div>
      ) : (
        messages.map((m) => (
          <div key={m.id} className={`flex gap-3 group relative ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div
                className="p-2 rounded-lg h-fit shrink-0 border"
                style={
                  m.error
                    ? { backgroundColor: 'var(--skipo-danger-bg, var(--skipo-surface-hover))', borderColor: 'var(--skipo-danger)', color: 'var(--skipo-danger)' }
                    : { backgroundColor: 'var(--skipo-surface-hover)', borderColor: 'var(--skipo-border-color)', color: 'var(--skipo-accent)' }
                }
              >
                {m.error ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
            )}

            <div
              className="max-w-2xl p-3.5 rounded-xl text-xs space-y-2 border transition-colors duration-200 relative group/msg"
              style={
                m.role === 'user'
                  ? {
                      backgroundColor: 'var(--skipo-accent)',
                      borderColor: 'var(--skipo-border-color)',
                      color: 'var(--skipo-accent-fg)',
                      boxShadow: 'var(--skipo-shadow-btn)'
                    }
                  : m.error
                  ? {
                      backgroundColor: 'var(--skipo-danger-bg, var(--skipo-surface-hover))',
                      borderColor: 'var(--skipo-danger)',
                      color: 'var(--skipo-danger)'
                    }
                  : {
                      backgroundColor: 'var(--skipo-surface-hover)',
                      borderColor: 'var(--skipo-border-color)',
                      color: 'var(--skipo-text)'
                    }
              }
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">{renderMessageContent(m.content, m.workflowMentions)}</div>
                <button
                  type="button"
                  onClick={() => handleCopySingle(m.content, m.id)}
                  title="Copy message"
                  className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded hover:bg-black/20 text-current shrink-0"
                >
                  {copiedId === m.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>

              {m.agentExecution && (
                <AgentExecutionCard execution={m.agentExecution} />
              )}

              {(m.keyLabel || m.keyUsedId || m.latencyMs) && (
                <div
                  className="flex flex-wrap items-center gap-2 pt-1 border-t text-[10px]"
                  style={{
                    borderColor: 'var(--skipo-border-color)',
                    color: 'var(--skipo-text-muted)'
                  }}
                >
                  {(m.keyLabel || m.keyUsedId) && (
                    <span
                      className="flex items-center gap-1 font-mono px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: 'var(--skipo-matte-bg, var(--skipo-surface-hover))',
                        borderColor: 'var(--skipo-border-color)',
                        color: 'var(--skipo-text)'
                      }}
                    >
                      <KeyRound className="w-3 h-3" style={{ color: 'var(--skipo-info)' }} />
                      <span>Used Key: {m.keyLabel || m.keyUsedId}</span>
                    </span>
                  )}
                  {m.latencyMs && (
                    <span className="flex items-center gap-0.5 font-mono" style={{ color: 'var(--skipo-warning)' }}>
                      <Zap className="w-3 h-3" />
                      <span>{m.latencyMs}ms</span>
                    </span>
                  )}
                  {m.modelId && (
                    <span className="font-mono opacity-80" style={{ color: 'var(--skipo-text-muted)' }}>
                      {m.modelId}
                    </span>
                  )}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div
                className="p-2 rounded-lg border h-fit shrink-0"
                style={{
                  backgroundColor: 'var(--skipo-surface-hover)',
                  borderColor: 'var(--skipo-border-color)',
                  color: 'var(--skipo-text)'
                }}
              >
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DirectChatMessageList;
