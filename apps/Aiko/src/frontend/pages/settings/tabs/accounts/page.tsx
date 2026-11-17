/**
 * Canonical Skipo Settings > Accounts tab.
 * Account state is supplied by the application/Kloks account services.
 */
import React from 'react';
import { BaseButton, BaseCard } from '@ultrst-armada/floks';
import { User } from 'lucide-react';

export interface AccountsPageProps {
  currentUserEmail?: string;
  onLogout: () => void;
}

export function AccountsPage({ currentUserEmail, onLogout }: AccountsPageProps) {
  return (
    <BaseCard className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2 font-bold uppercase text-sm tracking-wide">
        <User size={18} />
        Accounts
      </div>
      <div className="text-xs space-y-1">
        <div className="text-[var(--skipo-text-muted,#94a3b8)]">Signed in as:</div>
        <div className="font-mono font-bold text-sm">{currentUserEmail || 'Unknown'}</div>
      </div>
      <p className="text-xs text-[var(--skipo-text-muted,#94a3b8)]">
        Account providers and SRKL synchronization are supplied by the canonical Kloks account/storage services.
      </p>
      <BaseButton onClick={onLogout} variant="danger">Sign Out</BaseButton>
    </BaseCard>
  );
}

export default AccountsPage;
