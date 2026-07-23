/**
 * @file ObjectKit.ts
 * @description Deep clone, deep merge, deep equal, object diffing, and dot-notation in-memory path accessor tools.
 */
export declare class ObjectKit {
    /**
     * Structurally deep clones an object with circular dependency check.
     */
    static deepClone<T>(obj: T, seen?: Map<any, any>): T;
    /**
     * Recursively deep merges override objects into a base.
     */
    static deepMerge(base: any, ...overrides: any[]): any;
    /**
     * Performs a strict structural equality check.
     */
    static deepEqual(a: any, b: any): boolean;
    /**
     * Performs an object diff between before and after states.
     */
    static objectDiff(before: any, after: any): {
        added: any;
        removed: any;
        changed: any;
    };
    /**
     * Accesses an in-memory object by dot-notation.
     */
    static getPath(obj: any, path: string, defaultValue?: any): any;
    /**
     * Mutates or sets an in-memory object by dot-notation.
     */
    static setPath(obj: any, path: string, value: any): any;
}
//# sourceMappingURL=ObjectKit.d.ts.map