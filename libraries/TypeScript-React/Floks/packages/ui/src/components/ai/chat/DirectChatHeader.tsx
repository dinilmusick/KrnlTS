/**
 * @file DirectChatHeader.tsx
 * @description Header for conversational AI agent chats with model badges and clear actions
 */

import React from 'react';
import { Bot, RotateCcw } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';

export interface DirectChatHeaderProps {
  title?: string;
  modelName?: string;
  providerId?: string;
  onClearHistory?: () => void;
  actionsSlot?: React.ReactNode;
}

export const DirectChatHeader: React.FC<DirectChatHeaderProps> = ({
  title = 'AI Assistant',
  modelName,
  providerId,
  onClearHistory,
  actionsSlot,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Bot size={16} />
        </div>
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{title}</div>
          {modelName && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>{modelName}</span>
              {providerId && <span className="uppercase font-semibold">({providerId})</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actionsSlot}
        {onClearHistory && (
          <BaseButton
            size="sm"
            variant="ghost"
            onClick={onClearHistory}
            title="Clear Chat History"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <RotateCcw size={13} />
          </BaseButton>
        )}
      </div>
    </div>
  );
};
