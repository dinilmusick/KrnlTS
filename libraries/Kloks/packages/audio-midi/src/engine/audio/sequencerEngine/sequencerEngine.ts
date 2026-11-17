

import { SpaceNode, NodeConnection, ContainerNode, TriggerNode, ModuleNode, PlayerNode, RecorderNode, CodeNode, TriggerPulse, INodeVisuals } from '@kloks/state-graph';
import { synthEngine } from '../synthEngine';
import { audioClipEngine } from '../audioClipEngine';
import { retrospectiveBufferEngine } from '../retrospectiveBufferEngine';
import { shouldTriggerFireAtClock } from '@kloks/state-graph';
import { getEffectsAffectingWire } from '@kloks/state-graph';
import { getActiveEffectsForNode } from '@kloks/state-graph';
import { playContainerNoteWithEffects, processActiveContainers } from '../sequencerStepProcessor';
import { calculateNextQuantizeBeat } from '@kloks/state-graph';
import { executeCodeNodeScript } from '@kloks/state-graph';

export class SequencerEngine {
  public bpm = 120;
  public isPlaying = false;
  public currentBeat = 0;
  private timerId: number | null = null;
  private lastTickTime = 0;
  public nodeVisuals: INodeVisuals | null = null;

  private activeContainerPlayheads: Map<string, { startBeat: number; pausedOffset?: number }> = new Map();
  public nodes: SpaceNode[] = [];
  public connections: NodeConnection[] = [];

  public syncNodesAndConnections(nodes: SpaceNode[], connections: NodeConnection[]) {
    this.nodes = nodes;
    this.connections = connections;
  }

  public start(
    nodes: SpaceNode[],
    connections: NodeConnection[],
    onTriggerFired?: (triggerId: string, targetContainerIds: string[]) => void
  ) {
    this.nodes = nodes;
    this.connections = connections;
    if (this.isPlaying) return;
    this.isPlaying = true;
    synthEngine.init();
    this.lastTickTime = performance.now();

    const tick = () => {
      if (!this.isPlaying) return;
      const now = performance.now();
      const deltaSec = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      const beatsPerSec = this.bpm / 60;
      const prevBeat = this.currentBeat;
      this.currentBeat += deltaSec * beatsPerSec;

      this.processStep(prevBeat, this.currentBeat, this.nodes, this.connections, onTriggerFired);
      this.timerId = requestAnimationFrame(tick);
    };

    this.timerId = requestAnimationFrame(tick);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
    this.activeContainerPlayheads.clear();
  }

  private processStep(
    prevBeat: number,
    currBeat: number,
    nodes: SpaceNode[],
    connections: NodeConnection[],
    onTriggerFired?: (triggerId: string, targetContainerIds: string[]) => void
  ) {
    // 1. Collect top-level triggers and containers
    const allTriggers: TriggerNode[] = nodes.filter((n): n is TriggerNode => n.type === 'trigger' && n.active);
    const allContainers: ContainerNode[] = nodes.filter((n): n is ContainerNode => n.type === 'container');
    const allWires: NodeConnection[] = [...connections];

    // 2. Unpack active nested ModuleNodes
    const moduleNodes = nodes.filter((n): n is ModuleNode => n.type === 'module' && (n.active !== false));
    moduleNodes.forEach((mod) => {
      if (mod.innerNodes) {
        mod.innerNodes.forEach((inner) => {
          if ((inner as any).active !== false) {
            if (inner.type === 'trigger') allTriggers.push(inner as TriggerNode);
            if (inner.type === 'container') allContainers.push(inner as ContainerNode);
          }
        });
      }
      if (mod.innerConnections) {
        allWires.push(...mod.innerConnections);
      }
    });

    const containerMap = new Map(allContainers.map((c) => [c.id, c]));
    const moduleMap = new Map(moduleNodes.map((m) => [m.id, m]));

    // 3. Process Clocks and Step Sequencers
    allTriggers.forEach((trig) => {
      if ((trig.triggerType === 'beats' || trig.triggerType === 'beat_fractions' || (trig.triggerType as any) === 'clock' || !trig.triggerType) && shouldTriggerFireAtClock(trig, prevBeat, currBeat)) {
        this.processTriggerWiresWithEffects(trig, allWires, containerMap, moduleMap, onTriggerFired);
      }
    });

    // 4. Process Active Containers (top-level + inner)
    processActiveContainers(
      this.activeContainerPlayheads,
      containerMap,
      prevBeat,
      currBeat,
      [...nodes, ...moduleNodes.flatMap((m) => m.innerNodes || [])],
      allWires,
      this.bpm,
      this.isPlaying,
      this.nodeVisuals
    );

    // 5. Process Quantized Pending Triggers for Players and Recorders
    nodes.forEach((node) => {
      if (node.type === 'player') {
        const ply = node as PlayerNode;
        if (ply.pendingTriggerBeat != null && currBeat >= ply.pendingTriggerBeat) {
          if (ply.pendingAction === 'start_play') {
            const packetConn = allWires.find(
              (c) => c.toNodeId === ply.id && (c.toPort === 'packet_in' || c.toSocketIndex === 0)
            );
            const sourceContainer = packetConn ? containerMap.get(packetConn.fromNodeId) : null;
            this.handlePlayerStart(ply, sourceContainer);
            ply.isPlaying = true;
            ply.quantizeStatus = 'playing';
            ply.playbackStartBeat = currBeat;
            ply.pendingTriggerBeat = null;
            ply.pendingAction = null;
          } else if (ply.pendingAction === 'stop_play') {
            this.handlePlayerStop(ply);
            ply.isPlaying = false;
            ply.quantizeStatus = 'idle';
            ply.pendingTriggerBeat = null;
            ply.pendingAction = null;
          }
        }
      } else if (node.type === 'recorder') {
        const rec = node as RecorderNode;
        if (rec.pendingTriggerBeat != null && currBeat >= rec.pendingTriggerBeat) {
          if (rec.pendingAction === 'start_record') {
            audioClipEngine.startRecording(rec, currBeat);
          } else if (rec.pendingAction === 'stop_record') {
            const storeConns = allWires.filter(
              (c) => c.fromNodeId === rec.id && (c.fromPort === 'packet_out' || c.fromPort === 'store' || c.fromSocketIndex === 0)
            );
            const targetContainers = storeConns.map((c) => containerMap.get(c.toNodeId)).filter(Boolean) as ContainerNode[];
            audioClipEngine.stopRecordingToContainer(rec, targetContainers.length > 0 ? targetContainers : null);
            targetContainers.forEach((tc) => this.nodeVisuals?.triggerNodeFlash(tc.id));
          }
        }
      }
    });
  }

  private processTriggerWiresWithEffects(
    trig: SpaceNode,
    connections: NodeConnection[],
    containerMap: Map<string, ContainerNode>,
    moduleMap: Map<string, ModuleNode>,
    onTriggerFired?: (triggerId: string, targetContainerIds: string[]) => void,
    isManual = false
  ) {
    this.nodeVisuals?.triggerNodeFlash(trig.id);
    const targetIds: string[] = [];

    const beatsPerBar = 4;
    const bar = Math.floor(this.currentBeat / beatsPerBar);
    const beatWithinBar = Math.floor(this.currentBeat % beatsPerBar);
    const fraction = Math.round((this.currentBeat - Math.floor(this.currentBeat)) * 16) / 16;

    const initialPulse: TriggerPulse = {
      id: `pulse-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      bar,
      beat: beatWithinBar,
      beatFraction: fraction,
      codePayload: '',
      intensity: 1.0,
      duration: 0.25,
      payloadData: {},
    };

    const propagate = (
      sourceNodeId: string,
      sourcePosition: [number, number, number],
      accumulatedDelayMs: number,
      visitedConns: Set<string>,
      currentPulse: TriggerPulse
    ) => {
      const outgoing = connections.filter((c) => c.fromNodeId === sourceNodeId);

      outgoing.forEach((conn) => {
        if (visitedConns.has(conn.id)) return;
        const newVisited = new Set(visitedConns);
        newVisited.add(conn.id);

        const destNode = this.nodes.find((n) => n.id === conn.toNodeId);
        if (!destNode) return;

        const destPosition = destNode.position;

        const wireEffects = getEffectsAffectingWire(conn, this.nodes);
        const delayEffect = wireEffects.find((e) => e.effectType === 'delay');
        const repeaterEffect = wireEffects.find((e) => e.effectType === 'repeater');

        const segmentDelayMs = delayEffect?.delayConfig
          ? delayEffect.delayConfig.delayBeats * (60 / this.bpm) * 1000
          : 0;

        const repeats = repeaterEffect?.repeaterConfig?.repeats ?? 0;
        const repeatIntervalBeats = repeaterEffect?.repeaterConfig?.repeatIntervalBeats ?? 0.25;
        const intervalMs = repeatIntervalBeats * (60 / this.bpm) * 1000;

        for (let r = 0; r <= repeats; r++) {
          const repeatDelayMs = r * intervalMs;
          const totalDelayMs = accumulatedDelayMs + segmentDelayMs + repeatDelayMs;

          setTimeout(() => {
            if (!this.isPlaying && !isManual) return;

            if (sourcePosition && destPosition) {
              this.nodeVisuals?.spawnLaserPulse(sourcePosition, destPosition, undefined, conn.id);
            }

            if (delayEffect) this.nodeVisuals?.triggerNodeFlash(delayEffect.id);
            if (repeaterEffect && r > 0) this.nodeVisuals?.triggerNodeFlash(repeaterEffect.id);

            if (destNode.type === 'container') {
              const target = destNode as ContainerNode;
              targetIds.push(target.id);

              if (target.containerType === 'instrument') {
                const pitchOffset =
                  typeof currentPulse?.payloadData?.pitchOffset === 'number'
                    ? currentPulse.payloadData.pitchOffset
                    : typeof currentPulse?.payloadData?.noteOffset === 'number'
                    ? currentPulse.payloadData.noteOffset
                    : 0;
                const triggerNoteNum = (target.triggerNote ?? 60) + pitchOffset;
                const velocity = Math.max(
                  0.05,
                  Math.min(1.0, 0.85 * (currentPulse?.intensity ?? 1.0))
                );
                const duration = Math.max(0.05, currentPulse?.duration ?? 0.4);

                synthEngine.playNote(
                  { note: triggerNoteNum, name: '', velocity, time: 0, duration },
                  target.synthPreset || { synthType: 'poly', attack: 0.05, decay: 0.4, sustain: 0.5, release: 0.8, cutoff: 3000, resonance: 2, reverb: 0.4, delay: 0.3 },
                  0,
                  target.id
                );
                this.nodeVisuals?.triggerNodeFlash(target.id);
              } else {
                const toPort = conn.toPort || 'play_stop';
                if (toPort === 'record') {
                  target.isRecording = !target.isRecording;
                  this.nodeVisuals?.triggerNodeFlash(target.id);
                } else if (toPort === 'play_pause') {
                  this.handleContainerPlayPause(target);
                } else {
                  this.handleContainerPlayStop(target);
                }
              }
            } else if (destNode.type === 'module') {
              const targetMod = destNode as ModuleNode;
              targetIds.push(targetMod.id);
              this.nodeVisuals?.triggerNodeFlash(targetMod.id);

              const socketIdx = conn.toSocketIndex ?? 0;
              const mapping = targetMod.exposedInputs?.find((ei) => ei.moduleSocketIndex === socketIdx) || targetMod.exposedInputs?.[0];
              if (mapping) {
                const innerContainer = containerMap.get(mapping.innerNodeId);
                if (innerContainer) {
                   if (innerContainer.containerType === 'instrument') {
                     const triggerNoteNum = innerContainer.triggerNote ?? 60;
                     synthEngine.playNote(
                       { note: triggerNoteNum, name: '', velocity: 0.85, time: 0, duration: 0.4 },
                       innerContainer.synthPreset || { synthType: 'poly', attack: 0.05, decay: 0.4, sustain: 0.5, release: 0.8, cutoff: 3000, resonance: 2, reverb: 0.4, delay: 0.3 },
                       0,
                       innerContainer.id
                     );
                     this.nodeVisuals?.triggerNodeFlash(innerContainer.id);
                   } else {
                     const toPort = mapping.innerPortId || 'play_stop';
                     if (toPort === 'record') {
                       innerContainer.isRecording = !innerContainer.isRecording;
                       this.nodeVisuals?.triggerNodeFlash(innerContainer.id);
                     } else if (toPort === 'play_pause') {
                       this.handleContainerPlayPause(innerContainer);
                     } else {
                       this.handleContainerPlayStop(innerContainer);
                     }
                   }
                }
              }
            } else if (destNode.type === 'player') {
              const targetPlayer = destNode as PlayerNode;
              targetIds.push(targetPlayer.id);
              this.nodeVisuals?.triggerNodeFlash(targetPlayer.id);

              if (targetPlayer.quantizeEnabled !== false && (targetPlayer.quantizeDivision || '1_bar') !== 'none') {
                const nextBeat = calculateNextQuantizeBeat(this.currentBeat, targetPlayer.quantizeDivision || '1_bar');
                if (targetPlayer.isPlaying) {
                  targetPlayer.quantizeStatus = 'stopping_waiting';
                  targetPlayer.pendingTriggerBeat = nextBeat;
                  targetPlayer.pendingAction = 'stop_play';
                } else {
                  targetPlayer.quantizeStatus = 'armed_waiting';
                  targetPlayer.pendingTriggerBeat = nextBeat;
                  targetPlayer.pendingAction = 'start_play';
                }
              } else {
                if (targetPlayer.isPlaying) {
                  this.handlePlayerStop(targetPlayer);
                  targetPlayer.isPlaying = false;
                  targetPlayer.quantizeStatus = 'idle';
                } else {
                  const packetConn = connections.find(
                    (c) => c.toNodeId === targetPlayer.id && (c.toPort === 'packet_in' || c.toSocketIndex === 0)
                  );
                  const sourceContainer = packetConn ? containerMap.get(packetConn.fromNodeId) : null;
                  this.handlePlayerStart(targetPlayer, sourceContainer);
                  targetPlayer.isPlaying = true;
                  targetPlayer.quantizeStatus = 'playing';
                  targetPlayer.playbackStartBeat = this.currentBeat;
                }
              }
            } else if (destNode.type === 'recorder') {
              const targetRec = destNode as RecorderNode;
              targetIds.push(targetRec.id);
              this.nodeVisuals?.triggerNodeFlash(targetRec.id);

              const toPort = conn.toPort || (conn.toSocketIndex === 1 ? 'arm_in' : 'trigger_in');

              if (toPort === 'arm_in' || conn.toSocketIndex === 1) {
                targetRec.isArmed = !targetRec.isArmed;
              } else if (targetRec.recordingMode === 'retrospective') {
                const storeConns = connections.filter(
                  (c) => c.fromNodeId === targetRec.id && (c.fromPort === 'packet_out' || c.fromPort === 'store' || c.fromSocketIndex === 0)
                );
                const targetContainers = storeConns.map((c) => containerMap.get(c.toNodeId)).filter(Boolean) as ContainerNode[];
                retrospectiveBufferEngine.captureSnapshot(
                  targetRec,
                  targetContainers.length > 0 ? targetContainers : null,
                  this.currentBeat,
                  this.bpm,
                  (updatedRec) => {
                    Object.assign(targetRec, updatedRec);
                  },
                  (updatedCont) => {
                    const found = targetContainers.find((tc) => tc.id === updatedCont.id);
                    if (found) {
                      Object.assign(found, updatedCont);
                      this.nodeVisuals?.triggerNodeFlash(found.id);
                    }
                  }
                );
                targetContainers.forEach((tc) => this.nodeVisuals?.triggerNodeFlash(tc.id));
              } else if (targetRec.quantizeEnabled !== false && (targetRec.quantizeDivision || '1_bar') !== 'none') {
                const nextBeat = calculateNextQuantizeBeat(this.currentBeat, targetRec.quantizeDivision || '1_bar');
                if (targetRec.isRecording) {
                  targetRec.quantizeStatus = 'stopping_waiting';
                  targetRec.pendingTriggerBeat = nextBeat;
                  targetRec.pendingAction = 'stop_record';
                } else {
                  targetRec.isArmed = true;
                  targetRec.quantizeStatus = 'armed_waiting';
                  targetRec.pendingTriggerBeat = nextBeat;
                  targetRec.pendingAction = 'start_record';
                }
              } else {
                if (targetRec.isRecording) {
                  const storeConns = connections.filter(
                    (c) => c.fromNodeId === targetRec.id && (c.fromPort === 'packet_out' || c.fromPort === 'store' || c.fromSocketIndex === 0)
                  );
                  const targetContainers = storeConns.map((c) => containerMap.get(c.toNodeId)).filter(Boolean) as ContainerNode[];
                  audioClipEngine.stopRecordingToContainer(targetRec, targetContainers.length > 0 ? targetContainers : null);
                  targetContainers.forEach((tc) => this.nodeVisuals?.triggerNodeFlash(tc.id));
                } else {
                  targetRec.isArmed = true;
                  audioClipEngine.startRecording(targetRec, this.currentBeat);
                }
              }
            } else if (destNode.type === 'arrangement') {
              targetIds.push(destNode.id);
              this.nodeVisuals?.triggerNodeFlash(destNode.id);
              window.dispatchEvent(
                new CustomEvent('qwnsr:arrangement-trigger', {
                  detail: { nodeId: destNode.id },
                })
              );
            } else if (destNode.type === 'code') {
              const codeNode = destNode as CodeNode;
              targetIds.push(codeNode.id);
              this.nodeVisuals?.triggerNodeFlash(codeNode.id);
              codeNode.totalPulsesProcessed = (codeNode.totalPulsesProcessed || 0) + 1;

              const targetSocketId = conn.toSocketId || conn.toPort || 'trigger_in';
              const isFunctionTrigger = targetSocketId.startsWith('fn_in_');
              const targetFunctionName = isFunctionTrigger ? targetSocketId.replace(/^fn_in_/, '') : undefined;

              // Resolve all incoming data connections for variables and parameters
              const incomingConns = connections.filter((c) => c.toNodeId === codeNode.id);
              let injectedInputs: Record<string, any> = {};

              incomingConns.forEach((dc) => {
                const srcNode = this.nodes.find((n) => n.id === dc.fromNodeId);
                if (!srcNode) return;

                let srcVal: any = undefined;
                if (srcNode.type === 'primitive_string') {
                  srcVal = (srcNode as any).value;
                } else if (srcNode.type === 'primitive_number') {
                  srcVal = (srcNode as any).value;
                } else if (srcNode.type === 'primitive_boolean') {
                  srcVal = (srcNode as any).value;
                } else if (srcNode.type === 'primitive_object') {
                  srcVal = (srcNode as any).value;
                } else if (srcNode.type === 'folder_path') {
                  srcVal = (srcNode as any).selectedFolder;
                  injectedInputs['folder'] = srcVal;
                  injectedInputs['folders'] = (srcNode as any).folders;
                  injectedInputs['scope'] = (srcNode as any).scope;
                } else if (srcNode.type === 'code') {
                  const srcCodeNode = srcNode as CodeNode;
                  const fromSock = dc.fromSocketId || dc.fromPort;
                  if (fromSock && fromSock.startsWith('var_out_')) {
                    const outVar = fromSock.replace(/^var_out_/, '');
                    srcVal = srcCodeNode.lastExecutionOutput?.[outVar] ?? srcCodeNode.lastExecutionOutput?.[fromSock];
                  } else if (fromSock && fromSock.startsWith('fn_out_')) {
                    const outFn = fromSock.replace(/^fn_out_/, '');
                    srcVal = srcCodeNode.lastExecutionOutput?.[outFn] ?? srcCodeNode.lastExecutionOutput?.[fromSock];
                  } else {
                    srcVal = srcCodeNode.lastExecutionOutput;
                  }
                }

                if (srcVal !== undefined) {
                  const targetSock = dc.toSocketId || dc.toPort || 'data_in';
                  if (targetSock.startsWith('var_in_')) {
                    const varName = targetSock.replace(/^var_in_/, '');
                    injectedInputs[varName] = srcVal;
                    injectedInputs[targetSock] = srcVal;
                  } else {
                    injectedInputs[targetSock] = srcVal;
                    if (typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal)) {
                      injectedInputs = { ...injectedInputs, ...srcVal };
                    } else {
                      injectedInputs['value'] = srcVal;
                    }
                  }
                }
              });

              // Prepare function argument: either payloadData, or directly injected wire value
              const functionArgData = isFunctionTrigger
                ? (currentPulse.payloadData !== undefined && Object.keys(currentPulse.payloadData).length > 0
                    ? currentPulse.payloadData
                    : (injectedInputs[targetSocketId] ?? (targetFunctionName ? injectedInputs[targetFunctionName] : undefined) ?? injectedInputs))
                : undefined;

              // Execute code node script with reactive variable & function handling
              const execResult = executeCodeNodeScript(codeNode.code || '', {
                pulse: currentPulse,
                context: {
                  bpm: this.bpm,
                  currentBeat: this.currentBeat,
                  bar: currentPulse.bar,
                  beat: currentPulse.beat,
                  beatFraction: currentPulse.beatFraction,
                  data: injectedInputs,
                },
                inputs: injectedInputs,
                targetFunction: targetFunctionName,
                functionArgs: functionArgData,
              });

              if (execResult.success) {
                codeNode.lastErrorMessage = null;
                codeNode.lastExecutionOutput = execResult.outputs;

                // Sync any updated output variables to downstream connected primitive or container nodes
                const outgoingConns = connections.filter((c) => c.fromNodeId === codeNode.id);
                outgoingConns.forEach((oc) => {
                  const downstreamNode = this.nodes.find((n) => n.id === oc.toNodeId);
                  if (!downstreamNode) return;

                  const fromSock = oc.fromSocketId || oc.fromPort || 'trigger_out';
                  let emittedVal: any = undefined;

                  if (fromSock.startsWith('var_out_')) {
                    const varName = fromSock.replace(/^var_out_/, '');
                    emittedVal = execResult.outputs[varName] ?? execResult.outputs[fromSock];
                  } else if (fromSock.startsWith('fn_out_')) {
                    const fnName = fromSock.replace(/^fn_out_/, '');
                    emittedVal = execResult.outputs[fnName] ?? execResult.outputs[fromSock];
                  } else if (fromSock === 'data_out') {
                    emittedVal = execResult.outputs;
                  }

                  if (emittedVal !== undefined) {
                    if (downstreamNode.type === 'primitive_string' && typeof emittedVal === 'string') {
                      (downstreamNode as any).value = emittedVal;
                      this.nodeVisuals?.triggerNodeFlash(downstreamNode.id);
                    } else if (downstreamNode.type === 'primitive_number' && typeof emittedVal === 'number') {
                      (downstreamNode as any).value = emittedVal;
                      this.nodeVisuals?.triggerNodeFlash(downstreamNode.id);
                    } else if (downstreamNode.type === 'primitive_boolean' && typeof emittedVal === 'boolean') {
                      (downstreamNode as any).value = emittedVal;
                      this.nodeVisuals?.triggerNodeFlash(downstreamNode.id);
                    } else if (downstreamNode.type === 'primitive_object' && typeof emittedVal === 'object') {
                      (downstreamNode as any).value = emittedVal;
                      this.nodeVisuals?.triggerNodeFlash(downstreamNode.id);
                    } else if (downstreamNode.type === 'container') {
                      const cNode = downstreamNode as ContainerNode;
                      if (typeof emittedVal === 'string') {
                        cNode.exportFileName = emittedVal;
                      } else if (typeof emittedVal === 'object' && emittedVal !== null) {
                        if (emittedVal.filename) cNode.exportFileName = emittedVal.filename;
                        if (emittedVal.folder) cNode.targetUserFolder = emittedVal.folder;
                      }
                      this.nodeVisuals?.triggerNodeFlash(cNode.id);
                    }
                  }
                });
              } else {
                codeNode.lastErrorMessage = execResult.error || 'Execution error';
              }

              // Create clone of incoming trigger pulse and enrich with this node's code payload
              const enrichedPulse: TriggerPulse = {
                ...(execResult.enrichedPulse || currentPulse),
                codePayload: codeNode.code || '',
                payloadData: {
                  ...(currentPulse.payloadData ? { ...currentPulse.payloadData } : {}),
                  ...injectedInputs,
                  ...(execResult.outputs || {}),
                },
              };

              // Propagate enriched trigger stream pulse downstream
              propagate(codeNode.id, destPosition, 0, newVisited, enrichedPulse);
            } else if (destNode.type === 'combiner' || destNode.type === 'multiplexer') {
              this.nodeVisuals?.triggerNodeFlash(destNode.id);
              propagate(destNode.id, destNode.position, 0, newVisited, currentPulse);
            }
          }, totalDelayMs);
        }
      });
    };

    propagate(trig.id, trig.position, 0, new Set<string>(), initialPulse);

    setTimeout(() => {
      onTriggerFired?.(trig.id, Array.from(new Set(targetIds)));
    }, 50);
  }

  public handleContainerPlayStop(container: ContainerNode) {
    if (this.activeContainerPlayheads.has(container.id)) {
      this.activeContainerPlayheads.delete(container.id);
      container.isPlaying = false;
      container.pausedBeat = 0;
    } else {
      this.activeContainerPlayheads.set(container.id, { startBeat: this.currentBeat });
      container.isPlaying = true;
      if (container.containerType === 'audio' && container.audioTrack) {
        let volumeScale = 1.0;
        let panOffset = 0.0;
        const activeEffects = getActiveEffectsForNode(container, this.nodes, this.connections);
        const gainEffect = activeEffects.find((e) => e.effectType === 'gain' && e.active !== false);
        if (gainEffect?.gainConfig?.gain !== undefined) {
          volumeScale = gainEffect.gainConfig.gain;
          this.nodeVisuals?.triggerNodeFlash(gainEffect.id);
        }
        const panEffect = activeEffects.find((e) => e.effectType === 'pan' && e.active !== false);
        if (panEffect?.panConfig?.pan !== undefined) {
          panOffset = panEffect.panConfig.pan;
          this.nodeVisuals?.triggerNodeFlash(panEffect.id);
        }
        audioClipEngine.playAudioTrack(container.audioTrack, this.bpm, undefined, container.id, undefined, volumeScale, panOffset);
      }
      this.nodeVisuals?.triggerNodeFlash(container.id);
    }
  }

  public handleContainerPlayPause(container: ContainerNode) {
    if (this.activeContainerPlayheads.has(container.id)) {
      const active = this.activeContainerPlayheads.get(container.id)!;
      const cType = container.containerType || 'midi';
      const patternLen =
        cType === 'audio'
          ? container.audioTrack?.durationBeats || 4
          : cType === 'curve'
          ? container.curveData?.lengthInBeats || 4
          : container.pattern?.lengthInBeats || 4;
      const pausedBeat = (this.currentBeat - active.startBeat) % patternLen;
      container.pausedBeat = Math.max(0, pausedBeat);
      container.isPlaying = false;
      this.activeContainerPlayheads.delete(container.id);
    } else {
      const offset = container.pausedBeat || 0;
      this.activeContainerPlayheads.set(container.id, {
        startBeat: this.currentBeat - offset,
        pausedOffset: offset,
      });
      container.isPlaying = true;
      if (container.containerType === 'audio' && container.audioTrack) {
        let volumeScale = 1.0;
        let panOffset = 0.0;
        const activeEffects = getActiveEffectsForNode(container, this.nodes, this.connections);
        const gainEffect = activeEffects.find((e) => e.effectType === 'gain' && e.active !== false);
        if (gainEffect?.gainConfig?.gain !== undefined) {
          volumeScale = gainEffect.gainConfig.gain;
          this.nodeVisuals?.triggerNodeFlash(gainEffect.id);
        }
        const panEffect = activeEffects.find((e) => e.effectType === 'pan' && e.active !== false);
        if (panEffect?.panConfig?.pan !== undefined) {
          panOffset = panEffect.panConfig.pan;
          this.nodeVisuals?.triggerNodeFlash(panEffect.id);
        }
        audioClipEngine.playAudioTrack(container.audioTrack, this.bpm, undefined, container.id, offset, volumeScale, panOffset);
      }
      this.nodeVisuals?.triggerNodeFlash(container.id);
    }
  }

  public toggleContainerRecord(container: ContainerNode) {
    container.isRecording = !container.isRecording;
    this.nodeVisuals?.triggerNodeFlash(container.id);
  }

  public fireTrigger(
    trig: SpaceNode,
    connections: NodeConnection[],
    containerMap: Map<string, ContainerNode>,
    onTriggerFired?: (triggerId: string, targetContainerIds: string[]) => void,
    allNodes?: SpaceNode[]
  ) {
    if (allNodes && allNodes.length > 0) {
      this.nodes = allNodes;
    }
    this.connections = connections;
    const moduleMap = new Map<string, ModuleNode>(
      this.nodes.filter((n): n is ModuleNode => n.type === 'module').map((m) => [m.id, m])
    );
    this.processTriggerWiresWithEffects(trig, connections, containerMap, moduleMap, onTriggerFired, true);
  }

  public handlePlayerStart(player: PlayerNode, container?: ContainerNode | null) {
    this.nodeVisuals?.triggerNodeFlash(player.id);
    const audioTrack = container?.audioTrack;

    if (player.playerType === 'audio_stereo' || player.playerType === 'audio_mono' || player.playerType === 'audio') {
      if (audioTrack) {
        audioClipEngine.playAudioTrack(audioTrack, this.bpm, undefined, player.id, undefined, player.gain ?? 1.0, 0);
      } else {
        const dummyTrack = {
          id: `ply-track-${player.id}`,
          name: player.name,
          sampleType: 'cosmic_warp' as const,
          durationBeats: player.loopLengthBeats || 4,
          gain: player.gain ?? 1.0,
          pan: 0,
          pitchShift: player.pitchShiftSemitones || 0,
          filterCutoff: 8000,
          fadeInBeats: 0,
          fadeOutBeats: 0,
          trimStartBeats: 0,
          trimEndBeats: player.loopLengthBeats || 4,
          isReversed: false,
        };
        audioClipEngine.playAudioTrack(dummyTrack, this.bpm, undefined, player.id, undefined, player.gain ?? 1.0, 0);
      }
    } else if (player.playerType === 'midi') {
      const synth = player.synthPreset || container?.synthPreset || { synthType: 'poly', attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.5, cutoff: 4000, resonance: 2, reverb: 0.3, delay: 0.2 };
      const pattern = container?.pattern;
      if (pattern && pattern.notes && pattern.notes.length > 0) {
        pattern.notes.forEach((note) => {
          synthEngine.playNote(note, synth, note.time, player.id);
        });
      } else {
        synthEngine.playNote({ note: 60, name: 'C4', velocity: 0.8, time: 0, duration: 1 }, synth, 0, player.id);
      }
    }
  }

  public handlePlayerStop(player: PlayerNode) {
    audioClipEngine.stopAudioTrack(`ply-track-${player.id}`);
    audioClipEngine.stopAudioTrack(player.id);
    this.nodeVisuals?.triggerNodeFlash(player.id);
  }

  public manualTriggerContainer(container: ContainerNode) {
    this.handleContainerPlayStop(container);
  }
}

export const sequencerEngine = new SequencerEngine();