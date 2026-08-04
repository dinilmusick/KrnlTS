import * as fs from 'fs';
import * as path from 'path';

/**
 * KrnlTS Source Analyzer
 *
 * Performs static analysis of KrnlTS entity source files to enforce
 * architectural constraints that prevent runtime timing bugs.
 *
 * KEY CONSTRAINT ENFORCED:
 *   "All addLocal() calls with uiSpec MUST appear before the first
 *    KrnlMagneticLoader.loadAll() call in boot(). Violating this causes
 *    the frontend generator to see zero endpoints → blank UI."
 */
export class KrnlSourceAnalyzer {

  /**
   * Extracts all addLocal() call positions and their uiSpec presence from source.
   */
  static getAddLocalCalls(source: string): Array<{ line: number; hasUiSpec: boolean; id: string }> {
    const results: Array<{ line: number; hasUiSpec: boolean; id: string }> = [];
    const lines = source.split('\n');

    // Track addLocal block starts
    let inAddLocal = false;
    let braceDepth = 0;
    let blockStart = -1;
    let blockLines: string[] = [];
    let blockId = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inAddLocal) {
        // Detect start of addLocal({
        if (/this\.addLocal\s*\(/.test(line)) {
          inAddLocal = true;
          braceDepth = 0;
          blockStart = i + 1;
          blockLines = [line];
          // Try to extract id from same line
          const idMatch = line.match(/id\s*:\s*["']([^"']+)["']/);
          blockId = idMatch ? idMatch[1] : '';
        }
      } else {
        blockLines.push(line);
        // Extract id if not found yet
        if (!blockId) {
          const idMatch = line.match(/id\s*:\s*["']([^"']+)["']/);
          if (idMatch) blockId = idMatch[1];
        }
        // Track brace depth to find end of addLocal block
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') {
            braceDepth--;
            if (braceDepth < 0) {
              // End of addLocal call
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

  /**
   * Finds the line number of KrnlMagneticLoader.loadAll() or MagneticLoader.loadAll() in source.
   */
  static getMagneticLoaderLine(source: string): number {
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/(?:KrnlMagneticLoader|MagneticLoader)\.loadAll\s*\(/.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }

  /**
   * Checks for bare relative fetch URLs (missing leading slash) in generated component source.
   * These cause page blanks when the browser treats them as relative to the current path.
   */
  static getBareRelativeFetches(source: string): number[] {
    const lines = source.split('\n');
    const hits: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      // Match fetch('something') where something doesn't start with / or http
      if (/fetch\s*\(\s*['"][^/h][^'"]*['"]/.test(lines[i])) {
        hits.push(i + 1);
      }
    }
    return hits;
  }

  /**
   * Validates a single entity source file for boot-order constraints.
   *
   * RULE 1: addLocal() calls with uiSpec MUST appear before KrnlMagneticLoader.loadAll()
   * RULE 2: Every addLocal() with ui_component_enabled MUST have ui_component_enabled: true
   */
  static validateEntitySource(filePath: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fs.existsSync(filePath)) {
      return { valid: true, errors: [], warnings: [] };
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const addLocals = this.getAddLocalCalls(source);
    const magneticLoaderLine = this.getMagneticLoaderLine(source);

    // RULE 1: addLocal with uiSpec must come before MagneticLoader.loadAll
    if (magneticLoaderLine !== -1) {
      for (const al of addLocals) {
        if (al.hasUiSpec && al.line > magneticLoaderLine) {
          errors.push(
            `[ERR_BOOT_ORDER_VIOLATION] In '${path.basename(filePath)}': ` +
            `addLocal('${al.id}') with uiSpec at line ${al.line} appears AFTER ` +
            `KrnlMagneticLoader.loadAll() at line ${magneticLoaderLine}. ` +
            `The frontend generator runs inside loadAll() — if addLocal() calls come after it, ` +
            `the generator sees zero endpoints and produces a blank UI. ` +
            `FIX: Move all addLocal() calls to BEFORE KrnlMagneticLoader.loadAll() in boot().`
          );
        }
      }
    }

    // RULE 2: All addLocal() calls should have uiSpec if any do (consistency)
    const anyHasUiSpec = addLocals.some(al => al.hasUiSpec);
    if (anyHasUiSpec) {
      for (const al of addLocals) {
        if (!al.hasUiSpec) {
          warnings.push(
            `[WARN_MISSING_UISPEC] In '${path.basename(filePath)}': ` +
            `addLocal('${al.id}') at line ${al.line} is missing 'uiSpec'. ` +
            `Other endpoints in this file have uiSpec — this endpoint will not appear in the UI. ` +
            `Add 'uiSpec: { ui_component_enabled: true, ... }' to include it.`
          );
        }
      }
    }

    // RULE 3: Warn if NO addLocal calls have uiSpec but loadAll is present (UI will be blank)
    if (magneticLoaderLine !== -1 && addLocals.length > 0 && !anyHasUiSpec) {
      warnings.push(
        `[WARN_NO_UISPEC_ENDPOINTS] In '${path.basename(filePath)}': ` +
        `${addLocals.length} addLocal() endpoint(s) found but none have 'uiSpec'. ` +
        `The generated frontend will show "No UI-enabled endpoints" message. ` +
        `Add 'uiSpec: { ui_component_enabled: true, inputs: [...], outputs: [...] }' to each addLocal().`
      );
    }

    // RULE 4: Validate requires.functionalitiesExecuted targets exist in local addLocal calls
    const allKnownIds = new Set(addLocals.map(al => al.id));
    const requiresMatches = source.matchAll(/functionalitiesExecuted\s*:\s*\[([^\]]+)\]/g);
    for (const match of requiresMatches) {
      const rawArray = match[1];
      const targetIds = rawArray.split(',').map(s => s.trim().replace(/['"]/g, ''));
      for (const tid of targetIds) {
        if (tid && !allKnownIds.has(tid)) {
          // If not in addLocal, check if present elsewhere in source string as an atom ID
          const atomPattern = new RegExp(`id\\s*:\\s*["']${tid}["']`);
          if (!atomPattern.test(source)) {
            errors.push(
              `[ERR_REQUIRES_UNKNOWN_FID] In '${path.basename(filePath)}': ` +
              `Functionality requires dependency '${tid}' which is not defined in this application or project.`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates all entity source files in the project.
   * Scans for *.ts and *.js files in src/ that extend krnlSystemEntityBase or krnlEntityBase.
   */
  static validateProject(projectRoot: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    const srcDir = path.join(projectRoot, 'src');
    if (!fs.existsSync(srcDir)) {
      return { valid: true, errors: [], warnings: [] };
    }

    const entityFiles = this.findEntityFiles(srcDir);

    for (const filePath of entityFiles) {
      const result = this.validateEntitySource(filePath);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  private static findEntityFiles(dir: string, found: string[] = []): string[] {
    if (!fs.existsSync(dir)) return found;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.findEntityFiles(fullPath, found);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Only analyze files that define a KrnlTS entity class
          if (
            content.includes('krnlSystemEntityBase') ||
            content.includes('krnlEntityBase') ||
            content.includes('addLocal(')
          ) {
            found.push(fullPath);
          }
        } catch (_) {}
      }
    }
    return found;
  }
}
