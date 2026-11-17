import fs from 'fs';
import path from 'path';
import { ensureGlobalSamples } from '../sampleGenerator';

export const SAMPLES_GLOBAL_ROOT = path.join(process.cwd(), 'samples', 'global');
export const PROJECTS_ROOT = path.join(process.cwd(), 'projects');
export const SUPPORTED_AUDIO_EXTS = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.webm', '.weba', '.aac', '.aiff', '.aif', '.opus', '.mp4'];

export interface ServerAudioSampleItem {
  filename: string;
  name: string;
  category: string;
  format: string;
  url: string;
  size: number;
  scope: 'global' | 'project';
  projectId?: string;
  createdAt: number;
}

export function initGlobalSamplesDirectory(): void {
  ensureGlobalSamples(SAMPLES_GLOBAL_ROOT).catch((err) => {
    console.error('Error ensuring global samples:', err);
  });
}

export async function listGlobalSamples(): Promise<ServerAudioSampleItem[]> {
  if (!fs.existsSync(SAMPLES_GLOBAL_ROOT)) {
    await fs.promises.mkdir(SAMPLES_GLOBAL_ROOT, { recursive: true });
  }
  const files = await fs.promises.readdir(SAMPLES_GLOBAL_ROOT);
  const samples: ServerAudioSampleItem[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!SUPPORTED_AUDIO_EXTS.includes(ext)) continue;

    const filePath = path.join(SAMPLES_GLOBAL_ROOT, file);
    const stat = await fs.promises.stat(filePath);
    const baseName = path.basename(file, ext);
    const cleanName = baseName.replace(/[-_]/g, ' ');

    let category = 'synth';
    if (/808|kick|snare|hihat|drum|perc/i.test(baseName)) category = 'drums';
    else if (/pad|drone|ethereal|ambient|forest/i.test(baseName)) category = 'ambient';
    else if (/warp|riser|zap|fx|impact/i.test(baseName)) category = 'fx';

    samples.push({
      filename: file,
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      category,
      format: ext.replace('.', '').toUpperCase(),
      url: `/samples/global/${file}`,
      size: stat.size,
      scope: 'global',
      createdAt: stat.birthtimeMs || stat.mtimeMs,
    });
  }

  return samples;
}

export async function saveGlobalSample(filename: string, base64Content: string, category?: string): Promise<ServerAudioSampleItem> {
  const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = path.extname(safeFilename).toLowerCase() || '.wav';
  const filePath = path.join(SAMPLES_GLOBAL_ROOT, safeFilename);

  const buffer = Buffer.from(base64Content, 'base64');
  await fs.promises.writeFile(filePath, buffer);
  const stat = await fs.promises.stat(filePath);

  return {
    filename: safeFilename,
    name: path.basename(safeFilename, ext).replace(/[-_]/g, ' '),
    category: category || 'custom',
    format: ext.replace('.', '').toUpperCase(),
    url: `/samples/global/${safeFilename}`,
    size: stat.size,
    scope: 'global',
    createdAt: stat.birthtimeMs || stat.mtimeMs,
  };
}

export async function deleteGlobalSample(filename: string): Promise<boolean> {
  const safeFilename = path.basename(filename);
  const filePath = path.join(SAMPLES_GLOBAL_ROOT, safeFilename);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }
  return false;
}

export async function listProjectSamples(projectId: string): Promise<ServerAudioSampleItem[]> {
  const safeId = path.basename(projectId);
  const samplesDir = path.join(PROJECTS_ROOT, safeId, 'samples');
  if (!fs.existsSync(samplesDir)) {
    await fs.promises.mkdir(samplesDir, { recursive: true });
  }

  const files = await fs.promises.readdir(samplesDir);
  const samples: ServerAudioSampleItem[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!SUPPORTED_AUDIO_EXTS.includes(ext)) continue;

    const filePath = path.join(samplesDir, file);
    const stat = await fs.promises.stat(filePath);
    const baseName = path.basename(file, ext);

    samples.push({
      filename: file,
      name: baseName.replace(/[-_]/g, ' '),
      category: 'project_recording',
      format: ext.replace('.', '').toUpperCase(),
      url: `/projects/${safeId}/samples/${file}`,
      size: stat.size,
      scope: 'project',
      projectId: safeId,
      createdAt: stat.birthtimeMs || stat.mtimeMs,
    });
  }

  return samples;
}

export async function saveProjectSample(
  projectId: string,
  filename: string | undefined,
  base64Content: string,
  isRecording?: boolean
): Promise<ServerAudioSampleItem> {
  const safeId = path.basename(projectId);
  const samplesDir = path.join(PROJECTS_ROOT, safeId, 'samples');
  if (!fs.existsSync(samplesDir)) {
    await fs.promises.mkdir(samplesDir, { recursive: true });
  }

  const defaultName = isRecording ? `recording_take_${Date.now()}.wav` : `clip_${Date.now()}.wav`;
  const targetFilename = filename ? path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_') : defaultName;
  const ext = path.extname(targetFilename).toLowerCase() || '.wav';
  const filePath = path.join(samplesDir, targetFilename);

  const buffer = Buffer.from(base64Content, 'base64');
  await fs.promises.writeFile(filePath, buffer);
  const stat = await fs.promises.stat(filePath);

  return {
    filename: targetFilename,
    name: path.basename(targetFilename, ext).replace(/[-_]/g, ' '),
    category: isRecording ? 'recording' : 'import',
    format: ext.replace('.', '').toUpperCase(),
    url: `/projects/${safeId}/samples/${targetFilename}`,
    size: stat.size,
    scope: 'project',
    projectId: safeId,
    createdAt: stat.birthtimeMs || stat.mtimeMs,
  };
}

export async function deleteProjectSample(projectId: string, filename: string): Promise<boolean> {
  const safeId = path.basename(projectId);
  const safeFilename = path.basename(filename);
  const filePath = path.join(PROJECTS_ROOT, safeId, 'samples', safeFilename);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }
  return false;
}
