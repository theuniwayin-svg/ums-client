'use client';

import { useEffect, useCallback } from 'react';

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled = true,
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        target.tagName,
      );
      const isContentEditable = target.isContentEditable;

      // Skip shortcuts when typing in inputs (except Escape)
      if ((isInput || isContentEditable) && event.key !== 'Escape') {
        return;
      }

      const handler = shortcuts[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
