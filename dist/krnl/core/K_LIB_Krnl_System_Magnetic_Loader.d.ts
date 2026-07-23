import { AsyncLocalStorage } from 'async_hooks';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
export declare const magneticStorage: AsyncLocalStorage<{
    helpers: Record<string, any>;
    events: Record<string, any>;
}>;
export declare const subappLocalStorage: any;
export interface KrnlSubAppConfig {
    ServiceClass: any;
    prefix: string;
    isKrnl: boolean;
    entryPath: string;
}
export declare class KrnlMagneticLoader {
    /**
     * Scans and dynamically loads entities, functionalities, and subapps for the given system entity.
     */
    static loadAll(entity: krnlSystemEntityBase, baseDir: string): Promise<void>;
    static loadFunctionality(entity: krnlSystemEntityBase, funcDir: string, funcName: string): Promise<void>;
    static loadEntity(parent: krnlSystemEntityBase, entDir: string, entName: string): Promise<void>;
    static ensureSubAppBuilt(appPath: string, appName: string, entity: any): Promise<boolean>;
    static detectSubApp(appPath: string, appName: string): Promise<any | null>;
    private static registerGlobalWrapper;
}
//# sourceMappingURL=K_LIB_Krnl_System_Magnetic_Loader.d.ts.map