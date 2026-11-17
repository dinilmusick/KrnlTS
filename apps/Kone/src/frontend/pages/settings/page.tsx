'use client';

import { useEffect, useState } from 'react';
import { BaseButton, BaseInput, BaseTextarea } from '@ultrst-armada/floks/ui';
import { MidiDevicesSettings } from './MidiDevicesSettings.js';
import AccountsTab from './tabs/accounts/page.js';
import ThemesTab from './tabs/themes/page.js';
import { apiClient } from '../../../libraries/client/apiClient.js';

type Tab = 'general' | 'midi' | 'themes' | 'accounts';

type Workspace = {
  id: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
};

export default function SettingsPage({ workspace }: { workspace?: Workspace }) {
  const [tab, setTab] = useState<Tab>('general');
  const [name, setName] = useState(workspace?.name ?? '');
  const [description, setDescription] = useState(workspace?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(workspace?.name ?? '');
    setDescription(workspace?.description ?? '');
    setMessage(null);
  }, [workspace?.id, workspace?.name, workspace?.description]);

  const saveGeneral = async () => {
    if (!workspace?.id || !name.trim()) {
      setMessage('Workspace name is required.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.updateWorkspace(workspace.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setMessage('Workspace settings saved.');
      window.dispatchEvent(new Event('skipo-workspace-changed'));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ padding: 24 }}>
      <header style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['general', 'midi', 'themes', 'accounts'] as Tab[]).map((id) => (
          <BaseButton key={id} size="sm" variant={tab === id ? 'accent' : 'secondary'} onClick={() => setTab(id)}>
            {id === 'midi' ? 'MIDI Devices' : id[0].toUpperCase() + id.slice(1)}
          </BaseButton>
        ))}
      </header>
      {tab === 'general' && (
        <section aria-label="Workspace settings" style={{ maxWidth: 640 }}>
          <h1>Settings</h1>
          <p>Manage the active workspace identity and description.</p>
          <BaseInput aria-label="Workspace name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Workspace name" />
          <BaseTextarea aria-label="Workspace description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Workspace description" rows={4} style={{ width: '100%', marginTop: 8 }} />
          <div style={{ marginTop: 8 }}>
            <BaseButton size="sm" variant="accent" onClick={() => void saveGeneral()} disabled={saving || !workspace}>
              {saving ? 'Saving…' : 'Save'}
            </BaseButton>
          </div>
          {message && <p role="status">{message}</p>}
        </section>
      )}
      {tab === 'midi' && <MidiDevicesSettings />}
      {tab === 'themes' && <ThemesTab />}
      {tab === 'accounts' && <AccountsTab />}
    </section>
  );
}
