// ═══════════════════════════════════════════════════════════════════════════════
// OPEN SOUND CONTROL (OSC) TYPE DEFINITIONS & DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface OscMessage {
  address: string;
  args: Array<number | string | boolean>;
  timestamp: number;
  sourceDeviceId?: string;
  sourceDeviceName?: string;
}

export type OscDeviceType =
  | 'network_udp'
  | 'websocket_bridge'
  | 'touchosc'
  | 'lemur'
  | 'max_msp'
  | 'puredata'
  | 'supercollider'
  | 'vrchat';

export interface OscDevice {
  id: string;
  name: string;
  type: OscDeviceType;
  host: string;
  port: number;
  status: 'connected' | 'listening' | 'disconnected' | 'simulated';
  enabled: boolean;
  isCustom?: boolean;
}

export type OscListener = (message: OscMessage) => void;
export type OscDeviceListener = (devices: OscDevice[]) => void;

export const DEFAULT_OSC_DEVICES: OscDevice[] = [];
