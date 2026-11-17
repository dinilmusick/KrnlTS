import type { ReactNode } from 'react';

export interface AIKeyEntry {
  id: string;
  providerId: string;
  label: string;
  key?: string;
  status?: string;
  validationError?: string;
  lifespan?: string;
}

export interface AIKeyUsageStats {
  keyId: string;
  dayCount?: number;
  weekCount?: number;
  monthCount?: number;
  dailyCalls?: number;
  weeklyCalls?: number;
  monthlyCalls?: number;
}

export interface AIProviderMeta {
  id: string;
  name: string;
  icon?: ReactNode;
}

export interface KeyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadExportPayload: () => Promise<unknown>;
  onImport: (payload: unknown) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRefreshKeys?: () => void;
  title?: string;
}

export interface EmailProfileCardProps {
  email: string;
  providers: AIProviderMeta[];
  keys: AIKeyEntry[];
  usageStats?: AIKeyUsageStats[];
  targetKeyId?: string;
  targetProviderId?: string;
  onAddKey: (payload: { providerId: string; label: string; key: string }) => void;
  onVerifyKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onUpdateKeyLabel: (id: string, label: string) => void;
  getAcquisitionLink?: (providerId: string) => string;
}

export interface EmailProviderRowProps {
  email: string;
  providerMeta: AIProviderMeta;
  providerKey?: AIKeyEntry;
  usageStats?: AIKeyUsageStats[];
  isTargetedKey: boolean;
  isTargetedProvider: boolean;
  acquisitionLink?: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSaveKey: () => void;
  onVerifyKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onUpdateKeyLabel: (id: string, label: string) => void;
}

export interface ExistingKeyControlProps {
  providerKey: AIKeyEntry;
  usageStats?: AIKeyUsageStats[];
  onVerifyKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onUpdateKeyLabel: (id: string, label: string) => void;
}

export interface EmailProfileRegistrationFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event?: React.FormEvent) => void;
  placeholder?: string;
}
