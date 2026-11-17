import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WorkspaceCreateDialog, type WorkspaceStorageService } from './WorkspaceCreateDialog.js';

describe('canonical Backblaze workspace creation flow', () => {
  it('tests credentials, discovers a bucket, saves an opaque connection, clears secrets and creates the workspace', async () => {
    const calls: string[] = [];
    const storageService: WorkspaceStorageService = {
      listStorageProviderCapabilities: vi.fn().mockResolvedValue([{
        id: 'backblaze_b2',
        displayName: 'Backblaze B2',
        enabled: true,
        canSelectExistingConnection: true,
        canCreateConnection: true,
        requiredConfigurationFields: ['keyId', 'applicationKey'],
        authorizationMode: 'application_key',
        discoveryCapabilities: { accounts: true, buckets: true, folders: false },
      }]),
      listStorageConnections: vi.fn().mockResolvedValue([]),
      testBackblazeCredentials: vi.fn().mockImplementation(async () => {
        calls.push('testBackblazeCredentials');
        return { success: true, buckets: [{ bucketId: 'bucket-1', bucketName: 'workspace-data' }] };
      }),
      createBackblazeConnection: vi.fn().mockImplementation(async (_userId, input) => {
        calls.push('createBackblazeConnection');
        expect(input).toEqual({
          keyId: 'temporary-key',
          applicationKey: 'temporary-secret',
          bucketName: 'workspace-data',
        });
        return { id: 'saved-b2-1', name: 'Production B2', provider: 'backblaze_b2' };
      }),
    };
    const onSubmit = vi.fn();

    render(
      <WorkspaceCreateDialog
        open
        userId="user-1"
        currentUser={{ id: 'user-1', email: 'artist@example.test' }}
        appName="Floks Test"
        visibility={{ storagePolicy: { providers: ['backblaze_b2'] } }}
        storageService={storageService}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Workspace name' }), {
      target: { value: 'Research Vault' },
    });
    await screen.findByRole('option', { name: /Add or choose a Backblaze account/i });
    fireEvent.change(screen.getByRole('combobox', { name: 'Workspace storage' }), {
      target: { value: 'backblaze_external' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: 'Backblaze Key ID' }), {
      target: { value: 'temporary-key' },
    });
    fireEvent.change(screen.getByLabelText('Backblaze Application Key'), {
      target: { value: 'temporary-secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Test B2 credentials' }));

    expect(await screen.findByText(/Credentials verified/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'New Backblaze bucket' })).toHaveValue('workspace-data');
    fireEvent.click(screen.getByRole('button', { name: 'Save account and use it' }));

    await waitFor(() => expect(storageService.createBackblazeConnection).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText('Backblaze Key ID')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Backblaze Application Key')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Workspace storage' })).toHaveValue('saved-b2-1');

    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.storageProvider).toBe('backblaze_b2');
    expect(payload.storageConnectionId).toBe('saved-b2-1');
    expect(payload.b2BucketName).toBe('workspace-data');
    expect(JSON.stringify(payload)).not.toMatch(/temporary-key|temporary-secret|applicationKey|b2KeyId/);
    expect(calls).toEqual(['testBackblazeCredentials', 'createBackblazeConnection']);
  });
});
