/**
 * @file graphAssetService.ts
 * @description Server-side service for Graph-Scoped Asset Ownership.
 * Ensures assets are strictly owned and managed by individual Graph Packages.
 * Imported graphs retain independent ownership of their respective assets.
 */

import fs from 'fs';
import path from 'path';
import { createWavBuffer } from '../wavHelper';
import {
  AssetDataType,
  AssetChannelType,
  GraphAssetItem as BaseGraphAssetItem,
  GraphFolderInfo as BaseGraphFolderInfo,
} from '@kloks/state-graph';

export type GraphAssetItem = Partial<BaseGraphAssetItem> & { id: string; filename: string; name: string; graphId?: string; subfolder?: string; [key: string]: any };
export type GraphFolderInfo = Partial<BaseGraphFolderInfo> & { name: string; graphId?: string; isSystemDefault?: boolean; [key: string]: any };

export const WORKSPACE_ROOT = path.join(process.cwd(), 'workspaces', 'default');
export const GRAPHS_ROOT = path.join(WORKSPACE_ROOT, 'graphs');

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
 * Ensures baseline folder structure inside a graph package's assets directory:
 * <graphDir>/assets/
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
export function ensureGraphAssetDirectories(graphDir: string): void {
  const dirs = [
    path.join(graphDir, 'assets', 'audio', 'stereo', 'default'),
    path.join(graphDir, 'assets', 'audio', 'stereo', 'userdefined'),
    path.join(graphDir, 'assets', 'audio', 'mono', 'default'),
    path.join(graphDir, 'assets', 'audio', 'mono', 'userdefined'),
    path.join(graphDir, 'assets', 'midi', 'default'),
    path.join(graphDir, 'assets', 'midi', 'userdefined'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Seeds starter audio and midi assets into a graph package
 */
export function seedStarterGraphAssets(graphDir: string): void {
  const stereoDefaultDir = path.join(graphDir, 'assets', 'audio', 'stereo', 'default');
  const monoDefaultDir = path.join(graphDir, 'assets', 'audio', 'mono', 'default');
  const midiDefaultDir = path.join(graphDir, 'assets', 'midi', 'default');

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
    fs.writeFileSync(subBoomPath, createWavBuffer(sampleRate, 2, [chL, chR]));
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
    fs.writeFileSync(leadPath, createWavBuffer(sampleRate, 2, [chL, chR]));
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
    fs.writeFileSync(padPath, createWavBuffer(sampleRate, 2, [chL, chR]));
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
    fs.writeFileSync(snarePath, createWavBuffer(sampleRate, 1, [chM]));
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
    fs.writeFileSync(hihatPath, createWavBuffer(sampleRate, 1, [chM]));
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
    fs.writeFileSync(midiChordPath, JSON.stringify(starterMidiPattern, null, 2), 'utf-8');
  }
}

/**
 * Scan all assets owned by a graph package and optionally its imported graph dependencies
 */
export async function scanGraphAssets(
  graphId: string,
  includeImported: boolean = true
): Promise<{ folders: GraphFolderInfo[]; items: GraphAssetItem[]; importedItems?: GraphAssetItem[] }> {
  const safeGraphId = path.basename(graphId);
  const graphDir = path.join(GRAPHS_ROOT, safeGraphId);

  if (!fs.existsSync(graphDir)) {
    await fs.promises.mkdir(graphDir, { recursive: true });
  }
  ensureGraphAssetDirectories(graphDir);

  const folders: GraphFolderInfo[] = [];
  const items: GraphAssetItem[] = [];
  const importedItems: GraphAssetItem[] = [];

  // Helper scanner for a single graph directory
  async function scanSingleGraph(gId: string, isImported: boolean, ownerName?: string) {
    const currentGraphDir = path.join(GRAPHS_ROOT, path.basename(gId));
    const assetsDir = path.join(currentGraphDir, 'assets');
    if (!fs.existsSync(assetsDir)) return;

    async function scanCategoryFolder(dataType: AssetDataType, channelType?: AssetChannelType) {
      const catDir =
        dataType === 'audio'
          ? path.join(assetsDir, 'audio', channelType === 'mono' ? 'mono' : 'stereo')
          : path.join(assetsDir, 'midi');

      if (!fs.existsSync(catDir)) return;

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

          const url =
            dataType === 'audio'
              ? `/graphs/${gId}/assets/audio/${channelType === 'mono' ? 'mono' : 'stereo'}/${subfolderName}/${file}`
              : `/graphs/${gId}/assets/midi/${subfolderName}/${file}`;

          const item: GraphAssetItem = {
            id: `asset-${gId}-${relPath}`,
            filename: file,
            name: cleanName,
            graphId: gId,
            dataType,
            channelType: dataType === 'audio' ? channelType || 'stereo' : undefined,
            subfolder: subfolderName,
            relativePath: relPath,
            url,
            size: stat.size,
            format: ext.replace('.', '').toUpperCase(),
            createdAt: stat.birthtimeMs || stat.mtimeMs,
            isImported,
            ownerGraphName: ownerName,
          };

          if (isImported) {
            importedItems.push(item);
          } else {
            items.push(item);
          }
        }

        if (!isImported) {
          folders.push({
            name: subfolderName,
            graphId: gId,
            dataType,
            channelType,
            fileCount: validFileCount,
            isSystemDefault: subfolderName === 'default' || subfolderName === 'userdefined',
          });
        }
      }
    }

    await scanCategoryFolder('audio', 'stereo');
    await scanCategoryFolder('audio', 'mono');
    await scanCategoryFolder('midi', undefined);
  }

  // 1. Scan primary graph's assets
  await scanSingleGraph(safeGraphId, false);

  // 2. Scan imported graphs' assets if requested
  if (includeImported) {
    const qmsFile = path.join(graphDir, 'graph.qms');
    if (fs.existsSync(qmsFile)) {
      try {
        const raw = await fs.promises.readFile(qmsFile, 'utf-8');
        const pkg = JSON.parse(raw);
        const importedIds: string[] = pkg?.metadata?.importedGraphIds || [];

        for (const impId of importedIds) {
          const impQms = path.join(GRAPHS_ROOT, impId, 'graph.qms');
          let impName = impId;
          if (fs.existsSync(impQms)) {
            try {
              const impRaw = await fs.promises.readFile(impQms, 'utf-8');
              const impPkg = JSON.parse(impRaw);
              impName = impPkg?.metadata?.name || impId;
            } catch {}
          }
          await scanSingleGraph(impId, true, impName);
        }
      } catch (err) {
        console.warn('Error scanning imported graph assets:', err);
      }
    }
  }

  return { folders, items, importedItems };
}

/**
 * Creates a dynamic userdefined subfolder in the graph package's assets directory
 */
export async function createGraphAssetFolder(params: {
  graphId: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  folderName: string;
}): Promise<GraphFolderInfo> {
  const safeGraphId = path.basename(params.graphId);
  const safeFolderName = path.basename(params.folderName).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safeFolderName) throw new Error('Invalid subfolder name');

  const graphDir = path.join(GRAPHS_ROOT, safeGraphId);
  ensureGraphAssetDirectories(graphDir);

  const targetDir =
    params.dataType === 'audio'
      ? path.join(graphDir, 'assets', 'audio', params.channelType === 'mono' ? 'mono' : 'stereo', safeFolderName)
      : path.join(graphDir, 'assets', 'midi', safeFolderName);

  if (!fs.existsSync(targetDir)) {
    await fs.promises.mkdir(targetDir, { recursive: true });
  }

  return {
    name: safeFolderName,
    graphId: safeGraphId,
    dataType: params.dataType,
    channelType: params.channelType,
    fileCount: 0,
    isSystemDefault: safeFolderName === 'default' || safeFolderName === 'userdefined',
  };
}

/**
 * Saves uploaded audio or MIDI base64 file into the graph package
 */
export async function saveAssetToGraph(params: {
  graphId: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder?: string;
  filename: string;
  base64Content: string;
}): Promise<GraphAssetItem> {
  const safeGraphId = path.basename(params.graphId);
  const subfolder = params.subfolder || 'userdefined';
  const graphDir = path.join(GRAPHS_ROOT, safeGraphId);
  ensureGraphAssetDirectories(graphDir);

  const targetDir =
    params.dataType === 'audio'
      ? path.join(graphDir, 'assets', 'audio', params.channelType === 'mono' ? 'mono' : 'stereo', subfolder)
      : path.join(graphDir, 'assets', 'midi', subfolder);

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

  const url =
    params.dataType === 'audio'
      ? `/graphs/${safeGraphId}/assets/audio/${params.channelType === 'mono' ? 'mono' : 'stereo'}/${subfolder}/${safeFilename}`
      : `/graphs/${safeGraphId}/assets/midi/${subfolder}/${safeFilename}`;

  return {
    id: `asset-${safeGraphId}-${relPath}`,
    filename: safeFilename,
    name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
    graphId: safeGraphId,
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
 * Delete an asset file from a graph package
 */
export async function deleteAssetFromGraph(params: {
  graphId: string;
  dataType: AssetDataType;
  channelType?: AssetChannelType;
  subfolder: string;
  filename: string;
}): Promise<boolean> {
  const safeGraphId = path.basename(params.graphId);
  const graphDir = path.join(GRAPHS_ROOT, safeGraphId);

  const targetDir =
    params.dataType === 'audio'
      ? path.join(graphDir, 'assets', 'audio', params.channelType === 'mono' ? 'mono' : 'stereo', params.subfolder)
      : path.join(graphDir, 'assets', 'midi', params.subfolder);

  const filePath = path.join(targetDir, path.basename(params.filename));
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }
  return false;
}
