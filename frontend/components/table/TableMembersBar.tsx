'use client';

import React from 'react';
import { AppIcon } from '@/components/common/DashboardIcon';
import { AvatarGroup, TableMember } from './AvatarGroup';

export type Lang = 'vi' | 'en' | 'zh';

export interface TableMembersBarProps {
  tableMembers: TableMember[];
  myDeviceId?: string;
  customerName?: string;
  onEditName: () => void;
  cart: any[];
  totalQuantity: number;
  totalAmount: number;
  formatPrice: (price: number, lang: Lang) => string;
  lang?: Lang;
}

export const TableMembersBar: React.FC<TableMembersBarProps> = ({
  tableMembers,
  myDeviceId,
  customerName,
  onEditName,
  cart,
  totalQuantity,
  totalAmount,
  formatPrice,
  lang = 'vi',
}) => {
  // If tableMembers is empty, create a default member for the current user
  const effectiveMembers: TableMember[] =
    tableMembers.length > 0
      ? tableMembers
      : [
          {
            deviceId: myDeviceId || 'me',
            name: customerName || (lang === 'en' ? 'You' : 'Bạn'),
            isMe: true,
          },
        ];

  return (
    <div className="px-4 md:px-5 xl:px-6 py-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2.5 text-xs bg-slate-50/80 dark:bg-[#0F172A]/60 backdrop-blur-xs transition-colors select-none">
      {/* Left: Avatar Group + Member Info */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10.5px] sm:text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">
            {lang === 'en' ? 'Table' : lang === 'zh' ? '同桌' : 'CÙNG BÀN'} ({effectiveMembers.length}):
          </span>
        </div>

        {/* Avatar Group Stack (From NameThatUI facepile pattern) */}
        <AvatarGroup
          members={effectiveMembers}
          myDeviceId={myDeviceId}
          customerName={customerName}
          onEditMyName={onEditName}
          maxVisible={4}
          size="md"
          lang={lang}
        />
      </div>

      {/* Right: Group Cart Brief Indicator */}
      <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 shadow-2xs">
          <AppIcon name="local_mall" className="text-sm text-sky-500 dark:text-sky-400 shrink-0" />
          {totalQuantity > 0 ? (
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-sans">
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                {lang === 'en' ? 'Table Cart:' : lang === 'zh' ? '全桌:' : 'Giỏ chung:'}{' '}
              </span>
              <strong className="text-sky-600 dark:text-sky-400 font-bold">{totalQuantity} {lang === 'en' ? 'items' : 'món'}</strong>
              <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
              <span className="font-extrabold font-mono text-slate-900 dark:text-white">{formatPrice(totalAmount, lang || 'vi')}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
              <span className="hidden sm:inline">
                {lang === 'en' ? 'No items in table cart' : lang === 'zh' ? '全桌购物车为空' : 'Chưa có món trong giỏ chung'}
              </span>
              <span className="sm:hidden">
                {lang === 'en' ? 'Empty cart' : lang === 'zh' ? '暂无' : 'Giỏ trống'}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
