import type { SupportedLanguage } from "./types.js";

export interface LanguageResolutionInput {
  language?: SupportedLanguage;
  filename?: string;
  source: string;
}

export interface LanguageResolution {
  language: SupportedLanguage;
  confidence: number;
  reason: string;
}

export function resolveLanguage(input: LanguageResolutionInput): LanguageResolution {
  if (input.language) {
    return { language: input.language, confidence: 1, reason: "explicit language" };
  }

  const filename = input.filename?.toLowerCase();
  if (filename?.endsWith(".rs")) return { language: "rust", confidence: 1, reason: "Rust filename" };
  if (filename?.endsWith(".go")) return { language: "go", confidence: 1, reason: "Go filename" };

  const source = input.source;
  const rust = /\bfn\s+main\s*\(|use\s+std::|println!\s*\(/.test(source);
  const go = /\bpackage\s+main\b|\bfunc\s+main\s*\(|fmt\.(Print|Printf|Println)\s*\(/.test(source);

  if (rust && !go) return { language: "rust", confidence: 0.95, reason: "Rust syntax markers" };
  if (go && !rust) return { language: "go", confidence: 0.95, reason: "Go syntax markers" };
  throw new Error("Unable to resolve source language; provide language or filename.");
}
