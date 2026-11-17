/**
 * @file ServiceDropdown.tsx
 * @description In-service dropdown and select menu for bucket targets, regions, and formats.
 * File size < 200 lines strictly.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
}

export interface ServiceDropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function ServiceDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  size = 'md',
}: ServiceDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-1 font-mono text-xs w-full relative">
      {label && (
        <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-neutral-950 border-2 font-mono text-left flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
          isOpen ? 'border-amber-500 shadow-[2px_2px_0px_#F59E0B]' : 'border-neutral-750 hover:border-neutral-600'
        } ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}`}
      >
        <span className={selectedOption ? 'text-neutral-100 font-bold truncate' : 'text-neutral-500 truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-neutral-900 border-2 border-neutral-700 shadow-[4px_4px_0px_#000] max-h-56 overflow-y-auto font-mono">
          {options.length === 0 ? (
            <div className="p-2.5 text-neutral-500 text-center text-[11px]">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`p-2 flex items-center justify-between cursor-pointer border-b border-neutral-800 last:border-0 hover:bg-neutral-800 transition-colors ${
                    isSelected ? 'bg-amber-950/40 text-amber-300' : 'text-neutral-200'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[11px] truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="text-[9px] px-1 bg-neutral-800 border border-neutral-700 text-neutral-400">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-[10px] text-neutral-400 truncate">{opt.description}</p>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
