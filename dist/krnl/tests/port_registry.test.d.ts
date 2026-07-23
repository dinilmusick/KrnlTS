/**
 * @file port_registry.test.ts
 * @description Regression test: commPort, portRegistry, and ports snapshot file
 *              must all reflect the OS-bound port, not the constructor hint.
 *
 * Invariant under test:
 *   snapshot(ports.json) = f(server.address().port)
 *   NOT f(constructor_arg)
 *
 * Test scenario:
 *   1. Occupy preferred port with a blocker server.
 *   2. Start krnlSystemEntityBase on that same preferred port.
 *   3. System must probe and fall back to preferred+N.
 *   4. Assert: commPort === portRegistry['_krnl_system'] === ports.json value
 *              AND commComponent.listenPort, unifiedHttpAdapter.port agree.
 *              AND none of the above equal the blocked preferred port.
 */
export {};
//# sourceMappingURL=port_registry.test.d.ts.map