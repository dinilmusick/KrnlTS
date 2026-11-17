'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { BackblazeBucket, BackblazeItem } from './backblazeTypes';
import { BackblazePreviewModal } from './BackblazePreviewModal';
import { BackblazeFileInfoModal } from './BackblazeFileInfoModal';
import { BackblazeCreateBucketModal } from './BackblazeCreateBucketModal';
import { BackblazeNewFolderModal } from './BackblazeNewFolderModal';
import { BackblazeDeleteConfirmModal } from './BackblazeDeleteConfirmModal';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface BackblazeModalsContainerProps {
  previewItem: BackblazeItem | null;
  onClosePreview: () => void;
  infoItem: BackblazeItem | null;
  onCloseInfo: () => void;
  isCreateBucketOpen: boolean;
  onCloseCreateBucket: () => void;
  creds: { keyId: string; applicationKey: string };
  onBucketCreated: (bucket: BackblazeBucket) => void;
  isNewFolderOpen: boolean;
  onCloseNewFolder: () => void;
  currentPath: string;
  onCreateFolder: (name: string) => Promise<void>;
  deleteModalItem: BackblazeItem | null;
  isDeletingItem: boolean;
  onConfirmDelete: () => Promise<void>;
  onCloseDeleteModal: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export const BackblazeModalsContainer: React.FC<BackblazeModalsContainerProps> = ({
  previewItem,
  onClosePreview,
  infoItem,
  onCloseInfo,
  isCreateBucketOpen,
  onCloseCreateBucket,
  creds,
  onBucketCreated,
  isNewFolderOpen,
  onCloseNewFolder,
  currentPath,
  onCreateFolder,
  deleteModalItem,
  isDeletingItem,
  onConfirmDelete,
  onCloseDeleteModal,
}) => {
  return (
    <>
      <BackblazePreviewModal item={previewItem} onClose={onClosePreview} />
      <BackblazeFileInfoModal item={infoItem} onClose={onCloseInfo} />
      <BackblazeCreateBucketModal
        isOpen={isCreateBucketOpen}
        onClose={onCloseCreateBucket}
        creds={creds}
        onCreated={onBucketCreated}
      />
      <BackblazeNewFolderModal
        isOpen={isNewFolderOpen}
        onClose={onCloseNewFolder}
        currentPath={currentPath}
        onCreateFolder={onCreateFolder}
      />
      <BackblazeDeleteConfirmModal
        isOpen={!!deleteModalItem}
        item={deleteModalItem}
        isDeleting={isDeletingItem}
        onConfirm={onConfirmDelete}
        onClose={onCloseDeleteModal}
      />
    </>
  );
};
