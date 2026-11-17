/**
 * ASCII Architecture Flowchart: sanitizer
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize sanitizer       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          API_KEY_REGEX           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           BEARER_REGEX           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        AUTH_HEADER_REGEX         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO LEARNING & MEMORY SANITIZATION ENGINE ═══════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

const API_KEY_REGEX = /(?:sk-[a-zA-Z0-9_-]{12,}|AIza[a-zA-Z0-9_-]{30,}|key-[a-zA-Z0-9_-]{12,})/gi;
const BEARER_REGEX = /Bearer\s+[a-zA-Z0-9._~+/-]+=*/gi;
const AUTH_HEADER_REGEX = /(?:Authorization|Cookie|Set-Cookie):\s*[^\r\n]+/gi;
const SENSITIVE_PARAM_REGEX = /(?:api_?key|password|secret|auth_?token|access_?token|session_?id)=[^&\s"']+/gi;
const SENSITIVE_JSON_REGEX = /"(?:apiKey|password|secret|token|sessionToken|credential|privateKey)":\s*"[^"]+"/gi;
const REASONING_TAG_REGEX = /<think>[\s\S]*?<\/think>/gi;

export function sanitizeText(input: string): string {
  if (!input) return '';

  let sanitized = input
    .replace(REASONING_TAG_REGEX, '')
    .replace(API_KEY_REGEX, '[REDACTED_KEY]')
    .replace(BEARER_REGEX, 'Bearer [REDACTED_TOKEN]')
    .replace(AUTH_HEADER_REGEX, '[REDACTED_HEADER]')
    .replace(SENSITIVE_PARAM_REGEX, '[REDACTED_PARAM]')
    .replace(SENSITIVE_JSON_REGEX, '"[REDACTED_FIELD]": "[REDACTED]"');

  // Strip prose paragraphs if any, retain atomic bulleted or numbered list items
  const lines = sanitized.split('\n').map(l => l.trim()).filter(Boolean);
  const cleanLines: string[] = [];

  for (let line of lines) {
    // Remove leading bullet/number prefixes for uniform list normalization
    line = line.replace(/^(?:\d+[\.\)]|\*|-|\+)\s*/, '').trim();
    if (line) cleanLines.push(line);
  }

  return cleanLines.join('\n');
}

export function formatAsNumberedList(items: string[]): string {
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
}

export function isProseParagraph(text: string): boolean {
  return text.length > 200 && !text.includes('\n') && !/^\d+\./.test(text.trim());
}