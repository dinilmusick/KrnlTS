/**
 * @file ActionsSection.tsx
 * @description Action configuration sub-section for Service Builder Step 2.
 * Conforms to Skipo BaseIconButton icon-only button protocol.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { BaseInput, BaseToggle } from '@skipo/ui';
import { BrutalistSelect } from '../common/BrutalistSelect';
import { Plus, Trash2, Zap } from 'lucide-react';
import { ActionDefinition, ActionType } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';

interface ActionsSectionProps {
  actions: ActionDefinition[];
  setActions: React.Dispatch<React.SetStateAction<ActionDefinition[]>>;
}

export function ActionsSection({ actions, setActions }: ActionsSectionProps): React.ReactElement {
  const addAction = () => {
    setActions((prev) => [
      ...prev,
      {
        id: `ACTION_${prev.length + 1}`,
        name: `Action ${prev.length + 1}`,
        actionType: 'READ',
        description: 'Execute semantic operation',
        destructive: false,
      },
    ]);
  };

  const removeAction = (idx: number) => {
    setActions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-3 border border-neutral-800 bg-neutral-950/60 rounded-none space-y-3 font-mono text-xs shadow-[2px_2px_0px_#000]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase text-neutral-200">5. Semantic Actions</h3>
        </div>
        <BaseIconButton
          tooltip="Add Semantic Action"
          icon={<Plus className="w-3.5 h-3.5" />}
          variant="primary"
          size="sm"
          onClick={addAction}
        />
      </div>

      <div className="space-y-2">
        {actions.map((act, i) => (
          <div key={i} className="p-2.5 border border-neutral-800 bg-neutral-900 rounded-none space-y-2">
            <div className="flex items-center gap-2">
              <BaseInput type="text" placeholder="ID (e.g. QUERY_ITEMS)"
                value={act.id}
                onChange={(e) => {
                  const val = e.target.value;
                  setActions((prev) => prev.map((item, idx) => (idx === i ? { ...item, id: val } : item)));
                }}
                className="w-1/3" />

              <BaseInput type="text" placeholder="Display Name"
                value={act.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setActions((prev) => prev.map((item, idx) => (idx === i ? { ...item, name: val } : item)));
                }}
                className="flex-1" />

              <BrutalistSelect value={act.actionType}
                onChange={(e) => {
                  const t = e.target.value as ActionType;
                  setActions((prev) => prev.map((item, idx) => (idx === i ? { ...item, actionType: t } : item)));
                }} inspectionLabel="Action Type">
                <option value="READ">READ</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="EXECUTE">EXECUTE</option>
                <option value="SYNC">SYNC</option>
                <option value="REFRESH">REFRESH</option>
              </BrutalistSelect>

              <BaseToggle
                label="Destructive"
                checked={act.destructive}
                onChange={(e) => {
                  const chk = e.target.checked;
                  setActions((prev) => prev.map((item, idx) => (idx === i ? { ...item, destructive: chk } : item)));
                }}
                className="text-[10px] text-rose-400 font-bold"
              />

              <BaseIconButton
                tooltip="Delete Action"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                variant="danger"
                size="sm"
                onClick={() => removeAction(i)}
              />
            </div>

            <BaseInput type="text" placeholder="Action description"
              value={act.description}
              onChange={(e) => {
                const d = e.target.value;
                setActions((prev) => prev.map((item, idx) => (idx === i ? { ...item, description: d } : item)));
              }}
              className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
