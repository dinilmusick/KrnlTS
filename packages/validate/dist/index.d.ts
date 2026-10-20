import { SourceFile } from 'ts-morph';

interface ValidationError {
    ruleId: string;
    filePath: string;
    line?: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning';
}
interface PromotableAsset {
    name: string;
    kind: string;
    filePath: string;
    scope: 'service' | 'component' | 'application';
    scopeName: string;
    target: 'GutTS';
}
interface ValidationSummary {
    valid: boolean;
    totalFiles: number;
    errors: ValidationError[];
    warnings: ValidationError[];
    promotableAssets?: PromotableAsset[];
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
        promotableAssets?: PromotableAsset[];
    };
    private collectSourceFiles;
}

export { KrnlValidatorEngine, type KrnlValidatorOptions, type PromotableAsset, type ValidationError, type ValidationSummary };
