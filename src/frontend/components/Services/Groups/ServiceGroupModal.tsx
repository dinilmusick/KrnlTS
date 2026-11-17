/**
 * @file ServiceGroupModal.tsx
 * @description Modal dialog for creating or editing a Service Group with rich color coding.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect } from 'react';
import { Layers, Palette } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { BrutalistSelect } from '../../common/BrutalistSelect';
import { ServiceGroup } from '@/libraries/types/srkl';
import { BaseModal } from '../../common/BaseModal';
import { GROUP_COLOR_PRESETS, GROUP_ICON_OPTIONS, getGroupVisual } from './groupVisualHelpers';

interface ServiceGroupModalProps {
  group: ServiceGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: ServiceGroup) => void;
  onDelete?: (groupId: string) => void;
}

export function ServiceGroupModal({
  group,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ServiceGroupModalProps): React.ReactElement | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('sky');
  const [icon, setIcon] = useState('Layers');

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
      setColor(group.color || 'sky');
      setIcon(group.icon || 'Layers');
    } else {
      setName('');
      setDescription('');
      setColor('sky');
      setIcon('Layers');
    }
  }, [group, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedGroup: ServiceGroup = {
      id: group ? group.id : `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
    };

    onSave(savedGroup);
    onClose();
  };

  const previewVisual = getGroupVisual(color, icon);
  const PreviewIcon = previewVisual.icon;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={group ? `Edit Section • ${group.name}` : 'Create New Section Group'}
      subtitle="CUSTOMIZE SECTION TITLE, COLOR CODING & ACCENT ICON"
      icon={<Layers className="w-4 h-4 text-amber-400" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">Section Group Name *</label>
          <BaseInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., AI Foundation Services" className="w-full" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">Description</label>
          <BaseInput type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Generative models and foundation endpoints" className="w-full" />
        </div>

        {/* Color Coding Swatch Selector */}
        <div className="space-y-1.5 p-2.5 border border-neutral-800 bg-neutral-950">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Section Color Coding</span>
            </label>
            <span className="text-[10px] font-bold" style={{ color: previewVisual.accentHex }}>
              SELECTED: {color.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 pt-1">
            {GROUP_COLOR_PRESETS.map((p) => {
              const isSelected = color === p.id || color === p.hex;
              return (
                <BaseButton
                  key={p.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setColor(p.id)}
                  title={`${p.name} (${p.hex})`}
                  className={`h-7 p-0 rounded-xs border transition-transform flex items-center justify-center ${
                    isSelected ? 'scale-110 ring-2 ring-white z-10' : 'hover:scale-105 opacity-80'
                  }`}
                  style={{
                    backgroundColor: p.hex,
                    borderColor: isSelected ? 'var(--skipo-text)' : 'var(--skipo-border-color)',
                  }}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                </BaseButton>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 uppercase font-bold">Section Icon</label>
            <BrutalistSelect value={icon} onChange={(e) => setIcon(e.target.value)} inspectionLabel="Section Icon" className="w-full">
              {GROUP_ICON_OPTIONS.map((iOpt) => (
                <option key={iOpt.id} value={iOpt.id}>{iOpt.name}</option>
              ))}
            </BrutalistSelect>
          </div>

          {/* Section Live Preview */}
          <div className="space-y-1">
            <label className="text-[10px] text-neutral-400 uppercase font-bold">Live Preview</label>
            <div
              className="flex items-center gap-2 p-1.5 border rounded-xs"
              style={{
                borderColor: previewVisual.accentHex,
                backgroundColor: 'var(--skipo-surface)',
                boxShadow: `0 0 8px ${previewVisual.glowColor}`,
              }}
            >
              <div className="w-5 h-5 border flex items-center justify-center rounded-xs" style={{ borderColor: previewVisual.accentHex, color: previewVisual.accentHex }}>
                <PreviewIcon className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold truncate" style={{ color: previewVisual.accentHex }}>
                {name.trim() || 'Preview Section'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          {group && onDelete ? (
            <BaseButton
              type="button"
              size="sm"
              variant="danger"
              onClick={() => { onDelete(group.id); onClose(); }}
              className="text-xs uppercase font-bold"
            >
              Delete Section
            </BaseButton>
          ) : <div />}

          <div className="flex items-center gap-2">
            <BaseButton type="button" size="sm" variant="secondary" onClick={onClose} className="text-xs uppercase">Cancel</BaseButton>
            <BaseButton type="submit" size="sm" variant="accent" className="font-bold text-xs uppercase">
              {group ? 'Save Changes' : 'Create Section Group'}
            </BaseButton>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
