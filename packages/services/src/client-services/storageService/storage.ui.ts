/**
 * @file storage.ui.ts
 * @description Typed and versioned Service UI Schema for StorageService.
 * Declares OPTIONAL UI mode and canonical FLOKS WorkspaceTilesMenu asset bindings.
 */

import type { ServiceUISchema } from '@kloks/contracts';

export const StorageServiceUISchema: ServiceUISchema = {
  schemaId: 'kloks.service.storage.ui',
  schemaVersion: '1.0.0',
  serviceId: 'kloks.service.storage',
  requirementMode: 'optional',
  pages: [
    {
      name: 'Storage.ui',
      description: 'Workspace and storage connection page',
      sections: [
        {
          name: 'Storage.ui.TilesSection',
          description: 'Workspace isolation and storage tiles menu',
          assetRef: {
            packageId: '@ultrst-armada/floks',
            packageVersion: '^1.2.4',
            exportPath: 'ui',
            assetId: 'WorkspaceTilesMenu',
            assetVersion: '1.0.0',
          },
          components: [
            {
              name: 'Storage.ui.TilesSection.WorkspaceTilesMenu',
              assetRef: {
                packageId: '@ultrst-armada/floks',
                packageVersion: '^1.2.4',
                exportPath: 'ui',
                assetId: 'WorkspaceTilesMenu',
                assetVersion: '1.0.0',
              },
            },
          ],
        },
      ],
    },
  ],
  sections: [
    {
      name: 'Storage.ui.TilesSection',
      assetRef: {
        packageId: '@ultrst-armada/floks',
        packageVersion: '^1.2.4',
        exportPath: 'ui',
        assetId: 'WorkspaceTilesMenu',
        assetVersion: '1.0.0',
      },
      components: [
        {
          name: 'Storage.ui.TilesSection.WorkspaceTilesMenu',
          assetRef: {
            packageId: '@ultrst-armada/floks',
            packageVersion: '^1.2.4',
            exportPath: 'ui',
            assetId: 'WorkspaceTilesMenu',
            assetVersion: '1.0.0',
          },
        },
      ],
    },
  ],
  components: [
    {
      name: 'WorkspaceTilesMenu',
      assetRef: {
        packageId: '@ultrst-armada/floks',
        packageVersion: '^1.2.4',
        exportPath: 'ui',
        assetId: 'WorkspaceTilesMenu',
        assetVersion: '1.0.0',
      },
    },
  ],
  assetRefs: [
    {
      packageId: '@ultrst-armada/floks',
      packageVersion: '^1.2.4',
      exportPath: 'ui',
      assetId: 'WorkspaceTilesMenu',
      assetVersion: '1.0.0',
    },
  ],
  operationBindings: [
    {
      operationId: 'StorageClientService.getConnections',
      uiPath: 'Storage.ui.TilesSection',
    },
  ],
};
