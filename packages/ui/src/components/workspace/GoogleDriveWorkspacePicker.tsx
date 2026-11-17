import React, { useCallback, useEffect, useState } from 'react';

export interface GoogleDriveConnection {
  id: string;
  provider?: string;
  label?: string;
  name?: string;
  googleEmail?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  mimeType?: string;
}

export interface GoogleDriveWorkspacePickerProps {
  userId: string;
  connection?: GoogleDriveConnection;
  connectGoogleDrive?: (userId: string) => Promise<GoogleDriveConnection | void>;
  listGoogleDriveFolders?: (connectionId: string, parentFolderId?: string, userId?: string) => Promise<GoogleDriveFolder[]>;
  onConnected: (connection: GoogleDriveConnection) => void;
  onSelectFolder: (folder: GoogleDriveFolder) => void;
  selectedFolder?: GoogleDriveFolder | null;
}

interface FolderPathEntry {
  id: string;
  name: string;
}

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as { code?: unknown; status?: unknown; response?: { status?: unknown } };
  if (typeof candidate.code === 'string') return candidate.code.toUpperCase();
  if ((error as { name?: unknown }).name === 'AbortError') return 'GOOGLE_DRIVE_CANCELLED';
  const status = candidate.status ?? candidate.response?.status;
  return status === 401 ? 'GOOGLE_DRIVE_AUTH_EXPIRED' : status === 403 ? 'GOOGLE_DRIVE_ACCESS_DENIED' : '';
}

export function describeGoogleDriveError(error: unknown): string {
  const code = getErrorCode(error);
  if (code.includes('CANCEL') || code === 'ACCESS_DENIED' || code === 'OAUTH_ACCESS_DENIED') {
    return 'Google Drive authorization was cancelled or declined. No connection was added.';
  }
  if (code.includes('EXPIRED') || code === 'UNAUTHENTICATED') {
    return 'Your Google Drive authorization has expired. Reconnect your Google account to continue.';
  }
  if (code.includes('DENIED') || code.includes('FORBIDDEN')) {
    return 'Google Drive access was not granted. Authorize Drive access and try again.';
  }
  if (code.includes('UNAVAILABLE') || code.includes('SERVICE_UNAVAILABLE')) {
    return 'Google Drive is currently unavailable. Check Drive access and try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to access Google Drive. Please try again.';
}

/**
 * Presents the Google OAuth connection and folder-selection experience.
 *
 * OAuth, token exchange, refresh, and credential persistence deliberately remain
 * behind the injected storage service. This component never collects Google
 * credentials or handles OAuth client IDs, client secrets, or access tokens.
 */
export function GoogleDriveWorkspacePicker({
  userId,
  connection,
  connectGoogleDrive,
  listGoogleDriveFolders,
  onConnected,
  onSelectFolder,
  selectedFolder,
}: GoogleDriveWorkspacePickerProps) {
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [folderPath, setFolderPath] = useState<FolderPathEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadFolders = useCallback(async (connectionId: string, parentFolderId?: string) => {
    if (!listGoogleDriveFolders) {
      setFolders([]);
      setError('Google Drive folder browsing is not configured for this storage service.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await listGoogleDriveFolders(connectionId, parentFolderId, userId);
      setFolders(Array.isArray(items) ? items.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string') : []);
    } catch (reason) {
      setFolders([]);
      setError(describeGoogleDriveError(reason));
    } finally {
      setLoading(false);
    }
  }, [listGoogleDriveFolders, userId]);

  useEffect(() => {
    setFolderPath([]);
    setFolders([]);
    setError(null);
    setStatus(null);
    if (connection?.id) void loadFolders(connection.id);
  }, [connection?.id, loadFolders]);

  const handleConnect = async () => {
    if (!connectGoogleDrive) {
      setError('Google Drive authorization is not configured for this storage service.');
      return;
    }
    setConnecting(true);
    setError(null);
    setStatus(null);
    try {
      const connected = await connectGoogleDrive(userId);
      if (!connected) {
        setStatus('Google Drive authorization started. Complete the Google sign-in to return to workspace creation.');
        return;
      }
      if (typeof connected.id !== 'string' || !connected.id || connected.id === 'google_drive') {
        throw new Error('The Google Drive authorization service returned an invalid connection.');
      }
      onConnected(connected);
      setStatus('Google Drive connected. Choose a folder for this workspace.');
    } catch (reason) {
      const message = describeGoogleDriveError(reason);
      if (getErrorCode(reason).includes('CANCEL')) setStatus(message);
      else setError(message);
    } finally {
      setConnecting(false);
    }
  };

  const openFolder = async (folder: GoogleDriveFolder) => {
    if (!connection) return;
    setLoading(true);
    setError(null);
    try {
      const items = await listGoogleDriveFolders?.(connection.id, folder.id, userId);
      setFolders(Array.isArray(items) ? items : []);
      setFolderPath((current) => [...current, { id: folder.id, name: folder.name }]);
    } catch (reason) {
      setError(describeGoogleDriveError(reason));
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    if (!connection || folderPath.length === 0) return;
    const nextPath = folderPath.slice(0, -1);
    const parentFolderId = nextPath[nextPath.length - 1]?.id;
    setLoading(true);
    setError(null);
    try {
      const items = await listGoogleDriveFolders?.(connection.id, parentFolderId, userId);
      setFolders(Array.isArray(items) ? items : []);
      setFolderPath(nextPath);
    } catch (reason) {
      setError(describeGoogleDriveError(reason));
    } finally {
      setLoading(false);
    }
  };

  const selectCurrentFolder = () => {
    const current = folderPath[folderPath.length - 1];
    if (!current) return;
    onSelectFolder(current);
    setStatus(`“${current.name}” selected as the workspace storage root.`);
  };

  if (!connection) {
    return (
      <section aria-label="Google Drive connection" className="space-y-2 border p-3">
        <p className="text-xs">Connect your Google account to browse and select a Drive folder. Google handles sign-in and authorization; Floks never asks for your Google password.</p>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        {status && <p role="status" className="text-xs">{status}</p>}
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting || !connectGoogleDrive}
          className="border px-3 py-2 text-xs font-bold disabled:opacity-50"
        >
          {connecting ? 'Connecting to Google…' : connectGoogleDrive ? 'Connect Google Drive' : 'Google Drive authorization unavailable'}
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Google Drive folder picker" className="space-y-2 border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold">Google Drive connected</p>
          <p className="truncate text-[10px] opacity-70">{connection.googleEmail || connection.label || connection.name || connection.id}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadFolders(connection.id, folderPath[folderPath.length - 1]?.id)}
          disabled={loading}
          className="border px-2 py-1 text-[10px] disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {folderPath.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={goBack} disabled={loading} className="border px-2 py-1 text-[10px] disabled:opacity-50">
            Back
          </button>
          <span className="min-w-0 truncate text-[10px] opacity-70">
            My Drive / {folderPath.map((entry) => entry.name).join(' / ')}
          </span>
          <button type="button" onClick={selectCurrentFolder} disabled={loading} className="ml-auto border px-2 py-1 text-[10px] font-bold disabled:opacity-50">
            Use this folder
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      {status && <p role="status" className="text-xs">{status}</p>}
      {selectedFolder && (
        <p className="text-[10px]">Selected workspace root: <strong>{selectedFolder.name}</strong></p>
      )}

      {loading ? (
        <p role="status" className="text-xs opacity-70">Loading Google Drive folders…</p>
      ) : folders.length === 0 ? (
        <p className="text-xs opacity-70">No folders are available at this location.</p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {folders.map((folder) => (
            <li key={folder.id} className="flex items-center justify-between gap-2 border-b py-1">
              <span className="min-w-0 truncate text-xs">{folder.name}</span>
              <span className="flex shrink-0 gap-1">
                <button type="button" onClick={() => void openFolder(folder)} disabled={loading} className="border px-2 py-1 text-[10px] disabled:opacity-50">
                  Open
                </button>
                <button type="button" onClick={() => { onSelectFolder(folder); setStatus(`“${folder.name}” selected as the workspace storage root.`); }} disabled={loading} className="border px-2 py-1 text-[10px] font-bold disabled:opacity-50">
                  Select
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
