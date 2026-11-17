import type { AikoCapability } from '@ultrst-armada/kloks/aiko';

export function resolveLocalAikoCapability(capabilities: AikoCapability[], inputText: string): AikoCapability {
  const normalized = inputText.trim().toLowerCase();
  if (!normalized) throw new Error('Aiko request cannot be empty.');
  const matched = capabilities.find((capability) =>
    normalized.includes(String(capability.name).toLowerCase()) ||
    normalized.includes(String(capability.id).toLowerCase())
  );
  if (!matched) throw new Error('No local application capability matched the request.');
  return matched;
}
