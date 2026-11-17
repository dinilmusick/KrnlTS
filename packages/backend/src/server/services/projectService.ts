import fs from 'fs';
import path from 'path';

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  folderPath: string;
  createdAt: number;
  updatedAt: number;
  sampleCount: number;
  nodeCount: number;
  bpm: number;
}

export const PROJECTS_ROOT = path.join(process.cwd(), 'projects');

let customStarterProjectTemplate: Record<string, any> | null = null;

export function configureStarterProjectTemplate(template: Record<string, any>): void {
  customStarterProjectTemplate = template;
}

export function ensureProjectsRoot(starterTemplate?: Record<string, any>): void {
  if (!fs.existsSync(PROJECTS_ROOT)) {
    fs.mkdirSync(PROJECTS_ROOT, { recursive: true });
  }

  const template = starterTemplate || customStarterProjectTemplate;
  if (template && template.id) {
    const defaultProjDir = path.join(PROJECTS_ROOT, String(template.id));
    if (!fs.existsSync(defaultProjDir)) {
      fs.mkdirSync(defaultProjDir, { recursive: true });
      fs.mkdirSync(path.join(defaultProjDir, 'samples'), { recursive: true });
      fs.mkdirSync(path.join(defaultProjDir, 'assets'), { recursive: true });
      fs.writeFileSync(
        path.join(defaultProjDir, 'project.json'),
        JSON.stringify({ ...template, createdAt: Date.now(), updatedAt: Date.now() }, null, 2),
        'utf-8'
      );
    }
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
