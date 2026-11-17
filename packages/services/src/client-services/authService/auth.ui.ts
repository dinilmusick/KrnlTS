/**
 * @file auth.ui.ts
 * @description Typed and versioned Service UI Schema for AuthService.
 * Declares REQUIRED UI mode, canonical FLOKS asset bindings, and operation mappings.
 */

import type { ServiceUISchema } from '@kloks/contracts';

export const AuthServiceUISchema: ServiceUISchema = {
  schemaId: 'kloks.service.auth.ui',
  schemaVersion: '1.0.0',
  serviceId: 'kloks.service.auth',
  requirementMode: 'required',
  pages: [
    {
      name: 'Auth.ui',
      description: 'Canonical authentication page wrapper',
      sections: [
        {
          name: 'Auth.ui.LoginSection',
          description: 'Login and registration section backed by canonical FLOKS AuthPage',
          assetRef: {
            packageId: '@ultrst-armada/floks',
            packageVersion: '^1.2.4',
            exportPath: 'ui',
            assetId: 'AuthPage',
            assetVersion: '1.0.0',
          },
          components: [
            {
              name: 'Auth.ui.LoginSection.AuthPage',
              assetRef: {
                packageId: '@ultrst-armada/floks',
                packageVersion: '^1.2.4',
                exportPath: 'ui',
                assetId: 'AuthPage',
                assetVersion: '1.0.0',
              },
            },
            {
              name: 'Auth.ui.LoginSection.LoginModal',
              assetRef: {
                packageId: '@ultrst-armada/floks',
                packageVersion: '^1.2.4',
                exportPath: 'ui',
                assetId: 'LoginModal',
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
      name: 'Auth.ui.LoginSection',
      assetRef: {
        packageId: '@ultrst-armada/floks',
        packageVersion: '^1.2.4',
        exportPath: 'ui',
        assetId: 'AuthPage',
        assetVersion: '1.0.0',
      },
      components: [
        {
          name: 'Auth.ui.LoginSection.AuthPage',
          assetRef: {
            packageId: '@ultrst-armada/floks',
            packageVersion: '^1.2.4',
            exportPath: 'ui',
            assetId: 'AuthPage',
            assetVersion: '1.0.0',
          },
        },
      ],
    },
  ],
  components: [
    {
      name: 'AuthPage',
      assetRef: {
        packageId: '@ultrst-armada/floks',
        packageVersion: '^1.2.4',
        exportPath: 'ui',
        assetId: 'AuthPage',
        assetVersion: '1.0.0',
      },
    },
    {
      name: 'LoginModal',
      assetRef: {
        packageId: '@ultrst-armada/floks',
        packageVersion: '^1.2.4',
        exportPath: 'ui',
        assetId: 'LoginModal',
        assetVersion: '1.0.0',
      },
    },
  ],
  assetRefs: [
    {
      packageId: '@ultrst-armada/floks',
      packageVersion: '^1.2.4',
      exportPath: 'ui',
      assetId: 'AuthPage',
      assetVersion: '1.0.0',
    },
    {
      packageId: '@ultrst-armada/floks',
      packageVersion: '^1.2.4',
      exportPath: 'ui',
      assetId: 'LoginModal',
      assetVersion: '1.0.0',
    },
  ],
  operationBindings: [
    {
      operationId: 'AuthClientService.login',
      uiPath: 'Auth.ui.LoginSection',
    },
    {
      operationId: 'AuthClientService.register',
      uiPath: 'Auth.ui.LoginSection',
    },
  ],
};
