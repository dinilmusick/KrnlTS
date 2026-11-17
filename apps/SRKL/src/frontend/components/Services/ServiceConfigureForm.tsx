/**
 * @file ServiceConfigureForm.tsx
 * @description Form for configuring service name, custom color coding, credentials, and verification.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Key, AlertCircle, ArrowLeft, Check, X, ShieldCheck, RefreshCw, Palette } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceDefinition, ServiceGroup } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { BaseIconButton } from '../common/BaseIconButton';
import { verifyCredentials, VerificationResult } from './credentialVerificationHelper';
import { getServiceVisualConfig, TILE_COLOR_PRESETS } from './serviceIcons';
import { ServiceEditCredentialRow } from './ServiceEditCredentialRow';

interface ServiceConfigureFormProps {
  service: ServiceDefinition;
  groups?: ServiceGroup[];
  defaultGroupId?: string;
  onBack: () => void;
  onSubmit: (account: ServiceAccount) => Promise<void> | void;
}

export function ServiceConfigureForm({
  service,
  groups = [],
  defaultGroupId,
  onBack,
  onSubmit,
}: ServiceConfigureFormProps): React.ReactElement {
  const [name, setName] = useState(service.name);
  const [description] = useState(service.description);
  const [customColor, setCustomColor] = useState<string>('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => defaultGroupId ? [defaultGroupId] : (groups[0] ? [groups[0].id] : []));
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);

  const visual = getServiceVisualConfig(service.identifier, undefined, customColor);
  const IconComp = visual.icon;

  const handleVerify = async () => {
    setError(null);
    setIsVerifying(true);
    const result = await verifyCredentials(service, credentials);
    setIsVerifying(false);
    setVerifyResult(result);
    if (!result.success) setError(result.error || result.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) { setError('Tile name cannot be empty'); return; }

    for (const f of service.credentialFields) {
      const isMandatory = f.required || (service.identifier === 'google-ai-studio' && (f.name === 'googleAccount' || f.name === 'apiKey' || f.name === 'accessToken' || f.name === 'projectId'));
      if (isMandatory && !credentials[f.name]?.trim()) {
        setError(`Mandatory credential '${f.label || f.name}' is required.`);
        return;
      }
    }

    if (service.identifier === 'google-ai-studio' && !verifyResult?.success) {
      setIsVerifying(true);
      const vResult = await verifyCredentials(service, credentials);
      setIsVerifying(false);
      setVerifyResult(vResult);
      if (!vResult.success) { setError(vResult.error || vResult.message); return; }
    }

    const validGids = selectedGroupIds.filter((id) => groups.some((g) => g.id === id));
    const finalGroupIds = validGids.length ? validGids : [defaultGroupId || groups[0]?.id || 'grp_default'];
    const account = new ServiceAccount({
      id: `sa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(), serviceId: service.identifier, entityType: 'SERVICE_ACCOUNT',
      status: 'ONLINE', groupIds: finalGroupIds, groupId: finalGroupIds[0],
      credentials: { ...credentials }, lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      metadata: { description: description.trim(), customColor: customColor || undefined, color: customColor || undefined, verifiedAt: new Date().toISOString() },
    });

    setIsSubmitting(true);
    try {
      await onSubmit(account);
    } catch (err: any) {
      setError(`Account not added: ${err.message || 'Unable to save service to this workspace.'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-3 font-mono text-xs">
      {isSubmitting && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-neutral-950 border border-amber-500/80 shadow-xl rounded-xs">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-neutral-100 uppercase tracking-wide block leading-tight">
                Instantiating Service Tile...
              </span>
              <span className="text-[9px] text-neutral-400 block leading-tight">
                Saving & syncing vault
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 border flex items-center justify-center rounded-xs" style={{ borderColor: visual.accentHex, color: visual.accentHex, boxShadow: `0 0 8px ${visual.glowColor}` }}>
            <IconComp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-100 uppercase">{service.name}</h3>
            <span className="text-[10px] text-neutral-400">{service.identifier}</span>
          </div>
        </div>
        <BaseIconButton tooltip="Back to Catalog" icon={<ArrowLeft className="w-4 h-4" />} variant="secondary" size="sm" onClick={onBack} disabled={isSubmitting} />
      </div>

      {error && <div className="p-2 border border-rose-900 bg-rose-950/40 text-rose-300 flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span className="leading-snug">{error}</span></div>}
      {verifyResult?.success && <div className="p-2 border border-emerald-800 bg-emerald-950/40 text-emerald-300 flex items-center gap-2"><ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" /><span className="font-bold">{verifyResult.message}</span></div>}

      <div>
        <label className="block text-neutral-300 font-bold mb-0.5">TILE NAME *</label>
        <BaseInput type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full" disabled={isSubmitting} required />
      </div>

      {/* Tile Color Coding Swatches */}
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
        <label className="block text-[10px] text-amber-400 font-bold uppercase">SECTION GROUPS</label>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {groups.map((g) => {
            const isChecked = selectedGroupIds.includes(g.id);
            return (
              <BaseButton key={g.id} type="button" size="sm" variant={isChecked ? 'accent' : 'secondary'}
                onClick={() => setSelectedGroupIds((p) => (p.includes(g.id) ? p.filter((id) => id !== g.id) : [...p, g.id]))}
                className="px-2 py-1 text-[10px] font-bold">
                {isChecked ? '✓ ' : '+ '}{g.name}
              </BaseButton>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-300 font-bold"><Key className="w-3.5 h-3.5 text-amber-400" /><span>CREDENTIALS ({service.credentialFields.length})</span></div>
          <BaseButton type="button" size="sm" variant="secondary" onClick={handleVerify} disabled={isVerifying || isSubmitting} className="text-sky-300 text-[10px] font-bold">
            <RefreshCw className={`w-3 h-3 mr-1 ${isVerifying ? 'animate-spin text-amber-400' : ''}`} /><span>{isVerifying ? 'VERIFYING...' : 'VERIFY CREDENTIALS'}</span>
          </BaseButton>
        </div>

        {service.credentialFields.map((field) => (
          <ServiceEditCredentialRow key={field.name} field={field}
            isMandatory={field.required || (service.identifier === 'google-ai-studio' && (field.name === 'googleAccount' || field.name === 'apiKey' || field.name === 'accessToken' || field.name === 'projectId'))}
            value={credentials[field.name] || ''} isVisible={!!showSecrets[field.name]}
            onToggleVisibility={() => setShowSecrets((p) => ({ ...p, [field.name]: !p[field.name] }))}
            onChange={(val) => { setCredentials((p) => ({ ...p, [field.name]: val })); setVerifyResult(null); }} />
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
        <BaseIconButton tooltip="Discard" icon={<X className="w-4 h-4" />} variant="secondary" size="md" onClick={onBack} disabled={isSubmitting} />
        <BaseIconButton tooltip={isSubmitting ? 'Instantiating...' : 'Create Service Tile'} icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Check className="w-4 h-4" />} variant="primary" size="md" type="submit" disabled={isSubmitting} />
      </div>
    </form>
  );
}
