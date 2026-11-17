// ═══════════════════════════════════════════════════════════════════════════════
// OPEN SOUND CONTROL (OSC) MANAGER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

import { OscMessage, OscDevice, OscListener, OscDeviceListener, DEFAULT_OSC_DEVICES } from './types';
export * from './types';

export class OscManager {
  private listeners: Set<OscListener> = new Set();
  private addressListeners: Map<string, Set<OscListener>> = new Map();
  private deviceListeners: Set<OscDeviceListener> = new Set();

  public devices: OscDevice[] = [...DEFAULT_OSC_DEVICES];
  public lastMessage: OscMessage | null = null;
  public messageLog: OscMessage[] = [];
  public isLearning = false;
  private learningCallback: ((msg: OscMessage) => void) | null = null;

  public init(): void {}

  public receiveOscMessage(message: OscMessage): void {
    this.lastMessage = message;
    this.messageLog = [message, ...this.messageLog.slice(0, 49)];

    if (this.isLearning && this.learningCallback) {
      this.learningCallback(message);
      this.isLearning = false;
      this.learningCallback = null;
    }

    this.listeners.forEach((fn) => {
      try {
        fn(message);
      } catch (err) {
        console.error('Error in OSC listener:', err);
      }
    });

    this.addressListeners.forEach((listeners, pattern) => {
      if (this.matchesPattern(message.address, pattern)) {
        listeners.forEach((fn) => {
          try {
            fn(message);
          } catch (err) {
            console.error('Error in OSC pattern listener:', err);
          }
        });
      }
    });
  }

  /** @deprecated This is local in-memory event publication, not network OSC transmission. Use OscService for OSC client/server I/O. */
  public sendOscMessage(
    address: string,
    args: Array<number | string | boolean> = [],
    targetDeviceId?: string
  ): OscMessage {
    const formattedAddress = address.startsWith('/') ? address : `/${address}`;
    const msg: OscMessage = {
      address: formattedAddress,
      args,
      timestamp: Date.now(),
      sourceDeviceId: targetDeviceId || 'kloks-osc-engine',
      sourceDeviceName: 'OSC Control Engine',
    };

    this.receiveOscMessage(msg);
    return msg;
  }

  public startLearn(callback: (msg: OscMessage) => void): () => void {
    this.isLearning = true;
    this.learningCallback = callback;

    const timeout = setTimeout(() => {
      if (this.isLearning) {
        this.isLearning = false;
        this.learningCallback = null;
      }
    }, 15000);

    return () => {
      clearTimeout(timeout);
      this.isLearning = false;
      this.learningCallback = null;
    };
  }

  public addDevice(device: Omit<OscDevice, 'id'>): OscDevice {
    const newDevice: OscDevice = {
      ...device,
      id: `osc-dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'simulated',
      isCustom: true,
    };
    this.devices = [...this.devices, newDevice];
    this.notifyDeviceListeners();
    return newDevice;
  }

  public updateDevice(id: string, updates: Partial<OscDevice>): void {
    this.devices = this.devices.map((dev) => (dev.id === id ? { ...dev, ...updates } : dev));
    this.notifyDeviceListeners();
  }

  public removeDevice(id: string): void {
    this.devices = this.devices.filter((dev) => dev.id !== id);
    this.notifyDeviceListeners();
  }

  public toggleDevice(id: string): void {
    this.devices = this.devices.map((dev) =>
      dev.id === id
        ? {
            ...dev,
            enabled: !dev.enabled,
            status: !dev.enabled ? 'simulated' : 'disconnected',
          }
        : dev
    );
    this.notifyDeviceListeners();
  }

  public addListener(fn: OscListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public addAddressListener(pattern: string, fn: OscListener): () => void {
    if (!this.addressListeners.has(pattern)) {
      this.addressListeners.set(pattern, new Set());
    }
    this.addressListeners.get(pattern)!.add(fn);

    return () => {
      const set = this.addressListeners.get(pattern);
      if (set) {
        set.delete(fn);
        if (set.size === 0) {
          this.addressListeners.delete(pattern);
        }
      }
    };
  }

  public addDeviceListener(fn: OscDeviceListener): () => void {
    this.deviceListeners.add(fn);
    fn(this.devices);
    return () => this.deviceListeners.delete(fn);
  }

  private notifyDeviceListeners(): void {
    this.deviceListeners.forEach((fn) => fn(this.devices));
  }

  private matchesPattern(address: string, pattern: string): boolean {
    if (address === pattern) return true;
    if (pattern === '*' || pattern === '/*') return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return address.startsWith(prefix);
    }
    return false;
  }
}

export const oscManager = new OscManager();
