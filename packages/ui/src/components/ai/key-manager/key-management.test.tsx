import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmailProfileRegistrationForm } from './EmailProfileRegistrationForm.js';
import { KeyBackupExportTab } from './KeyBackupExportTab.js';
import { ExistingKeyControl } from './ExistingKeyControl.js';

describe('AI key management UI', () => {
  it('submits an email profile through its generic contract', () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(<EmailProfileRegistrationForm value="user@example.com" onChange={onChange} onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('renders export payload and exposes download/copy actions', () => {
    const payload = { exportMetadata: { totalKeys: 2, totalEmailProfiles: 1 }, keys: [] };
    render(<KeyBackupExportTab exportPayload={payload} />);
    expect(screen.getByText('2 KEYS')).toBeTruthy();
    expect(screen.getByText('1 SECTIONS')).toBeTruthy();
    expect(screen.getByRole('button', { name: /export backup file/i })).toBeTruthy();
  });

  it('provides generic key lifecycle actions without app imports', () => {
    const onVerifyKey = vi.fn();
    const onDeleteKey = vi.fn();
    const onUpdateKeyLabel = vi.fn();
    render(
      <ExistingKeyControl
        providerKey={{ id: 'key-1', providerId: 'google', label: 'Primary', key: 'secret-value', status: 'active' }}
        usageStats={[{ keyId: 'key-1', dayCount: 2, weekCount: 4, monthCount: 8 }]}
        onVerifyKey={onVerifyKey}
        onDeleteKey={onDeleteKey}
        onUpdateKeyLabel={onUpdateKeyLabel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /re-verify/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onVerifyKey).toHaveBeenCalledWith('key-1');
    expect(onDeleteKey).toHaveBeenCalledWith('key-1');
  });
});
