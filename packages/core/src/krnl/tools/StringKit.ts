/**
 * @file StringKit.ts
 * @description String case conversions, UUID & ShortID generators, and minimal template interpolation.
 */

export class StringKit {
  static toCamelCase(str: string): string {
    return str
      .replace(/[-_]+/g, " ")
      .replace(/[^\w\s]/g, "")
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, "");
  }

  static toPascalCase(str: string): string {
    const camel = StringKit.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  static toSnakeCase(str: string): string {
    return str
      .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      .replace(/[-_\s]+/g, "_")
      .replace(/^[_\s]+|[_\s]+$/g, "")
      .toLowerCase();
  }

  static toKebabCase(str: string): string {
    return str
      .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      .replace(/[-_\s]+/g, "-")
      .replace(/^[-_\s]+|[-_\s]+$/g, "")
      .toLowerCase();
  }

  static toScreamingSnake(str: string): string {
    return StringKit.toSnakeCase(str).toUpperCase();
  }

  static toSlug(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, "")
      .replace(/[\s-_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static generateUUID(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static generateShortId(length = 8): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.random() * chars.length | 0);
    }
    return result;
  }

  static generatePrefixedId(prefix: string, length = 8): string {
    return `${prefix}-${StringKit.generateShortId(length)}`;
  }

  static interpolate(tmpl: string, data: Record<string, any>): string {
    return tmpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
    });
  }
}
