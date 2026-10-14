import * as fs from 'fs';
import * as path from 'path';

export interface PlaneRoots {
  backend: string;
  frontend: string;
  isKrnlDir: boolean;
}

export function getPlaneRoots(projectRoot: string): PlaneRoots {
  const krnlRoot = path.join(projectRoot, 'krnl');
  if (fs.existsSync(krnlRoot)) {
    return {
      backend: path.join(krnlRoot, 'backend'),
      frontend: path.join(krnlRoot, 'frontend'),
      isKrnlDir: true,
    };
  }
  return {
    backend: path.join(projectRoot, 'src'),
    frontend: path.join(projectRoot, 'src'),
    isKrnlDir: false,
  };
}
