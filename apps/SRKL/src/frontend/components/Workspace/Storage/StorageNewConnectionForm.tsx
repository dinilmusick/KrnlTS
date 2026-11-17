'use client';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { UserStorageConnection, UserStorageProvider } from '@/libraries/types/auth';
import { luthFetch } from '../../../auth/luthAuthClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
interface StorageNewConnectionFormProps {
  savedConnections: UserStorageConnection[];
  onSave: (conn: Partial<UserStorageConnection>) => Promise<void>;
  onCancel?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: NEW STORAGE CONNECTION FORM
// ═══════════════════════════════════════════════════════════════════════════
export function StorageNewConnectionForm({
  savedConnections,
  onSave,
  onCancel,
}: StorageNewConnectionFormProps) {
  const provider: UserStorageProvider = 'backblaze_b2';
  const [label, setLabel] = useState('');
  const [b2KeyId, setB2KeyId] = useState('');
  const [b2AppKey, setB2AppKey] = useState('');
  const [b2Bucket, setB2Bucket] = useState('');
  const [b2Endpoint, setB2Endpoint] = useState('s3.eu-central-003.backblazeb2.com');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const payload: Partial<UserStorageConnection> = {
    provider,
    label: label.trim() || 'Backblaze B2 Vault',
    b2KeyId: b2KeyId.trim(),
    b2ApplicationKey: b2AppKey.trim(),
    b2BucketName: b2Bucket.trim(),
    b2Endpoint: b2Endpoint.trim(),
  };

  const isDuplicate = savedConnections.some(
    (c) => c.provider === provider && (c.b2BucketName || c.bucketName) === b2Bucket.trim() && (c.b2Endpoint || c.endpoint) === b2Endpoint.trim()
  );

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await luthFetch('/api/workspaces/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection: payload }),
      });
      const data = await res.json();
      setTestResult({ ok: data.success, latencyMs: data.latencyMs, error: data.error });
    } catch (err: any) {
      setTestResult({ ok: false, error: err.message || 'Probe failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3.5 border-2 space-y-3 font-mono text-xs" style={{
      backgroundColor: 'var(--skipo-surface)',
      borderColor: 'var(--skipo-border-color)',
      borderRadius: 'var(--skipo-radius)',
    }}>
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <span className="font-black text-xs uppercase text-amber-400">CONNECT STORAGE BUCKET</span>
        {isDuplicate && (
          <span className="text-[9px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 border border-amber-400/30">
            ⚠️ BUCKET ALREADY CONNECTED (WILL UPDATE)
          </span>
        )}
      </div>

      <div className="border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-[10px] font-black uppercase text-amber-300">
        Backblaze B2 · S3-compatible external storage
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-[10px] font-bold uppercase mb-1 opacity-70">Storage Label</label>
          <BaseInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. TodaDJP - BB Vault"
            className="w-full text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 opacity-70">B2 Key ID (accessKeyId)</label>
                <BaseInput
                  value={b2KeyId}
                  onChange={(e) => setB2KeyId(e.target.value)}
                  placeholder="00364f88..."
                  required
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 opacity-70">B2 Application Key (secretAccessKey)</label>
                <BaseInput
                  type="password"
                  value={b2AppKey}
                  onChange={(e) => setB2AppKey(e.target.value)}
                  placeholder="K0034..."
                  required
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 opacity-70">Bucket Name</label>
                <BaseInput
                  value={b2Bucket}
                  onChange={(e) => setB2Bucket(e.target.value)}
                  placeholder="ultrst-apps"
                  required
                  className="w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1 opacity-70">S3 Endpoint</label>
                <BaseInput
                  value={b2Endpoint}
                  onChange={(e) => setB2Endpoint(e.target.value)}
                  placeholder="s3.eu-central-003.backblazeb2.com"
                  required
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>
      </div>

      {testResult && (
        <div className={`p-2 border text-[10px] flex items-center gap-2 ${testResult.ok ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-red-500 bg-red-500/10 text-red-300'}`}>
          {testResult.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{testResult.ok ? `Bucket Verified (${testResult.latencyMs}ms latency)` : `Error: ${testResult.error}`}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex gap-2">
          <BaseButton type="button" variant="secondary" size="sm" onClick={handleTest} disabled={testing || !b2Bucket}>
              <Zap size={11} className={testing ? 'animate-spin text-amber-400' : ''} />
              <span>{testing ? 'Testing...' : 'Probe & Test'}</span>
          </BaseButton>
          {onCancel && (
            <BaseButton type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </BaseButton>
          )}
        </div>
        <BaseButton type="submit" variant="accent" size="sm" disabled={saving}>
          {saving ? 'Saving...' : isDuplicate ? 'Update Connection' : 'Save & Connect'}
        </BaseButton>
      </div>
    </form>
  );
}
