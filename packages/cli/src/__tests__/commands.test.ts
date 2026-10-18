import { describe, expect, it } from 'vitest';
import { runValidate } from '../commands/validate.js';

describe('Krnl CLI commands', () => {
  it('returns true for a valid project', async () => {
    expect(await runValidate(process.cwd())).toBe(true);
  });
});
