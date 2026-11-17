/**
 * @file BackblazeCreateBucketModal.tsx
 * @description Dialog to create a real bucket in Backblaze B2 storage.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Database, Plus, X, AlertCircle } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { BaseIconButton } from '../../common/BaseIconButton';
import { createLiveBucket } from './backblazeApi';
import { BackblazeBucket } from './backblazeTypes';

interface BackblazeCreateBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
  creds: Record<string, unknown>;
  onCreated: (bucket: BackblazeBucket) => void;
}

export function BackblazeCreateBucketModal({
  isOpen,
  onClose,
  creds,
  onCreated,
}: BackblazeCreateBucketModalProps): React.ReactElement | null {
  const [bucketName, setBucketName] = useState('');
  const [bucketType, setBucketType] = useState<'allPrivate' | 'allPublic'>('allPrivate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = bucketName.trim().toLowerCase();
    if (!cleanName) {
      setError('Bucket name is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanName) || cleanName.length < 6 || cleanName.length > 50) {
      setError('Backblaze bucket names must be 6-50 chars, lowercase letters, numbers, and hyphens only.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const bucket = await createLiveBucket(creds, cleanName, bucketType);
      onCreated(bucket);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create bucket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-amber-500 shadow-[4px_4px_0px_#000] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Database className="w-4 h-4" />
            <span>CREATE BACKBLAZE BUCKET</span>
          </div>
          <BaseIconButton tooltip="Close" icon={<X className="w-3.5 h-3.5" />} variant="ghost" size="sm" onClick={onClose} />
        </div>

        {error && (
          <div className="p-2 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-300 font-bold mb-1">
              BUCKET NAME <span className="text-amber-500">*</span>
            </label>
            <BaseInput
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value.toLowerCase())}
              placeholder="e.g. my-app-vault-2026"
              className="w-full font-mono"
              required
            />
            <span className="text-[10px] text-neutral-500 block mt-0.5">Globally unique, 6-50 lowercase alphanumeric/hyphen chars.</span>
          </div>

          <div>
            <label className="block text-neutral-300 font-bold mb-1">PRIVACY TYPE</label>
            <div className="grid grid-cols-2 gap-2">
              <BaseButton
                type="button"
                size="sm"
                variant={bucketType === 'allPrivate' ? 'accent' : 'secondary'}
                onClick={() => setBucketType('allPrivate')}
                className="py-1.5 px-2 font-bold"
              >
                🔒 ALL PRIVATE
              </BaseButton>
              <BaseButton
                type="button"
                size="sm"
                variant={bucketType === 'allPublic' ? 'accent' : 'secondary'}
                onClick={() => setBucketType('allPublic')}
                className="py-1.5 px-2 font-bold"
              >
                🌐 ALL PUBLIC
              </BaseButton>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <BaseButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="font-bold"
            >
              CANCEL
            </BaseButton>
            <BaseButton
              type="submit"
              size="sm"
              variant="accent"
              disabled={isSubmitting}
              className="font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {isSubmitting ? 'CREATING...' : 'CREATE BUCKET'}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
