/**
 * @file KrnlShell.ts
 * @description Safe promise-based exec and spawn wrappers with cross-platform command routing.
 */
import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs";
export class KrnlShell {
    /**
     * Promisified command execution.
     */
    static exec(cmd, opts = {}) {
        const timeout = opts.timeout || 30000;
        return new Promise((resolve, reject) => {
            exec(cmd, { ...opts, timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`[KrnlShellError] Command failed: ${cmd}\nExit Code: ${error.code}\nStderr: ${String(stderr)}`));
                }
                else {
                    resolve({ stdout: String(stdout), stderr: String(stderr) });
                }
            });
        });
    }
    /**
     * Streaming command execution.
     */
    static spawn(cmd, args, opts = {}) {
        const child = spawn(cmd, args, opts);
        const promise = new Promise((resolve, reject) => {
            child.on("close", (code, signal) => {
                resolve({ code, signal });
            });
            child.on("error", (err) => {
                reject(err);
            });
        });
        return {
            pid: child.pid,
            kill: (signal) => child.kill(signal),
            promise
        };
    }
    /**
     * Defines posix vs win32 specific commands.
     */
    static platform(routing) {
        return process.platform === "win32" ? routing.win32 : routing.posix;
    }
    /**
     * Resolves the full path of a binary.
     */
    static which(cmd) {
        const envPath = process.env.PATH || "";
        const paths = envPath.split(path.delimiter);
        const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
        for (const p of paths) {
            for (const ext of extensions) {
                const fullPath = path.join(p, `${cmd}${ext}`);
                try {
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        return fullPath;
                    }
                }
                catch (e) { }
            }
        }
        return null;
    }
}
//# sourceMappingURL=KrnlShell.js.map