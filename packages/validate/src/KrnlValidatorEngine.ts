import * as fs from 'fs';
import * as path from 'path';
import { Project, SourceFile } from 'ts-morph';
import { ValidationError, ValidationSummary, PromotableAsset } from './types.js';
import { checkFileLimits, FileLimitOptions } from './rules/fileLimits.js';
import { checkComponentRules } from './rules/componentRules.js';
import { checkOrchestrationRules } from './rules/orchestrationRules.js';
import { checkTopLevelPurity, checkWorkspaceLayout } from './rules/workspaceRules.js';
import { checkServiceBoundaries } from './rules/serviceBoundaryRules.js';
import { checkScopedLibraryRules } from './rules/scopedLibraryRules.js';

export interface KrnlValidatorOptions {
  projectRoot: string;
  maxFileLineLimit?: number;
  maxMainLogicLimit?: number;
  maxHelperLineLimit?: number;
}

export class KrnlValidatorEngine {
  private project: Project;
  private projectRoot: string;
  private limitOptions: FileLimitOptions;

  constructor(optionsOrRoot: KrnlValidatorOptions | string) {
    const options: KrnlValidatorOptions =
      typeof optionsOrRoot === 'string' ? { projectRoot: optionsOrRoot } : optionsOrRoot;
    this.projectRoot = path.resolve(options.projectRoot || process.cwd());
    this.limitOptions = {
      maxFileLineLimit: options.maxFileLineLimit ?? 200,
      maxMainLogicLimit: options.maxMainLogicLimit ?? 20,
      maxHelperLineLimit: options.maxHelperLineLimit ?? 30,
    };

    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      this.project = new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new Project({ compilerOptions: { target: 99 /* ESNext */ } });
    }
  }

  public validateAll(): ValidationSummary {
    const files = this.collectSourceFiles(this.projectRoot);
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const promotableAssets: PromotableAsset[] = [];

    checkWorkspaceLayout(this.projectRoot, errors);

    for (const f of files) {
      const sf = this.project.addSourceFileAtPath(f);
      const fileReport = this.validateSourceFile(sf);
      errors.push(...fileReport.errors);
      warnings.push(...fileReport.warnings);
      if (fileReport.promotableAssets) {
        promotableAssets.push(...fileReport.promotableAssets);
      }
    }

    return {
      valid: errors.length === 0,
      totalFiles: files.length,
      errors,
      warnings,
      promotableAssets,
    };
  }

  public validateSourceFile(sf: SourceFile): { errors: ValidationError[]; warnings: ValidationError[]; promotableAssets?: PromotableAsset[] } {
    const filePath = sf.getFilePath();
    const baseName = path.basename(filePath);

    if (baseName.includes('_pb.') || baseName.endsWith('.d.ts')) {
      return { errors: [], warnings: [], promotableAssets: [] };
    }

    const limits = checkFileLimits(sf, this.limitOptions);
    const purity = checkTopLevelPurity(sf);
    const components = checkComponentRules(sf);
    const orchestration = checkOrchestrationRules(sf);
    const boundaries = checkServiceBoundaries(sf);
    const scopedLibraries = checkScopedLibraryRules(sf);

    return {
      errors: [
        ...limits.errors,
        ...purity.errors,
        ...components.errors,
        ...orchestration.errors,
        ...boundaries.errors,
        ...scopedLibraries.errors,
      ],
      warnings: [
        ...limits.warnings,
        ...purity.warnings,
        ...components.warnings,
        ...orchestration.warnings,
        ...boundaries.warnings,
        ...scopedLibraries.warnings,
      ],
      promotableAssets: scopedLibraries.promotableAssets,
    };
  }

  private collectSourceFiles(dir: string, collected: string[] = []): string[] {
    if (!fs.existsSync(dir)) return collected;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectSourceFiles(full, collected);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.ts') ||
          entry.name.endsWith('.js') ||
          entry.name.endsWith('.tsx') ||
          entry.name.endsWith('.jsx'))
      ) {
        collected.push(full);
      }
    }
    return collected;
  }
}
