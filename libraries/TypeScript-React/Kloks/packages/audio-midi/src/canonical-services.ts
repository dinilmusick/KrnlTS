import { createClockKernelService, type ClockState } from './clock/index.js';
import { ClockService, type ClockOptions } from './clock/index.js';
import { createMidiKernelService, type MidiState } from './midi/index.js';
import { createWebMidiBackend, type MidiBackend } from './midi/index.js';
import { createOscKernelService, type OscState } from './osc/index.js';
import type { OscTransport } from './osc/index.js';
import type { IService, ServiceDefinition } from '@ultrst-armada/krnl';

/** Default timing facade; each Skipo app can create an isolated clock instance. */
const defaultClockService = createClockKernelService();
export const ClockServiceDefinition: ServiceDefinition = defaultClockService.getDefinition();
export const ClockServiceFacade = {
  id: ClockServiceDefinition.id,
  name: ClockServiceDefinition.name,
  version: ClockServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: ClockServiceDefinition,
  createInstance: (options: ClockOptions = {}): IService<ClockState> => createClockKernelService(new ClockService(options)),
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn) => {
    await defaultClockService.start();
    return defaultClockService.call<TIn, TOut>(operation, input);
  },
};

/** Capability-gated Web MIDI facade. Native/server backends are injected per application. */
const defaultMidiService = createMidiKernelService(createWebMidiBackend());
export const CanonicalMidiServiceDefinition: ServiceDefinition = defaultMidiService.getDefinition();
export const CanonicalMidiServiceFacade = {
  id: CanonicalMidiServiceDefinition.id,
  name: CanonicalMidiServiceDefinition.name,
  version: CanonicalMidiServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: CanonicalMidiServiceDefinition,
  createInstance: (backend: MidiBackend = createWebMidiBackend()): IService<MidiState> => createMidiKernelService(backend),
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn) => {
    await defaultMidiService.start();
    return defaultMidiService.call<TIn, TOut>(operation, input);
  },
};

/** No implicit/fake network backend: applications must inject a real OSC transport. */
const unconfiguredOscTransport: OscTransport = {
  send: async () => { throw new Error('OSC transport is not configured; inject a runtime-specific OscTransport.'); },
  listen: async () => { throw new Error('OSC transport is not configured; inject a runtime-specific OscTransport.'); },
};
const defaultOscService = createOscKernelService(unconfiguredOscTransport);
export const OscServiceDefinition: ServiceDefinition = defaultOscService.getDefinition();
export const OscServiceFacade = {
  id: OscServiceDefinition.id,
  name: OscServiceDefinition.name,
  version: OscServiceDefinition.version,
  runtime: 'client' as const,
  deployment: 'local' as const,
  definition: OscServiceDefinition,
  createInstance: (transport: OscTransport = unconfiguredOscTransport): IService<OscState> => createOscKernelService(transport),
  execute: async <TIn = unknown, TOut = unknown>(operation: string, input?: TIn) => {
    await defaultOscService.start();
    return defaultOscService.call<TIn, TOut>(operation, input);
  },
};
