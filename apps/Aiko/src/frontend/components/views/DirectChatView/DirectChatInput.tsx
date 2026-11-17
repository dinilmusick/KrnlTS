// ══════════════════════════════════════════════════════════════════════════════════
// ════ DIRECT CHAT INPUT COMPONENT ═════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { BaseButton, BaseTextarea } from '@ultrst-armada/floks';

export interface DirectChatInputProps {
  inputPrompt: string;
  setInputPrompt: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  availableWorkflows?: unknown[];
}

export const DirectChatInput: React.FC<DirectChatInputProps> = ({
  inputPrompt,
  setInputPrompt,
  onSend,
  loading
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && inputPrompt.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--skipo-surface)] border-t border-[var(--skipo-border-color)]">
      <BaseTextarea
        value={inputPrompt}
        onChange={(e) => setInputPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message or workflow request..."
        className="flex-1 min-h-[44px] max-h-32 text-xs font-mono resize-none py-2"
        disabled={loading}
      />
      <BaseButton
        variant="accent"
        size="md"
        onClick={onSend}
        disabled={loading || !inputPrompt.trim()}
        icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      >
        Send
      </BaseButton>
    </div>
  );
};

export default DirectChatInput;
