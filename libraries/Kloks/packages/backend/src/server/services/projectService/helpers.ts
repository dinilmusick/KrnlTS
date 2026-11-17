import fs from 'fs';
import { PROJECTS_ROOT } from './projectService.js';

export function ensureProjectsRoot(): void {
  if (!fs.existsSync(PROJECTS_ROOT)) {
    fs.mkdirSync(PROJECTS_ROOT, { recursive: true });
  }
}
