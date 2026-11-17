import { UniversalSocketDefinition, SignalMedium, SignalDataType, SignalType } from "../../types/index.js";
import { ContainerNode, TriggerNode, EffectNode } from "../../types/index.js";
import { createPackagedSocket, NodeSocketsResult } from "./socketUtils";

export function getContainerSockets(node: ContainerNode): NodeSocketsResult {
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


export function getTriggerSockets(node: TriggerNode): NodeSocketsResult {
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


export function getEffectSockets(node: EffectNode): NodeSocketsResult {
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

