/**
 * @file node.ts
 * @description Explicit Node.js adapters and filesystem tooling.
 *
 * Import this entrypoint only from Node.js applications. The default entrypoint
 * remains runtime-neutral and does not load Node transports or filesystem APIs.
 */

export * from './index.js';
export * from './protocols/HttpProtocolAdapter.js';
export * from './protocols/WebSocketProtocolAdapter.js';
export * from './protocols/UdpProtocolAdapter.js';
export * from './discovery/KrnlPackageReconciler.js';
export * as gutts from '@dinilmusick/gutts';
