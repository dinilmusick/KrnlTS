/**
 * @file useBackblazeExplorer.ts
 * @description State and data fetching hook for Backblaze B2 Explorer.
 * File size < 200 lines strictly.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { BackblazeBucket, BackblazeItem, ExplorerViewMode, ExplorerSortOption } from './backblazeTypes';
import {
  fetchLiveBuckets,
  fetchLiveBucketFiles,
  uploadLiveFile,
  deleteLiveFile,
  deleteLiveBucket,
  deleteLiveFolder,
  createLiveFolder,
} from './backblazeApi';
import { BackblazeEventBus, BackblazeEvent } from '@/libraries/services/backblaze/BackblazeEventBus';

export function useBackblazeExplorer(account: ServiceAccount) {
  const keyId = (account.getCredential('keyId') || '').trim();
  const applicationKey = (account.getCredential('applicationKey') || '').trim();
  const creds = useMemo(() => ({ keyId, applicationKey }), [keyId, applicationKey]);

  const [buckets, setBuckets] = useState<BackblazeBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<BackblazeBucket | null>(null);
  const [items, setItems] = useState<BackblazeItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ExplorerViewMode>('list');
  const [sortOption, setSortOption] = useState<ExplorerSortOption>('name_asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BackblazeItem | null>(null);
  const [infoItem, setInfoItem] = useState<BackblazeItem | null>(null);
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [deleteModalItem, setDeleteModalItem] = useState<BackblazeItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBuckets = useCallback(async () => {
    if (!keyId || !applicationKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const liveBuckets = await fetchLiveBuckets(creds);
      setBuckets(liveBuckets);
      if (liveBuckets.length > 0) {
        setSelectedBucket((prev) => (prev && liveBuckets.some((b) => b.id === prev.id) ? prev : liveBuckets[0]));
      } else {
        setSelectedBucket(null);
        setItems([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate and list buckets from Backblaze.');
    } finally {
      setIsLoading(false);
    }
  }, [keyId, applicationKey, creds]);

  const loadBucketFiles = useCallback(async (bucket?: BackblazeBucket | null) => {
    const target = bucket || selectedBucket;
    if (!target || !keyId || !applicationKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const { items: liveItems } = await fetchLiveBucketFiles(creds, target.id, target.name);
      setItems(liveItems);
    } catch (err: any) {
      setError(err.message || 'Failed to read bucket directory tree.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucket, keyId, applicationKey, creds]);

  useEffect(() => { loadBuckets(); }, [loadBuckets]);

  useEffect(() => {
    if (selectedBucket) {
      setCurrentPath('');
      loadBucketFiles(selectedBucket);
    }
  }, [selectedBucket?.id, loadBucketFiles]);

  useEffect(() => {
    return BackblazeEventBus.subscribe((event: BackblazeEvent) => {
      if (event.type === 'b2:bucket:created' || event.type === 'b2:bucket:deleted') {
        loadBuckets();
      } else if (event.bucketId && selectedBucket && event.bucketId === selectedBucket.id) {
        loadBucketFiles(selectedBucket);
      }
    });
  }, [loadBuckets, loadBucketFiles, selectedBucket]);

  const handleUploadFiles = async (fileList: FileList) => {
    if (!selectedBucket) return;
    setIsLoading(true);
    setError(null);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const destPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        await uploadLiveFile(creds, selectedBucket.id, destPath, file);
      }
      await loadBucketFiles(selectedBucket);
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!selectedBucket) return;
    const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setIsLoading(true);
    setError(null);
    try {
      await createLiveFolder(creds, selectedBucket.id, folderPath);
      await loadBucketFiles(selectedBucket);
    } catch (err: any) {
      setError(err.message || 'Failed to create folder in Backblaze');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBucket || !deleteModalItem) return;
    setIsDeletingItem(true);
    setError(null);
    try {
      if (deleteModalItem.type === 'file') {
        await deleteLiveFile(creds, deleteModalItem.path, deleteModalItem.fileId, selectedBucket.id);
      } else if (deleteModalItem.type === 'folder') {
        await deleteLiveFolder(creds, deleteModalItem.path, selectedBucket.id);
      }
      if (previewItem?.id === deleteModalItem.id) setPreviewItem(null);
      if (infoItem?.id === deleteModalItem.id) setInfoItem(null);
      setDeleteModalItem(null);
      await loadBucketFiles(selectedBucket);
    } catch (err: any) {
      setError(err.message || `Failed to delete ${deleteModalItem.type}`);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleDeleteBucket = async () => {
    if (!selectedBucket) return;
    if (!window.confirm(`Delete bucket "${selectedBucket.name}"? Note: B2 buckets must be empty before deletion.`)) return;
    setIsLoading(true);
    try {
      await deleteLiveBucket(creds, selectedBucket.id);
      await loadBuckets();
    } catch (err: any) {
      setError(err.message || 'Failed to delete bucket');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    creds,
    buckets,
    setBuckets,
    selectedBucket, setSelectedBucket, items, currentPath, setCurrentPath,
    searchQuery, setSearchQuery, viewMode, setViewMode, sortOption, setSortOption,
    isLoading, error, previewItem, setPreviewItem, infoItem, setInfoItem,
    isCreateBucketOpen, setIsCreateBucketOpen, isNewFolderOpen, setIsNewFolderOpen,
    deleteModalItem, setDeleteModalItem, isDeletingItem, fileInputRef,
    loadBuckets, loadBucketFiles, handleUploadFiles, handleCreateFolder,
    handleConfirmDelete, handleDeleteBucket,
  };
}
