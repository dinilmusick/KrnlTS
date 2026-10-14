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
    private limitOptions;
    constructor(optionsOrRoot: KrnlValidatorOptions | string);
    validateAll(): ValidationSummary;
    validateSourceFile(sf: SourceFile): {
        errors: ValidationError[];
        warnings: ValidationError[];
    };
    private collectSourceFiles;
}

export { KrnlValidatorEngine, type KrnlValidatorOptions, type ValidationError, type ValidationSummary };
