import {
  SpaceNode,
  ContainerNode,
  RecorderNode,
  PlayerNode,
  AudioPadsNode,
  UniversalSocketDefinition,
  SignalMedium,
  SignalDataType,
  SignalType,
} from "../../types/index.js";
import { NodeSocketsResult } from './types';
import { createPackagedSocket } from './createPackagedSocket';

export function getContainerSockets(node: SpaceNode): NodeSocketsResult | null {
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

  return null;
}
