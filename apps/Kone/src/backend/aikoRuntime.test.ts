import { describe, expect, it } from 'vitest';
import { resolveLocalAikoCapability } from './aikoCapabilityResolution.js';

const capabilities = [
  { id: 'workspace.create', name: 'Create Workspace' },
  { id: 'performance.save', name: 'Save Performance' },
] as any;

describe('local Aiko capability resolution', () => {
  it('matches by capability name or id', () => {
    expect(resolveLocalAikoCapability(capabilities, 'please save performance').id).toBe('performance.save');
    expect(resolveLocalAikoCapability(capabilities, 'workspace.create now').id).toBe('workspace.create');
  });

  it('does not silently execute an unrelated first capability', () => {
    expect(() => resolveLocalAikoCapability(capabilities, 'do something unrelated')).toThrow(
      'No local application capability matched the request.',
    );
  });

  it('rejects empty requests', () => {
    expect(() => resolveLocalAikoCapability(capabilities, '   ')).toThrow('Aiko request cannot be empty.');
  });
});
