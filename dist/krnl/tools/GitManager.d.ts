/**
 * @file GitManager.ts
 * @description Safe project-scoped Git operations.
 */
export declare class GitManager {
    static isRepo(dirPath: string): boolean;
    static init(dirPath: string): Promise<void>;
    static clone(repoUrl: string, destPath: string): Promise<void>;
    static commit(dirPath: string, message: string): Promise<boolean>;
    static push(dirPath: string, remote?: string, branch?: string): Promise<void>;
}
//# sourceMappingURL=GitManager.d.ts.map