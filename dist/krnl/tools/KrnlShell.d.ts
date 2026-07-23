/**
 * @file KrnlShell.ts
 * @description Safe promise-based exec and spawn wrappers with cross-platform command routing.
 */
import { ExecOptions, SpawnOptions } from "child_process";
export interface SpawnHandle {
    pid?: number;
    kill: (signal?: NodeJS.Signals | number) => boolean;
    promise: Promise<{
        code: number | null;
        signal: NodeJS.Signals | null;
    }>;
}
export declare class KrnlShell {
    /**
     * Promisified command execution.
     */
    static exec(cmd: string, opts?: ExecOptions & {
        timeout?: number;
    }): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Streaming command execution.
     */
    static spawn(cmd: string, args: string[], opts?: SpawnOptions): SpawnHandle;
    /**
     * Defines posix vs win32 specific commands.
     */
    static platform<T>(routing: {
        posix: T;
        win32: T;
    }): T;
    /**
     * Resolves the full path of a binary.
     */
    static which(cmd: string): string | null;
}
//# sourceMappingURL=KrnlShell.d.ts.map