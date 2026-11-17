/**
 * @file kloks.test.ts
 * @description Comprehensive verification suite for all @kloks/* KrnlTS-based packages:
 * - @kloks/services (Service A, B, C, D)
 * - @kloks/orchestrations (Orchestrator A, B)
 * - @kloks/audio-midi (AudioHardwareService, MidiService, AudioMidiOrchestrator)
 * - @kloks/functions (FunctionsServiceFacade & pure functions)
 * - @kloks/backend (AuthServiceFacade, StorageServiceFacade, WorkspaceServiceFacade, ControlPlaneServiceFacade, ExecutionServiceFacade)
 * - @kloks/state-graph (StateLifecycleServiceFacade, NodeGraphEngineServiceFacade)
 */

import { describe, it, expect } from 'vitest';
import {
  ServiceAFacade,
  ServiceBFacade,
  ServiceCFacade,
  ServiceDFacade,
  exposeServiceD,
} from '@kloks/services';
import {
  OrchestratorADefinition,
  OrchestratorBDefinition,
} from '@kloks/orchestrations';
import {
  AudioHardwareServiceFacade,
  MidiServiceFacade,
  AudioMidiOrchestratorDefinition,
} from '@kloks/audio-midi';
import {
  FunctionsServiceFacade,
  toKebabCase,
} from '@kloks/functions';
import {
  AuthServiceFacade,
  StorageServiceFacade,
  WorkspaceServiceFacade,
  ControlPlaneServiceFacade,
  SrklServiceFacade,
} from '@kloks/backend/node';
import {
  StateLifecycleServiceFacade,
  NodeGraphEngineServiceFacade,
} from '@kloks/state-graph';

describe('Kloks Public Package Library (@kloks/* built on KrnlTS)', () => {
  it('Service A (Pure) & Service B (Stateful) have pure serializable Orchestrator A definition with zero execution machinery', async () => {
    await ServiceBFacade.execute('reset');
    const sum = await ServiceAFacade.execute<{ a: number; b: number }, { result: number }>('add', {
      a: 12,
      b: 8,
    });
    expect(sum.result).toBe(20);

    expect(OrchestratorADefinition.id).toBe('kloks.orchestrator.a');
    expect(OrchestratorADefinition.steps).toHaveLength(2);
    expect(OrchestratorADefinition.dependencies).toContain('kloks.service.a');
    expect(OrchestratorADefinition.dependencies).toContain('kloks.service.b');
    // Enforce ZERO execution machinery in Kloks
    expect((OrchestratorADefinition as any).execute).toBeUndefined();
  });

  it('Service B (Stateful) & Service C (Event-Emitting) have pure serializable Orchestrator B definition with zero execution machinery', async () => {
    expect(OrchestratorBDefinition.id).toBe('kloks.orchestrator.b');
    expect(OrchestratorBDefinition.steps).toHaveLength(2);
    expect(OrchestratorBDefinition.dependencies).toContain('kloks.service.b');
    expect(OrchestratorBDefinition.dependencies).toContain('kloks.service.c');
    // Enforce ZERO execution machinery in Kloks
    expect((OrchestratorBDefinition as any).execute).toBeUndefined();
  });

  it('Service D (Protocol-Enabled) exposes over HTTP and responds via KrnlTS ServiceProxy', async () => {
    expect(ServiceDFacade.deployment).toBe('remote');
    const handle = await exposeServiceD();
    const res = await handle.proxy.call<{ message: string }, { echoed: string }>('echo', {
      message: 'hello-kloks',
    });
    expect(res.echoed).toBe('hello-kloks');
    await handle.stop();
  });

  it('@kloks/audio-midi MidiService, AudioHardwareService, and AudioMidiOrchestrator operate as KrnlTS services', async () => {
    const parsed = await MidiServiceFacade.execute<
      { bytes: Uint8Array },
      { command: string; note: number; velocity: number }
    >('parseRawBytes', {
      bytes: new Uint8Array([0x90, 64, 110]),
    });
    expect(parsed.command).toBe('NOTE_ON');
    expect(parsed.note).toBe(64);
    expect(parsed.velocity).toBe(110);

    expect(AudioMidiOrchestratorDefinition.id).toBe('kloks.orchestrator.audioMidi');
    expect(AudioMidiOrchestratorDefinition.steps).toHaveLength(2);
    expect(AudioMidiOrchestratorDefinition.dependencies).toContain(MidiServiceFacade.id);
    expect(AudioMidiOrchestratorDefinition.dependencies).toContain(AudioHardwareServiceFacade.id);
    expect((AudioMidiOrchestratorDefinition as any).execute).toBeUndefined();
  });

  it('@kloks/functions FunctionsServiceFacade and pure utilities execute', async () => {
    expect(toKebabCase('KloksServicePackage')).toBe('kloks-service-package');
    const kebab = await FunctionsServiceFacade.execute<{ value: string }, string>('toKebabCase', {
      value: 'AudioHardwareService',
    });
    expect(kebab).toBe('audio-hardware-service');
  });

  it('@kloks/backend and @kloks/state-graph KrnlTS services execute cleanly', async () => {
    const wsRes = await WorkspaceServiceFacade.execute<
      { id: string; name: string },
      { valid: boolean; workspaceId: string }
    >('validateWorkspaceConfig', { id: 'ws-1', name: 'Main' });
    expect(wsRes.valid).toBe(true);

    const cpStatus = await ControlPlaneServiceFacade.execute<undefined, { healthy: boolean }>(
      'status'
    );
    expect(cpStatus.healthy).toBe(true);

    const storageStatus = await StorageServiceFacade.execute<
      { provider: 'local' },
      { provider: string; initialized: boolean }
    >('resolveAdapterType', { provider: 'local' });
    expect(storageStatus.initialized).toBe(true);
    expect((AuthServiceFacade as any).definition.operations.login).toBeDefined();
    expect((AuthServiceFacade as any).definition.operations.resolveUser).toBeDefined();
    expect((AuthServiceFacade as any).definition.operations.createSession).toBeUndefined();
    expect((AuthServiceFacade as any).definition.operations.checkRateLimit).toBeUndefined();

    const backendExports = [AuthServiceFacade, StorageServiceFacade, WorkspaceServiceFacade, SrklServiceFacade];
    expect(backendExports.every((service) => typeof service.execute === 'function')).toBe(true);
    expect(SrklServiceFacade.id).toBe('kloks.backend.srkl');
    expect((WorkspaceServiceFacade as any).definition.operations.listWorkspaces).toBeDefined();
    expect((StorageServiceFacade as any).definition.operations.listBackblazeBuckets).toBeDefined();

    const stateRes = await StateLifecycleServiceFacade.execute<
      { from: string; to: string },
      { graphReady: boolean }
    >('validateTransition', { from: 'IDLE', to: 'LOADING' });
    expect(stateRes.graphReady).toBe(true);

    const graphRes = await NodeGraphEngineServiceFacade.execute<
      undefined,
      { initialized: boolean }
    >('getRuleStoreStatus');
    expect(graphRes.initialized).toBe(true);
  });
});
