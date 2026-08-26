import { SourceFile } from 'ts-morph';

interface ValidationError {
    ruleId: string;
    filePath: string;
    line?: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning';
}
interface ValidationSummary {
    valid: boolean;
    totalFiles: number;
    errors: ValidationError[];
    warnings: ValidationError[];
}

interface KrnlValidatorOptions {
    projectRoot: string;
    maxFileLineLimit?: number;
    maxMainLogicLimit?: number;
    maxHelperLineLimit?: number;
}
declare class KrnlValidatorEngine {
    private project;
    private projectRoot;
    private maxFileLineLimit;
    private maxMainLogicLimit;
    private maxHelperLineLimit;
    constructor(options: KrnlValidatorOptions);
    /**
     * Scans and validates all source files in the project.
     */
    validateAll(): ValidationSummary;
    /**
     * Validates a single SourceFile.
     */
    validateSourceFile(sf: SourceFile): {
        errors: ValidationError[];
        warnings: ValidationError[];
    };
    private collectSourceFiles;
}

export { KrnlValidatorEngine, type KrnlValidatorOptions, type ValidationError, type ValidationSummary };
