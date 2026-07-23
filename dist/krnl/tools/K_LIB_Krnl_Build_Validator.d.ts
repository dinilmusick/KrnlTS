export interface KrnlSubAppDependency {
    name: string;
    required?: boolean;
}
export interface KrnlRequiredRemote {
    fid: string;
    targetEntity: string;
}
export interface KrnlManifestDependencies {
    subapps?: KrnlSubAppDependency[];
    requiredRemotes?: KrnlRequiredRemote[];
}
export interface KrnlManifestExports {
    publicFunctionalities?: string[];
}
export interface KrnlManifest {
    appName: string;
    version?: string;
    entityClass?: string;
    dependencies?: KrnlManifestDependencies;
    exports?: KrnlManifestExports;
}
export declare class KrnlBuildValidator {
    /**
     * Reads and parses krnl.json from specified directory
     */
    static readManifest(dirPath: string): KrnlManifest | null;
    /**
     * Validates project dependencies statically at build time.
     * Scans project root krnl.json and checks if required subapps and required remotes can be satisfied.
     */
    static validateProject(projectRoot: string): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=K_LIB_Krnl_Build_Validator.d.ts.map