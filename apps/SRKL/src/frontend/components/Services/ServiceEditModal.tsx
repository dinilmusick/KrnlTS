/**
 * @file ServiceEditModal.tsx
 * @description Edit dialog for tile fields, custom color coding, secrets, and verification.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect } from 'react';
import { Key, FileJson, Trash2, Check, X, AlertCircle, RefreshCw, ShieldCheck, Palette } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition, ServiceGroup } from '@/libraries/types/srkl';
import { getServiceVisualConfig, TILE_COLOR_PRESETS } from './serviceIcons';
import { BaseModal } from '../common/BaseModal';
import { BaseIconButton } from '../common/BaseIconButton';
import { inferDefaultGroupId } from '@/libraries/data/groupTabDefaults';
import { verifyCredentials, VerificationResult } from './credentialVerificationHelper';
import { ServiceEditCredentialRow } from './ServiceEditCredentialRow';

interface ServiceEditModalProps {
  account: ServiceAccount | null;
  definition?: ServiceDefinition;
  groups?: ServiceGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ServiceAccount) => Promise<void> | void;
  onExport: (account: ServiceAccount) => void;
  onDelete: (accountId: string) => void;
}

export function ServiceEditModal({ account, definition, groups = [], isOpen, onClose, onSave, onExport, onDelete }: ServiceEditModalProps): React.ReactElement | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customColor, setCustomColor] = useState<string>('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setDescription((account.metadata?.description as string) || definition?.description || '');
      setCustomColor((account.metadata?.customColor as string) || (account.metadata?.color as string) || '');
      setSelectedGroupIds(account.groupIds?.length ? account.groupIds : [account.groupId || inferDefaultGroupId(account.serviceId)]);
      setCredentials(account.getAllCredentials());
      setShowSecrets({}); setError(null); setVerifyResult(null);
    }
  }, [account, definition]);

  if (!isOpen || !account) return null;
  const visual = getServiceVisualConfig(account.serviceId, undefined, customColor);
  const IconComp = visual.icon;
  const fields = definition?.credentialFields || [];

  const handleVerify = async () => {
    if (!definition) return;
    setError(null); setIsVerifying(true);
    const result = await verifyCredentials(definition, credentials);
    setIsVerifying(false); setVerifyResult(result);
    if (!result.success) setError(result.error || result.message);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Service tile name cannot be empty'); return; }
    for (const f of fields) {
      const isMandatory = f.required || (account.serviceId.includes('google-ai-studio') && (f.name === 'googleAccount' || f.name === 'apiKey' || f.name === 'accessToken' || f.name === 'projectId'));
      if (isMandatory && !credentials[f.name]?.trim()) { setError(`Mandatory credential '${f.label || f.name}' is required.`); return; }
    }
    const finalGroups = selectedGroupIds.length > 0 ? selectedGroupIds : [inferDefaultGroupId(account.serviceId)];
    const updated = new ServiceAccount({
      id: account.id, name: name.trim(), serviceId: account.serviceId, entityType: 'SERVICE_ACCOUNT', status: 'ONLINE',
      groupIds: finalGroups, groupId: finalGroups[0], credentials: { ...credentials }, lastSync: account.lastSync, createdAt: account.createdAt, updatedAt: new Date().toISOString(),
      metadata: { ...(account.metadata || {}), description: description.trim(), customColor: customColor || undefined, color: customColor || undefined, verifiedAt: new Date().toISOString() },
    });
    try { await onSave(updated); onClose(); } catch (err: any) { setError(err.message || 'Unable to save service.'); }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`EDIT SERVICE: ${account.name}`} subtitle={account.serviceId} icon={<IconComp className="w-4 h-4" style={{ color: visual.accentHex }} />} maxWidth="xl">
      {error && <div className="p-2 border border-rose-900 bg-rose-950/40 text-rose-300 flex items-start gap-2 text-xs"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
      {verifyResult?.success && <div className="p-2 border border-emerald-800 bg-emerald-950/40 text-emerald-300 flex items-center gap-2 text-xs font-bold"><ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" /><span>{verifyResult.message}</span></div>}
      <form onSubmit={handleSave} className="space-y-3 font-mono text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div><label className="block text-neutral-300 font-bold mb-1">TILE NAME</label><BaseInput type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full" required /></div>
          <div className="p-1.5 border border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 border flex items-center justify-center rounded-xs" style={{ borderColor: visual.accentHex, color: visual.accentHex, boxShadow: `0 0 8px ${visual.glowColor}` }}><IconComp className="w-4 h-4" /></div>
              <div className="text-[10px]"><span className="text-neutral-400">ACCENT:</span> <span className="font-bold" style={{ color: visual.accentHex }}>{customColor ? customColor.toUpperCase() : 'DEFAULT'}</span></div>
            </div>
          </div>
        </div>
        <div className="p-2 border border-neutral-800 bg-neutral-950 space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1"><Palette className="w-3 h-3" /><span>TILE COLOR CODING</span></label>
            <BaseButton type="button" size="sm" variant="ghost" onClick={() => setCustomColor('')} className="text-[9px] underline">RESET DEFAULT</BaseButton>
          </div>
          <div className="grid grid-cols-8 gap-1 pt-1">
            {TILE_COLOR_PRESETS.map((p) => {
              const isSelected = customColor === p.id || customColor === p.hex;
              return (
                <BaseButton key={p.id} type="button" size="sm" variant="ghost" onClick={() => setCustomColor(p.id)} title={p.name}
                  className={`h-5.5 p-0 rounded-xs border transition-transform flex items-center justify-center ${isSelected ? 'scale-110 ring-2 ring-white z-10' : 'hover:scale-105 opacity-80'}`}
                  style={{ backgroundColor: p.hex, borderColor: isSelected ? 'var(--skipo-text)' : 'var(--skipo-border-color)' }}>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                </BaseButton>
              );
            })}
          </div>
        </div>
        <div className="p-2 border border-neutral-800 bg-neutral-950 space-y-1">
          <label className="block text-[10px] text-amber-400 font-bold uppercase">ASSIGNED SECTION GROUPS</label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {groups.map((g) => (
              <BaseButton key={g.id} type="button" size="sm" variant={selectedGroupIds.includes(g.id) ? 'accent' : 'secondary'}
                onClick={() => setSelectedGroupIds((p) => p.includes(g.id) ? p.filter((id) => id !== g.id) : [...p, g.id])} className="px-2 py-1 text-[10px] font-bold">
                {selectedGroupIds.includes(g.id) ? '✓ ' : '+ '}{g.name}
              </BaseButton>
            ))}
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-neutral-300 font-bold"><Key className="w-3.5 h-3.5 text-amber-400" /><span>CREDENTIALS ({fields.length})</span></div>
            {definition && (
              <BaseButton type="button" size="sm" variant="secondary" onClick={handleVerify} disabled={isVerifying} className="text-sky-300 text-[10px] font-bold">
                <RefreshCw className={`w-3 h-3 mr-1 ${isVerifying ? 'animate-spin' : ''}`} /><span>{isVerifying ? 'VERIFYING...' : 'VERIFY'}</span>
              </BaseButton>
            )}
          </div>
          {fields.map((field) => (
            <ServiceEditCredentialRow key={field.name} field={field}
              isMandatory={field.required || (account.serviceId.includes('google-ai-studio') && (field.name === 'googleAccount' || field.name === 'apiKey' || field.name === 'accessToken' || field.name === 'projectId'))}
              value={credentials[field.name] || ''} isVisible={!!showSecrets[field.name]}
              onToggleVisibility={() => setShowSecrets((p) => ({ ...p, [field.name]: !p[field.name] }))}
              onChange={(val) => { setCredentials((p) => ({ ...p, [field.name]: val })); setVerifyResult(null); }} />
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <BaseIconButton tooltip="Export JSON" icon={<FileJson className="w-4 h-4 text-amber-400" />} variant="secondary" size="md" onClick={() => onExport(account)} />
            <BaseIconButton tooltip="Delete Tile" icon={<Trash2 className="w-4 h-4" />} variant="danger" size="md" onClick={() => { onDelete(account.id); onClose(); }} />
          </div>
          <div className="flex items-center gap-2">
            <BaseIconButton tooltip="Discard" icon={<X className="w-4 h-4" />} variant="secondary" size="md" onClick={onClose} />
            <BaseIconButton tooltip="Save Changes" icon={<Check className="w-4 h-4" />} variant="primary" size="md" type="submit" />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
