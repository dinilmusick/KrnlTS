/**
 * @file CredentialsSection.tsx
 * @description Credential fields configuration for Service Builder Step 1.
 * Uses BaseIconButton for all actions conforming to icon-only button protocol.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { BaseInput, BaseToggle } from '@skipo/ui';
import { Plus, Trash2, KeyRound } from 'lucide-react';
import { CredentialField } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';
import { BrutalistSelect } from '../common/BrutalistSelect';

interface CredentialsSectionProps {
  credentialFields: CredentialField[];
  setCredentialFields: React.Dispatch<React.SetStateAction<CredentialField[]>>;
}

export function CredentialsSection({
  credentialFields,
  setCredentialFields,
}: CredentialsSectionProps): React.ReactElement {
  const addField = () => {
    setCredentialFields((prev) => [
      ...prev,
      {
        name: `param_${prev.length + 1}`,
        label: `Param ${prev.length + 1}`,
        type: 'string',
        required: true,
        secret: false,
        description: '',
      },
    ]);
  };

  const removeField = (index: number) => {
    setCredentialFields((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-3 border border-neutral-800 bg-neutral-950/60 rounded-none space-y-3 font-mono text-xs shadow-[2px_2px_0px_#000]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase text-neutral-200">2. Credential Schema Fields</h3>
        </div>
        <BaseIconButton
          tooltip="Add Credential Field"
          icon={<Plus className="w-3.5 h-3.5" />}
          variant="primary"
          size="sm"
          onClick={addField}
        />
      </div>

      <div className="space-y-2">
        {credentialFields.map((field, idx) => (
          <div key={idx} className="p-2 border border-neutral-800 bg-neutral-900 rounded-none flex flex-wrap gap-2 items-center">
            <BaseInput type="text" placeholder="fieldKey"
              value={field.name}
              onChange={(e) => {
                const val = e.target.value;
                setCredentialFields((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
              }}
              className="w-32" />
            <BaseInput type="text" placeholder="Display Label"
              value={field.label}
              onChange={(e) => {
                const val = e.target.value;
                setCredentialFields((prev) => prev.map((item, i) => (i === idx ? { ...item, label: val } : item)));
              }}
              className="flex-1" />
            <BrutalistSelect value={field.type}
              onChange={(e) => {
                const val = e.target.value as 'string' | 'password';
                setCredentialFields((prev) => prev.map((item, i) => (i === idx ? { ...item, type: val } : item)));
              }} inspectionLabel="Field Type">
              <option value="string">string</option>
              <option value="password">password (secret)</option>
            </BrutalistSelect>
            <BaseToggle
              label="Mandatory"
              checked={field.required ?? false}
              onChange={(e) => {
                const val = e.target.checked;
                setCredentialFields((prev) => prev.map((item, i) => (i === idx ? { ...item, required: val } : item)));
              }}
              className="text-[11px] text-amber-400 font-semibold"
            />
            <BaseToggle
              label="Masked"
              checked={field.secret}
              onChange={(e) => {
                const val = e.target.checked;
                setCredentialFields((prev) => prev.map((item, i) => (i === idx ? { ...item, secret: val } : item)));
              }}
              className="text-[11px] text-neutral-400"
            />
            <BaseIconButton
              tooltip="Remove Field"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              variant="danger"
              size="sm"
              onClick={() => removeField(idx)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
