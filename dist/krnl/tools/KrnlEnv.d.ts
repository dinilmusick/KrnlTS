/**
 * @file KrnlEnv.ts
 * @description Type-safe environment loading and Zod schema config validation tool.
 */
import { z } from "zod";
export declare class KrnlEnv {
    /**
     * Reads a process environment variable with type coercion and defaults.
     */
    static get<T>(key: string, defaultValue?: T): T;
    /**
     * Asserts environment variable is set and returns its string value.
     */
    static require(key: string): string;
    /**
     * Loads a .env file and injects variables into process.env.
     */
    static load(filePath?: string): void;
    /**
     * Validates the entire config using a Zod schema.
     */
    static schema<T extends z.ZodTypeAny>(zodSchema: T): z.infer<T>;
}
//# sourceMappingURL=KrnlEnv.d.ts.map