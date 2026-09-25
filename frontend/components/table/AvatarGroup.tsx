'use client';

import React from 'react';
import { AppIcon } from '@/components/common/DashboardIcon';

export interface TableMember {
  deviceId: string;
  name: string;
  socketId?: string;
  isMe?: boolean;
}

export interface AvatarGroupProps {
  members: TableMember[];
  myDeviceId?: string;
  customerName?: string;
  onEditMyName?: () => void;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  lang?: 'vi' | 'en' | 'zh';
}

/**
 * Extracts initials from member name (e.g. "Hoài Nam" -> "HN", "Alex" -> "AL")
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Curated color palette for avatar circles to ensure high contrast and vibrant aesthetics
 */
const AVATAR_PALETTES = [
  'bg-sky-500 text-white',
  'bg-indigo-600 text-white',
  'bg-emerald-600 text-white',
  'bg-violet-600 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-cyan-600 text-white',
  'bg-blue-600 text-white',
];

export function getAvatarColor(key: string, isMe?: boolean): string {
  if (isMe) {
    return 'bg-gradient-to-tr from-[#0284c7] to-[#38BDF8] text-white';
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * AvatarGroup Component (NameThatUI - Facepile / Stacked Avatars pattern)
 * Displays overlapping circular avatars with surface color rings and overflow +N badge
 */
export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  members,
  myDeviceId,
  customerName,
  onEditMyName,
  maxVisible = 4,
  size = 'md',
  lang = 'vi',
}) => {
  // Sort members so the current user is always shown first
  const sortedMembers = [...members].sort((a, b) => {
    const aIsMe = a.deviceId === myDeviceId || (customerName && a.name === customerName);
    const bIsMe = b.deviceId === myDeviceId || (customerName && b.name === customerName);
    if (aIsMe) return -1;
    if (bIsMe) return 1;
    return 0;
  });

  const visibleMembers = sortedMembers.slice(0, maxVisible);
  const overflowCount = Math.max(0, sortedMembers.length - maxVisible);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-xs',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-sm',
  }[size];

  const ringClass = 'ring-2 ring-slate-50 dark:ring-[#0F172A]';

  return (
    <div className="flex items-center -space-x-2 sm:-space-x-2.5 overflow-visible">
      {visibleMembers.map((member, index) => {
        const isMe =
          member.deviceId === myDeviceId ||
          (customerName && member.name === customerName) ||
          member.isMe;
        const hasCustomName = isMe ? Boolean(customerName && customerName.trim()) : Boolean(member.name && member.name.trim());
        const initials = isMe && !hasCustomName ? '+' : getInitials(member.name || customerName);
        const colorClass = getAvatarColor(member.deviceId || member.name || `${index}`, isMe);

        const tooltip = isMe
          ? (customerName
              ? `${customerName} (${lang === 'en' ? 'You - Click to change name' : 'Bạn - Bấm để đổi tên'})`
              : (lang === 'en' ? 'You - Click to enter name' : 'Bạn - Bấm để nhập tên'))
          : member.name || (lang === 'en' ? 'Guest' : 'Khách');

        return (
          <div
            key={member.deviceId || `${index}`}
            className="relative group transition-all duration-200"
            style={{ zIndex: visibleMembers.length - index }}
          >
            <button
              type="button"
              onClick={isMe ? onEditMyName : undefined}
              className={`${sizeClasses} ${ringClass} ${colorClass} rounded-full flex items-center justify-center font-black tracking-tight select-none shadow-xs transition-transform duration-150 group-hover:scale-115 group-hover:z-30 cursor-pointer active:scale-95 focus:outline-none`}
              title={tooltip}
              aria-label={tooltip}
            >
              <span>{initials}</span>

              {/* Online pulse indicator for current user */}
              {isMe && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1.5 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </button>
          </div>
        );
      })}

      {/* Overflow Avatar Circle (+N) */}
      {overflowCount > 0 && (
        <div
          className="relative group transition-all duration-200"
          style={{ zIndex: 0 }}
        >
          <div
            className={`${sizeClasses} ${ringClass} rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold flex items-center justify-center select-none shadow-xs group-hover:scale-110 transition-transform`}
            title={
              lang === 'en'
                ? `+${overflowCount} more members`
                : lang === 'zh'
                ? `还有 ${overflowCount} 位成员`
                : `+${overflowCount} thành viên khác`
            }
          >
            <span className="leading-none text-[11px] sm:text-xs">+{overflowCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};
