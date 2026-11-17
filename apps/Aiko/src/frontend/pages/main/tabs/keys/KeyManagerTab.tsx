/**
 * @file KeyManagerTab.tsx
 * @description Canonical Key Management Tab within Main Page.
 * Conforms to L9 (Lines <= 200).
 */

import React from 'react';
import { KeyManagerView } from '../../../../components/views/KeyManagerView.js';

export interface KeyManagerTabProps {
  workspaceId?: string;
  onCloseToGraph: () => void;
  keys: any[];
  usageStats: any[];
  strategy: any;
  initialProviderId?: string;
  targetKeyId?: string;
  highlightNonce?: number;
  onAddKey: (key: any) => Promise<boolean>;
  onVerifyKey: (keyId: string) => Promise<boolean>;
  onDeleteKey: (keyId: string) => Promise<boolean>;
  onUpdateKeyLabel: (keyId: string, label: string) => Promise<boolean>;
  onSetStrategy: (strategy: any) => Promise<void>;
  onRefreshKeys: () => void;
}

export function KeyManagerTab(props: KeyManagerTabProps) {
  return <KeyManagerView {...props} />;
}

export default KeyManagerTab;
