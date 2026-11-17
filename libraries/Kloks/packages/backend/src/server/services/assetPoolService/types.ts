export type AssetDataType = 'audio' | 'midi';
export type AssetChannelType = 'stereo' | 'mono';
export type AssetPoolScope = 'workspace' | 'project';

export interface AssetFolderInfo {
  name: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  fileCount: number;
  isSystemDefault?: boolean;
}

export interface AssetPoolItem {
  id: string;
  filename: string;
  name: string;
  scope: AssetPoolScope;
  projectId?: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder: string;
  relativePath: string;
  url: string;
  size: number;
  format: string;
  createdAt: number;
}
