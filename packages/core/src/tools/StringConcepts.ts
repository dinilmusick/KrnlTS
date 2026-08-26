/**
 * @file StringConcepts.ts
 * @role component
 * @description Polymorphic generic templates for string interpolation, slugification, casing, and sanitization.
 */

import { StringKit } from "./StringKit.js";

/**
 * Interpolates a template string containing {{variable}} placeholders with values from an object.
 */
export function interpolate(template: string, vars: Record<string, any>): string {
  return StringKit.interpolate(template, vars);
}

/**
 * Converts a string into a URL-friendly slug.
 */
export function toSlug(input: string): string {
  return StringKit.toSlug(input);
}

/**
 * Transforms string casing between camelCase, PascalCase, kebab-case, and snake_case.
 */
export function toCase(
  input: string,
  targetCase: "camel" | "pascal" | "kebab" | "snake"
): string {
  const words = input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .split(/\s+/);

  if (words.length === 0 || (words.length === 1 && words[0] === "")) {
    return "";
  }

  switch (targetCase) {
    case "camel":
      return words
        .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join("");
    case "pascal":
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    case "kebab":
      return words.map((w) => w.toLowerCase()).join("-");
    case "snake":
      return words.map((w) => w.toLowerCase()).join("_");
  }
}

/**
 * Truncates a string to a max length, appending an ellipsis suffix if truncated.
 */
export function truncate(input: string, maxLength: number, suffix: string = "..."): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
}

/**
 * Strips HTML tags and unsafe script characters from text.
 */
export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[&<>"']/g, (m) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return map[m] || m;
    });
}
