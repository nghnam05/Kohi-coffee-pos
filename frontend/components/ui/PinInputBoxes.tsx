'use client';

import React, { useRef, useEffect } from 'react';

export interface PinInputBoxesProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string;
  className?: string;
}

export function PinInputBoxes({
  length = 4,
  value = '',
  onChange,
  disabled = false,
  autoFocus = true,
  error = '',
  className = '',
}: PinInputBoxesProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      // Clear this digit
      const nextArr = [...digits];
      nextArr[index] = '';
      onChange(nextArr.join(''));
      return;
    }

    if (rawVal.length === 1) {
      const nextArr = [...digits];
      nextArr[index] = rawVal;
      const nextStr = nextArr.join('').slice(0, length);
      onChange(nextStr);
      // Auto-advance to next box
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Pasted or multiple digits
      const nextArr = [...digits];
      for (let i = 0; i < rawVal.length && index + i < length; i++) {
        nextArr[index + i] = rawVal[i];
      }
      const nextStr = nextArr.join('').slice(0, length);
      onChange(nextStr);
      const nextFocus = Math.min(length - 1, index + rawVal.length);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasteData) {
      onChange(pasteData);
      const targetIndex = Math.min(length - 1, pasteData.length);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-center items-center gap-2.5 sm:gap-3.5">
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center font-mono text-2xl sm:text-3xl font-black rounded-2xl border-2 transition-all outline-none ${
              error
                ? 'border-rose-500 bg-rose-500/10 text-rose-500 ring-2 ring-rose-500/20'
                : digits[i]
                ? 'border-[#38BDF8] bg-sky-50/50 dark:bg-sky-500/10 text-slate-900 dark:text-white shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700'
            } focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/20 disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        ))}
      </div>
      {error && <p className="text-xs text-rose-500 font-extrabold text-center mt-1.5">{error}</p>}
    </div>
  );
}
