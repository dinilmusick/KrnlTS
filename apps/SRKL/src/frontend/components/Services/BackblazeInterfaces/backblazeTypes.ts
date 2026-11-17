/**
 * @file backblazeTypes.ts
 * @description Type definitions for real Backblaze B2 Directory Explorer & Service.
 * File size < 200 lines strictly.
 */

export interface BackblazeBucket {
  id: string;
  name: string;
  type: 'allPrivate' | 'allPublic';
  region?: string;
  revision?: number;
  objectCount?: number;
  totalSizeBytes?: number;
}

export interface BackblazeItem {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  sizeBytes?: number;
  contentType?: string;
  sha1?: string;
  updatedAt?: string;
  uploadTimestamp?: number;
  fileId?: string;
  downloadUrl?: string;
  previewUrl?: string;
  blobUrl?: string;
}

export type ExplorerViewMode = 'list' | 'grid';
export type ExplorerSortOption = 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'date_desc' | 'date_asc';

export interface DirectoryNode {
  currentPath: string;
  folders: BackblazeItem[];
  files: BackblazeItem[];
  totalFilesCount: number;
  totalSizeBytes: number;
}
