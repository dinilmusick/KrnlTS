/**
 * @file StringKit.ts
 * @description String case conversions, UUID & ShortID generators, and minimal template interpolation.
 */
export declare class StringKit {
    static toCamelCase(str: string): string;
    static toPascalCase(str: string): string;
    static toSnakeCase(str: string): string;
    static toKebabCase(str: string): string;
    static toScreamingSnake(str: string): string;
    static toSlug(str: string): string;
    static generateUUID(): string;
    static generateShortId(length?: number): string;
    static generatePrefixedId(prefix: string, length?: number): string;
    static interpolate(tmpl: string, data: Record<string, any>): string;
}
//# sourceMappingURL=StringKit.d.ts.map