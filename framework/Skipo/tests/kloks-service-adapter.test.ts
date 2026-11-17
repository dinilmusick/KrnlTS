import { describe, expect, it } from 'vitest';
import { ServiceAFacade } from '@ultrst-armada/kloks/services';
import { BackendFacade } from '../src/backend/BackendFacade.js';
import { toKrnlServiceFacade } from '../src/backend/KloksServiceAdapter.js';

describe('Kloks service facade adapter', () => {
  it('exposes Kloks operations as queued Krnl capabilities', async () => {
    const backend = new BackendFacade();
    const adapted = toKrnlServiceFacade(ServiceAFacade);
    backend.registerService(adapted);

    const capabilities = backend.listCapabilities();
    expect(capabilities.some(capability => capability.id === 'kloks.service.a/functionalities/add')).toBe(true);

    const result = await backend.executeCapability(
      'add',
      'add',
      { a: 2, b: 3 },
      { serviceId: ServiceAFacade.id },
    );
    expect(result).toEqual({ result: 5 });
    await adapted.dispose();
  });
});
