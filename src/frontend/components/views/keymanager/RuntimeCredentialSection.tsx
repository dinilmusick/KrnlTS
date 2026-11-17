import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, ExternalLink, Github, Pencil, Plane, Save, Trash2, X } from 'lucide-react';
import { apiClient } from '../../../../libraries/apiClient.js';
import { createRuntimeCredentialDraft } from '../../../../libraries/runtimeProviderForm.js';

type CredentialField = { id: string; label: string; description: string; required: boolean; secret: boolean; placeholder?: string };
type RuntimeProvider = {
  id: string; displayName: string; description: string; icon: string; documentationUrl: string;
  authenticationType: string; credentialFields: CredentialField[];
  capabilities: Array<{ id: string; label: string; description: string }>;
  execution: { available: false; status: 'credentials-only' };
};
type RuntimeAccount = { id: string; providerId: string; displayName: string; metadata?: Record<string, string | number | boolean> };

interface RuntimeCredentialSectionProps { workspaceId?: string; emailGroup?: string }

const emptyFields = (provider?: RuntimeProvider) => createRuntimeCredentialDraft(provider?.credentialFields || []);
const ProviderIcon = ({ icon }: { icon: string }) => icon === 'github' ? <Github size={15} /> : icon === 'plane' ? <Plane size={15} /> : <Cloud size={15} />;

export function RuntimeCredentialSection({ workspaceId, emailGroup }: RuntimeCredentialSectionProps) {
  const [accounts, setAccounts] = useState<RuntimeAccount[]>([]);
  const [providers, setProviders] = useState<RuntimeProvider[]>([]);
  const [providerId, setProviderId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const loadVersion = useRef(0);

  const selectedProvider = useMemo(() => providers.find(provider => provider.id === providerId), [providers, providerId]);
  const visibleAccounts = accounts.filter(account => String(account.metadata?.emailGroup || '') === String(emailGroup || ''));
  const hasCredentialInput = Object.values(fields).some(value => value.trim().length > 0);
  const requiredFieldsComplete = Boolean(selectedProvider?.credentialFields.filter(field => field.required).every(field => Boolean(fields[field.id]?.trim())));

  const load = useCallback(async () => {
    const requestVersion = ++loadVersion.current;
    if (!workspaceId) { setAccounts([]); setProviders([]); setProviderId(''); setLoading(false); setError(''); return; }
    setLoading(true); setError('');
    try {
      const result = await apiClient.getRuntimeAccounts(workspaceId);
      if (requestVersion !== loadVersion.current) return;
      if (!result?.success) throw new Error(result?.error || 'Unable to load runtime accounts.');
      setAccounts(result.accounts || []);
      setProviders(result.providers || []);
      setProviderId(current => current || result.providers?.[0]?.id || '');
    } catch (err) {
      if (requestVersion === loadVersion.current) setError(err instanceof Error ? err.message : 'Unable to load runtime accounts.');
    } finally {
      if (requestVersion === loadVersion.current) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { void load(); return () => { loadVersion.current += 1; }; }, [load]);

  const resetForm = () => {
    setEditingId(null); setDisplayName(''); setFields(emptyFields(selectedProvider));
  };
  const selectProvider = (nextId: string) => {
    setProviderId(nextId); setFields(emptyFields(providers.find(provider => provider.id === nextId)));
  };
  const editAccount = (account: RuntimeAccount) => {
    setEditingId(account.id); setProviderId(account.providerId); setDisplayName(account.displayName);
    setFields(emptyFields(providers.find(provider => provider.id === account.providerId))); setError('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceId || !selectedProvider || !displayName.trim()) return;
    if (!editingId && !requiredFieldsComplete) { setError('Complete every required credential field.'); return; }
    setSaving(true); setError('');
    try {
      const accountDetails = { providerId, displayName: displayName.trim(), emailGroup: emailGroup || undefined };
      const result = editingId
        ? await apiClient.updateRuntimeAccount(workspaceId, editingId, { ...accountDetails, fields: hasCredentialInput ? fields : undefined })
        : await apiClient.createRuntimeAccount(workspaceId, { ...accountDetails, fields });
      if (!result?.success) throw new Error(result?.error || 'Unable to save runtime account.');
      resetForm(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save runtime account.'); }
    finally { setSaving(false); }
  };

  const remove = async (accountId: string) => {
    if (!workspaceId) return;
    setError('');
    try {
      const result = await apiClient.deleteRuntimeAccount(workspaceId, accountId);
      if (!result?.success) throw new Error(result?.error || 'Unable to delete runtime account.');
      if (editingId === accountId) resetForm(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete runtime account.'); }
  };

  return (
    <section className="rounded-xl border border-cyan-900/70 bg-slate-950/70 p-4 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-wide text-cyan-200"><Cloud size={16} /> RUNTIME ENVIRONMENTS</div>
          <p className="mt-1 text-[10px] text-slate-400">External compute accounts. Separate from AI / inference provider keys.</p>
        </div>
        <span className="text-[9px] font-mono text-slate-500">{visibleAccounts.length} ACCOUNT{visibleAccounts.length === 1 ? '' : 'S'}</span>
      </header>
      {!workspaceId && <p className="text-xs text-amber-400">Select a workspace to manage runtime accounts.</p>}
      {visibleAccounts.map(account => {
        const provider = providers.find(item => item.id === account.providerId);
        return (
          <article key={account.id} className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold"><ProviderIcon icon={provider?.icon || 'cloud'} />{account.displayName}</div>
                <div className="mt-1 text-[10px] text-slate-400">{provider?.displayName || account.providerId} · credentials saved</div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => editAccount(account)} aria-label={'Edit ' + account.displayName} className="p-2 text-slate-400 hover:text-cyan-300"><Pencil size={14} /></button>
                <button type="button" onClick={() => void remove(account.id)} aria-label={'Delete ' + account.displayName} className="p-2 text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            {provider && <div className="mt-2 flex flex-wrap gap-1.5" aria-label={provider.displayName + ' capabilities'}>
              {provider.capabilities.map(capability => <span key={capability.id} title={capability.description} className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] text-slate-400">{capability.label}</span>)}
            </div>}
          </article>
        );
      })}
      <form onSubmit={save} className="space-y-3 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-200">{editingId ? 'UPDATE RUNTIME ACCOUNT' : 'ADD RUNTIME ACCOUNT'}</h3>
          {editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-[10px] text-slate-400"><X size={12} /> CANCEL</button>}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <label className="text-[10px] font-bold text-slate-400">RUNTIME PROVIDER
            <select value={providerId} disabled={Boolean(editingId)} onChange={event => selectProvider(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100">
              {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.displayName}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold text-slate-400">ACCOUNT NAME
            <input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={100} placeholder="Development environment" className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" />
          </label>
        </div>
        {selectedProvider && <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-400">{selectedProvider.description}</p>
            <a href={selectedProvider.documentationUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[10px] text-cyan-300">Docs <ExternalLink size={11} /></a>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2">
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">Runtime capabilities</div>
            <div className="mt-1 flex flex-wrap gap-1.5">{selectedProvider.capabilities.map(capability => <span key={capability.id} className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-slate-300">{capability.label}</span>)}</div>
            <div className="mt-2 text-[9px] text-amber-400">Execution status: {selectedProvider.execution.status}. Credentials can be saved now; provider execution adapters remain explicitly unavailable until registered.</div>
          </div>
          {selectedProvider.credentialFields.map(field => (
            <label key={field.id} className="block text-[10px] font-bold text-slate-400">
              {field.label}{field.required ? ' *' : ' (optional)'}
              <input type={field.secret ? 'password' : 'text'} autoComplete="off" value={fields[field.id] || ''}
                onChange={event => setFields(current => ({ ...current, [field.id]: event.target.value }))}
                placeholder={editingId && field.secret ? 'Leave blank to keep the saved credential' : field.placeholder || field.description}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" />
              <span className="mt-1 block font-normal text-slate-500">{field.description}</span>
            </label>
          ))}
          <div className="text-[9px] text-slate-500">Authentication: {selectedProvider.authenticationType}. Secrets stay in the workspace credential store and are never returned in account views.</div>
        </div>}
        <div className="flex justify-end">
          <button type="submit" disabled={!workspaceId || !selectedProvider || !displayName.trim() || saving || (!editingId && !requiredFieldsComplete)}
            className="inline-flex items-center gap-2 rounded bg-cyan-700 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40"><Save size={12} /> {saving ? 'SAVING…' : editingId ? 'UPDATE ACCOUNT' : 'SAVE ACCOUNT'}</button>
        </div>
      </form>
      {loading && <p className="text-[10px] text-slate-500">Loading runtime accounts…</p>}
      {error && <p role="alert" className="text-[10px] text-red-400">{error}</p>}
      {providers.length > 0 && <p className="text-[9px] text-slate-500">Credentials are stored in the workspace vault. Account records expose neither credential values nor credential references.</p>}
    </section>
  );
}

export default RuntimeCredentialSection;
