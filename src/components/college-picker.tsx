'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useSuggestions } from '@/hooks/use-leads';

interface CollegePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  minLength?: number;
  allowFreeform?: boolean;
}

export function CollegePicker({
  value,
  onValueChange,
  placeholder = 'Type college name...',
  className,
  label,
  minLength = 1,
  allowFreeform = true,
}: CollegePickerProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useSuggestions(
    'preferredCollege',
    query,
    minLength,
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const visibleSuggestions = useMemo(
    () => (suggestions || []).filter(Boolean).slice(0, 8),
    [suggestions],
  );

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      {label && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>}
      <Input
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          setOpen(true);
          if (allowFreeform) {
            onValueChange(nextValue);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        onBlur={() => {
          if (!allowFreeform) {
            setQuery(value);
          }
        }}
        autoComplete="off"
      />

      {open && visibleSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Suggested colleges
          </div>
          <div className="max-h-56 overflow-auto">
            {visibleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  onValueChange(suggestion);
                  setQuery(suggestion);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>{suggestion}</span>
                <span className="text-xs text-gray-400">Select</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}