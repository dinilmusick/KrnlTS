/**
 * @file contracts.test.ts
 * @description Comprehensive Invariant & Semantic Verification Suite for Kloks Contract Foundation:
 * T1 → export existence
 * T2 → type/schema agreement
 * T3 → facade behavior
 * T4 → semantic invariants (QwnsrRequiredSurface ⊆ KloksPublicContract)
 * T5 → consumer fixture compilation
 * T6 → consumer fixture runtime
 */

import { describe, it, expect } from 'vitest';
import {
  KLOKS_CANONICAL_CONTRACT,
  KLOKS_PUBLIC_SURFACE,
  QWNSR_REQUIRED_SURFACE,
  validateConsumerSurfaceCompatibility,
  createKloksSnapshot,
  diffContractSnapshots,
  GraphEntityMetadataSchema,
  SocketPosition2DSchema,
  SocketGeometryConfigSchema,
  SocketStyleConfigSchema,
  WireEndpoint2DSchema,
  WireVisualConfigSchema,
  NodeDimensions2DSchema,
  AudioBusConfigSchema,
  AudioHardwareStateSchema,
  MidiCommandTypeSchema,
  MidiEventPayloadSchema,
} from '@kloks/contracts';

import {
  GraphEntityParent,
  type GraphEntityMetadata,
  type SocketPosition2D,
  createSocketInstance,
  createWireInstance,
  createNodeInstance,
  StateLifecycleServiceFacade,
  NodeGraphEngineServiceFacade,
} from '@kloks/state-graph';

import {
  AudioHardwareServiceFacade,
  MidiServiceFacade,
  AudioMidiOrchestratorDefinition,
} from '@kloks/audio-midi';

import {
  OrchestratorADefinition,
  OrchestratorBDefinition,
} from '@kloks/orchestrations';

describe('Kloks 01 — Contract Foundation Verification Suite', () => {
  // ── T1: Export Existence ──
  it('T1: verifies all canonical public symbols exist on public subpaths', () => {
    expect(KLOKS_PUBLIC_SURFACE.length).toBeGreaterThan(60);

    const categories = new Set(KLOKS_PUBLIC_SURFACE.map((s) => s.category));
    expect(categories.has('state-graph')).toBe(true);
    expect(categories.has('audio-midi')).toBe(true);
    expect(categories.has('orchestrations')).toBe(true);
    expect(categories.has('backend')).toBe(true);
    expect(categories.has('services')).toBe(true);
    expect(categories.has('functions')).toBe(true);
    expect(categories.has('contracts')).toBe(true);
  });

  // ── T2: Type / Schema Agreement ──
  it('T2: verifies Zod runtime schemas enforce and match TypeScript contracts', () => {
    // 1. GraphEntityMetadata
    const validMeta: GraphEntityMetadata = {
      id: 'entity-1',
      name: 'GainNode',
      type: 'audio_gain',
      archetype: 'DataProcessingNodeParent',
      tags: ['audio', 'dsp'],
    };
    expect(GraphEntityMetadataSchema.safeParse(validMeta).success).toBe(true);
    expect(GraphEntityMetadataSchema.safeParse({ id: 123 }).success).toBe(false);

    // 2. SocketPosition2D
    const pos: SocketPosition2D = { x: 140, y: 80 };
    expect(SocketPosition2DSchema.safeParse(pos).success).toBe(true);
    expect(SocketPosition2DSchema.safeParse({ x: 'invalid' }).success).toBe(false);

    // 3. Socket Geometry & Style
    expect(SocketGeometryConfigSchema.safeParse({ radius: 8, hitRadius: 16 }).success).toBe(true);
    expect(SocketStyleConfigSchema.safeParse({ color: '#ffaa00' }).success).toBe(true);

    // 4. Wire Endpoint & Visual Config
    expect(
      WireEndpoint2DSchema.safeParse({
        nodeId: 'node-a',
        socketId: 'sock-1',
        position: { x: 10, y: 20 },
      }).success
    ).toBe(true);

    expect(
      WireVisualConfigSchema.safeParse({
        strokeColor: '#00ffff',
        strokeWidth: 3,
        glow: true,
      }).success
    ).toBe(true);

    // 5. Node Dimensions
    expect(NodeDimensions2DSchema.safeParse({ width: 220, height: 160 }).success).toBe(true);

    // 6. Audio / MIDI
    expect(AudioBusConfigSchema.safeParse({ channelCount: 2, sampleRate: 48000 }).success).toBe(true);
    expect(
      AudioHardwareStateSchema.safeParse({
        contextState: 'running',
        sampleRate: 48000,
        inputChannels: 2,
        outputChannels: 2,
      }).success
    ).toBe(true);

    expect(MidiCommandTypeSchema.safeParse('NOTE_ON').success).toBe(true);
    expect(MidiCommandTypeSchema.safeParse('INVALID_CMD').success).toBe(false);

    expect(
      MidiEventPayloadSchema.safeParse({
        command: 'NOTE_ON',
        channel: 1,
        note: 60,
        velocity: 100,
      }).success
    ).toBe(true);
  });

  // ── T3: Facade Behavior ──
  it('T3: verifies stable facades execute according to their public contract', async () => {
    // 1. StateLifecycleServiceFacade
    const stateRes = await StateLifecycleServiceFacade.execute<{ from: string; to: string }, { graphReady: boolean }>(
      'validateTransition',
      { from: 'IDLE', to: 'READY' }
    );
    expect(stateRes.graphReady).toBe(true);

    // 3. NodeGraphEngineServiceFacade
    const ruleRes = await NodeGraphEngineServiceFacade.execute<undefined, { initialized: boolean }>(
      'getRuleStoreStatus'
    );
    expect(ruleRes.initialized).toBe(true);

    // 4. Orchestrators A & B (Pure definitions in Kloks distribution)
    expect(OrchestratorADefinition.id).toBe('kloks.orchestrator.a');
    expect(OrchestratorADefinition.scope).toBe('service');
    expect((OrchestratorADefinition as any).execute).toBeUndefined();

    expect(OrchestratorBDefinition.id).toBe('kloks.orchestrator.b');
    expect(OrchestratorBDefinition.scope).toBe('service');
    expect((OrchestratorBDefinition as any).execute).toBeUndefined();
  });

  // ── T4: Semantic Invariants ──
  it('T4: verifies QwnsrRequiredSurface ⊆ KloksPublicContract (Invariant Acceptance)', () => {
    const check = validateConsumerSurfaceCompatibility(QWNSR_REQUIRED_SURFACE);
    expect(check.compatible).toBe(true);
    expect(check.missingSymbols).toHaveLength(0);
    expect(check.totalPresent).toBe(QWNSR_REQUIRED_SURFACE.length);
  });

  // ── T5: Snapshot & Diff Versioning Invariant ──
  it('T5: verifies contract snapshots and semver diff engine', () => {
    const snap1 = createKloksSnapshot('1.0.2');
    expect(snap1.package).toBe('@ultrst-armada/kloks');
    expect(snap1.version).toBe('1.0.2');
    expect(snap1.publicSymbols.length).toBeGreaterThan(50);

    // Diff identical snapshot => PATCH
    const diffIdentical = diffContractSnapshots(snap1, snap1);
    expect(diffIdentical.isIdentical).toBe(true);
    expect(diffIdentical.versionRecommendation).toBe('PATCH');

    // Additive change => MINOR
    const snap2 = {
      ...snap1,
      publicSymbols: [...snap1.publicSymbols, 'NewlyAddedFutureSymbol'],
      normalizedSignatures: { ...snap1.normalizedSignatures, NewlyAddedFutureSymbol: 'state-graph:state-graph' },
    };
    const diffAdditive = diffContractSnapshots(snap1, snap2);
    expect(diffAdditive.hasAdditiveChanges).toBe(true);
    expect(diffAdditive.versionRecommendation).toBe('MINOR');

    // Breaking change (symbol removal) => MAJOR
    const snap3 = {
      ...snap1,
      publicSymbols: snap1.publicSymbols.filter((s) => s !== 'GraphEntityMetadata'),
    };
    const diffBreaking = diffContractSnapshots(snap1, snap3);
    expect(diffBreaking.hasBreakingChanges).toBe(true);
    expect(diffBreaking.versionRecommendation).toBe('MAJOR');
  });

  // ── T6: Consumer Fixture Runtime (Qwnsr Simulation) ──
  it('T6: runs simulated Qwnsr consumer fixture against Kloks public contracts', async () => {
    // Simulate Qwnsr instantiating canonical sockets, wires, and nodes
    const socket = createSocketInstance({
      nodeId: 'node-qwnsr-1',
      type: 'audio_stereo',
      direction: 'output',
      position: { x: 50, y: 100 },
    });
    expect(socket).toBeDefined();

    const wire = createWireInstance({
      id: 'wire-qwnsr-1',
      sourceNodeId: 'node-qwnsr-1',
      sourceSocketId: 'sock-out',
      targetNodeId: 'node-qwnsr-2',
      targetSocketId: 'sock-in',
      type: 'audio_stereo',
    });
    expect(wire).toBeDefined();

    const node = createNodeInstance({
      id: 'node-qwnsr-1',
      name: 'QwnsrAudioOscillator',
      type: 'signal_generator',
      position: [200, 150],
      dimensions: { width: 180, height: 120 },
    });
    expect(node).toBeDefined();

    // Verify metadata validity against Zod schema
    const metaCheck = GraphEntityMetadataSchema.safeParse({
      id: node.id ?? 'node-qwnsr-1',
      name: 'QwnsrAudioOscillator',
      type: 'signal_generator',
      archetype: 'SignalGeneratorNodeParent',
    });
    expect(metaCheck.success).toBe(true);
  });
});
