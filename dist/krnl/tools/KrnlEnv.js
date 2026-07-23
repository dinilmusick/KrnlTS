/**
 * @file KrnlEnv.ts
 * @description Type-safe environment loading and Zod schema config validation tool.
 */
import fs from "fs";
import path from "path";
export class KrnlEnv {
    /**
     * Reads a process environment variable with type coercion and defaults.
     */
    static get(key, defaultValue) {
        const val = process.env[key];
        if (val === undefined) {
            if (defaultValue !== undefined)
                return defaultValue;
            throw new Error(`[KrnlEnvError] Missing required environment variable: ${key}`);
        }
        if (typeof defaultValue === "number") {
            const num = Number(val);
            if (isNaN(num)) {
                throw new Error(`[KrnlEnvError] Expected number for ${key}, received: ${val}`);
            }
            return num;
        }
        if (typeof defaultValue === "boolean") {
            return (val === "true" || val === "1");
        }
        try {
            if (defaultValue && typeof defaultValue === "object") {
                return JSON.parse(val);
            }
        }
        catch (e) { }
        return val;
    }
    /**
     * Asserts environment variable is set and returns its string value.
     */
    static require(key) {
        const val = process.env[key];
        if (val === undefined) {
            throw new Error(`[KrnlEnvError] Missing required environment variable: ${key}`);
        }
        return val;
    }
    /**
     * Loads a .env file and injects variables into process.env.
     */
    static load(filePath) {
        const file = filePath || path.join(process.cwd(), ".env");
        if (!fs.existsSync(file))
            return;
        try {
            const content = fs.readFileSync(file, "utf8");
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#"))
                    continue;
                const equalsIndex = trimmed.indexOf("=");
                if (equalsIndex === -1)
                    continue;
                const key = trimmed.slice(0, equalsIndex).trim();
                let value = trimmed.slice(equalsIndex + 1).trim();
                // Handle quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.slice(1, -1);
                }
                if (process.env[key] === undefined) {
                    process.env[key] = value;
                }
            }
        }
        catch (e) { }
    }
    /**
     * Validates the entire config using a Zod schema.
     */
    static schema(zodSchema) {
        try {
            return zodSchema.parse(process.env);
        }
        catch (err) {
            throw new Error(`[KrnlEnvError] Environment validation failed: ${err.message || String(err)}`);
        }
    }
}
//# sourceMappingURL=KrnlEnv.js.map