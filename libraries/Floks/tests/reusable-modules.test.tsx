import React from 'react';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  AuthPage,
  authPageDefinition,
  TilesMenu,
  tilesMenuDefinition,
  WorkspaceTilesMenu,
  workspaceTilesMenuDefinition,
  WorkspaceCreateDialog,
  createKloksWorkspaceStorageService,
  GraphsMenu,
} from '../packages/ui/src/index.js';
import { floksFrnlStore } from '../packages/ui/src/frnl/store.js';

afterEach(() => cleanup());

describe('reusable application modules', () => {
  it('defines FRNL state/events for auth and menus', () => {
    expect(authPageDefinition.states.idle.events.login.functionId).toBe('AuthPage.idle.login');
    expect(tilesMenuDefinition.states.idle.events.select.functionId).toBe('tilesMenu.idle.select');
    expect(workspaceTilesMenuDefinition.states.idle.events.create.functionId).toBe('workspaceTilesMenu.idle.create');
    expect(authPageDefinition.states.loading.phases.sustainPhase).toBeDefined();
    expect(workspaceTilesMenuDefinition.states.loading.phases.sustainPhase).toBeDefined();
  });

  it('registers AuthPage in the FRNL store and invokes the supplied auth service', async () => {
    let loginCalled = false;
    render(
      <AuthPage
        onLogin={async () => { loginCalled = true; return { success: true }; }}
        onRegister={async () => ({ success: true })}
      />,
    );
    expect(Object.keys(floksFrnlStore.getState().entities).some((id) => id.startsWith('AuthPage.'))).toBe(true);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in to workspace/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loginCalled).toBe(true);
  });

  it('uses TilesMenu as the base interaction surface', () => {
    let selected = '';
    render(
      <TilesMenu
        title="Tiles"
        tiles={[{ id: 'one', title: 'One', description: 'First' }]}
        onSelect={(tile) => { selected = tile.id; }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /one/i }));
    expect(selected).toBe('one');
  });

  it('discovers and selects an existing saved Backblaze connection through the canonical storage selector', async () => {
    const calls: string[] = [];
    const onSubmit = vi.fn();
    const storageService = {
      listStorageProviderCapabilities: async (userId: string) => {
        calls.push('capabilities:' + userId);
        return [{ id: 'backblaze_b2', displayName: 'Backblaze B2', enabled: true, canSelectExistingConnection: true, canCreateConnection: false, requiredConfigurationFields: [], authorizationMode: 'none', discoveryCapabilities: { accounts: true, buckets: true, folders: false } }];
      },
      listStorageConnections: async (userId: string) => {
        calls.push('connections:' + userId);
        return [{
          id: 'acct-1',
          provider: 'backblaze_b2',
          label: 'Archive B2',
          b2BucketName: 'workspace-bucket',
        }];
      },
    };
    render(
      <WorkspaceCreateDialog
        open
        userId="user-1"
        storageService={storageService}
        visibility={{ storagePolicy: { providers: ['backblaze_b2'] } }}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Archive' } });
    expect(await screen.findByRole('option', { name: /Archive B2/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Workspace storage'), { target: { value: 'acct-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      storageProvider: 'backblaze_b2',
      storageConnectionId: 'acct-1',
      b2BucketName: 'workspace-bucket',
    });
    expect(calls).toEqual(['capabilities:user-1', 'connections:user-1']);
  });

  it('adapts canonical Kloks connections without coupling provider account management to SRKL', async () => {
    const calls: unknown[] = [];
    const service = createKloksWorkspaceStorageService({
      invoke: async (...args) => {
        calls.push(args);
        return [{ id: 'drive-1', provider: 'google_drive', label: 'Google Drive' }];
      },
    });
    expect(await service.listStorageConnections?.('user-1')).toEqual([
      expect.objectContaining({ id: 'drive-1', provider: 'google_drive' }),
    ]);
    expect(calls).toEqual([['kloks.backend.storage', 'getConnections', { userId: 'user-1' }]]);
    expect(service).not.toHaveProperty('listBackblazeAccounts');
    expect(service).not.toHaveProperty('listBackblazeBuckets');
  });

  it('renders the workspace menu with the reusable creation flow', () => {
    const storageService = {};
    render(
      <WorkspaceTilesMenu
        workspaces={[{ id: 'ws1', title: 'Docs', storageProvider: 'local_fs' }]}
        userId="user-1"
        storageService={storageService}
        onSelectWorkspace={() => {}}
        onCreateWorkspace={async () => {}}
      />,
    );
    expect(screen.getByText('Workspaces')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /docs/i })).toBeInTheDocument();
  });

  it('forwards an explicit application storage policy through WorkspaceTilesMenu', () => {
    render(
      <WorkspaceTilesMenu
        workspaces={[]}
        visibility={{ storagePolicy: { providers: ['local_fs'] } }}
        onSelectWorkspace={() => {}}
        onCreateWorkspace={async () => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new workspace/i }));
    expect(screen.getByLabelText('Workspace storage')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /local folder/i })).toBeInTheDocument();
  });

  it('renders an empty reusable graphs menu without requiring a domain implementation', () => {
    render(<GraphsMenu graphs={[]} onSelectGraph={() => {}} />);
    expect(screen.getByText('Graphs')).toBeInTheDocument();
    expect(screen.getByText('No tiles found.')).toBeInTheDocument();
  });
});
