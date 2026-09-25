'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Chat Bubble (Message Bubble) — NameThatUI Pattern: /web/chat-bubble
 * Specification: The rounded box around one message in a conversation, yours on one side, theirs on the other.
 */
export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  sender?: 'user' | 'assistant' | 'system';
  avatar?: React.ReactNode;
  time?: React.ReactNode;
  status?: React.ReactNode;
  children: React.ReactNode;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  sender = 'assistant',
  avatar,
  time,
  status,
  children,
  className,
  ...props
}) => {
  const isUser = sender === 'user';
  const isSystem = sender === 'system';

  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-2', className)} {...props}>
        <div className="px-3 py-1 rounded-full text-[11px] font-normal bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2.5 my-2.5',
        isUser ? 'flex-row-reverse justify-start' : 'flex-row justify-start',
        className
      )}
      {...props}
    >
      {avatar && <div className="shrink-0 mb-1">{avatar}</div>}
      <div className={cn('flex flex-col max-w-[85%] sm:max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-2.5 text-xs font-normal leading-relaxed rounded-2xl shadow-2xs',
            isUser
              ? 'bg-[#38BDF8] text-[#090D16] font-medium rounded-br-xs'
              : 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-white/10 rounded-bl-xs'
          )}
        >
          {children}
        </div>
        {(time || status) && (
          <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            {time && <span>{time}</span>}
            {status && <span>{status}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
