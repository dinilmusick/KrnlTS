/**
 * @file DirectChatMessageList.tsx
 * @description Scrollable chat message stream rendering user, assistant, and system messages
 */

import React from 'react';
import { User, Bot } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  toolCalls?: Array<{ id: string; name: string }>;
}

export interface DirectChatMessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  className?: string;
}

export const DirectChatMessageList: React.FC<DirectChatMessageListProps> = ({
  messages,
  isStreaming = false,
  className = '',
}) => {
  return (
    <div className={`space-y-4 p-4 overflow-y-auto font-mono text-xs ${className}`}>
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
          <Bot size={28} className="opacity-40" />
          <p>No messages yet. Send a prompt to start conversation.</p>
        </div>
      ) : (
        messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-xl p-3 border leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.timestamp && (
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          );
        })
      )}

      {isStreaming && (
        <div className="flex gap-3 justify-start items-center text-slate-400 text-[11px]">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span>Generating response...</span>
        </div>
      )}
    </div>
  );
};
