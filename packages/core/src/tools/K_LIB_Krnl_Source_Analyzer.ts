/**
 * @file K_LIB_Krnl_Source_Analyzer.ts
 * @role skeleton
 * @description Master source analyzer enforcing boot order, UI specs, line limits, and 4-layer purity.
 */

import * as fs from 'fs';
import * as path from 'path';
import { KrnlPurityRules } from './K_LIB_Krnl_Purity_Rules.js';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class KrnlSourceAnalyzer {
  static getAddLocalCalls(source: string): Array<{ line: number; hasUiSpec: boolean; id: string }> {
    const results: Array<{ line: number; hasUiSpec: boolean; id: string }> = [];
    const lines = source.split('\n');
    let inAddLocal = false;
    let braceDepth = 0;
    let blockStart = -1;
    let blockLines: string[] = [];
    let blockId = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inAddLocal) {
        if (/this\.addLocal\s*\(/.test(line)) {
          inAddLocal = true;
          braceDepth = 0;
          blockStart = i + 1;
          blockLines = [line];
          const idMatch = line.match(/id\s*:\s*["']([^"']+)["']/);
          blockId = idMatch ? idMatch[1] : '';
        }
      } else {
        blockLines.push(line);
        if (!blockId) {
          const idMatch = line.match(/id\s*:\s*["']([^"']+)["']/);
          if (idMatch) blockId = idMatch[1];
        }
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') {
            braceDepth--;
            if (braceDepth < 0) {
              const blockSource = blockLines.join('\n');
              const hasUiSpec = /uiSpec\s*:/.test(blockSource);
              results.push({ line: blockStart, hasUiSpec, id: blockId });
              inAddLocal = false;
              blockLines = [];
              blockId = '';
              break;
            }
          }
        }
      }
    }
    return results;
  }

  static getMagneticLoaderLine(source: string): number {
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/(?:KrnlMagneticLoader|MagneticLoader)\.loadAll\s*\(/.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }

  static validateEntitySource(filePath: string): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!fs.existsSync(filePath)) return { valid: true, errors: [], warnings: [] };

    const baseName = path.basename(filePath);
    if (baseName.includes('_pb.') || baseName.endsWith('.d.ts')) {
      return { valid: true, errors: [], warnings: [] };
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const isEntityClass = /class\s+\w+\s+extends\s+(?:krnlEntityBase|Entity|krnlSystemEntityBase)/.test(source);

    // 1. Line limits & import suffixes
    const lineLimitErr = KrnlPurityRules.checkFileLineLimit(filePath, source);
    if (lineLimitErr) errors.push(lineLimitErr);
    errors.push(...KrnlPurityRules.checkImportSuffixes(filePath, source));

    // 2. Context destructuring & purity checks
    const contextErr = KrnlPurityRules.checkContextDestructuring(filePath, source);
    if (contextErr) errors.push(contextErr);
    errors.push(...KrnlPurityRules.checkHelperPurity(filePath, source));
    errors.push(...KrnlPurityRules.checkMainDelegation(filePath, source));

    // 3. Boot order & uiSpec rules (Only on real Entity classes)
    if (isEntityClass && !filePath.includes('/bin/')) {
      const addLocals = this.getAddLocalCalls(source);
      const loaderLine = this.getMagneticLoaderLine(source);

      if (loaderLine !== -1) {
        for (const al of addLocals) {
          if (al.hasUiSpec && al.line > loaderLine) {
            errors.push(
              `[ERR_BOOT_ORDER_VIOLATION] In '${path.basename(filePath)}': addLocal('${al.id}') at line ${al.line} appears AFTER loadAll() at line ${loaderLine}.`
            );
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  static validateProject(projectRoot: string): ValidationReport {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const scanDirs = ['src', 'entities', 'libraries', 'functionalities'];

    for (const d of scanDirs) {
      const targetDir = path.join(projectRoot, d);
      if (fs.existsSync(targetDir)) {
        const files = this.scanSourceFiles(targetDir);
        for (const f of files) {
          const report = this.validateEntitySource(f);
          allErrors.push(...report.errors);
          allWarnings.push(...report.warnings);
        }
      }
    }

    return { valid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
  }

  private static scanSourceFiles(dir: string, found: string[] = []): string[] {
    if (!fs.existsSync(dir)) return found;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.scanSourceFiles(fullPath, found);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        found.push(fullPath);
      }
    }
    return found;
  }
}
