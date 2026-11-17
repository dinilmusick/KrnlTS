import { SpaceNode, ContainerNode, EffectNode } from '@kloks/state-graph';

/**
 * ============================================================================
 * Audio Graph Node Authority & Inheritance Hierarchy
 * ============================================================================
 *
 * STRICT ARCHITECTURAL INVARIANT:
 * No individual node in the graph (MIDI Instruments, Samplers, Audio Containers,
 * Synthesizers, Inputs, Effects) has direct access or authority to emit audio
 * directly into the application's master audio output (speakers / AudioContext.destination).
 *
 * Direct emission capability is structurally disabled (`canEmitDirectlyToMaster() === false`)
 * on the base class and all standard node subclasses.
 *
 * The ONLY class in this entire hierarchy permitted to emit to the hardware master output
 * is `MasterAudioOutputGraphNode`.
 *
 * For all other nodes, audio emission is STRUCTURALLY IMPOSSIBLE unless an active, unmuted,
 * valid graph path connects the node's output to an active `MasterAudioOutputGraphNode`.
 */

export abstract class BaseAudioGraphNode {
  public abstract readonly id: string;
  public abstract readonly nodeType: string;

  /**
   * Root capability flag.
   * By rule, base nodes CANNOT emit directly to the master output.
   */
  public canEmitDirectlyToMaster(): boolean {
    return false;
  }

  /**
   * Evaluates if this node is structurally authorized to emit audio.
   * Standard nodes must prove reachability to a MasterAudioOutputGraphNode
   * through the active graph connection topology.
   */
  public isAuthorizedToEmit(graphReachabilityChecker: (nodeId: string) => boolean): boolean {
    if (this.canEmitDirectlyToMaster()) {
      return true;
    }
    return graphReachabilityChecker(this.id);
  }
}

/**
 * Master Audio Output Graph Node (Output Strip)
 * The ONLY class in the graph authorized to emit directly to master hardware output.
 */
export class MasterAudioOutputGraphNode extends BaseAudioGraphNode {
  public readonly nodeType = 'output_strip';
  constructor(public readonly id: string, public active: boolean = true) {
    super();
  }
  public override canEmitDirectlyToMaster(): boolean {
    return this.active;
  }
}

/**
 * Base class for all audio source nodes (signal producers).
 */
export abstract class BaseSourceAudioGraphNode extends BaseAudioGraphNode {
  public readonly isSourceNode = true;
}

/**
 * MIDI Instrument VST Node (Plugin Nexus)
 * STRICT RULE: Cannot emit audio directly to master output without a connection to AudioOutputNode.
 */
export class MidiInstrumentGraphNode extends BaseSourceAudioGraphNode {
  public readonly nodeType = 'instrument';
  constructor(
    public readonly id: string,
    public readonly pluginId: string = 'grand_piano',
    public volume: number = 1.0
  ) {
    super();
  }
}

/**
 * Audio Container Node (Recorded / Sample Audio Clips)
 * STRICT RULE: Cannot emit audio directly to master output without a connection to AudioOutputNode.
 */
export class AudioContainerGraphNode extends BaseSourceAudioGraphNode {
  public readonly nodeType = 'audio';
  constructor(public readonly id: string, public readonly audioFormat: 'mono' | 'stereo' = 'mono') {
    super();
  }
}

/**
 * MIDI Synth Container Node
 * STRICT RULE: Cannot emit audio directly to master output without a connection to AudioOutputNode.
 */
export class MidiContainerGraphNode extends BaseSourceAudioGraphNode {
  public readonly nodeType = 'midi';
  constructor(public readonly id: string) {
    super();
  }
}

/**
 * Base class for all audio processor / DSP nodes (Effects, Combiners, Multiplexers, Converters).
 */
export abstract class BaseProcessorAudioGraphNode extends BaseAudioGraphNode {
  public readonly isProcessorNode = true;
}

/**
 * Effect DSP Node (Delay, Reverb, Repeater, Gain, etc.)
 */
export class EffectProcessorGraphNode extends BaseProcessorAudioGraphNode {
  public readonly nodeType = 'effect';
  constructor(
    public readonly id: string,
    public readonly effectType: string,
    public active: boolean = true
  ) {
    super();
  }
}

/**
 * Signal Router Node (Combiner / Multiplexer / Converter)
 */
export class SignalRouterGraphNode extends BaseProcessorAudioGraphNode {
  public readonly nodeType: 'combiner' | 'multiplexer' | 'converter';
  constructor(
    public readonly id: string,
    type: 'combiner' | 'multiplexer' | 'converter',
    public active: boolean = true
  ) {
    super();
    this.nodeType = type;
  }
}

/**
 * Factory to construct the corresponding strongly-typed graph node instance
 * for any generic SpaceNode.
 */
export function createAudioGraphNode(node: SpaceNode): BaseAudioGraphNode {
  switch (node.type) {
    case 'container': {
      const cont = node as ContainerNode;
      const cType = cont.containerType || 'midi';
      if (cType === 'instrument') {
        return new MidiInstrumentGraphNode(cont.id, cont.selectedPluginId, cont.volume);
      }
      if (cType === 'audio') {
        return new AudioContainerGraphNode(cont.id, cont.audioFormat);
      }
      return new MidiContainerGraphNode(cont.id);
    }
    case 'effect': {
      const eff = node as EffectNode;
      return new EffectProcessorGraphNode(eff.id, eff.effectType, eff.active !== false);
    }
    case 'combiner':
    case 'multiplexer':
    case 'converter': {
      return new SignalRouterGraphNode(node.id, node.type, (node as any).active !== false);
    }
    case 'output_strip': {
      return new MasterAudioOutputGraphNode(node.id, (node as any).active !== false);
    }
    default:
      if (node.id === 'output-strip-node') {
        return new MasterAudioOutputGraphNode(node.id, (node as any).active !== false);
      }
      return new (class GenericGraphNode extends BaseAudioGraphNode {
        public readonly id = node.id;
        public readonly nodeType = node.type;
      })();
  }
}
