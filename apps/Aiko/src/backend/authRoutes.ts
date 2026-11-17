/**
 * ASCII Architecture Flowchart: authRoutes
 *
 *   ┌──────────────────────────────────────┐
 *   │        Initialize authRoutes         │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │  Execute Component / Pipeline Logic  │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │    Return State / Result Payload     │
 *   └──────────────────────────────────────┘
 */

export * from './authRoutes/authRoutes.js';
export { authRouter, databaseRouter, default } from './authRoutes/authRoutes.js';
