import {
  SpaceNode,
  ContainerNode,
  EffectNode,
  CombinerNode,
  MultiplexerNode,
  ModuleNode,
  GroupNode,
  SubgraphNode,
  RecorderNode,
  PlayerNode,
  SamplerNode,
  AudioPadsNode,
  ConverterNode,
  ArrangementNode,
  CodeNode,
  UniversalSocketDefinition,
  SignalMedium,
  SignalDataType,
  SignalPolarity,
  ConnectivityType,
  SignalType,
} from "../types/index.js";
import { SIGNAL_TYPES } from '../functions/canonicalSignalTable';
import { createDefaultMapIoConfig } from '../types/stripsTypes';
import { generateCodeNodeSockets } from '../functions/codeNodeParser';

export type { UniversalSocketDefinition };
export type NodeSocketDescriptor = UniversalSocketDefinition;

export interface NodeSocketsResult {
  inputs: UniversalSocketDefinition[];
  outputs: UniversalSocketDefinition[];
}

/**
 * Universal Factory for building standardized, packaged socket descriptors.
 */
export function createPackagedSocket(options: {
  socketId: string;
  label: string;
  polarity: SignalPolarity;
  medium: SignalMedium;
  dataType: SignalDataType;
  signalType?: SignalType;
  connectivity?: ConnectivityType;
  socketIndex?: number;
  description: string;
  iconName?: string;
  isCustom?: boolean;
  isOmni?: boolean;
  customMeta?: Record<string, any>;
}): UniversalSocketDefinition {
  // Derive canonical composite signalType if not explicitly passed
  let canonicalSig: SignalType = options.signalType || 'trigger';
  if (!options.signalType) {
    if (options.medium === 'trigger') {
      canonicalSig = 'trigger';
    } else if (options.medium === 'midi') {
      canonicalSig = options.dataType === 'packet' ? 'midi_packet' : 'midi_stream';
    } else if (options.medium === 'curve') {
      canonicalSig = options.dataType === 'packet' ? 'curve_packet' : 'curve_stream';
    } else if (options.medium === 'audio_mono') {
      canonicalSig = options.dataType === 'packet' ? 'audio_packet' : 'audio_mono';
    } else if (options.medium === 'audio_stereo') {
      canonicalSig = options.dataType === 'packet' ? 'audio_packet' : 'audio_stereo';
    } else if (options.medium === 'component') {
      canonicalSig = 'component';
    } else if (options.medium === 'omni') {
      canonicalSig = options.dataType === 'packet' ? 'omni_packet' : 'omni_stream';
    }
  }

  const visualDef = SIGNAL_TYPES[canonicalSig] || SIGNAL_TYPES.trigger;

  return {
    socketId: options.socketId,
    label: options.label,
    polarity: options.polarity,
    medium: options.medium,
    dataType: options.dataType,
    signalType: canonicalSig,
    connectivity: options.connectivity || (options.polarity === 'input' ? 'single' : 'multi'),
    socketIndex: options.socketIndex ?? 0,
    description: options.description,
    colorHex: visualDef.colorHex,
    colorStr: visualDef.colorStr,
    bgStr: visualDef.bgStr,
    iconName: options.iconName || visualDef.iconName,
    isCustom: options.isCustom ?? false,
    isOmni: options.isOmni ?? (options.medium === 'omni' || canonicalSig === 'omni_packet' || canonicalSig === 'omni_stream' || canonicalSig === 'omni'),
    customMeta: options.customMeta,
  };
}

/**
 * Global registry for custom node socket providers.
 * Allows plugins, sub-graphs, and future custom nodes to register their socket descriptors.
 */
const customNodeSocketRegistry: Map<string, (node: SpaceNode) => NodeSocketsResult> = new Map();

export function registerCustomNodeSockets(nodeType: string, provider: (node: SpaceNode) => NodeSocketsResult): void {
  customNodeSocketRegistry.set(nodeType, provider);
}

export function unregisterCustomNodeSockets(nodeType: string): void {
  customNodeSocketRegistry.delete(nodeType);
}

/**
 * Master Global Resolver: Returns exact canonical input and output socket definitions for any node.
 * Universal across 3D RTS visual building entities, 2D UI inspectors, wire routing, and connection validation.
 */
export function getNodeSockets(node: SpaceNode): NodeSocketsResult {
  // 1. Check custom registry first
  if (customNodeSocketRegistry.has(node.type)) {
    const customProvider = customNodeSocketRegistry.get(node.type)!;
    return customProvider(node);
  }

  // 2. Dynamic support for user-authored custom sockets on any node
  const customSockets = (node as any).customSockets as UniversalSocketDefinition[] | undefined;
  if (customSockets && Array.isArray(customSockets) && customSockets.length > 0) {
    const inputs = customSockets.filter((s) => s.polarity === 'input');
    const outputs = customSockets.filter((s) => s.polarity === 'output');
    return { inputs, outputs };
  }

  // 2b. Dynamic support for GraphNode explicit inputs/outputs arrays
  const rawInputs = (node as any).inputs;
  const rawOutputs = (node as any).outputs;
  if (Array.isArray(rawInputs) || Array.isArray(rawOutputs)) {
    const inputs = Array.isArray(rawInputs) ? rawInputs.map((inp: any, idx: number) => createPackagedSocket({
      socketId: inp.id || `in_${idx}`,
      label: inp.label || inp.id || 'IN',
      polarity: 'input',
      medium: (inp.dataType?.toLowerCase().includes('audio') ? 'audio_stereo' : 'trigger') as any,
      dataType: 'stream',
      signalType: (inp.dataType?.toLowerCase() || 'audio_stereo') as any,
      description: inp.label || 'Input Socket',
    })) : [];
    const outputs = Array.isArray(rawOutputs) ? rawOutputs.map((out: any, idx: number) => createPackagedSocket({
      socketId: out.id || `out_${idx}`,
      label: out.label || out.id || 'OUT',
      polarity: 'output',
      medium: (out.dataType?.toLowerCase().includes('audio') ? 'audio_stereo' : 'trigger') as any,
      dataType: 'stream',
      signalType: (out.dataType?.toLowerCase() || 'audio_stereo') as any,
      description: out.label || 'Output Socket',
    })) : [];
    return { inputs, outputs };
  }

  // 3. Built-in Core Node Archetypes

  // ── INPUT STRIP LANDMARK NODE (Originates Graph Inputs) ──────────────────────
  if (node.type === 'input_strip') {
    const ioCfg = (node as any).mapIoConfig || createDefaultMapIoConfig();
    const inputsList: any[] = ioCfg?.inputs && Array.isArray(ioCfg.inputs)
      ? ioCfg.inputs
      : [];

    const outputs: UniversalSocketDefinition[] = inputsList.map((ch: any, idx: number) => {
      let medium: SignalMedium = 'audio_stereo';
      let signalType: SignalType = 'audio_stereo';
      let dataType: SignalDataType = 'stream';

      if (ch.type === 'trigger' || ch.signalType === 'trigger') {
        medium = 'trigger';
        signalType = 'trigger';
        dataType = 'pulse';
      } else if (ch.type === 'audio') {
        const isMono = ch.signalType === 'audio_mono' || ch.audioFormat === 'mono';
        medium = isMono ? 'audio_mono' : 'audio_stereo';
        signalType = isMono ? 'audio_mono' : 'audio_stereo';
        dataType = ch.signalType === 'audio_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'midi') {
        medium = 'midi';
        signalType = ch.signalType || 'midi_stream';
        dataType = ch.signalType === 'midi_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'osc') {
        medium = 'curve';
        signalType = ch.signalType || 'curve_stream';
        dataType = ch.signalType === 'curve_packet' ? 'packet' : 'stream';
      }

      const formatBadge = ch.type === 'audio' ? (signalType === 'audio_mono' ? ' [MONO]' : ' [STEREO]') : '';
      const displayLabel = `${ch.name.toUpperCase()}${formatBadge}`;

      return createPackagedSocket({
        socketId: `out-${ch.id}`,
        label: displayLabel,
        polarity: 'output',
        medium,
        dataType,
        signalType,
        connectivity: 'multi',
        socketIndex: idx,
        description: `Input Strip Source: ${ch.name} (${signalType.toUpperCase()})`,
        customMeta: { color: ch.color, audioFormat: ch.audioFormat },
        iconName: ch.type === 'trigger' ? 'zap' : ch.type === 'audio' ? 'mic' : ch.type === 'midi' ? 'music' : 'activity',
      });
    });

    return { inputs: [], outputs };
  }

  // ── OUTPUT STRIP LANDMARK NODE (Terminates Graph Outputs) ─────────────────────
  if (node.type === 'output_strip') {
    const ioCfg = (node as any).mapIoConfig || createDefaultMapIoConfig();
    const outputsList: any[] = ioCfg?.outputs && Array.isArray(ioCfg.outputs)
      ? ioCfg.outputs
      : [];

    const inputs: UniversalSocketDefinition[] = outputsList.map((ch: any, idx: number) => {
      let medium: SignalMedium = 'audio_stereo';
      let signalType: SignalType = 'audio_stereo';
      let dataType: SignalDataType = 'stream';

      if (ch.type === 'trigger' || ch.signalType === 'trigger') {
        medium = 'trigger';
        signalType = 'trigger';
        dataType = 'pulse';
      } else if (ch.type === 'audio') {
        const isMono = ch.signalType === 'audio_mono' || ch.audioFormat === 'mono';
        medium = isMono ? 'audio_mono' : 'audio_stereo';
        signalType = isMono ? 'audio_mono' : 'audio_stereo';
        dataType = ch.signalType === 'audio_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'midi') {
        medium = 'midi';
        signalType = ch.signalType || 'midi_stream';
        dataType = ch.signalType === 'midi_packet' ? 'packet' : 'stream';
      } else if (ch.type === 'osc') {
        medium = 'curve';
        signalType = ch.signalType || 'curve_stream';
        dataType = ch.signalType === 'curve_packet' ? 'packet' : 'stream';
      }

      const formatBadge = ch.type === 'audio' ? (signalType === 'audio_mono' ? ' [MONO]' : ' [STEREO]') : '';
      const displayLabel = `${ch.name.toUpperCase()}${formatBadge}`;

      return createPackagedSocket({
        socketId: `in-${ch.id}`,
        label: displayLabel,
        polarity: 'input',
        medium,
        dataType,
        signalType,
        connectivity: 'single',
        socketIndex: idx,
        description: `Output Strip Destination: ${ch.name} (${signalType.toUpperCase()})`,
        customMeta: { color: ch.color, audioFormat: ch.audioFormat },
        iconName: ch.type === 'trigger' ? 'zap' : ch.type === 'audio' ? 'volume-2' : ch.type === 'midi' ? 'disc' : 'activity',
      });
    });

    return { inputs, outputs: [] };
  }

  // ── CONTAINER NODES ──────────────────────────────────────────────────────────
  if (node.type === 'container') {
    const cNode = node as ContainerNode;
    const cType = cNode.containerType || 'midi';
    const isAudio = cType === 'audio';
    const isCurve = cType === 'curve';
    const isTrigger = cType === 'trigger';
    const medium: SignalMedium = isAudio
      ? (cNode.audioFormat === 'mono' ? 'audio_mono' : 'audio_stereo')
      : isCurve
      ? 'curve'
      : isTrigger
      ? 'trigger'
      : 'midi';
    const packetSig: SignalType = isAudio
      ? 'audio_packet'
      : isCurve
      ? 'curve_packet'
      : isTrigger
      ? 'trigger_packet'
      : 'midi_packet';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'packet_in',
        label: 'PACKET IN',
        polarity: 'input',
        medium,
        dataType: 'packet',
        signalType: packetSig,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Packet In: Ingests and stores signal packets into container memory',
        customMeta: { isPacketHandle: true, legacySocketId: 'store' },
        iconName: 'box',
      }),
      createPackagedSocket({
        socketId: 'file_name_in',
        label: 'FILE NAME',
        polarity: 'input',
        medium: 'data',
        dataType: 'stream',
        signalType: 'string',
        connectivity: 'single',
        socketIndex: 1,
        description: 'String Input: Dynamically sets export file name for container clips',
        iconName: 'file-text',
      }),
      createPackagedSocket({
        socketId: 'folder_path_in',
        label: 'FOLDER PATH',
        polarity: 'input',
        medium: 'data',
        dataType: 'stream',
        signalType: 'string',
        connectivity: 'single',
        socketIndex: 2,
        description: 'String/Object Input: Dynamically sets target user folder path for saving or loading',
        iconName: 'folder',
      }),
    ];

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'packet_out',
        label: 'PACKET OUT',
        polarity: 'output',
        medium,
        dataType: 'packet',
        signalType: packetSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Packet Out: Emits stored signal packets to Players, Samplers, Arrangements, and processors',
        customMeta: { isContainerOutput: true, isContainerStoreOut: true, isPacketHandle: true, legacySocketId: 'retrieve' },
        iconName: 'box',
      }),
    ];

    return { inputs, outputs };
  }

  // ── RECORDER NODES (Stream ➔ Packet) ──────────────────────────────────────────
  if (node.type === 'recorder') {
    const rec = node as RecorderNode;
    const recType = rec.recorderType || 'audio_mono';
    const isAudioMono = recType === 'audio_mono' || recType === 'audio';
    const isAudioStereo = recType === 'audio_stereo';
    const isCurve = recType === 'curve';
    const medium: SignalMedium = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve' : 'midi';
    const streamSig: SignalType = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve_stream' : 'midi_stream';
    const packetSig: SignalType = isAudioMono || isAudioStereo ? 'audio_packet' : isCurve ? 'curve_packet' : 'midi_packet';

    const streamLabel = isAudioMono ? 'AUDIO IN (MONO)' : isAudioStereo ? 'AUDIO IN (STEREO)' : isCurve ? 'CV STREAM IN' : 'MIDI STREAM IN';
    const isRetro = rec.recordingMode === 'retrospective';
    const trigLabel = isRetro ? 'CAPTURE TRIG' : 'REC TRIG';
    const trigDesc = isRetro
      ? 'Capture Trigger: Pulse triggers retrospective snapshot capture of rolling buffer take into container'
      : 'Rec Trigger: Clock pulse to arm or start/stop quantized packet recording';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'stream_in',
        label: streamLabel,
        polarity: 'input',
        medium,
        dataType: 'stream',
        signalType: streamSig,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Stream In: Continuous live stream signal to capture and package',
        iconName: isAudioStereo || isAudioMono ? 'activity' : isCurve ? 'trending_up' : 'music',
      }),
      createPackagedSocket({
        socketId: 'arm_in',
        label: 'ARM TRIG',
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 1,
        description: 'Arm Trigger: Pulse arms or disarms recorder input monitoring and preview waveform state',
        iconName: 'disc',
      }),
      createPackagedSocket({
        socketId: 'trigger_in',
        label: trigLabel,
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 2,
        description: trigDesc,
        iconName: 'zap',
      }),
    ];

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'packet_out',
        label: 'PACKET OUT',
        polarity: 'output',
        medium,
        dataType: 'packet',
        signalType: packetSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Packet Out: Multi-connect packet output that pushes recorded packets to containers',
        customMeta: { isPacketHandle: true, isRecorderOutput: true, legacySocketId: 'store' },
        iconName: 'box',
      }),
    ];

    return { inputs, outputs };
  }

  // ── PLAYER NODES (Packet ➔ Stream) ───────────────────────────────────────────
  if (node.type === 'player') {
    const ply = node as PlayerNode;
    const plyType = ply.playerType || 'audio_stereo';
    const isAudioMono = plyType === 'audio_mono';
    const isAudioStereo = plyType === 'audio_stereo' || plyType === 'audio';
    const isCurve = plyType === 'curve';
    const medium: SignalMedium = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve' : 'midi';
    const packetSig: SignalType = (isAudioMono || isAudioStereo) ? 'audio_packet' : isCurve ? 'curve_packet' : 'midi_packet';
    const streamSig: SignalType = isAudioMono ? 'audio_mono' : isAudioStereo ? 'audio_stereo' : isCurve ? 'curve_stream' : 'midi_stream';
    const streamLabel = isAudioMono ? 'AUDIO OUT (MONO)' : isAudioStereo ? 'AUDIO OUT (STEREO)' : isCurve ? 'CV OUT' : 'MIDI OUT';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'packet_in',
        label: 'PACKET IN',
        polarity: 'input',
        medium,
        dataType: 'packet',
        signalType: packetSig,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Packet In: Connects to Container PACKET OUT to load stored packets for playback',
        customMeta: { isPacketHandle: true, legacySocketId: 'retrieve' },
        iconName: 'box',
      }),
      createPackagedSocket({
        socketId: 'trigger_in',
        label: 'PLAY TRIG',
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 1,
        description: 'Play Trigger: Clock or pulse to start/retrigger quantized stream playback',
        iconName: 'zap',
      }),
    ];

    if (isAudioStereo || isAudioMono || plyType === 'midi') {
      inputs.push(
        createPackagedSocket({
          socketId: 'midi_in',
          label: 'MIDI IN',
          polarity: 'input',
          medium: 'midi',
          dataType: 'stream',
          signalType: 'midi_stream',
          connectivity: 'single',
          socketIndex: 2,
          description: 'MIDI In: Note pitch and velocity for chromatic/polyphonic sample or synth playback',
          iconName: 'music',
        })
      );
    }

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'stream_out',
        label: streamLabel,
        polarity: 'output',
        medium,
        dataType: 'stream',
        signalType: streamSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Stream Out: Continuous playback audio/MIDI stream',
        iconName: isAudioStereo || isAudioMono ? 'volume_2' : isCurve ? 'trending_up' : 'music',
      }),
    ];

    return { inputs, outputs };
  }

  // ── SAMPLER NODES (Audio Sampler) ───────────────────────────────────────────
  if (node.type === 'sampler') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'store_in',
          label: 'STORE IN',
          polarity: 'input',
          medium: 'audio_stereo',
          dataType: 'packet',
          signalType: 'audio_packet',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Store In: Connects to Audio Containers (mono and stereo) to load sample zones',
          iconName: 'box',
          customMeta: { acceptsAnyAudioFormat: true, legacySocketId: 'packet_in' },
        }),
        createPackagedSocket({
          socketId: 'midi_in',
          label: 'MIDI IN',
          polarity: 'input',
          medium: 'midi',
          dataType: 'stream',
          signalType: 'midi_stream',
          connectivity: 'single',
          socketIndex: 1,
          description: 'MIDI In: Stream input for triggering samples with pitch shift across mapped note zones',
          iconName: 'music',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'stream_out',
          label: 'AUDIO OUT (STEREO)',
          polarity: 'output',
          medium: 'audio_stereo',
          dataType: 'stream',
          signalType: 'audio_stereo',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Audio Out: High quality stereo multisample audio stream',
          iconName: 'volume_2',
        }),
      ],
    };
  }

  // ── AUDIO PADS NODES (Multi-Sample Drum & One-Shot Pads) ───────────────────
  if (node.type === 'audio_pads') {
    const padNode = node as AudioPadsNode;
    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'store_in',
        label: 'STORE IN',
        polarity: 'input',
        medium: 'audio_stereo',
        dataType: 'packet',
        signalType: 'audio_packet',
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Store In: Connects to Audio Containers (mono and stereo) to load sample pads',
        iconName: 'box',
        customMeta: { acceptsAnyAudioFormat: true, legacySocketId: 'packet_in' },
      }),
      createPackagedSocket({
        socketId: 'midi_in',
        label: 'MIDI IN',
        polarity: 'input',
        medium: 'midi',
        dataType: 'stream',
        signalType: 'midi_stream',
        connectivity: 'single',
        socketIndex: 1,
        description: 'MIDI In: Stream input for triggering assigned sample drum pads',
        iconName: 'music',
      }),
    ];

    let outputs: UniversalSocketDefinition[] = [];
    if (padNode.pads && padNode.pads.length > 0) {
      outputs = padNode.pads.map((pad, idx) => {
        const isMono = pad.audioFormat === 'mono';
        const formatLabel = isMono ? 'MONO' : 'STEREO';
        return createPackagedSocket({
          socketId: `out_${pad.id}`,
          label: `${pad.name.toUpperCase()} (${formatLabel})`,
          polarity: 'output',
          medium: isMono ? 'audio_mono' : 'audio_stereo',
          dataType: 'stream',
          signalType: isMono ? 'audio_mono' : 'audio_stereo',
          connectivity: 'multi',
          socketIndex: idx,
          description: `Direct Audio Out for pad ${pad.name} (${formatLabel})`,
          iconName: 'volume_2',
        });
      });
    } else {
      outputs = [
        createPackagedSocket({
          socketId: 'stream_out',
          label: 'AUDIO OUT (STEREO)',
          polarity: 'output',
          medium: 'audio_stereo',
          dataType: 'stream',
          signalType: 'audio_stereo',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Audio Out: Direct audio output',
          iconName: 'volume_2',
        }),
      ];
    }

    return { inputs, outputs };
  }

  // ── TRIGGER / CLOCK NODES ───────────────────────────────────────────────────
  if (node.type === 'trigger') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'trigger_in',
          label: 'SYNC IN',
          polarity: 'input',
          medium: 'trigger',
          dataType: 'stream',
          signalType: 'trigger_stream',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Sync In: External pulse resets or triggers clock phase',
          iconName: 'zap',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'trigger_out',
          label: 'TRIG STR OUT',
          polarity: 'output',
          medium: 'trigger',
          dataType: 'stream',
          signalType: 'trigger_stream',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Trigger Stream Out: Quantized tempo clock trigger pulse stream carrying timing in bars, beats, and fractions',
          iconName: 'zap',
        }),
      ],
    };
  }

  // ── CODE NODES (Reactive Code Node with Custom Syntax Exposed Variables & Functions) ──
  if (node.type === 'code') {
    const codeNode = node as CodeNode;
    return generateCodeNodeSockets(codeNode.code || '', createPackagedSocket);
  }

  // ── STRING PRIMITIVE NODES ──────────────────────────────────────────────────
  if (node.type === 'primitive_string') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_str',
          label: 'STR IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'single',
          socketIndex: 0,
          description: 'String Input: External text to set or override string primitive',
          iconName: 'file-text',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_str',
          label: 'STR OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'String Output: Emits primitive string text for filenames, labels, and parameters',
          iconName: 'file-text',
        }),
      ],
    };
  }

  // ── NUMBER PRIMITIVE NODES ──────────────────────────────────────────────────
  if (node.type === 'primitive_number') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_num',
          label: 'NUM IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'number',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Number Input: External value to set numeric parameter',
          iconName: 'hash',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_num',
          label: 'NUM OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'number',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Number Output: Emits primitive numeric value',
          iconName: 'hash',
        }),
      ],
    };
  }

  // ── BOOLEAN PRIMITIVE NODES ─────────────────────────────────────────────────
  if (node.type === 'primitive_boolean') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_bool',
          label: 'BOOL IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'boolean',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Boolean Input: Sets true/false boolean parameter flag',
          iconName: 'toggle-left',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_bool',
          label: 'BOOL OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'boolean',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Boolean Output: Emits boolean true/false toggle state',
          iconName: 'toggle-left',
        }),
      ],
    };
  }

  // ── OBJECT / JSON PRIMITIVE NODES ───────────────────────────────────────────
  if (node.type === 'primitive_object') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'in_obj',
          label: 'OBJ IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Object Input: Ingests dictionary/object payload',
          iconName: 'braces',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'out_obj',
          label: 'OBJ OUT',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Object Output: Emits structured JSON dictionary object',
          iconName: 'braces',
        }),
      ],
    };
  }

  // ── FOLDER PATH ACCESS NODES ────────────────────────────────────────────────
  if (node.type === 'folder_path') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'select_in',
          label: 'SELECT IN',
          polarity: 'input',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Select In: Programmatically select active folder name from incoming string or object',
          iconName: 'folder',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'folders_obj',
          label: 'FOLDERS OBJ',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'object',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Folders Object Output: Emits structured object containing user-defined folders list, selected folder, and base path',
          iconName: 'braces',
        }),
        createPackagedSocket({
          socketId: 'folder_str',
          label: 'FOLDER PATH',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'string',
          connectivity: 'multi',
          socketIndex: 1,
          description: 'Folder Path Output: Emits selected user-defined folder path string to configure Containers or Code nodes',
          iconName: 'folder',
        }),
        createPackagedSocket({
          socketId: 'folders_list',
          label: 'FOLDERS LIST',
          polarity: 'output',
          medium: 'data',
          dataType: 'stream',
          signalType: 'array',
          connectivity: 'multi',
          socketIndex: 2,
          description: 'Folders List Output: Emits list of user-defined folder names as an array',
          iconName: 'layers',
        }),
      ],
    };
  }

  // ── BUTTON NODES ────────────────────────────────────────────────────────────
  if (node.type === 'button') {
    return {
      inputs: [],
      outputs: [
        createPackagedSocket({
          socketId: 'trigger_out',
          label: 'PULSE OUT',
          polarity: 'output',
          medium: 'trigger',
          dataType: 'pulse',
          signalType: 'trigger',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Pulse Out: Sends manual trigger pulse on press/state change',
          iconName: 'zap',
        }),
      ],
    };
  }

  // ── COMBINER NODES (Fan-In Sum / Merge) ──────────────────────────────────────
  if (node.type === 'combiner') {
    const cNode = node as CombinerNode;
    const count = Math.max(2, Math.min(8, cNode.inputCount || 3));
    const rawSig = cNode.signalType || 'trigger';
    const medium: SignalMedium =
      rawSig === 'audio' || rawSig === 'audio_stereo' ? 'audio_stereo' :
      rawSig === 'audio_mono' ? 'audio_mono' :
      rawSig === 'midi' ? 'midi' :
      rawSig === 'curve' ? 'curve' : 'trigger';
    const dataType: SignalDataType = medium === 'trigger' ? 'pulse' : 'stream';
    const sigType: SignalType =
      medium === 'trigger' ? 'trigger' :
      medium === 'midi' ? 'midi_stream' :
      medium === 'curve' ? 'curve_stream' :
      medium === 'audio_mono' ? 'audio_mono' : 'audio_stereo';

    const inputs: UniversalSocketDefinition[] = [];
    for (let i = 0; i < count; i++) {
      inputs.push(
        createPackagedSocket({
          socketId: `in_${i}`,
          label: `IN ${i + 1}`,
          polarity: 'input',
          medium,
          dataType,
          signalType: sigType,
          connectivity: 'single',
          socketIndex: i,
          description: `Input Port ${i + 1} for signal combination`,
        })
      );
    }

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'out_0',
        label: 'COMBINED',
        polarity: 'output',
        medium,
        dataType,
        signalType: sigType,
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Combined Output: Merged or summed signal stream',
      }),
    ];

    return { inputs, outputs };
  }

  // ── MULTIPLEXER NODES (Fan-Out Distribute / Switch) ──────────────────────────
  if (node.type === 'multiplexer') {
    const mNode = node as MultiplexerNode;
    const count = Math.max(2, Math.min(8, mNode.outputCount || 4));
    const rawSig = mNode.signalType || 'trigger';
    const medium: SignalMedium =
      rawSig === 'audio' || rawSig === 'audio_stereo' ? 'audio_stereo' :
      rawSig === 'audio_mono' ? 'audio_mono' :
      rawSig === 'midi' ? 'midi' :
      rawSig === 'curve' ? 'curve' : 'trigger';
    const dataType: SignalDataType = medium === 'trigger' ? 'pulse' : 'stream';
    const sigType: SignalType =
      medium === 'trigger' ? 'trigger' :
      medium === 'midi' ? 'midi_stream' :
      medium === 'curve' ? 'curve_stream' :
      medium === 'audio_mono' ? 'audio_mono' : 'audio_stereo';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'in_0',
        label: 'INPUT',
        polarity: 'input',
        medium,
        dataType,
        signalType: sigType,
        connectivity: 'single',
        socketIndex: 0,
        description: 'Input Signal to distribute across output branches',
      }),
    ];

    const outputs: UniversalSocketDefinition[] = [];
    for (let i = 0; i < count; i++) {
      outputs.push(
        createPackagedSocket({
          socketId: `out_${i}`,
          label: `OUT ${i + 1}`,
          polarity: 'output',
          medium,
          dataType,
          signalType: sigType,
          connectivity: 'multi',
          socketIndex: i,
          description: `Output Branch ${i + 1}`,
        })
      );
    }

    return { inputs, outputs };
  }

  // ── STEREO / MONO CONVERTER NODES ───────────────────────────────────────────
  if (node.type === 'converter') {
    const conv = node as ConverterNode;
    const isStereoToMono = conv.converterType === 'stereo_to_mono';

    return {
      inputs: [
        createPackagedSocket({
          socketId: 'audio_in',
          label: isStereoToMono ? 'STEREO IN' : 'MONO IN',
          polarity: 'input',
          medium: isStereoToMono ? 'audio_stereo' : 'audio_mono',
          dataType: 'stream',
          signalType: isStereoToMono ? 'audio_stereo' : 'audio_mono',
          connectivity: 'single',
          socketIndex: 0,
          description: isStereoToMono ? 'Stereo Audio In for mono collapse' : 'Mono Audio In for stereo expansion',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'audio_out',
          label: isStereoToMono ? 'MONO OUT' : 'STEREO OUT',
          polarity: 'output',
          medium: isStereoToMono ? 'audio_mono' : 'audio_stereo',
          dataType: 'stream',
          signalType: isStereoToMono ? 'audio_mono' : 'audio_stereo',
          connectivity: 'multi',
          socketIndex: 0,
          description: isStereoToMono ? 'Collapsed Mono Output' : 'Expanded Stereo Output',
        }),
      ],
    };
  }

  // ── COLLAPSED GROUP NODES (PRESERVES INTERNAL NODE GROUP) ───────────────────
  if (node.type === 'module' || node.type === 'group') {
    const mNode = node as (ModuleNode | GroupNode);
    const exposedInputs = mNode.exposedInputs || [];
    const exposedOutputs = mNode.exposedOutputs || [];

    const inputs: UniversalSocketDefinition[] =
      exposedInputs.length === 0
        ? [
            createPackagedSocket({
              socketId: 'in_0',
              label: 'Group In',
              polarity: 'input',
              medium: 'trigger',
              dataType: 'pulse',
              signalType: 'trigger',
              connectivity: 'single',
              socketIndex: 0,
              description: 'Default Group Node Input',
            }),
          ]
        : exposedInputs.map((mapping, idx) => {
            const sig = mapping.signalType || 'trigger';
            const isPkt = sig.includes('packet');
            const isPulse = sig === 'trigger';
            const medium: SignalMedium =
              sig.includes('audio') ? 'audio_stereo' :
              sig.includes('midi') ? 'midi' :
              sig.includes('curve') ? 'curve' : 'trigger';
            const dataType: SignalDataType = isPkt ? 'packet' : isPulse ? 'pulse' : 'stream';

            return createPackagedSocket({
              socketId: mapping.innerPortId || `in_${idx}`,
              label: mapping.label || `In ${idx + 1}`,
              polarity: 'input',
              medium,
              dataType,
              signalType: sig,
              connectivity: 'single',
              socketIndex: mapping.moduleSocketIndex ?? idx,
              description: `Exposed Group Input: ${mapping.label}`,
            });
          });

    const outputs: UniversalSocketDefinition[] =
      exposedOutputs.length === 0
        ? [
            createPackagedSocket({
              socketId: 'out_0',
              label: 'Group Out',
              polarity: 'output',
              medium: 'midi',
              dataType: 'stream',
              signalType: 'midi',
              connectivity: 'multi',
              socketIndex: 0,
              description: 'Default Group Node Output',
            }),
          ]
        : exposedOutputs.map((mapping, idx) => {
            const sig = mapping.signalType || 'midi';
            const isPkt = sig.includes('packet');
            const isPulse = sig === 'trigger';
            const medium: SignalMedium =
              sig.includes('audio') ? 'audio_stereo' :
              sig.includes('midi') ? 'midi' :
              sig.includes('curve') ? 'curve' : 'trigger';
            const dataType: SignalDataType = isPkt ? 'packet' : isPulse ? 'pulse' : 'stream';

            return createPackagedSocket({
              socketId: mapping.innerPortId || `out_${idx}`,
              label: mapping.label || `Out ${idx + 1}`,
              polarity: 'output',
              medium,
              dataType,
              signalType: sig,
              connectivity: 'multi',
              socketIndex: mapping.moduleSocketIndex ?? idx,
              description: `Exposed Group Output: ${mapping.label}`,
            });
          });

    return { inputs, outputs };
  }

  // ── REUSABLE SUBGRAPH NODES (DERIVED DYNAMICALLY FROM GRAPH DEFINITION) ───────
  if (node.type === 'subgraph') {
    const sgNode = node as SubgraphNode;
    
    // If customSockets already exist on the node, partition them into inputs and outputs
    if (sgNode.customSockets && sgNode.customSockets.length > 0) {
      return {
        inputs: sgNode.customSockets.filter((s) => s.polarity === 'input'),
        outputs: sgNode.customSockets.filter((s) => s.polarity === 'output'),
      };
    }

    // Otherwise derive directly from inputHandles and outputHandles or graph reference physical I/O
    const physicalInputs = sgNode.inputHandles?.length
      ? sgNode.inputHandles
      : sgNode.reference?.physicalInputs || [];

    const physicalOutputs = sgNode.outputHandles?.length
      ? sgNode.outputHandles
      : sgNode.reference?.physicalOutputs || [];

    const inputs: UniversalSocketDefinition[] = physicalInputs.map((pin: any, idx: number) => {
      const typeStr = pin.type || 'Audio';
      const normType = typeStr.toLowerCase();
      const normChannels = pin.channels?.toLowerCase() || '';
      const isAudio = normType.includes('audio');
      const isMidi = normType.includes('midi');
      const isMono = normChannels.includes('mono') || normType.includes('mono');
      const medium: SignalMedium = isAudio ? (isMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi' : 'trigger';
      const sigType: SignalType = isAudio ? (isMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi_stream' : 'trigger';

      const label = pin.label || `${typeStr}${pin.channels ? ' ' + pin.channels : ''} Stream IN`;
      const socketId = pin.id || `in_${normType}_${normChannels ? normChannels + '_' : ''}${idx}`;
      return createPackagedSocket({
        socketId,
        label,
        polarity: 'input',
        medium,
        dataType: 'stream', // ALWAYS STREAM! Never Packet
        signalType: sigType,
        connectivity: 'single',
        socketIndex: pin.socketIndex ?? idx,
        description: `Subgraph Stream Input: ${label}`,
      });
    });

    const outputs: UniversalSocketDefinition[] = physicalOutputs.map((pout: any, idx: number) => {
      const typeStr = pout.type || 'Audio';
      const normType = typeStr.toLowerCase();
      const normChannels = pout.channels?.toLowerCase() || '';
      const isAudio = normType.includes('audio');
      const isMidi = normType.includes('midi');
      const isMono = normChannels.includes('mono') || normType.includes('mono');
      const medium: SignalMedium = isAudio ? (isMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi' : 'trigger';
      const sigType: SignalType = isAudio ? (isMono ? 'audio_mono' : 'audio_stereo') : isMidi ? 'midi_stream' : 'trigger';

      const label = pout.label || `${typeStr}${pout.channels ? ' ' + pout.channels : ''} Stream OUT`;
      const socketId = pout.id || `out_${normType}_${normChannels ? normChannels + '_' : ''}${idx}`;
      return createPackagedSocket({
        socketId,
        label,
        polarity: 'output',
        medium,
        dataType: 'stream', // ALWAYS STREAM! Never Packet
        signalType: sigType,
        connectivity: 'multi',
        socketIndex: pout.socketIndex ?? idx,
        description: `Subgraph Stream Output: ${label}`,
      });
    });

    return { inputs, outputs };
  }

  // ── EFFECT ORB NODES ────────────────────────────────────────────────────────
  if (node.type === 'effect') {
    const eNode = node as EffectNode;
    const isTrigger = eNode.effectType === 'repeater';
    const isMidi = eNode.effectType === 'velocity';
    const inSig: SignalType = isTrigger ? 'trigger' : isMidi ? 'midi' : 'audio_stereo';
    const medium: SignalMedium = isTrigger ? 'trigger' : isMidi ? 'midi' : 'audio_stereo';
    const dataType: SignalDataType = isTrigger ? 'pulse' : 'stream';

    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'in_0',
        label: isTrigger ? 'TRIG IN' : isMidi ? 'MIDI IN' : 'AUDIO IN',
        polarity: 'input',
        medium,
        dataType,
        signalType: inSig,
        connectivity: 'single',
        socketIndex: 0,
        description: `${eNode.name || eNode.effectType} Primary Signal Input`,
        iconName: isTrigger ? 'zap' : isMidi ? 'music' : 'volume_2',
      }),
    ];

    // Dedicated Sidechain Key Audio In for Compressor & Multiband Compressor
    if (eNode.effectType === 'compressor' || eNode.effectType === 'multiband_compressor') {
      inputs.push(
        createPackagedSocket({
          socketId: 'sidechain_in',
          label: 'SIDECHAIN IN',
          polarity: 'input',
          medium: 'audio_stereo',
          dataType: 'stream',
          signalType: 'audio_stereo',
          connectivity: 'single',
          socketIndex: 1,
          description: 'Sidechain Key In: External audio signal driving dynamic ducking attenuation',
          iconName: 'split',
        })
      );
    }

    const outputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'out_0',
        label: isTrigger ? 'TRIG OUT' : isMidi ? 'MIDI OUT' : 'AUDIO OUT',
        polarity: 'output',
        medium,
        dataType,
        signalType: inSig,
        connectivity: 'multi',
        socketIndex: 0,
        description: `${eNode.name || eNode.effectType} Processed Signal Output`,
        iconName: isTrigger ? 'zap' : isMidi ? 'music' : 'volume_2',
      }),
    ];

    return { inputs, outputs };
  }

  // ── CONTROL PANEL NODES ──────────────────────────────────────────────────────
  if (node.type === 'control') {
    return {
      inputs: [
        createPackagedSocket({
          socketId: 'sync_in',
          label: 'SYNC IN',
          polarity: 'input',
          medium: 'trigger',
          dataType: 'pulse',
          signalType: 'trigger',
          connectivity: 'single',
          socketIndex: 0,
          description: 'Sync In: External trigger or clock to pulse or advance control parameters',
          iconName: 'zap',
        }),
        createPackagedSocket({
          socketId: 'cv_in',
          label: 'CV / MOD IN',
          polarity: 'input',
          medium: 'curve',
          dataType: 'stream',
          signalType: 'curve_stream',
          connectivity: 'single',
          socketIndex: 1,
          description: 'CV Modulation In: External CV stream to modulate mapped UI parameters',
          iconName: 'trending-up',
        }),
      ],
      outputs: [
        createPackagedSocket({
          socketId: 'trigger_out',
          label: 'PULSE OUT',
          polarity: 'output',
          medium: 'trigger',
          dataType: 'pulse',
          signalType: 'trigger',
          connectivity: 'multi',
          socketIndex: 0,
          description: 'Pulse Out: Triggers fired from UI buttons, pads, and sequence triggers',
          iconName: 'zap',
        }),
        createPackagedSocket({
          socketId: 'midi_out',
          label: 'MIDI OUT',
          polarity: 'output',
          medium: 'midi',
          dataType: 'stream',
          signalType: 'midi',
          connectivity: 'multi',
          socketIndex: 1,
          description: 'MIDI Out: Live CC and Note stream generated by sliders, knobs, and pads',
          iconName: 'music',
        }),
        createPackagedSocket({
          socketId: 'cv_out',
          label: 'CV OUT',
          polarity: 'output',
          medium: 'curve',
          dataType: 'stream',
          signalType: 'curve_stream',
          connectivity: 'multi',
          socketIndex: 2,
          description: 'CV Out: Continuous normalized modulation voltage (0.0 to 1.0)',
          iconName: 'activity',
        }),
      ],
    };
  }

  // ── ARRANGEMENT DAW TIMELINE NODE ──────────────────────────────────────────
  if (node.type === 'arrangement') {
    const arrNode = node as ArrangementNode;
    const tracks = arrNode.tracks || [];

    // The arrangement node input handles: Omni Packet ingest handle + Trigger in handle
    const inputs: UniversalSocketDefinition[] = [
      createPackagedSocket({
        socketId: 'omni_packet_in',
        label: 'OMNI PACKET IN',
        polarity: 'input',
        medium: 'omni',
        dataType: 'packet',
        signalType: 'omni_packet',
        connectivity: 'multi',
        socketIndex: 0,
        isOmni: true,
        description: 'Universal Omni Packet Ingest Handle: Multi-connect receptacle accepting packets of any signal type (Audio, MIDI, Curve)',
        customMeta: { acceptsAnySignal: true, isArrangementIngest: true, isOmni: true, isPacketHandle: true, legacySocketId: 'container_in' },
        iconName: 'box',
      }),
      createPackagedSocket({
        socketId: 'trigger_in',
        label: 'PLAY TRIG',
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 1,
        description: 'Arrangement Play Trigger: Pulse or clock trigger to start and play arrangement timeline from beginning',
        iconName: 'zap',
      }),
    ];

    // Outputs on arrangement node appear strictly when a track/container is added
    const outputs: UniversalSocketDefinition[] = [];

    tracks.forEach((t) => {
      const isMonoAudio = t.signalType === 'audio_mono';
      const isStereoAudio = t.signalType === 'audio_stereo' || t.signalType === 'audio';
      const isAud = isMonoAudio || isStereoAudio;
      const isMid = t.signalType.includes('midi');
      const isTrig = t.signalType === 'trigger';

      const medium: SignalMedium = isMonoAudio
        ? 'audio_mono'
        : isStereoAudio
        ? 'audio_stereo'
        : isMid
        ? 'midi'
        : isTrig
        ? 'trigger'
        : 'curve';

      const sigType: SignalType = isMonoAudio
        ? 'audio_mono'
        : isStereoAudio
        ? 'audio_stereo'
        : isMid
        ? 'midi_stream'
        : isTrig
        ? 'trigger'
        : 'curve_stream';

      const dType: SignalDataType = isTrig ? 'pulse' : 'stream';

      outputs.push(
        createPackagedSocket({
          socketId: `out_track_${t.id}`,
          label: `${t.name.toUpperCase()} OUT`,
          polarity: 'output',
          medium,
          dataType: dType,
          signalType: sigType,
          connectivity: 'multi',
          socketIndex: outputs.length,
          description: `Track ${t.name} Dedicated Output (${sigType.toUpperCase()})`,
          customMeta: { color: t.color, trackId: t.id },
          iconName: isAud ? (isMonoAudio ? 'volume-1' : 'volume-2') : isMid ? 'disc' : isTrig ? 'zap' : 'activity',
        })
      );
    });

    return { inputs, outputs };
  }

  // ── GENERIC FALLBACK ─────────────────────────────────────────────────────────
  return {
    inputs: [
      createPackagedSocket({
        socketId: 'in_0',
        label: 'IN',
        polarity: 'input',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'single',
        socketIndex: 0,
        description: 'Input Socket',
      }),
    ],
    outputs: [
      createPackagedSocket({
        socketId: 'out_0',
        label: 'OUT',
        polarity: 'output',
        medium: 'trigger',
        dataType: 'pulse',
        signalType: 'trigger',
        connectivity: 'multi',
        socketIndex: 0,
        description: 'Output Socket',
      }),
    ],
  };
}

/**
 * Finds a socket on a node by its socketId/portId or socketIndex.
 */
export function findSocketByPortOrIndex(
  node: SpaceNode,
  direction: 'in' | 'out',
  portId?: string,
  socketIndex?: number
): UniversalSocketDefinition | undefined {
  const { inputs, outputs } = getNodeSockets(node);
  const pool = direction === 'in' ? inputs : outputs;

  if (portId) {
    const found = pool.find((s) => s.socketId === portId || s.socketId.toLowerCase() === portId.toLowerCase());
    if (found) return found;
  }

  if (socketIndex !== undefined && socketIndex >= 0 && socketIndex < pool.length) {
    return pool[socketIndex];
  }

  return pool[0];
}
