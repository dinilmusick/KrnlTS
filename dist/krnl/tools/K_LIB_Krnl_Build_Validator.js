import * as fs from 'fs';
import * as path from 'path';
export class KrnlBuildValidator {
    /**
     * Reads and parses krnl.json from specified directory
     */
    static readManifest(dirPath) {
        const manifestPath = path.join(dirPath, 'krnl.json');
        if (!fs.existsSync(manifestPath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            return JSON.parse(content);
        }
        catch (err) {
            throw new Error(`[ERR_KRNL_MANIFEST_PARSE_ERROR] Failed to parse manifest at ${manifestPath}: ${err.message}`);
        }
    }
    /**
     * Validates project dependencies statically at build time.
     * Scans project root krnl.json and checks if required subapps and required remotes can be satisfied.
     */
    static validateProject(projectRoot) {
        const errors = [];
        const mainManifest = this.readManifest(projectRoot);
        if (!mainManifest) {
            // No krnl.json found, skip or warning
            return { valid: true, errors: [] };
        }
        const subappsDir = path.join(projectRoot, 'subapps');
        const existingSubapps = new Set();
        if (fs.existsSync(subappsDir)) {
            const entries = fs.readdirSync(subappsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    existingSubapps.add(entry.name);
                    // Also check subapp manifest if available
                    const subManifest = this.readManifest(path.join(subappsDir, entry.name));
                    if (subManifest && subManifest.appName) {
                        existingSubapps.add(subManifest.appName);
                    }
                }
            }
        }
        // 1. Validate subapp dependencies
        if (mainManifest.dependencies?.subapps) {
            for (const subdep of mainManifest.dependencies.subapps) {
                if (subdep.required !== false) {
                    if (!existingSubapps.has(subdep.name)) {
                        errors.push(`[ERR_MISSING_SUBAPP_DEPENDENCY] Required sub-app '${subdep.name}' listed in krnl.json was not found in 'subapps/' directory.`);
                    }
                }
            }
        }
        // 2. Validate required remotes target entities availability in subapps/owned components
        if (mainManifest.dependencies?.requiredRemotes) {
            for (const remote of mainManifest.dependencies.requiredRemotes) {
                if (remote.targetEntity) {
                    // If targetEntity is not self and not in subapps, log error
                    const isSelf = mainManifest.appName === remote.targetEntity || mainManifest.entityClass === remote.targetEntity;
                    if (!isSelf && !existingSubapps.has(remote.targetEntity)) {
                        errors.push(`[ERR_MISSING_REMOTE_TARGET] Required remote functionality '${remote.fid}' target entity '${remote.targetEntity}' is not provided by any sub-app in 'subapps/'.`);
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
//# sourceMappingURL=K_LIB_Krnl_Build_Validator.js.map