/**
 * @file DirectChatInput.tsx
 * @description Chat composer input area with send button and keyboard submit
 */

import React, { useState } from 'react';
import { Bug, Send } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import { BaseTextarea } from '../../base/BaseTextarea.js';

export interface DirectChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  toolsSlot?: React.ReactNode;
  onReportBug?: (description: string) => void;
}

export const DirectChatInput: React.FC<DirectChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a prompt... (Shift+Enter for new line)',
  toolsSlot,
  onReportBug,
}) => {
  const [content, setContent] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim());
    setContent('');
  };

  return (
    <div className="p-3 border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">{toolsSlot}{onReportBug && <BaseButton size="sm" variant="ghost" onClick={() => content.trim() && onReportBug(content.trim())} disabled={disabled || !content.trim()} title="Report bug"><Bug size={13} /> Report bug</BaseButton>}</div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <BaseTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
          />
        </div>

        <BaseButton
          variant="accent"
          onClick={handleSend}

          disabled={disabled || !content.trim()}
          className="p-2.5 h-[42px] flex items-center justify-center shrink-0"
        >
          <Send size={15} />
        </BaseButton>
      </div>
    </div>
  );
};
