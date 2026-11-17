import path from 'path';
import { AssetPoolScope, AssetDataType, AssetChannelType } from './types.js';

export const WORKSPACE_ASSETS_ROOT = path.join(process.cwd(), 'assets');
export const PROJECTS_ROOT = path.join(process.cwd(), 'projects');

export function getAssetPoolLocationPath(
  scope: AssetPoolScope,
  projectId: string | undefined,
  dataType: AssetDataType,
  channelType?: AssetChannelType,
  subfolder: string = 'userdefined'
): string {
  const root =
    scope === 'project' && projectId
      ? path.join(PROJECTS_ROOT, path.basename(projectId), 'assets')
      : WORKSPACE_ASSETS_ROOT;

  const safeSub = path.basename(subfolder).replace(/[^a-zA-Z0-9._-]/g, '_');

  if (dataType === 'audio') {
    const safeChannel = channelType === 'mono' ? 'mono' : 'stereo';
    return path.join(root, 'audio', safeChannel, safeSub);
  } else {
    return path.join(root, dataType, safeSub);
  }
}

export function getAssetPoolPublicUrl(
  scope: AssetPoolScope,
  projectId: string | undefined,
  dataType: AssetDataType,
  channelType: AssetChannelType | undefined,
  subfolder: string,
  filename: string
): string {
  const safeFilename = path.basename(filename);
  const safeSub = path.basename(subfolder);

  if (scope === 'project' && projectId) {
    const safeProj = path.basename(projectId);
    if (dataType === 'audio') {
      const channel = channelType === 'mono' ? 'mono' : 'stereo';
      return `/projects/${safeProj}/assets/audio/${channel}/${safeSub}/${safeFilename}`;
    } else {
      return `/projects/${safeProj}/assets/${dataType}/${safeSub}/${safeFilename}`;
    }
  } else {
    if (dataType === 'audio') {
      const channel = channelType === 'mono' ? 'mono' : 'stereo';
      return `/assets/audio/${channel}/${safeSub}/${safeFilename}`;
    } else {
      return `/assets/${dataType}/${safeSub}/${safeFilename}`;
    }
  }
}
