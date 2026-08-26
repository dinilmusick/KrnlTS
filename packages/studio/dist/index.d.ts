export { ArchitectureEdge, ArchitectureGraph, ArchitectureNode, AstMutationEngine, FileChangeCallback, FunctionExecutionRequest, FunctionExecutionResult, FunctionExecutor, JsonRpcRequest, JsonRpcResponse, JsonRpcRouter, StudioFileWatcher, StudioServer, StudioServerOptions } from './server/index.js';
import { BaseSchemes } from 'rete';
import { AreaPlugin } from 'rete-area-plugin';

interface VanJSRenderOptions {
    onNodeContextMenu?: (nodeId: string, event: MouseEvent) => void;
    onSocketConnect?: (socketId: string) => void;
}
/**
 * VanJSRenderPlugin: Pure Direct-DOM VanJS rendering plugin for Rete.js v2.
 * Renders Neo-Brutalist 2.5D nodes with zero React overhead.
 */
declare function createVanJSRenderPlugin<Schemes extends BaseSchemes>(options?: VanJSRenderOptions): (area: AreaPlugin<Schemes, any>) => void;

interface ComponentNode {
    id: string;
    type: string;
    props: Record<string, any>;
    children?: ComponentNode[];
}
declare class VanJSCodeGenerator {
    /**
     * Generates production-ready VanJS TypeScript source code from a component tree.
     */
    static generateCode(root: ComponentNode, componentName?: string): string;
    private static renderNodeToCode;
    private static collectUsedAtoms;
}

export { type ComponentNode, VanJSCodeGenerator, type VanJSRenderOptions, createVanJSRenderPlugin };
