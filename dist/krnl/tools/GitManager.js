/**
 * @file GitManager.ts
 * @description Safe project-scoped Git operations.
 */
import { KrnlShell } from "./KrnlShell.js";
import fs from "fs";
import path from "path";
export class GitManager {
    static isRepo(dirPath) {
        return fs.existsSync(path.join(dirPath, ".git"));
    }
    static async init(dirPath) {
        if (GitManager.isRepo(dirPath))
            return;
        await KrnlShell.exec("git init", { cwd: dirPath });
    }
    static async clone(repoUrl, destPath) {
        const parentDir = path.dirname(destPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        await KrnlShell.exec(`git clone ${repoUrl} ${path.basename(destPath)}`, { cwd: parentDir });
    }
    static async commit(dirPath, message) {
        if (!GitManager.isRepo(dirPath)) {
            throw new Error(`[GitManagerError] Directory ${dirPath} is not a git repository.`);
        }
        // Check if there are any changes (dirty-check)
        const { stdout: status } = await KrnlShell.exec("git status --porcelain", { cwd: dirPath });
        if (!status.trim()) {
            return false; // No changes to commit
        }
        await KrnlShell.exec("git add -A", { cwd: dirPath });
        await KrnlShell.exec(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: dirPath });
        return true;
    }
    static async push(dirPath, remote = "origin", branch = "main") {
        if (!GitManager.isRepo(dirPath)) {
            throw new Error(`[GitManagerError] Directory ${dirPath} is not a git repository.`);
        }
        await KrnlShell.exec(`git push ${remote} ${branch}`, { cwd: dirPath });
    }
}
//# sourceMappingURL=GitManager.js.map