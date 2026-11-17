export * from './types';
export * from './helpers';

import fs from 'fs';
import path from 'path';
import type { ProjectMetadata } from './types';
import { ensureProjectsRoot } from './helpers';

export const PROJECTS_ROOT = path.join(process.cwd(), 'projects');


export function ensureDefaultProject(): void {
  const defaultProjDir = path.join(PROJECTS_ROOT, 'default-kingdom');
  if (!fs.existsSync(defaultProjDir)) {
    fs.mkdirSync(defaultProjDir, { recursive: true });
    fs.mkdirSync(path.join(defaultProjDir, 'samples'), { recursive: true });
    fs.mkdirSync(path.join(defaultProjDir, 'assets'), { recursive: true });

    const defaultProjectData = {
      id: 'default-kingdom',
      name: 'Default Fantasy Realm',
      description: 'Starter DAW kingdom project with orbital clock triggers and synth containers',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bpm: 120,
      masterVolume: 0.85,
      currentBiome: 'verdant_forest',
      nodes: [
        {
          id: 'input-strip-node',
          type: 'input_strip',
          name: 'INPUT STRIP',
          position: [-10, 0, 0],
          color: '#f59e0b',
          radius: 1.8,
          label: 'Landmark [0]',
          active: true,
        },
        {
          id: 'output-strip-node',
          type: 'output_strip',
          name: 'OUTPUT STRIP',
          position: [10, 0, 0],
          color: '#10b981',
          radius: 1.8,
          label: 'Landmark [1]',
          active: true,
        },
        {
          id: 'trig-1',
          type: 'trigger',
          name: 'Beats Sequencer Alpha',
          position: [-6, 2, 0],
          triggerType: 'beats',
          intervalBeats: 1,
          divisionMode: 'every_beat',
          divisionsPerBeat: 1,
          stepsPerCycle: 4,
          activeSteps: [true, true, true, true],
          active: true,
          color: '#fbbf24',
          label: 'Beats Seq',
        },
        {
          id: 'cont-1',
          type: 'container',
          containerType: 'midi',
          name: 'Andromeda Nebula Chords',
          position: [3, 3, -2],
          color: '#c084fc',
          radius: 1.8,
          isLooping: true,
          synthPreset: {
            synthType: 'pad',
            attack: 0.15,
            decay: 0.8,
            sustain: 0.7,
            release: 1.6,
            cutoff: 2400,
            resonance: 3,
            reverb: 0.6,
            delay: 0.4,
          },
          pattern: {
            id: 'pat-1',
            name: 'Lydian Celestial Pad',
            lengthInBeats: 4,
            tempo: 120,
            notes: [
              { note: 60, name: 'C4', velocity: 0.85, time: 0, duration: 3.8 },
              { note: 64, name: 'E4', velocity: 0.8, time: 0, duration: 3.8 },
              { note: 67, name: 'G4', velocity: 0.8, time: 0, duration: 3.8 },
              { note: 71, name: 'B4', velocity: 0.75, time: 0, duration: 3.8 },
            ],
          },
        },
        {
          id: 'cont-2',
          type: 'container',
          containerType: 'audio',
          name: 'Global Boom Sample Stem',
          position: [4, -2, 2],
          color: '#f43f5e',
          radius: 1.5,
          isLooping: true,
          audioTrack: {
            id: 'track-1',
            name: '808 Sub Boom',
            sampleType: 'custom',
            customAudioUrl: '/samples/global/808_sub_boom.wav',
            durationBeats: 4,
            gain: 1.0,
            pan: 0,
            pitchShift: 0,
            filterCutoff: 8000,
            fadeInBeats: 0,
            fadeOutBeats: 0,
            trimStartBeats: 0,
            trimEndBeats: 4,
            isReversed: false,
          },
        },
      ],
      connections: [
        { id: 'conn-1', fromNodeId: 'trig-1', toNodeId: 'cont-1', latencyBeats: 0 },
        { id: 'conn-2', fromNodeId: 'cont-1', toNodeId: 'output-strip-node', fromPort: 'audio_out', toPort: 'in-map-out-audio-master', latencyBeats: 0 },
      ],
    };

    fs.writeFileSync(
      path.join(defaultProjDir, 'project.json'),
      JSON.stringify(defaultProjectData, null, 2),
      'utf-8'
    );
  }
}

export async function listAllProjects(): Promise<ProjectMetadata[]> {
  ensureProjectsRoot();
  const dirs = await fs.promises.readdir(PROJECTS_ROOT);
  const projects: ProjectMetadata[] = [];

  for (const dir of dirs) {
    const projDir = path.join(PROJECTS_ROOT, dir);
    const stat = await fs.promises.stat(projDir);
    if (!stat.isDirectory()) continue;

    const projectFile = path.join(projDir, 'project.json');
    const samplesDir = path.join(projDir, 'samples');

    let sampleCount = 0;
    if (fs.existsSync(samplesDir)) {
      const samples = await fs.promises.readdir(samplesDir);
      sampleCount = samples.filter((f) => !f.startsWith('.')).length;
    }

    if (fs.existsSync(projectFile)) {
      try {
        const raw = await fs.promises.readFile(projectFile, 'utf-8');
        const data = JSON.parse(raw);
        projects.push({
          id: data.id || dir,
          name: data.name || dir,
          description: data.description || '',
          folderPath: `projects/${dir}`,
          createdAt: data.createdAt || stat.birthtimeMs,
          updatedAt: data.updatedAt || stat.mtimeMs,
          sampleCount,
          nodeCount: Array.isArray(data.nodes) ? data.nodes.length : 0,
          bpm: data.bpm || 120,
        });
      } catch {
        // ignore corrupted json
      }
    }
  }

  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProjectById(id: string): Promise<Record<string, unknown> | null> {
  const safeId = path.basename(id);
  const projectFile = path.join(PROJECTS_ROOT, safeId, 'project.json');
  if (!fs.existsSync(projectFile)) return null;
  const raw = await fs.promises.readFile(projectFile, 'utf-8');
  return JSON.parse(raw);
}

export async function saveProject(id: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const safeId = path.basename(id);
  const projDir = path.join(PROJECTS_ROOT, safeId);
  const projectFile = path.join(projDir, 'project.json');

  if (!fs.existsSync(projDir)) {
    await fs.promises.mkdir(projDir, { recursive: true });
    await fs.promises.mkdir(path.join(projDir, 'samples'), { recursive: true });
    await fs.promises.mkdir(path.join(projDir, 'assets'), { recursive: true });
  }

  let existingData: Record<string, unknown> = {};
  if (fs.existsSync(projectFile)) {
    const raw = await fs.promises.readFile(projectFile, 'utf-8');
    existingData = JSON.parse(raw);
  }

  const updatedData = {
    ...existingData,
    ...payload,
    id: safeId,
    updatedAt: Date.now(),
  };

  await fs.promises.writeFile(projectFile, JSON.stringify(updatedData, null, 2), 'utf-8');
  return updatedData;
}

export async function deleteProject(id: string): Promise<boolean> {
  const safeId = path.basename(id);
  const projDir = path.join(PROJECTS_ROOT, safeId);
  if (!fs.existsSync(projDir)) return false;
  await fs.promises.rm(projDir, { recursive: true, force: true });
  return true;
}