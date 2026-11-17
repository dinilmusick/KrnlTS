'use client';
import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSearchKeyboardNavigationOptions<T> {
  items: T[];
  onSelect: (item: T) => void;
  onClose?: () => void;
  initialIndex?: number;
}

/**
 * Universal hook for keyboard-driven search navigation:
 * - Automatically highlights the first matching item (index 0).
 * - ArrowUp / ArrowDown moves highlight through the list.
 * - Enter selects the highlighted item immediately.
 * - Escape closes the search interface.
 */
export function useSearchKeyboardNavigation<T>({
  items,
  onSelect,
  onClose,
  initialIndex = 0
}: UseSearchKeyboardNavigationOptions<T>) {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(initialIndex);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Invariant: Top result is automatically highlighted whenever items change
  useEffect(() => {
    setHighlightedIndex(items.length > 0 ? 0 : -1);
  }, [items]);

  // Keep highlighted item visible in scroll container
  useEffect(() => {
    if (highlightedIndex >= 0 && listContainerRef.current) {
      const container = listContainerRef.current;
      const element = container.children[highlightedIndex] as HTMLElement | undefined;
      if (element) {
        const elemTop = element.offsetTop;
        const elemBottom = elemTop + element.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      if (items.length === 0) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose?.();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeIdx = highlightedIndex >= 0 && highlightedIndex < items.length ? highlightedIndex : 0;
        const activeItem = items[activeIdx];
        if (activeItem !== undefined) {
          onSelect(activeItem);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    },
    [items, highlightedIndex, onSelect, onClose]
  );

  return {
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    highlightedItem: highlightedIndex >= 0 && highlightedIndex < items.length ? items[highlightedIndex] : undefined,
    listContainerRef
  };
}
