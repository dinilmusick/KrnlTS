/**
 * @file systemDb.ui.ts
 * @description Typed and versioned Service UI Schema for SystemDbService.
 * Declares NONE requirement mode — system database configuration has no required frontend UI component.
 */

import type { ServiceUISchema } from '@kloks/contracts';

export const SystemDbServiceUISchema: ServiceUISchema = {
  schemaId: 'kloks.service.systemDb.ui',
  schemaVersion: '1.0.0',
  serviceId: 'kloks.service.systemDb',
  requirementMode: 'none',
  pages: [],
  sections: [],
  components: [],
  assetRefs: [],
  operationBindings: [],
};
