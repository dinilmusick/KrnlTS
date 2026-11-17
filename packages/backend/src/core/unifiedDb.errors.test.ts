import { afterEach, describe, expect, it, vi } from 'vitest';

const mockNeon = vi.hoisted(() => vi.fn());
vi.mock('@neondatabase/serverless', () => ({ neon: mockNeon }));

import { queryUnifiedDb } from './unifiedDb.js';

afterEach(() => {
  vi.restoreAllMocks();
  mockNeon.mockReset();
});

describe('unified database error redaction', () => {
  it('does not expose SQL parameter values or driver messages in thrown errors or logs', async () => {
    const secretMarker = 'private-storage-credential-marker';
    mockNeon.mockReturnValue(async () => {
      throw Object.assign(new Error(`driver failed while binding ${secretMarker}`), {
        code: '42P01',
      });
    });
    const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    let thrown: unknown;
    try {
      await queryUnifiedDb(
        'SELECT * FROM private_storage WHERE token = $1',
        [secretMarker],
        {
          SYSTEM_DATABASE_URL: 'postgresql://primary.example/db',
          SYSTEM_DATABASE_URL_2: 'postgresql://fallback.example/db',
        },
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: '42P01' });
    expect(thrown instanceof Error ? thrown.message : String(thrown)).not.toContain(secretMarker);
    expect(JSON.stringify(logger.mock.calls)).not.toContain(secretMarker);
    expect(mockNeon).toHaveBeenCalledTimes(1);
  });
});
