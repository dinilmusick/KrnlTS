/**
 * Truncates an input string to a maximum number of words.
 *
 * @param value The input string to truncate.
 * @param maxWords Maximum number of words allowed.
 * @param suffix Suffix to append if truncated (default: '…').
 * @returns Truncated string.
 */
export function truncateWords(value: string, maxWords: number, suffix = "…"): string {
  if (maxWords < 0) throw new RangeError("maxWords must be non-negative");
  if (!value) return "";
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value;
  return `${words.slice(0, maxWords).join(" ")}${suffix}`;
}
