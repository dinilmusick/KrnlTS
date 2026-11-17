'use client';
import React, { useState, useMemo } from 'react';
import { SearchInput } from './SearchInput.js';
import { useSearchKeyboardNavigation } from './useSearchKeyboardNavigation.js';
import '../../styles/composite.css';

export interface SearchableListProps<T> {
  items: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T, isHighlighted: boolean) => React.ReactNode;
  onSelect: (item: T) => void;
  onClose?: () => void;
  placeholder?: string;
  filterFn: (item: T, query: string) => boolean;
  emptyMessage?: string;
  maxHeight?: string | number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchableList<T>({
  items,
  getItemKey,
  renderItem,
  onSelect,
  onClose,
  placeholder = 'Search...',
  filterFn,
  emptyMessage = 'No matching items',
  maxHeight = '240px',
  className = '',
  autoFocus = true
}: SearchableListProps<T>) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter(item => filterFn(item, query));
  }, [items, query, filterFn]);

  const {
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    listContainerRef
  } = useSearchKeyboardNavigation<T>({
    items: filteredItems,
    onSelect,
    onClose
  });

  return (
    <div className={`skipo-searchable-list ${className}`} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px' }}>
        <SearchInput
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div
        ref={listContainerRef}
        style={{
          overflowY: 'auto',
          maxHeight,
          padding: '4px 8px'
        }}
      >
        {filteredItems.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--skipo-text-muted, #888)' }}>
            {emptyMessage}
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={getItemKey(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => onSelect(item)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 'var(--skipo-radius-sm, 4px)',
                  backgroundColor: isHighlighted ? 'var(--skipo-accent-subtle, rgba(97, 175, 239, 0.18))' : 'transparent',
                  border: isHighlighted ? '1px solid var(--skipo-accent, #61afef)' : '1px solid transparent',
                  marginBottom: '2px',
                  transition: 'background-color 0.1s ease'
                }}
              >
                {renderItem(item, isHighlighted)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
