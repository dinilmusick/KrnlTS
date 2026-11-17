import React from 'react';
import { Plus } from 'lucide-react';
import { BaseInput } from '../../base/BaseInput.js';
import { BaseButton } from '../../base/BaseButton.js';
import type { EmailProfileRegistrationFormProps } from './contracts.js';

export const EmailProfileRegistrationForm: React.FC<EmailProfileRegistrationFormProps> = ({
  value, onChange, onSubmit, placeholder = 'Register Email Profile',
}) => (
  <form onSubmit={onSubmit} className="p-3 rounded-lg border-2 border-slate-700 bg-slate-200/40 dark:bg-slate-800/40 flex items-center gap-2 font-mono text-xs">
    <BaseInput type="email" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
    <BaseButton type="submit" variant="accent" disabled={!value.trim()}><Plus size={14} /></BaseButton>
  </form>
);
