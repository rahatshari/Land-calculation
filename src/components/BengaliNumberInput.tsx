import React, { useState, useEffect } from 'react';

interface BengaliNumberInputProps {
  value: number | undefined | null;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;
  autoFocus?: boolean;
}

const EN_TO_BN: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.'
};

const BN_TO_EN: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9', '।': '.', '.': '.'
};

export function convertToBengaliDigits(strOrNum: string | number | undefined | null): string {
  if (strOrNum === undefined || strOrNum === null || strOrNum === '') return '';
  return String(strOrNum).replace(/[0-9.]/g, (char) => EN_TO_BN[char] || char);
}

export function parseBengaliOrEnglishNumber(input: string): number {
  if (!input || !input.trim()) return 0;
  // Convert any Bengali digits or full stop to english
  const normalized = input.replace(/[০-৯।.]/g, (char) => BN_TO_EN[char] || char);
  const cleaned = normalized.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export const BengaliNumberInput: React.FC<BengaliNumberInputProps> = ({
  value,
  onChange,
  placeholder = '০',
  className = '',
  min,
  max,
  step = 1,
  allowDecimals = true,
  autoFocus = false,
}) => {
  // If value is 0 and empty, show empty in input so user doesn't have to erase 0
  const [text, setText] = useState<string>(() => {
    if (value === undefined || value === null || value === 0) return '';
    return convertToBengaliDigits(value);
  });

  const [isFocused, setIsFocused] = useState(false);

  // Sync with incoming external value changes when not actively typing
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null || value === 0) {
        setText('');
      } else {
        setText(convertToBengaliDigits(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Map any typed English digits to Bengali digits
    const bnText = raw.replace(/[0-9.]/g, (char) => EN_TO_BN[char] || char);
    setText(bnText);

    const numVal = parseBengaliOrEnglishNumber(bnText);
    onChange(numVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let numVal = parseBengaliOrEnglishNumber(text);
    if (min !== undefined && numVal < min) numVal = min;
    if (max !== undefined && numVal > max) numVal = max;
    onChange(numVal);
    setText(numVal === 0 ? '' : convertToBengaliDigits(numVal));
  };

  const handleStep = (delta: number) => {
    const current = parseBengaliOrEnglishNumber(text);
    let next = current + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    // Round to step precision
    if (allowDecimals) {
      next = Math.round(next * 100) / 100;
    }
    onChange(next);
    setText(next === 0 ? '' : convertToBengaliDigits(next));
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={text}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          className || 'border-slate-300 text-slate-800 bg-white placeholder:text-slate-300'
        }`}
      />
    </div>
  );
};
