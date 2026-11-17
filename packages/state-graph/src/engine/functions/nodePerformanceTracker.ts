import { SpaceNode, NodeConnection, ContainerNode, TriggerNode, EffectNode } from "../types/index.js";

let configuredPerfEngines: {
  synthEngine?: any;
  sequencerEngine?: any;
  midiManager?: any;
  oscManager?: any;
  audioClipEngine?: any;
} = {};

export function configureNodePerformanceTracker(engines: {
  synthEngine?: any;
  sequencerEngine?: any;
  midiManager?: any;
  oscManager?: any;
  audioClipEngine?: any;
}): void {
  configuredPerfEngines = { ...configuredPerfEngines, ...engines };
  if (engines.synthEngine) {
    (globalThis as any).__KLOKS_SYNTH_ENGINE__ = engines.synthEngine;
    (globalThis as any).__QWNSR_SYNTH_ENGINE__ = engines.synthEngine;
  }
}

const synthEngine: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const globalEngine =
        configuredPerfEngines.synthEngine ||
        (globalThis as any).__KLOKS_SYNTH_ENGINE__ ||
        (globalThis as any).__QWNSR_SYNTH_ENGINE__;
      if (globalEngine && typeof globalEngine[prop] === 'function') {
        return globalEngine[prop].bind(globalEngine);
      }
      return () => true;
    },
  }
);

export interface NodePerformanceData {
  nodeId: string;
  loadPercentage: number; // 0 - 100
  isMaxNode: boolean;
  voiceCount: number;
  dspStatus: 'IDLE' | 'ACTIVE' | 'HIGH' | 'PEAK' | 'OFFLINE';
  detailLabel: string;
}

// Internal cache for smoothed load values to give smooth needle movement
const smoothedLoads: Map<string, number> = new Map();

export function calculateNodePerformance(
  nodes: SpaceNode[],
  connections: NodeConnection[],
  isPlaying: boolean,
  bpm: number
): { metrics: Map<string, NodePerformanceData>; maxNodeId: string | null; totalDspload: number } {
  const metrics = new Map<string, NodePerformanceData>();
  let maxLoad = -1;
  let maxNodeId: string | null = null;
  let totalDspload = 0;

  // Pre-calculate outgoing connections map
  const outgoingMap = new Map<string, number>();
  connections.forEach((c) => {
    outgoingMap.set(c.fromNodeId, (outgoingMap.get(c.fromNodeId) || 0) + 1);
  });

  const now = performance.now() * 0.001;

  nodes.forEach((node) => {
    let rawLoad = 0;
    let voiceCount = 0;
    let detailLabel = '0% DSP';
    let dspStatus: NodePerformanceData['dspStatus'] = 'IDLE';

    const isActive = (node as any).active !== false && !(node as any).isMuted;

    if (!isActive) {
      rawLoad = 0;
      dspStatus = 'OFFLINE';
      detailLabel = 'MUTED / OFF';
    } else {
      // Check if node is connected to output
      const isConnected = synthEngine.isNodeConnectedToOutput(node.id);

      if (node.type === 'container') {
        const cNode = node as ContainerNode;
        if (!isConnected) {
          rawLoad = 1.0;
          detailLabel = 'NO OUTPUT';
          dspStatus = 'IDLE';
        } else {
          // Base DSP load from synth preset or audio track
          const cType = cNode.containerType || 'midi';
          if (cType === 'midi') {
            const noteCount = cNode.pattern?.notes.length || 0;
            const synthType = cNode.synthPreset?.synthType || 'poly';
            const baseTypeLoad = synthType === 'drums' ? 22 : synthType === 'lead' ? 18 : synthType === 'bass' ? 14 : 15;
            
            // Active effects load
            let fxLoad = 0;
            if (cNode.synthPreset?.reverb && cNode.synthPreset.reverb > 0.05) fxLoad += 12;
            if (cNode.synthPreset?.delay && cNode.synthPreset.delay > 0.05) fxLoad += 10;
            if (cNode.synthPreset?.cutoff && cNode.synthPreset.cutoff < 14000) fxLoad += 6;

            voiceCount = Math.min(16, Math.max(1, Math.ceil(noteCount * 0.4)));
            rawLoad = baseTypeLoad + fxLoad + voiceCount * 3.5;

            if (isPlaying) {
              // Add playback activity wobble / rhythm pulse
              const pulse = (Math.sin(now * (bpm / 60) * Math.PI * 2 + node.position[0]) + 1) * 0.5;
              rawLoad += pulse * 18;
            }
          } else if (cType === 'audio') {
            const track = cNode.audioTrack;
            voiceCount = track ? 1 : 0;
            rawLoad = track ? 24 : 5;
            if (isPlaying) {
              const pulse = (Math.cos(now * 8 + node.position[2]) + 1) * 0.5;
              rawLoad += pulse * 22;
            }
          } else if (cType === 'curve') {
            rawLoad = 12 + (isPlaying ? Math.sin(now * 5) * 8 : 0);
          }
        }
      } else if (node.type === 'trigger') {
        const tNode = node as TriggerNode;
        const interval = tNode.intervalBeats || 1;
        const divisions = tNode.divisionsPerBeat || 1;
        const rateFactor = divisions > 4 ? 28 : divisions > 1 ? 18 : interval < 0.5 ? 22 : 10;

        const outgoingCount = outgoingMap.get(node.id) || 0;
        rawLoad = rateFactor + outgoingCount * 6;
        if (isPlaying) {
          const tick = (Math.sin(now * (bpm / 30)) + 1) * 0.5;
          rawLoad += tick * 15;
        }
      } else if (node.type === 'effect') {
        const eNode = node as EffectNode;
        const eType = eNode.effectType;
        const base = eType === 'repeater' ? 22 : 26;
        rawLoad = base;
        if (isPlaying) {
          rawLoad += (Math.sin(now * 4 + node.position[0]) + 1) * 10;
        }
      }
    }

    // Cap between 0 and 98
    rawLoad = Math.min(98, Math.max(0, rawLoad));

    // Smooth load transitions
    const prev = smoothedLoads.get(node.id) || rawLoad;
    const smoothed = prev + (rawLoad - prev) * 0.15;
    smoothedLoads.set(node.id, smoothed);

    const finalLoad = Math.round(smoothed);

    if (dspStatus !== 'OFFLINE') {
      if (finalLoad > 75) dspStatus = 'PEAK';
      else if (finalLoad > 45) dspStatus = 'HIGH';
      else if (finalLoad > 10) dspStatus = 'ACTIVE';
      else dspStatus = 'IDLE';
    }

    detailLabel = `${finalLoad}% DSP`;

    if (finalLoad > maxLoad && dspStatus !== 'OFFLINE') {
      maxLoad = finalLoad;
      maxNodeId = node.id;
    }

    totalDspload += finalLoad;

    metrics.set(node.id, {
      nodeId: node.id,
      loadPercentage: finalLoad,
      isMaxNode: false,
      voiceCount,
      dspStatus,
      detailLabel,
    });
  });

  // Mark the maximum processing node
  if (maxNodeId && metrics.has(maxNodeId)) {
    const item = metrics.get(maxNodeId)!;
    if (item.loadPercentage > 5) {
      item.isMaxNode = true;
    }
  }

  return { metrics, maxNodeId, totalDspload };
}
