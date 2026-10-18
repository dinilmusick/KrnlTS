import * as http from 'http';

declare function runValidate(projectRoot?: string): Promise<boolean>;

declare function runGenerate(type: string, name: string, _parentService?: string, projectRoot?: string): Promise<void>;

declare function generateMagneticDeclarations(projectRoot?: string): void;

/**
 * @file build.ts
 * @description Production build runner reconciling manifests, validating purity, and compiling TypeScript.
 */
interface BuildOptions {
    service?: string;
    orchestration?: string;
    all?: boolean;
}
declare function runBuild(projectRoot?: string, options?: BuildOptions): Promise<{
    success: boolean;
    error?: string;
}>;

/**
 * @file dev.ts
 * @description Local development server and continuous ambient declaration watcher.
 */

interface DevOptions {
    port?: number;
    service?: string;
    orchestration?: string;
    all?: boolean;
    dryRun?: boolean;
}
interface DevServerInstance {
    server?: http.Server;
    close: () => Promise<void>;
    port: number;
}
declare function runDev(projectRoot?: string, options?: DevOptions): Promise<DevServerInstance>;

export { type BuildOptions, type DevOptions, type DevServerInstance, generateMagneticDeclarations, runBuild, runDev, runGenerate, runValidate };
