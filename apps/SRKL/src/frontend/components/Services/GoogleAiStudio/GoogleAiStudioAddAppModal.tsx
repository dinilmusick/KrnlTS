/**
 * @file GoogleAiStudioAddAppModal.tsx
 * @description Dialog to register and track a new developing applet.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { BaseInput } from '@skipo/ui';
import { BrutalistSelect } from '../../common/BrutalistSelect';
import { BaseModal } from '../../common/BaseModal';
import { BaseIconButton } from '../../common/BaseIconButton';
import { Plus, Check, X } from 'lucide-react';

interface GoogleAiStudioAddAppModalProps {
  isOpen: boolean;
  googleAccount: string;
  defaultProjectId: string;
  onClose: () => void;
  onAdd: (app: {
    name: string;
    description: string;
    googleAccount: string;
    appletId: string;
    platform: 'Web (React + Vite)' | 'Android (Kotlin + Compose)' | 'Cloud Run' | 'Tuned Model';
    model: string;
    projectId: string;
    devUrl: string;
    shareUrl: string;
  }) => Promise<void>;
}

export function GoogleAiStudioAddAppModal({
  isOpen,
  googleAccount,
  defaultProjectId,
  onClose,
  onAdd,
}: GoogleAiStudioAddAppModalProps): React.ReactElement | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [appletId, setAppletId] = useState('');
  const [platform, setPlatform] = useState<'Web (React + Vite)' | 'Android (Kotlin + Compose)' | 'Cloud Run' | 'Tuned Model'>('Web (React + Vite)');
  const [model, setModel] = useState('Gemini 2.5 Flash');
  const [devUrl, setDevUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onAdd({
      name: name.trim(),
      description: description.trim(),
      googleAccount,
      appletId: appletId.trim() || `applet-${Date.now().toString(36)}`,
      platform,
      model,
      projectId: defaultProjectId || '207414612407',
      devUrl: devUrl.trim(),
      shareUrl: shareUrl.trim(),
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="TRACK DEVELOPING APPLET" subtitle="Register AI Studio or Cloud Run Project" icon={<Plus className="w-4 h-4 text-amber-400" />} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
        <div>
          <label className="block text-neutral-300 font-bold mb-0.5">APP NAME *</label>
          <BaseInput type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Gemini Vision Pipeline" className="w-full" />
        </div>
        <div>
          <label className="block text-neutral-300 font-bold mb-0.5">DESCRIPTION</label>
          <BaseInput type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summary of application purpose" className="w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-neutral-300 font-bold mb-0.5">PLATFORM</label>
            <BrutalistSelect value={platform} onChange={(e) => setPlatform(e.target.value as any)} inspectionLabel="Platform" className="w-full">
              <option value="Web (React + Vite)">Web (React + Vite)</option>
              <option value="Android (Kotlin + Compose)">Android (Kotlin + Compose)</option>
              <option value="Cloud Run">Cloud Run</option>
              <option value="Tuned Model">Tuned Model</option>
            </BrutalistSelect>
          </div>
          <div>
            <label className="block text-neutral-300 font-bold mb-0.5">PRIMARY MODEL</label>
            <BaseInput type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Gemini 2.5 Flash" className="w-full" />
          </div>
        </div>
        <div>
          <label className="block text-neutral-300 font-bold mb-0.5">APPLET ID / CLUSTER ID</label>
          <BaseInput type="text" value={appletId} onChange={(e) => setAppletId(e.target.value)} placeholder="Optional: UUID or Cloud Run service name" className="w-full" />
        </div>
        <div>
          <label className="block text-neutral-300 font-bold mb-0.5">PREVIEW / SHARE URL</label>
          <BaseInput type="url" value={shareUrl} onChange={(e) => setShareUrl(e.target.value)} placeholder="https://...run.app" className="w-full" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
          <BaseIconButton tooltip="Discard" icon={<X className="w-4 h-4" />} variant="secondary" size="md" onClick={onClose} />
          <BaseIconButton tooltip="Save Applet" icon={<Check className="w-4 h-4" />} variant="primary" size="md" type="submit" disabled={isSubmitting} />
        </div>
      </form>
    </BaseModal>
  );
}
