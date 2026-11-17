import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SystemDbService } from './systemDbService.js';

describe('SystemDbService initialization', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('does not make network requests during construction or module initialization', () => {
    new SystemDbService();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes status only when explicitly requested', async () => {
    const service = new SystemDbService();
    await service.refreshStatus();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/system/env-config');
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/backend');
  });
});
