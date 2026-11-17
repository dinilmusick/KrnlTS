// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { GraphEntityParent } from '../core/GraphEntityParent';
import { SignalType, SIGNAL_TYPES } from '../../../functions/canonicalSignalTable';

export type SocketDirection = 'in' | 'out';

export interface GraphSocketDescriptor {
  portId: string;
  label: string;
  signalType: SignalType;
  socketIndex: number;
  direction: SocketDirection;
  description: string;
  maxConnections?: number;
}
export type QwnsrSocketDescriptor = GraphSocketDescriptor;


/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. GraphSocketParent: Base Model for All Sockets
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * Represents the fundamental mechanism of any input receptor or output transmitter.
 */
export abstract class GraphSocketParent extends GraphEntityParent {
  public readonly portId: string;
  public readonly direction: SocketDirection;
  public readonly signalType: SignalType;
  public readonly socketIndex: number;
  public label: string;
  public description: string;
  public maxConnections: number;
  public connectedWireIds: Set<string>;

  constructor(descriptor: QwnsrSocketDescriptor) {
    super(
      `socket-${descriptor.direction}-${descriptor.portId}-${descriptor.socketIndex}`,
      descriptor.label,
      'socket',
      { description: descriptor.description }
    );
    this.portId = descriptor.portId;
    this.direction = descriptor.direction;
    this.signalType = descriptor.signalType;
    this.socketIndex = descriptor.socketIndex;
    this.label = descriptor.label;
    this.description = descriptor.description;
    this.maxConnections = descriptor.maxConnections || (descriptor.direction === 'in' ? 1 : 16);
    this.connectedWireIds = new Set();
  }

  public initialize(): void {
    this.emit('socket_initialized', { portId: this.portId, direction: this.direction });
  }

  public dispose(): void {
    this.connectedWireIds.clear();
    this.emit('socket_disposed');
  }

  // ── Compatibility Rules ──
  public isCompatibleWith(other: GraphSocketParent): boolean {
    // Sockets must be opposite directions (in -> out or out -> in)
    if (this.direction === other.direction) return false;
    
    const outSock = this.direction === 'out' ? this : other;
    const inSock = this.direction === 'in' ? this : other;

    // Component connections require component signal
    if (outSock.signalType === 'component' || inSock.signalType === 'component') {
      return outSock.signalType === 'component' && inSock.signalType === 'component';
    }

    // Direct match
    if (outSock.signalType === inSock.signalType) return true;

    // Strict audio format matching: Stereo cannot connect to Mono, Mono cannot connect to Stereo
    const isOutAudio = outSock.signalType === 'audio_stereo' || outSock.signalType === 'audio_mono' || outSock.signalType === 'audio';
    const isInAudio = inSock.signalType === 'audio_stereo' || inSock.signalType === 'audio_mono' || inSock.signalType === 'audio';
    if (isOutAudio || isInAudio) {
      return outSock.signalType === inSock.signalType;
    }

    return false;
  }

  public getColor(): string {
    return SIGNAL_TYPES[this.signalType]?.colorStr || '#38bdf8';
  }

  public getHexColor(): number {
    return SIGNAL_TYPES[this.signalType]?.colorHex || 0x38bdf8;
  }

  public getTooltip(): string {
    const dir = this.direction === 'in' ? 'INPUT RECEPTOR' : 'OUTPUT TRANSMITTER';
    return `[${dir}] ${this.label} (${SIGNAL_TYPES[this.signalType]?.name || this.signalType}) - ${this.description}`;
  }

  public connectWire(wireId: string): boolean {
    if (this.connectedWireIds.size >= this.maxConnections) {
      return false;
    }
    this.connectedWireIds.add(wireId);
    this.emit('wire_connected', wireId);
    return true;
  }

  public disconnectWire(wireId: string): void {
    if (this.connectedWireIds.has(wireId)) {
      this.connectedWireIds.delete(wireId);
      this.emit('wire_disconnected', wireId);
    }
  }

  public isConnected(): boolean {
    return this.connectedWireIds.size > 0;
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      portId: this.portId,
      direction: this.direction,
      signalType: this.signalType,
      socketIndex: this.socketIndex,
      label: this.label,
      description: this.description,
      connectedWires: Array.from(this.connectedWireIds),
    };
  }
}
