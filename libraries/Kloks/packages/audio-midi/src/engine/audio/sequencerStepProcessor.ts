import { SpaceNode, NodeConnection, ContainerNode, INodeVisuals } from '@kloks/state-graph';
import { synthEngine } from './synthEngine';
import { curveEngine } from './curveEngine';
import { getActiveEffectsForNode } from '@kloks/state-graph';

export function playContainerNoteWithEffects(
  container: ContainerNode,
  note: any,
  nodes: SpaceNode[],
  connections: NodeConnection[],
  bpm: number,
  isPlaying: boolean,
  nodeVisuals: INodeVisuals | null
) {
  const activeEffects = getActiveEffectsForNode(container, nodes, connections);
  const delayEffect = activeEffects.find((e) => e.effectType === 'delay');
  const repeaterEffect = activeEffects.find((e) => e.effectType === 'repeater');
  const velocityEffect = activeEffects.find((e) => e.effectType === 'velocity');

  let initialVel = note.velocity ?? 0.8;
  if (velocityEffect?.velocityConfig && velocityEffect.active) {
    const cfg = velocityEffect.velocityConfig as any;
    const mult = cfg.scale !== undefined && cfg.scale !== 1.0 ? cfg.scale : (cfg.multiplier ?? 1.0);
    const offset = cfg.offset ?? 0;
    const randomize = cfg.randomize ?? 0;
    const jitter = randomize > 0 ? (Math.random() * 2 - 1) * (randomize / 127) : 0;
    initialVel = Math.max(0.01, Math.min(1.0, initialVel * mult + offset / 127 + jitter));
    nodeVisuals?.triggerNodeFlash(velocityEffect.id);
  }

  const processedNote = { ...note, velocity: initialVel };
  synthEngine.playNote(processedNote, container.synthPreset, 0, container.id);

  if (repeaterEffect?.repeaterConfig) {
    const { repeats, repeatIntervalBeats, decay } = repeaterEffect.repeaterConfig;
    const intervalMs = repeatIntervalBeats * (60 / bpm) * 1000;

    for (let r = 1; r <= repeats; r++) {
      setTimeout(() => {
        if (isPlaying) {
          const decayedVel = (processedNote.velocity || 0.8) * Math.pow(decay, r);
          synthEngine.playNote({ ...processedNote, velocity: decayedVel }, container.synthPreset, 0, container.id);
          nodeVisuals?.triggerNodeFlash(repeaterEffect.id);
        }
      }, r * intervalMs);
    }
  }

  if (delayEffect?.delayConfig) {
    const { delayBeats, feedback } = delayEffect.delayConfig;
    const delayMs = delayBeats * (60 / bpm) * 1000;
    if (feedback > 0.05) {
      setTimeout(() => {
        if (isPlaying) {
          const decayedVel = (processedNote.velocity || 0.8) * feedback;
          synthEngine.playNote({ ...processedNote, velocity: decayedVel }, container.synthPreset, 0, container.id);
          nodeVisuals?.triggerNodeFlash(delayEffect.id);
        }
      }, delayMs);
    }
  }
}

export function processActiveContainers(
  activeContainerPlayheads: Map<string, { startBeat: number; pausedOffset?: number }>,
  containerMap: Map<string, ContainerNode>,
  prevBeat: number,
  currBeat: number,
  nodes: SpaceNode[],
  connections: NodeConnection[],
  bpm: number,
  isPlaying: boolean,
  nodeVisuals: INodeVisuals | null
) {
  activeContainerPlayheads.forEach((playback, containerId) => {
    const container = containerMap.get(containerId);
    if (!container) return;

    const cType = container.containerType || 'midi';
    const patternLen =
      cType === 'audio'
        ? container.audioTrack?.durationBeats || 4
        : cType === 'curve'
        ? container.curveData?.lengthInBeats || 4
        : container.pattern?.lengthInBeats || 4;

    const elapsedBeats = currBeat - playback.startBeat;
    if (elapsedBeats >= patternLen && !container.isLooping) {
      activeContainerPlayheads.delete(containerId);
      container.isPlaying = false;
      container.pausedBeat = 0;
      return;
    }

    container.isPlaying = true;
    const currentPlayhead = (currBeat - playback.startBeat) % patternLen;
    container.playheadBeats = currentPlayhead;

    const patternBeatPrev = (prevBeat - playback.startBeat) % patternLen;
    const patternBeatCurr = currentPlayhead;

    if (cType === 'midi' && container.pattern?.notes) {
      container.pattern.notes.forEach((note) => {
        if (
          (patternBeatPrev <= note.time && patternBeatCurr >= note.time) ||
          (patternBeatCurr < patternBeatPrev && (note.time >= patternBeatPrev || note.time <= patternBeatCurr))
        ) {
          playContainerNoteWithEffects(container, note, nodes, connections, bpm, isPlaying, nodeVisuals);
          nodeVisuals?.triggerNodeFlash(container.id);
        }
      });
    } else if (cType === 'curve' && container.curveData) {
      const valNorm = curveEngine.evaluateCurve(container.curveData, patternBeatCurr);
      curveEngine.applyModulation(container.curveData, valNorm, nodes);
    }
  });
}
