import * as fs from 'fs';
import * as path from 'path';
import { tryParseJson } from '@dinilmusick/gutts';

export interface ReconcileResult {
  updated: boolean;
  totalManifests: number;
  addedDependencies: Record<string, string>;
  addedDevDependencies: Record<string, string>;
  conflicts: Array<{ package: string; versions: string[] }>;
}

export class KrnlPackageReconciler {
  /**
   * Scans all manifest.json files across backend and frontend and reconciles root package.json.
   */
  static reconcile(projectRoot: string = process.cwd(), writeChanges: boolean = true): ReconcileResult {
    const manifests = this.findManifests(projectRoot);
    const aggregatedDeps: Record<string, string[]> = {};
    const aggregatedDevDeps: Record<string, string[]> = {};

    for (const mPath of manifests) {
      try {
        const raw = fs.readFileSync(mPath, 'utf8');
        const json = tryParseJson<any>(raw) ?? {};
        if (json.dependencies && typeof json.dependencies === 'object') {
          for (const [pkg, ver] of Object.entries(json.dependencies)) {
            if (!aggregatedDeps[pkg]) aggregatedDeps[pkg] = [];
            if (!aggregatedDeps[pkg].includes(String(ver))) {
              aggregatedDeps[pkg].push(String(ver));
            }
          }
        }
        if (json.devDependencies && typeof json.devDependencies === 'object') {
          for (const [pkg, ver] of Object.entries(json.devDependencies)) {
            if (!aggregatedDevDeps[pkg]) aggregatedDevDeps[pkg] = [];
            if (!aggregatedDevDeps[pkg].includes(String(ver))) {
              aggregatedDevDeps[pkg].push(String(ver));
            }
          }
        }
      } catch (err) {
        console.warn(`[KrnlPackageReconciler] Warning: Could not parse ${mPath}:`, err);
      }
    }

    const conflicts: Array<{ package: string; versions: string[] }> = [];
    const resolvedDeps: Record<string, string> = {};
    const resolvedDevDeps: Record<string, string> = {};

    for (const [pkg, versions] of Object.entries(aggregatedDeps)) {
      if (versions.length > 1) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDeps[pkg] = versions[versions.length - 1];
    }

    for (const [pkg, versions] of Object.entries(aggregatedDevDeps)) {
      if (versions.length > 1 && !conflicts.some((c) => c.package === pkg)) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDevDeps[pkg] = versions[versions.length - 1];
    }

    const pkgJsonPath = path.join(projectRoot, 'package.json');
    let updated = false;

    if (fs.existsSync(pkgJsonPath)) {
      const pkgContent = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      pkgContent.dependencies = pkgContent.dependencies || {};
      pkgContent.devDependencies = pkgContent.devDependencies || {};
      let hasChanges = false;

      for (const [pkg, ver] of Object.entries(resolvedDeps)) {
        if (pkgContent.dependencies[pkg] !== ver) {
          pkgContent.dependencies[pkg] = ver;
          hasChanges = true;
        }
      }

      for (const [pkg, ver] of Object.entries(resolvedDevDeps)) {
        if (!pkgContent.dependencies[pkg] && pkgContent.devDependencies[pkg] !== ver) {
          pkgContent.devDependencies[pkg] = ver;
          hasChanges = true;
        }
      }

      if (hasChanges && writeChanges) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + '\n');
        updated = true;
        console.log(`[KrnlPackageReconciler] Reconciled package.json from ${manifests.length} manifest(s).`);
      }
    }

    return {
      updated,
      totalManifests: manifests.length,
      addedDependencies: resolvedDeps,
      addedDevDependencies: resolvedDevDeps,
      conflicts,
    };
  }

  /**
   * Discovers all manifest.json files in krnl/ (or src/)
   */
  static findManifests(projectRoot: string): string[] {
    const searchDirs = [
      path.join(projectRoot, 'krnl', 'backend', 'services'),
      path.join(projectRoot, 'krnl', 'backend', 'libraries'),
      path.join(projectRoot, 'krnl', 'backend', 'functionalities'),
      path.join(projectRoot, 'krnl', 'frontend', 'libraries'),
      path.join(projectRoot, 'krnl', 'frontend', 'functionalities'),
      path.join(projectRoot, 'src', 'backend', 'services'),
      path.join(projectRoot, 'src', 'services'),
      path.join(projectRoot, 'src', 'functionalities'),
      path.join(projectRoot, 'src', 'libraries'),
    ];

    const found: string[] = [];
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        this.scanRecursive(dir, found);
      }
    }
    return found;
  }

  private static scanRecursive(dir: string, found: string[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.scanRecursive(full, found);
        } else if (entry.isFile() && entry.name === 'manifest.json') {
          found.push(full);
        }
      }
    } catch {}
  }
}
