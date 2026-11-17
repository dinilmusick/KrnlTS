export * from './types';
export * from './helpers';

import fs from 'fs';
import path from 'path';
import { createWavBuffer } from '../../wavHelper';
import type { AssetDataType, AssetChannelType, AssetPoolScope, AssetFolderInfo, AssetPoolItem } from './types';
import { getAssetPoolPublicUrl, getAssetPoolLocationPath } from './helpers';

export const WORKSPACE_ASSETS_ROOT = path.join(process.cwd(), 'assets');
export const PROJECTS_ROOT = path.join(process.cwd(), 'projects');

export const SUPPORTED_AUDIO_EXTS = [
  '.wav',
  '.mp3',
  '.ogg',
  '.flac',
  '.m4a',
  '.webm',
  '.weba',
  '.aac',
  '.aiff',
  '.aif',
  '.opus',
  '.mp4',
];

export const SUPPORTED_MIDI_EXTS = ['.mid', '.midi', '.json'];



/**
 * Ensures baseline folder structure for an asset root directory:
 * assets/
 * ├── audio/
 * │   ├── stereo/
 * │   │   ├── default/
 * │   │   └── userdefined/
 * │   └── mono/
 * │       ├── default/
 * │       └── userdefined/
 * └── midi/
 *     ├── default/
 *     └── userdefined/
 */
export async function ensureAssetPoolDirectories(rootDir: string): Promise<void> {
  const dirs = [
    path.join(rootDir, 'audio', 'stereo', 'default'),
    path.join(rootDir, 'audio', 'stereo', 'userdefined'),
    path.join(rootDir, 'audio', 'mono', 'default'),
    path.join(rootDir, 'audio', 'mono', 'userdefined'),
    path.join(rootDir, 'midi', 'default'),
    path.join(rootDir, 'midi', 'userdefined'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
}

/**
 * Seed starter audio samples and MIDI files into default asset pools
 */
export async function seedDefaultAssets(): Promise<void> {
  await ensureAssetPoolDirectories(WORKSPACE_ASSETS_ROOT);

  // Seed default audio samples in workspace stereo pool
  const stereoDefaultDir = path.join(WORKSPACE_ASSETS_ROOT, 'audio', 'stereo', 'default');
  const monoDefaultDir = path.join(WORKSPACE_ASSETS_ROOT, 'audio', 'mono', 'default');
  const midiDefaultDir = path.join(WORKSPACE_ASSETS_ROOT, 'midi', 'default');

  const sampleRate = 44100;

  // 1. Stereo Sub Boom
  const subBoomPath = path.join(stereoDefaultDir, '808_sub_boom.wav');
  if (!fs.existsSync(subBoomPath)) {
    const numSamples = Math.floor(sampleRate * 1.8);
    const chL = new Float32Array(numSamples);
    const chR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const p = i / numSamples;
      const pitch = 55 * Math.exp(-p * 5) + 38;
      const s = Math.tanh(Math.sin(2 * Math.PI * pitch * (i / sampleRate)) * 2.8) * 0.7 * Math.exp(-p * 2.2);
      chL[i] = s;
      chR[i] = s;
    }
    await fs.promises.writeFile(subBoomPath, createWavBuffer(sampleRate, 2, [chL, chR]));
  }

  // 2. Stereo Celestial Lead
  const leadPath = path.join(stereoDefaultDir, 'celestial_lead.wav');
  if (!fs.existsSync(leadPath)) {
    const numSamples = Math.floor(sampleRate * 2.5);
    const chL = new Float32Array(numSamples);
    const chR = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const p = i / numSamples;
      const f = 440 + Math.sin(t * 6) * 4;
      const s1 = Math.sin(2 * Math.PI * f * t) * 0.4;
      const s2 = Math.sin(2 * Math.PI * f * 2 * t) * 0.2;
      const env = Math.sin(p * Math.PI) * 0.8;
      chL[i] = s1 * env;
      chR[i] = (s1 + s2 * 0.5) * env;
    }
    await fs.promises.writeFile(leadPath, createWavBuffer(sampleRate, 2, [chL, chR]));
  }

  // 3. Stereo Ethereal Pad
  const padPath = path.join(stereoDefaultDir, 'ethereal_pad.wav');
  if (!fs.existsSync(padPath)) {
    const numSamples = Math.floor(sampleRate * 3.0);
    const chL = new Float32Array(numSamples);
    const chR = new Float32Array(numSamples);
    const chord = [261.63, 329.63, 392.0, 523.25];
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const p = i / numSamples;
      let left = 0;
      let right = 0;
      chord.forEach((freq, idx) => {
        const lfo = Math.sin(t * (2 + idx * 0.5)) * 0.04;
        left += Math.sin(2 * Math.PI * freq * (1 + lfo) * t) * 0.15;
        right += Math.sin(2 * Math.PI * freq * 1.004 * (1 - lfo) * t) * 0.15;
      });
      const env = Math.sin(p * Math.PI);
      chL[i] = left * env;
      chR[i] = right * env;
    }
    await fs.promises.writeFile(padPath, createWavBuffer(sampleRate, 2, [chL, chR]));
  }

  // 4. Mono Snare Snappy
  const snarePath = path.join(monoDefaultDir, 'snare_snappy.wav');
  if (!fs.existsSync(snarePath)) {
    const numSamples = Math.floor(sampleRate * 0.8);
    const chM = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const p = i / numSamples;
      const tone = Math.sin(2 * Math.PI * 180 * Math.exp(-p * 10) * t) * Math.exp(-p * 8) * 0.4;
      const noise = (Math.random() * 2 - 1) * Math.exp(-p * 4.5) * 0.6;
      chM[i] = tone + noise;
    }
    await fs.promises.writeFile(snarePath, createWavBuffer(sampleRate, 1, [chM]));
  }

  // 5. Mono Closed HiHat
  const hihatPath = path.join(monoDefaultDir, 'hihat_closed.wav');
  if (!fs.existsSync(hihatPath)) {
    const numSamples = Math.floor(sampleRate * 0.25);
    const chM = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const p = i / numSamples;
      const noise = (Math.random() * 2 - 1) * Math.exp(-p * 20);
      chM[i] = noise * 0.5;
    }
    await fs.promises.writeFile(hihatPath, createWavBuffer(sampleRate, 1, [chM]));
  }

  // 6. MIDI Starter Progression
  const midiChordPath = path.join(midiDefaultDir, 'lydian_celestial_pad.json');
  if (!fs.existsSync(midiChordPath)) {
    const starterMidiPattern = {
      id: 'pat-default-lydian',
      name: 'Lydian Celestial Pad',
      lengthInBeats: 4,
      tempo: 120,
      notes: [
        { note: 60, name: 'C4', velocity: 0.85, time: 0, duration: 3.8 },
        { note: 64, name: 'E4', velocity: 0.8, time: 0, duration: 3.8 },
        { note: 67, name: 'G4', velocity: 0.8, time: 0, duration: 3.8 },
        { note: 71, name: 'B4', velocity: 0.75, time: 0, duration: 3.8 },
      ],
    };
    await fs.promises.writeFile(midiChordPath, JSON.stringify(starterMidiPattern, null, 2), 'utf-8');
  }

  // Also seed default-kingdom project assets
  await ensureProjectAssets('default-kingdom');
}

/**
 * Ensures project level asset pool directories exist
 */
export async function ensureProjectAssets(projectId: string): Promise<string> {
  const safeId = path.basename(projectId);
  const projectAssetsDir = path.join(PROJECTS_ROOT, safeId, 'assets');
  await ensureAssetPoolDirectories(projectAssetsDir);
  return projectAssetsDir;
}

/**
 * Scan all subfolders and items in an asset pool
 */
export async function scanAssetPool(
  scope: AssetPoolScope,
  projectId?: string
): Promise<{ folders: AssetFolderInfo[]; items: AssetPoolItem[] }> {
  if (scope === 'project' && projectId) {
    await ensureProjectAssets(projectId);
  } else {
    await ensureAssetPoolDirectories(WORKSPACE_ASSETS_ROOT);
  }

  const rootDir =
    scope === 'project' && projectId
      ? path.join(PROJECTS_ROOT, path.basename(projectId), 'assets')
      : WORKSPACE_ASSETS_ROOT;

  const folders: AssetFolderInfo[] = [];
  const items: AssetPoolItem[] = [];

  // Helper scanner for target category directory
  async function scanCategoryFolder(dataType: AssetDataType, channelType?: AssetChannelType) {
    const catDir =
      dataType === 'audio'
        ? path.join(rootDir, 'audio', channelType === 'mono' ? 'mono' : 'stereo')
        : path.join(rootDir, 'midi');

    if (!fs.existsSync(catDir)) {
      await fs.promises.mkdir(catDir, { recursive: true });
    }

    const subentries = await fs.promises.readdir(catDir, { withFileTypes: true });

    for (const entry of subentries) {
      if (!entry.isDirectory()) continue;
      const subfolderName = entry.name;
      const subfolderDir = path.join(catDir, subfolderName);

      const files = await fs.promises.readdir(subfolderDir);
      let validFileCount = 0;

      for (const file of files) {
        if (file.startsWith('.')) continue;
        const ext = path.extname(file).toLowerCase();
        const isAudio = SUPPORTED_AUDIO_EXTS.includes(ext);
        const isMidi = SUPPORTED_MIDI_EXTS.includes(ext);

        if ((dataType === 'audio' && !isAudio) || (dataType === 'midi' && !isMidi)) continue;

        validFileCount++;
        const filePath = path.join(subfolderDir, file);
        const stat = await fs.promises.stat(filePath);
        const cleanName = path
          .basename(file, ext)
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const relPath =
          dataType === 'audio'
            ? `audio/${channelType === 'mono' ? 'mono' : 'stereo'}/${subfolderName}/${file}`
            : `midi/${subfolderName}/${file}`;

        const url = getAssetPoolPublicUrl(
          scope,
          projectId,
          dataType,
          channelType,
          subfolderName,
          file
        );

        items.push({
          id: `${scope}-${projectId || 'ws'}-${relPath}`,
          filename: file,
          name: cleanName,
          scope,
          projectId: scope === 'project' ? projectId : undefined,
          dataType,
          channelType: dataType === 'audio' ? channelType || 'stereo' : undefined,
          subfolder: subfolderName,
          relativePath: relPath,
          url,
          size: stat.size,
          format: ext.replace('.', '').toUpperCase(),
          createdAt: stat.birthtimeMs || stat.mtimeMs,
        });
      }

      folders.push({
        name: subfolderName,
        dataType,
        channelType,
        fileCount: validFileCount,
        isSystemDefault: subfolderName === 'default' || subfolderName === 'userdefined',
      });
    }
  }

  // Scan Audio Stereo
  await scanCategoryFolder('audio', 'stereo');
  // Scan Audio Mono
  await scanCategoryFolder('audio', 'mono');
  // Scan MIDI
  await scanCategoryFolder('midi', undefined);

  return { folders, items };
}

/**
 * Creates a dynamic userdefined subfolder in the specified pool category
 */
export async function createAssetSubfolder(params: {
  scope: AssetPoolScope;
  projectId?: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  folderName: string;
}): Promise<AssetFolderInfo> {
  const safeName = path.basename(params.folderName).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeName) throw new Error('Invalid subfolder name');

  const dirPath = getAssetPoolLocationPath(
    params.scope,
    params.projectId,
    params.dataType,
    params.channelType,
    safeName
  );

  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }

  return {
    name: safeName,
    dataType: params.dataType,
    channelType: params.channelType,
    fileCount: 0,
    isSystemDefault: safeName === 'default' || safeName === 'userdefined',
  };
}

/**
 * Saves uploaded audio or MIDI base64 file into the specified asset pool
 */
export async function saveAssetToPool(params: {
  scope: AssetPoolScope;
  projectId?: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder?: string;
  filename: string;
  base64Content: string;
}): Promise<AssetPoolItem> {
  const subfolder = params.subfolder || 'userdefined';
  const targetDir = getAssetPoolLocationPath(
    params.scope,
    params.projectId,
    params.dataType,
    params.channelType,
    subfolder
  );

  if (!fs.existsSync(targetDir)) {
    await fs.promises.mkdir(targetDir, { recursive: true });
  }

  const safeFilename = path.basename(params.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = path.extname(safeFilename).toLowerCase() || (params.dataType === 'audio' ? '.wav' : '.json');
  const filePath = path.join(targetDir, safeFilename);

  const buffer = Buffer.from(params.base64Content, 'base64');
  await fs.promises.writeFile(filePath, buffer);

  const stat = await fs.promises.stat(filePath);
  const cleanName = path.basename(safeFilename, ext).replace(/[-_]/g, ' ');

  const relPath =
    params.dataType === 'audio'
      ? `audio/${params.channelType === 'mono' ? 'mono' : 'stereo'}/${subfolder}/${safeFilename}`
      : `midi/${subfolder}/${safeFilename}`;

  const url = getAssetPoolPublicUrl(
    params.scope,
    params.projectId,
    params.dataType,
    params.channelType,
    subfolder,
    safeFilename
  );

  return {
    id: `${params.scope}-${params.projectId || 'ws'}-${relPath}`,
    filename: safeFilename,
    name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
    scope: params.scope,
    projectId: params.scope === 'project' ? params.projectId : undefined,
    dataType: params.dataType,
    channelType: params.dataType === 'audio' ? params.channelType || 'stereo' : undefined,
    subfolder,
    relativePath: relPath,
    url,
    size: stat.size,
    format: ext.replace('.', '').toUpperCase(),
    createdAt: stat.birthtimeMs || stat.mtimeMs,
  };
}

/**
 * Delete an asset file from pool
 */
export async function deleteAssetFromPool(params: {
  scope: AssetPoolScope;
  projectId?: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder: string;
  filename: string;
}): Promise<boolean> {
  const targetDir = getAssetPoolLocationPath(
    params.scope,
    params.projectId,
    params.dataType,
    params.channelType,
    params.subfolder
  );

  const filePath = path.join(targetDir, path.basename(params.filename));
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }
  return false;
}