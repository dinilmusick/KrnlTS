import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  GoogleDriveWorkspacePicker,
  describeGoogleDriveError,
  type GoogleDriveConnection,
} from './GoogleDriveWorkspacePicker.js';

const connection: GoogleDriveConnection = {
  id: 'drive-connection-1',
  provider: 'google_drive',
  googleEmail: 'artist@example.test',
};

describe('canonical Google Drive workspace picker', () => {
  it('starts authorization without exposing OAuth credentials or requesting a Google password', async () => {
    const connectGoogleDrive = vi.fn().mockResolvedValue(connection);
    const onConnected = vi.fn();

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connectGoogleDrive={connectGoogleDrive}
        onConnected={onConnected}
        onSelectFolder={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: 'Connect Google Drive' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/google password|client secret|client id/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Connect Google Drive' }));

    await waitFor(() => expect(connectGoogleDrive).toHaveBeenCalledWith('user-1'));
    await waitFor(() => expect(onConnected).toHaveBeenCalledWith(connection));
  });

  it('browses the authenticated Drive and returns the selected folder', async () => {
    const listGoogleDriveFolders = vi.fn().mockResolvedValue([
      { id: 'folder-shared', name: 'Shared Projects', mimeType: 'application/vnd.google-apps.folder' },
    ]);
    const onSelectFolder = vi.fn();

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connection={connection}
        listGoogleDriveFolders={listGoogleDriveFolders}
        onConnected={() => undefined}
        onSelectFolder={onSelectFolder}
      />,
    );

    expect(await screen.findByText('Shared Projects')).toBeInTheDocument();
    expect(listGoogleDriveFolders).toHaveBeenCalledWith(connection.id, undefined, 'user-1');
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelectFolder).toHaveBeenCalledWith({
      id: 'folder-shared',
      name: 'Shared Projects',
      mimeType: 'application/vnd.google-apps.folder',
    });
  });

  it('handles nested folder browsing and parent navigation', async () => {
    const listGoogleDriveFolders = vi.fn()
      .mockResolvedValueOnce([{ id: 'folder-parent', name: 'Projects' }])
      .mockResolvedValueOnce([{ id: 'folder-child', name: 'Current Project' }])
      .mockResolvedValueOnce([{ id: 'folder-parent', name: 'Projects' }]);

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connection={connection}
        listGoogleDriveFolders={listGoogleDriveFolders}
        onConnected={() => undefined}
        onSelectFolder={() => undefined}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Open' }));
    expect(await screen.findByText('Current Project')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Projects')).toBeInTheDocument();
    expect(listGoogleDriveFolders).toHaveBeenNthCalledWith(2, connection.id, 'folder-parent', 'user-1');
    expect(listGoogleDriveFolders).toHaveBeenNthCalledWith(3, connection.id, undefined, 'user-1');
  });

  it('represents authorization cancellation without treating it as an unexpected failure', async () => {
    const connectGoogleDrive = vi.fn().mockRejectedValue({ code: 'GOOGLE_DRIVE_CANCELLED' });

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connectGoogleDrive={connectGoogleDrive}
        onConnected={() => undefined}
        onSelectFolder={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect Google Drive' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/cancelled or declined/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('represents authorization failures and expired access clearly', async () => {
    const connectGoogleDrive = vi.fn().mockRejectedValue(new Error('OAuth exchange failed'));

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connectGoogleDrive={connectGoogleDrive}
        onConnected={() => undefined}
        onSelectFolder={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect Google Drive' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('OAuth exchange failed');
    expect(describeGoogleDriveError({ status: 401 })).toMatch(/authorization has expired/i);
    expect(describeGoogleDriveError({ status: 403 })).toMatch(/access was not granted/i);
    expect(describeGoogleDriveError({ code: 'SERVICE_UNAVAILABLE' })).toMatch(/currently unavailable/i);
  });

  it('surfaces authenticated Drive access errors from folder browsing', async () => {
    const listGoogleDriveFolders = vi.fn().mockRejectedValue({ status: 401 });

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connection={connection}
        listGoogleDriveFolders={listGoogleDriveFolders}
        onConnected={() => undefined}
        onSelectFolder={() => undefined}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/authorization has expired/i);
  });

  it('does not claim a connection exists when the authorization callback returns no connection id', async () => {
    const connectGoogleDrive = vi.fn().mockResolvedValue({ id: 'google_drive', provider: 'google_drive' });

    render(
      <GoogleDriveWorkspacePicker
        userId="user-1"
        connectGoogleDrive={connectGoogleDrive as any}
        onConnected={() => undefined}
        onSelectFolder={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect Google Drive' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid connection/i);
  });
});
