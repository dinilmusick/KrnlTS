import React from 'react';
import { Brain, Cpu, Sparkles, Wrench, Terminal, Shield, Zap, GitFork } from 'lucide-react';

export interface IconSelectorRowProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  label?: string;
}

export const ICON_PALETTE = [
  { name: 'Brain', icon: Brain },
  { name: 'Cpu', icon: Cpu },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Wrench', icon: Wrench },
  { name: 'Terminal', icon: Terminal },
  { name: 'Shield', icon: Shield },
  { name: 'Zap', icon: Zap },
  { name: 'GitFork', icon: GitFork }
];

export const IconSelectorRow: React.FC<IconSelectorRowProps> = ({
  selectedIcon,
  onSelectIcon,
  label = 'Sphere Icon'
}) => {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase font-bold text-[var(--skipo-text-muted)] font-mono">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {ICON_PALETTE.map((opt) => {
          const IconCmp = opt.icon;
          const isSelected = selectedIcon.toLowerCase() === opt.name.toLowerCase();
          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => onSelectIcon(opt.name)}
              className={`p-2 rounded-lg border transition-all ${
                isSelected
                  ? 'border-[var(--skipo-accent)] bg-[var(--skipo-accent)]/20 text-[var(--skipo-accent)] shadow-sm'
                  : 'border-[var(--skipo-border-color)] bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)] hover:border-[var(--skipo-accent)]/50'
              }`}
              title={opt.name}
            >
              <IconCmp size={15} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconSelectorRow;
