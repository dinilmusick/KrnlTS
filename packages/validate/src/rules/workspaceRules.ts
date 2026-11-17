import * as fs from 'fs';
import * as path from 'path';
import { ValidationError } from '../types.js';

export { checkTopLevelPurity } from './topLevelPurityRules.js';

export function checkWorkspaceLayout(
  projectRoot: string,
  errors: ValidationError[]
): void {
  const krnlDir = path.join(projectRoot, 'krnl');
  const srcDir = path.join(projectRoot, 'src');
  const targetDir = fs.existsSync(krnlDir) ? krnlDir : fs.existsSync(srcDir) ? srcDir : null;
  if (!targetDir) return;

  const backendDir = path.join(targetDir, 'backend');
  const frontendDir = path.join(targetDir, 'frontend');

  if (fs.existsSync(backendDir)) {
    // Check service-owned libraries and functionalities
    const bServices = path.join(backendDir, 'services');
    if (fs.existsSync(bServices)) {
      for (const sEntry of fs.readdirSync(bServices, { withFileTypes: true })) {
        if (!sEntry.isDirectory()) continue;
        const sDir = path.join(bServices, sEntry.name);

        // Service-owned libraries
        const sLibs = path.join(sDir, 'libraries');
        if (fs.existsSync(sLibs)) {
          for (const entry of fs.readdirSync(sLibs, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const libPath = path.join(sLibs, entry.name);
            if (!fs.existsSync(path.join(libPath, 'manifest.json'))) {
              errors.push({
                ruleId: 'krnl/concept-manifest-required',
                filePath: libPath,
                message: `Service-owned concept library "${sEntry.name}/${entry.name}" is missing a manifest.json file.`,
                severity: 'error',
              });
            }
          }
        }

        // Service-owned functionalities
        const sFuncs = path.join(sDir, 'functionalities');
        if (fs.existsSync(sFuncs)) {
          for (const entry of fs.readdirSync(sFuncs, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const funcPath = path.join(sFuncs, entry.name);
            if (!fs.existsSync(path.join(funcPath, 'manifest.json'))) {
              errors.push({
                ruleId: 'krnl/functionality-manifest-required',
                filePath: funcPath,
                message: `Service-owned functionality "${sEntry.name}/${entry.name}" is missing a manifest.json file.`,
                severity: 'error',
              });
            }
          }
        }
      }
    }

    // Legacy global backend libraries check (if present, require manifest, but encourage service ownership)
    const bLibs = path.join(backendDir, 'libraries');
    if (fs.existsSync(bLibs)) {
      for (const entry of fs.readdirSync(bLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path.join(bLibs, entry.name);
        if (!fs.existsSync(path.join(libPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/concept-manifest-required',
            filePath: libPath,
            message: `Backend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }

    const bFuncs = path.join(backendDir, 'functionalities');
    if (fs.existsSync(bFuncs)) {
      for (const entry of fs.readdirSync(bFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path.join(bFuncs, entry.name);
        if (!fs.existsSync(path.join(funcPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/functionality-manifest-required',
            filePath: funcPath,
            message: `Backend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }
  }

  if (fs.existsSync(frontendDir)) {
    const fLibs = path.join(frontendDir, 'libraries');
    if (fs.existsSync(fLibs)) {
      for (const entry of fs.readdirSync(fLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path.join(fLibs, entry.name);
        if (!fs.existsSync(path.join(libPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/frontend-concept-manifest-required',
            filePath: libPath,
            message: `Frontend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }

    const fFuncs = path.join(frontendDir, 'functionalities');
    if (fs.existsSync(fFuncs)) {
      for (const entry of fs.readdirSync(fFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path.join(fFuncs, entry.name);
        if (!fs.existsSync(path.join(funcPath, 'manifest.json'))) {
          errors.push({
            ruleId: 'krnl/frontend-functionality-manifest-required',
            filePath: funcPath,
            message: `Frontend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: 'error',
          });
        }
      }
    }
  }
}
