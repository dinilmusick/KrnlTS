// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import React from 'react';
import { SpaceNode, ContainerNode, ModuleNode, TriggerNode, EffectNode } from '@floks/contracts';
import { NodeSocketDescriptor, NodeSocketsResult } from '@floks/contracts';
import { Node2DSpriteSetting } from '@floks/contracts';
import { Node2DBase } from './Node2DBase';

export interface NodeRenderer2DProps {
  node: SpaceNode;
  sprite: Node2DSpriteSetting;
  sockets: NodeSocketsResult;
  screenPos: { x: number; y: number };
  zoom: number;
  isSelected: boolean;
  isHovered: boolean;
  isPlaying?: boolean;
  onNodeMouseDown?: (e: React.MouseEvent) => void;
  onNodeDoubleClick?: (e: React.MouseEvent) => void;
  onNodeMouseEnter?: () => void;
  onNodeMouseLeave?: () => void;
  onSocketHover?: (info: { nodeId: string; socket: NodeSocketDescriptor; screenX: number; screenY: number } | null) => void;
  onSocketMouseDown?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
  onSocketMouseUp?: (nodeId: string, socket: NodeSocketDescriptor, e: React.MouseEvent) => void;
}

// ── 1. Specialized Trigger 2D ──
export const TriggerNode2D: React.FC<NodeRenderer2DProps> = (props) => {
  const trigNode = props.node as TriggerNode;
  const interval = trigNode.intervalBeats || 1;
  return (
    <Node2DBase
      {...props}
      extraHeaderBadge={
        <span className="text-[8px] bg-amber-950 border border-amber-500/50 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
          {interval} BEATS
        </span>
      }
    />
  );
};

// ── 2. Specialized Container 2D (Sampler, Instrument, Audio, Curve, MIDI) ──
export const ContainerNode2D: React.FC<NodeRenderer2DProps> = (props) => {
  const containerNode = props.node as ContainerNode;
  const cType = containerNode.containerType || 'midi';

  let badge = `${cType.toUpperCase()}`;
  if (cType === 'audio') {
    badge = containerNode.audioFormat === 'stereo' ? 'STEREO' : 'MONO';
  }

  return (
    <Node2DBase
      {...props}
      extraHeaderBadge={
        <span className="text-[8px] bg-sky-950 border border-sky-500/50 text-sky-300 px-1 py-0.2 rounded font-mono font-bold">
          {badge}
        </span>
      }
    />
  );
};

// ── 3. Specialized Module 2D ──
export const ModuleNode2D: React.FC<NodeRenderer2DProps> = (props) => {
  const modNode = props.node as ModuleNode;
  return (
    <Node2DBase
      {...props}
      extraHeaderBadge={
        <span className="text-[8px] bg-purple-950 border border-purple-600/60 text-purple-300 px-1 py-0.2 rounded font-bold">
          {modNode.innerNodes?.length || 0} NODES
        </span>
      }
    />
  );
};

// ── 4. Specialized Effect 2D ──
export const EffectNode2D: React.FC<NodeRenderer2DProps> = (props) => {
  const effectNode = props.node as EffectNode;
  let badgeText = `R: ${effectNode.radius || 6.0}m`;
  let badgeColor = 'bg-emerald-950 border-emerald-500/50 text-emerald-300';

  if (effectNode.effectType === 'compressor') {
    const sc = effectNode.compressorConfig?.sidechainEnabled ? ' • SC' : '';
    badgeText = `${effectNode.compressorConfig?.ratio ?? 4}:1${sc}`;
    badgeColor = 'bg-indigo-950 border-indigo-500/50 text-indigo-300';
  } else if (effectNode.effectType === 'multiband_compressor') {
    const sc = effectNode.multibandCompressorConfig?.sidechainEnabled ? ' • SC' : '';
    badgeText = `3-BAND${sc}`;
    badgeColor = 'bg-violet-950 border-violet-500/50 text-violet-300';
  } else if (effectNode.effectType === 'eq') {
    badgeText = '4-BAND EQ';
    badgeColor = 'bg-teal-950 border-teal-500/50 text-teal-300';
  } else if (effectNode.effectType === 'limiter') {
    badgeText = `CEIL: ${effectNode.limiterConfig?.ceiling ?? -0.1}dB`;
    badgeColor = 'bg-amber-950 border-amber-500/50 text-amber-300';
  } else if (effectNode.effectType === 'reverb') {
    badgeText = `${effectNode.reverbConfig?.decayTime ?? 2.5}s`;
    badgeColor = 'bg-purple-950 border-purple-500/50 text-purple-300';
  } else if (effectNode.effectType === 'delay') {
    badgeText = `${effectNode.delayConfig?.delayBeats ?? 0.5} B`;
    badgeColor = 'bg-blue-950 border-blue-500/50 text-blue-300';
  } else if (effectNode.effectType === 'saturation') {
    badgeText = (effectNode.saturationConfig?.saturationType || 'tape').toUpperCase();
    badgeColor = 'bg-rose-950 border-rose-500/50 text-rose-300';
  }

  return (
    <Node2DBase
      {...props}
      extraHeaderBadge={
        <span className={`text-[8px] ${badgeColor} border px-1 py-0.2 rounded font-mono font-bold uppercase`}>
          {badgeText}
        </span>
      }
    />
  );
};

// ── 5. Polymorphic 2D Node Renderer ──
export const NodeRenderer2D: React.FC<NodeRenderer2DProps> = (props) => {
  switch (props.node.type) {
    case 'trigger':
      return <TriggerNode2D {...props} />;
    case 'container':
      return <ContainerNode2D {...props} />;
    case 'module':
      return <ModuleNode2D {...props} />;
    case 'effect':
      return <EffectNode2D {...props} />;
    default:
      return <Node2DBase {...props} />;
  }
};
