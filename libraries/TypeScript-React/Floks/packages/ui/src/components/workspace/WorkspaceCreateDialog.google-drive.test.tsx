import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  WorkspaceCreateDialog,
  createKloksWorkspaceStorageService,
  type WorkspaceStorageOption,
} from './WorkspaceCreateDialog.js';

describe('WorkspaceCreateDialog Google Drive integration', () => {
  it('connects through the injected OAuth service and returns the selected Drive folder in the canonical workspace contract', async () => {
    const driveConnection = {
      id: 'drive-auth-1',
      provider: 'google_drive',
      label: 'Drive — artist@example.test',
      googleEmail: 'artist@example.test',
      credentials: {
        accessToken: 'must-not-enter-workspace-payload',
        refreshToken: 'must-not-enter-workspace-payload',
        clientSecret: 'must-not-enter-workspace-payload',
      },
    } as unknown as WorkspaceStorageOption;
    const folder = { id: 'drive-folder-1', name: 'Studio Archive', mimeType: 'application/vnd.google-apps.folder' };
    const connectGoogleDrive = vi.fn().mockResolvedValue(driveConnection);
    const listGoogleDriveFolders = vi.fn().mockResolvedValue([folder]);
    const getGoogleDriveAccountIdentity = vi.fn().mockResolvedValue({
      accountId: 'google-account-1',
      email: 'artist@example.test',
    });
    const selectGoogleDriveRootFolder = vi.fn().mockResolvedValue(folder);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <WorkspaceCreateDialog
        open
        userId="user-1"
        storageOptions={[{ id: 'local_fs', provider: 'local_fs', label: 'Local Folder' }]}
        storageService={{
          listStorageProviderCapabilities: vi.fn().mockResolvedValue([{
            id: 'google_drive',
            displayName: 'Google Drive',
            enabled: true,
            canSelectExistingConnection: true,
            canCreateConnection: true,
            requiredConfigurationFields: [],
            authorizationMode: 'oauth2',
            discoveryCapabilities: { accounts: true, buckets: false, folders: true },
          }]),
          connectGoogleDrive,
          listGoogleDriveFolders,
          getGoogleDriveAccountIdentity,
          selectGoogleDriveRootFolder,
        }}
        visibility={{ storagePolicy: { providers: ['local_fs', 'google_drive'] } }}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Studio' } });
    fireEvent.change(screen.getByLabelText('Workspace storage'), { target: { value: 'google_drive' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Connect Google Drive' }));

    await waitFor(() => expect(connectGoogleDrive).toHaveBeenCalledWith('user-1'));
    expect(await screen.findByText('Studio Archive')).toBeInTheDocument();
    expect(listGoogleDriveFolders).toHaveBeenCalledWith('drive-auth-1', undefined, 'user-1');

    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    await waitFor(() => expect(getGoogleDriveAccountIdentity).toHaveBeenCalledWith('user-1', 'drive-auth-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));

    await waitFor(() => expect(selectGoogleDriveRootFolder).toHaveBeenCalledWith('user-1', 'drive-auth-1', 'drive-folder-1'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const input = onSubmit.mock.calls[0][0];
    expect(input.storageProvider).toBe('google_drive');
    expect(input.storage.provider).toBe('google_drive');
    expect(input.storageConnectionId).toBe('drive-auth-1');
    expect(input.storage.connectionId).toBe('drive-auth-1');
    expect(input.storage.googleEmail).toBe('artist@example.test');
    expect(input.storage.googleRootFolderId).toBe('drive-folder-1');
    expect(input.storage.googleRootFolderName).toBe('Studio Archive');
    expect(input.storageConnection).toMatchObject({
      id: 'drive-auth-1',
      provider: 'google_drive',
    });
    expect(input.storageConnection).not.toHaveProperty('credentials');
    expect(JSON.stringify(input)).not.toContain('must-not-enter-workspace-payload');
    expect(input.storageConnection).not.toHaveProperty('credentials');
    expect(input.storageConnection).not.toHaveProperty('endpoint');
    expect(input.storageConnection).not.toHaveProperty('region');
  });

  it('requires a connected Drive account and selected folder before workspace creation', async () => {
    const onSubmit = vi.fn();

    render(
      <WorkspaceCreateDialog
        open
        storageOptions={[]}
        visibility={{ storagePolicy: { providers: ['google_drive'] } }}
        storageService={{ connectGoogleDrive: vi.fn(), listGoogleDriveFolders: vi.fn() }}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Studio' } });
    fireEvent.change(screen.getByLabelText('Workspace storage'), { target: { value: 'google_drive' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/connect google drive and select a folder/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('applies provider and field visibility overrides without replacing the dialog', () => {
    const { container } = render(
      <WorkspaceCreateDialog
        open
        storageOptions={[
          { id: 'local_fs', provider: 'local_fs' },
          { id: 'b2-1', provider: 'backblaze_b2', label: 'Archive bucket' },
        ]}
        visibility={{
          storagePolicy: { providers: ['google_drive'] },
          hiddenFields: ['description', 'localFolderName', 'backblaze', 'canonicalFolderPreview'],
        }}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    const storage = screen.getByLabelText('Workspace storage');
    const options = within(storage).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Google Drive');
    expect(screen.getByRole('form', { name: 'Create workspace' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Workspace description')).not.toBeInTheDocument();
    expect(screen.queryByText('Backblaze B2')).not.toBeInTheDocument();
    expect(screen.queryByText('Canonical Workspace Folder')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('Archive bucket');
  });

  it('can hide a provider without hiding existing local and Backblaze options', () => {
    render(
      <WorkspaceCreateDialog
        open
        storageOptions={[
          { id: 'local_fs', provider: 'local_fs', label: 'Local' },
          { id: 'drive-1', provider: 'google_drive', label: 'Existing Drive' },
          { id: 'b2-1', provider: 'backblaze_b2', label: 'Archive' },
        ]}
        visibility={{ storagePolicy: { providers: ['local_fs', 'google_drive', 'backblaze_b2'] }, hiddenStorageProviders: ['google_drive'] }}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    const options = within(screen.getByLabelText('Workspace storage')).getAllByRole('option');
    expect(options.map((option) => option.textContent).join(' ')).toContain('Local');
    expect(options.map((option) => option.textContent).join(' ')).toContain('Backblaze B2');
    expect(options.map((option) => option.textContent).join(' ')).not.toContain('Google Drive');
  });

  it('uses the canonical Kloks backend storage service for connections without exposing provider secrets', async () => {
    const invoke = vi.fn(async (serviceId: string, operation: string, input: Record<string, unknown>) => {
      if (serviceId === 'kloks.backend.storage' && operation === 'getConnections') {
        expect(input).toEqual({ userId: 'user-1' });
        return {
          success: true,
          connections: [
            { id: 'local-1', provider: 'local_fs', label: 'Local Workstation' },
            {
              id: 'drive-1',
              provider: 'google_drive',
              label: 'Google Drive',
              googleEmail: 'artist@example.test',
              credentials: { accessToken: 'server-secret' },
              endpoint: 'https://provider.internal',
              region: 'private-region',
            },
            { id: 'b2-1', provider: 'backblaze_b2', label: 'Archive' },
          ],
        };
      }
      if (serviceId === 'kloks.backend.storage' && operation === 'getProviderCapabilities') {
        return [
          { id: 'backblaze_b2', displayName: 'Backblaze B2', enabled: true, canCreateConnection: true },
          { id: 'google_drive', displayName: 'Google Drive', enabled: true, canCreateConnection: true },
        ];
      }
      if (serviceId === 'kloks.backend.storage' && operation === 'testBackblazeCredentials') {
        return { success: true, buckets: [{ id: 'bucket-1', bucketName: 'archive' }] };
      }
      if (serviceId === 'kloks.backend.storage' && operation === 'createBackblazeConnection') {
        return { id: 'b2-new', provider: 'backblaze_b2', label: 'New B2' };
      }
      if (serviceId === 'kloks.backend.storage' && operation === 'createGoogleDriveAuthorizationRequest') {
        return { authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=signed-state' };
      }
      if (serviceId === 'kloks.backend.storage' && operation === 'listGoogleDriveFolders') return [];
      if (serviceId === 'kloks.backend.storage' && operation === 'getGoogleDriveAccountIdentity') {
        return { accountId: 'google-account-1', email: 'artist@example.test' };
      }
      if (serviceId === 'kloks.backend.storage' && operation === 'selectGoogleDriveRootFolder') {
        return { id: 'folder-1', name: 'Projects' };
      }
      return {};
    });
    const service = createKloksWorkspaceStorageService({ invoke });
    const connections = await service.listStorageConnections?.('user-1');
    const capabilities = await service.listStorageProviderCapabilities?.('user-1');

    expect(invoke).toHaveBeenCalledWith('kloks.backend.storage', 'getConnections', { userId: 'user-1' });
    expect(invoke).toHaveBeenCalledWith('kloks.backend.storage', 'getProviderCapabilities', { userId: 'user-1' });
    expect(connections).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'local-1', provider: 'local_fs' }),
      expect.objectContaining({ id: 'drive-1', provider: 'google_drive' }),
      expect.objectContaining({ id: 'b2-1', provider: 'backblaze_b2' }),
    ]));
    const drive = connections?.find((connection) => connection.id === 'drive-1');
    expect(drive).not.toHaveProperty('credentials');
    expect(drive).not.toHaveProperty('endpoint');
    expect(drive).not.toHaveProperty('region');
    expect(capabilities?.map((capability) => capability.id)).toEqual(['backblaze_b2', 'google_drive']);

    await expect(service.testBackblazeCredentials?.({
      keyId: 'key-id',
      applicationKey: 'private-key',
    })).resolves.toMatchObject({ success: true });
    expect(invoke).toHaveBeenCalledWith('kloks.backend.storage', 'testBackblazeCredentials', {
      keyId: 'key-id',
      applicationKey: 'private-key',
    });

    await expect(service.createBackblazeConnection?.('user-1', {
      keyId: 'key-id',
      applicationKey: 'private-key',
      bucketName: 'archive',
    })).resolves.toMatchObject({ id: 'b2-new', provider: 'backblaze_b2' });
    expect(invoke).toHaveBeenCalledWith('kloks.backend.storage', 'createBackblazeConnection', {
      userId: 'user-1',
      keyId: 'key-id',
      applicationKey: 'private-key',
      bucketName: 'archive',
    });

    const location = {
      href: 'https://app.example.test/workspaces',
      origin: 'https://app.example.test',
      assign: vi.fn(),
    };
    vi.stubGlobal('window', { location });
    try {
      await service.connectGoogleDrive?.('user-1');
      expect(location.assign).toHaveBeenCalledWith(expect.stringContaining('https://accounts.google.com/'));
    } finally {
      vi.unstubAllGlobals();
    }
    expect(invoke).toHaveBeenCalledWith('kloks.backend.storage', 'createGoogleDriveAuthorizationRequest', {
      userId: 'user-1',
      returnTo: location.href,
      callbackOrigin: location.origin,
    });
    await expect(service.listGoogleDriveFolders?.('drive-2', undefined, 'user-1')).resolves.toEqual([]);
    await expect(service.getGoogleDriveAccountIdentity?.('user-1', 'drive-2')).resolves.toEqual({
      accountId: 'google-account-1',
      email: 'artist@example.test',
    });
    await expect(service.selectGoogleDriveRootFolder?.('user-1', 'drive-2', 'folder-1')).resolves.toEqual({
      id: 'folder-1',
      name: 'Projects',
    });
  });

  it('creates a tested Backblaze connection from the workspace dialog and uses it immediately', async () => {
    const testBackblazeCredentials = vi.fn().mockResolvedValue({
      success: true,
      accountId: 'b2-account-1',
      buckets: [{ id: 'bucket-1', bucketName: 'archive' }],
    });
    const createBackblazeConnection = vi.fn().mockResolvedValue({
      id: 'b2-connection-1',
      name: 'Production B2',
      provider: 'backblaze_b2',
    });
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <WorkspaceCreateDialog
        open
        userId="user-1"
        storageOptions={[]}
        storageService={{
          listStorageProviderCapabilities: vi.fn().mockResolvedValue([
            { id: 'backblaze_b2', displayName: 'Backblaze B2', enabled: true, canCreateConnection: true },
          ]),
          listStorageConnections: vi.fn().mockResolvedValue([]),
          testBackblazeCredentials,
          createBackblazeConnection,
        }}
        visibility={{ storagePolicy: { providers: ['backblaze_b2'] } }}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Archive Workspace' } });
    await screen.findByRole('option', { name: /Add or choose a Backblaze account/i });
    fireEvent.change(screen.getByLabelText('Workspace storage'), { target: { value: 'backblaze_external' } });

    fireEvent.change(screen.getByLabelText('Backblaze Key ID'), { target: { value: 'test-key-id' } });
    fireEvent.change(screen.getByLabelText('Backblaze Application Key'), { target: { value: 'test-application-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test B2 credentials' }));

    expect(await screen.findByText(/credentials verified/i)).toBeInTheDocument();
    expect(testBackblazeCredentials).toHaveBeenCalledWith({
      keyId: 'test-key-id',
      applicationKey: 'test-application-key',
    });

    fireEvent.change(screen.getByLabelText('New Backblaze bucket'), { target: { value: 'archive' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save account and use it' }));
    await waitFor(() => expect(createBackblazeConnection).toHaveBeenCalledWith('user-1', {
      label: undefined,
      keyId: 'test-key-id',
      applicationKey: 'test-application-key',
      bucketName: 'archive',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const input = onSubmit.mock.calls[0][0];
    expect(input.storageProvider).toBe('backblaze_b2');
    expect(input.storageConnectionId).toBe('b2-connection-1');
    expect(input.storage.connectionId).toBe('b2-connection-1');
    expect(input.b2BucketName).toBe('archive');
    expect(input.storageConnection).toMatchObject({
      id: 'b2-connection-1',
      provider: 'backblaze_b2',
      b2BucketName: 'archive',
    });
    expect(JSON.stringify(input)).not.toContain('test-application-key');
    expect(JSON.stringify(input)).not.toContain('test-key-id');
  });

});
