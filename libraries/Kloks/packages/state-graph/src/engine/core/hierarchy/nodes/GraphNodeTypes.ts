// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import { GraphNodeParent } from './GraphNodeParent';
import {
  SpaceNode,
  TriggerNode,
  ContainerNode,
  CombinerNode,
  MultiplexerNode,
  EffectNode,
  ModuleNode,
  ConverterNode,
} from "../../../types/index.js";

// ── 1. Trigger Node Family ──
export class QwnsrTriggerNodeModel extends GraphNodeParent<TriggerNode> {
  constructor(node: TriggerNode) {
    super(node);
  }

  public trigger(timestamp?: number): void {
    this.emit('pulse_triggered', { timestamp: timestamp || Date.now() });
  }
}

// ── 2. Container Node Family (Sampler, Instrument, Audio, Curve, MIDI) ──
export class QwnsrContainerNodeModel extends GraphNodeParent<ContainerNode> {
  constructor(node: ContainerNode) {
    super(node);
  }

  public getContainerType(): string {
    return this.rawNode.containerType || 'midi';
  }

  public trigger(timestamp?: number): void {
    this.emit('container_playback_triggered', {
      type: this.getContainerType(),
      timestamp: timestamp || Date.now(),
    });
  }
}

// ── 3. Audio In & Out Family ──
// ── 3. Combiner & Multiplexer Routing Family ──
export class QwnsrCombinerNodeModel extends GraphNodeParent<CombinerNode> {
  constructor(node: CombinerNode) {
    super(node);
  }

  public trigger(): void {
    this.emit('combiner_sum_evaluated');
  }
}

export class QwnsrMultiplexerNodeModel extends GraphNodeParent<MultiplexerNode> {
  constructor(node: MultiplexerNode) {
    super(node);
  }

  public trigger(): void {
    this.emit('multiplexer_routed');
  }
}

// ── 6. Effect Node Family (AoE Field) ──
export class QwnsrEffectNodeModel extends GraphNodeParent<EffectNode> {
  constructor(node: EffectNode) {
    super(node);
  }

  public trigger(): void {
    this.emit('effect_field_pulsed', { radius: this.rawNode.radius });
  }
}

// ── 7. Module Node Family (Sub-Graph Nesting) ──
export class QwnsrModuleNodeModel extends GraphNodeParent<ModuleNode> {
  constructor(node: ModuleNode) {
    super(node);
  }

  public trigger(): void {
    this.emit('module_subgraph_evaluated');
  }
}

// ── 8. Converter & Generic Node Family ──
export class QwnsrGenericNodeModel extends GraphNodeParent<SpaceNode> {
  constructor(node: SpaceNode) {
    super(node);
  }

  public trigger(): void {
    this.emit('generic_node_triggered');
  }
}

/**
 * Polymorphic Factory: Returns the strongly typed QwnsrNode instance.
 */
export function createQwnsrNodeInstance(node: SpaceNode): GraphNodeParent {
  switch (node.type) {
    case 'trigger':
      return new QwnsrTriggerNodeModel(node as TriggerNode);
    case 'container':
      return new QwnsrContainerNodeModel(node as ContainerNode);
    case 'combiner':
      return new QwnsrCombinerNodeModel(node as CombinerNode);
    case 'multiplexer':
      return new QwnsrMultiplexerNodeModel(node as MultiplexerNode);
    case 'effect':
      return new QwnsrEffectNodeModel(node as EffectNode);
    case 'module':
      return new QwnsrModuleNodeModel(node as ModuleNode);
    default:
      return new QwnsrGenericNodeModel(node);
  }
}

// ── Standard Node Parent Archetypes ──
export class DataProcessingNodeParent<T extends SpaceNode = SpaceNode> extends GraphNodeParent<T> {
  public trigger(timestamp?: number): void {
    this.emit('data_processed', { timestamp: timestamp || Date.now() });
  }
}

export class SignalGeneratorNodeParent<T extends SpaceNode = SpaceNode> extends GraphNodeParent<T> {
  public trigger(timestamp?: number): void {
    this.emit('signal_generated', { timestamp: timestamp || Date.now() });
  }
}

export class RoutingNodeParent<T extends SpaceNode = SpaceNode> extends GraphNodeParent<T> {
  public trigger(timestamp?: number): void {
    this.emit('routing_evaluated', { timestamp: timestamp || Date.now() });
  }
}

export class ControlNodeParent<T extends SpaceNode = SpaceNode> extends GraphNodeParent<T> {
  public trigger(timestamp?: number): void {
    this.emit('control_dispatched', { timestamp: timestamp || Date.now() });
  }
}

// ── Standard Node Archetype Models ──
export class TriggerNodeModel extends QwnsrTriggerNodeModel {}
export class ContainerNodeModel extends QwnsrContainerNodeModel {}
export class ModuleNodeModel extends QwnsrModuleNodeModel {}
export class EffectNodeModel extends QwnsrEffectNodeModel {}

export class CodeNodeModel extends DataProcessingNodeParent {
  public trigger(timestamp?: number): void {
    this.emit('code_executed', { timestamp: timestamp || Date.now() });
  }
}

export class ArrangementNodeModel extends ControlNodeParent {
  public trigger(timestamp?: number): void {
    this.emit('arrangement_clock_pulsed', { timestamp: timestamp || Date.now() });
  }
}

export class RouterNodeModel extends RoutingNodeParent {}
export class StripNodeModel extends ControlNodeParent {}
export class ControlNodeModel extends ControlNodeParent {}
export class PrimitiveNodeModel extends QwnsrGenericNodeModel {}
export class GroupNodeModel extends ModuleNodeModel {}

export function createNodeInstance(node: SpaceNode): GraphNodeParent {
  switch (node.type) {
    case 'trigger':
      return new TriggerNodeModel(node as TriggerNode);
    case 'container':
      return new ContainerNodeModel(node as ContainerNode);
    case 'effect':
      return new EffectNodeModel(node as EffectNode);
    case 'module':
      return new ModuleNodeModel(node as ModuleNode);
    case 'code':
      return new CodeNodeModel(node);
    case 'arrangement':
      return new ArrangementNodeModel(node);
    case 'multiplexer':
    case 'combiner':
      return new RouterNodeModel(node);
    case 'input_strip':
    case 'output_strip':
      return new StripNodeModel(node);
    case 'group':
      return new GroupNodeModel(node as ModuleNode);
    default:
      return new PrimitiveNodeModel(node);
  }
}

export interface NodeDimensions2D {
  width: number;
  height: number;
}

export interface NodeScreenRect2D {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface NodeHeaderStyle {
  background?: string;
  color?: string;
  accentColor?: string;
  borderBottom?: string;
}

