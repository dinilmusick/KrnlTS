import fs from 'fs';
import { KrnlFrontendAdapter } from './K_LIB_Krnl_System_Frontend_Adapter.js';
import { KrnlCustomFrontendOptions, BlockDescriptor } from './types.js';
export declare class KrnlBlockContainerAdapter extends KrnlFrontendAdapter {
    blocksDir: string;
    discoveredBlocks: Map<string, BlockDescriptor>;
    blockWatcher: fs.FSWatcher | null;
    constructor(name: string, containerRoot: string, options?: KrnlCustomFrontendOptions);
    startApp(): Promise<void>;
    loadBlocks(): Promise<void>;
    setupBlockWatcher(): void;
    scanBlock(blockId: string, blockPath: string): Promise<BlockDescriptor>;
    private _findPagesRoutesRecursive;
    private _findAppRoutesRecursive;
    getBlocksManifest(): BlockDescriptor[];
    dispose(): void;
}
//# sourceMappingURL=K_LIB_Krnl_Block_Container_Adapter.d.ts.map