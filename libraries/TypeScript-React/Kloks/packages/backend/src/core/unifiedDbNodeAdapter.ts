/**
 * @file unifiedDbNodeAdapter.ts
 * @description Node-only source of default system configuration.
 * This module is installed only by the explicit /backend/node entrypoint.
 */

import { configureUnifiedDatabaseEnvironmentResolver } from './unifiedDb.js';

configureUnifiedDatabaseEnvironmentResolver(() => process.env);
